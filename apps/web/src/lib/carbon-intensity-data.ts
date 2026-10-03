import {
  fetchCarbonIntensityWindow as fetchCarbonIntensityWindowLive,
  formatCarbonIntensityInstant,
  parseCarbonIntensityWindow,
} from '@uk-open-data-connectors/uk-sources';
import type {
  CarbonIntensityIndex,
  CarbonIntensityWindow,
} from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { formatCount } from './uk-format';

/** The range endpoint answers in a second or two; this is the ceiling on one call. */
export const CARBON_INTENSITY_LIVE_TIMEOUT_MS = 30_000;

/** Half-hour readings in a whole day, which sets the width of the heatmap. */
export const CARBON_INTENSITY_SLOTS_PER_DAY = 48;

/** How many complete days the page draws, counted in UK local time. */
export const CARBON_INTENSITY_WINDOW_DAYS = 30;

/** The days on the page are UK days, because the series is the British grid's. */
export const CARBON_INTENSITY_TIME_ZONE = 'Europe/London';

// Committed snapshot, so the static build still works when the API is slow,
// rate-limited, or unreachable from the build runner.
const CARBON_INTENSITY_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/carbon-intensity-sample.json',
);

/** One half hour on the chart, with the reading the page draws for it. */
export interface CarbonIntensityCell {
  /** gCO2/kWh over the half hour. */
  intensity: number;
  /** The grade the operator put that reading in. */
  index: CarbonIntensityIndex;
}

/** One row of the heatmap: a UK day and the half hours it holds. */
export interface CarbonIntensityDay {
  /** The day as YYYY-MM-DD in UK local time. */
  date: string;
  /** The day as "Mon 14 Sep". */
  label: string;
  /** One entry per half hour from 00:00, or null where the day holds none. */
  slots: (CarbonIntensityCell | null)[];
}

/** One column of the heatmap, averaged across every day in the window. */
export interface CarbonIntensitySlotProfile {
  /** The half hour as "HH:mm", UK local time. */
  label: string;
  /** Days the window holds a reading for this half hour. */
  dayCount: number;
  averageIntensity: number;
  lowestIntensity: number;
  highestIntensity: number;
}

/** The fill each grade is drawn in, lowest intensity first. */
export const CARBON_INTENSITY_BAND_FILLS: Record<CarbonIntensityIndex, string> = {
  'very low': 'var(--accent-emerald-fg)',
  low: 'var(--accent-lime-fg)',
  moderate: 'var(--accent-amber-fg)',
  high: 'var(--accent-rose-fg)',
  'very high': 'var(--accent-fuchsia-fg)',
};

/** The half hour labels down the columns, "00:00" first. */
export const CARBON_INTENSITY_COLUMN_LABELS: readonly string[] = Array.from(
  { length: CARBON_INTENSITY_SLOTS_PER_DAY },
  (_unused, slot) => {
    const minutes = slot * 30;
    const hours = Math.floor(minutes / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  },
);

const UK_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: CARBON_INTENSITY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const UK_DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: CARBON_INTENSITY_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

interface UkWallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** Reads one instant as the wall clock a UK reader sees for it. */
function ukWallClock(instant: Date): UkWallClock {
  const parts = UK_DATE_TIME_FORMATTER.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

/** How far UK local time runs ahead of UTC at one instant, in milliseconds. */
function ukOffsetMilliseconds(instant: Date): number {
  const wall = ukWallClock(instant);
  const wholeMinutes = Math.floor(instant.getTime() / 60_000) * 60_000;
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute) - wholeMinutes;
}

/**
 * The instant UK midnight starts on one civil date.
 *
 * The offset is looked up twice because it changes on the two clock-change
 * days: the first pass can land on the wrong side of the change, the second
 * fixes it.
 *
 * @param year - the civil year
 * @param month - the civil month, 1 to 12
 * @param day - the civil day of the month
 * @returns the instant midnight began
 */
export function ukMidnightInstant(year: number, month: number, day: number): Date {
  const civilMidnight = Date.UTC(year, month - 1, day);
  let instant = new Date(civilMidnight);
  for (let pass = 0; pass < 2; pass += 1) {
    instant = new Date(civilMidnight - ukOffsetMilliseconds(instant));
  }
  return instant;
}

/**
 * Works out the window the page draws: whole UK days, ending at the UK
 * midnight that starts today. The operator publishes in UTC, so a window
 * pinned to UTC days would cut the first and last day in half once British
 * Summer Time is in force.
 *
 * @param now - the clock the window is measured back from
 * @returns the window's start and end as ISO instants
 */
export function resolveUkCarbonIntensityWindow(now: Date = new Date()): {
  from: string;
  to: string;
} {
  const wall = ukWallClock(now);
  const to = ukMidnightInstant(wall.year, wall.month, wall.day);
  const startDate = new Date(
    Date.UTC(wall.year, wall.month - 1, wall.day - CARBON_INTENSITY_WINDOW_DAYS),
  );
  const from = ukMidnightInstant(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 1,
    startDate.getUTCDate(),
  );
  return { from: formatCarbonIntensityInstant(from), to: formatCarbonIntensityInstant(to) };
}

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Reads the last 30 UK days of half-hourly carbon intensity at build time.
 *
 * Falls back to the committed snapshot when the API is slow, rate-limited, or
 * unreachable. The fallback is logged, not swallowed.
 *
 * @param now - the clock the window is measured back from
 * @returns every reading in the window with its totals
 */
export async function fetchCarbonIntensitySummary(
  now: Date = new Date(),
): Promise<CarbonIntensityWindow> {
  const { from, to } = resolveUkCarbonIntensityWindow(now);
  try {
    return await fetchCarbonIntensityWindowLive({
      from,
      to,
      fetchImpl: (input, init) =>
        globalThis.fetch(input, {
          ...init,
          // A one second cache window keeps each build reading the source. The
          // obvious `cache: 'no-store'` is not usable: it marks the fetch
          // dynamic, and the static export refuses to prerender a route that
          // makes one, which silently pushes every story onto its snapshot.
          next: { revalidate: 1 },
          signal: AbortSignal.timeout(CARBON_INTENSITY_LIVE_TIMEOUT_MS),
        }),
    });
  } catch (error) {
    console.warn(
      `Falling back to the committed carbon intensity snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return parseCarbonIntensityWindow(readSnapshot(CARBON_INTENSITY_SNAPSHOT_PATH));
  }
}

/** The column a reading sits in, from its UK local half hour. */
function slotIndexFor(instant: Date): number {
  const wall = ukWallClock(instant);
  return Math.round((wall.hour * 60 + wall.minute) / 30) % CARBON_INTENSITY_SLOTS_PER_DAY;
}

/**
 * Lays the window out as one row per UK day, so the chart can draw a grid.
 *
 * @param window - the readings, oldest first
 * @returns the days, oldest first, each with 48 half-hour slots
 */
export function buildCarbonIntensityDays(window: CarbonIntensityWindow): CarbonIntensityDay[] {
  const daysByDate = new Map<string, CarbonIntensityDay>();
  for (const period of window.periods) {
    const instant = new Date(period.from);
    const wall = ukWallClock(instant);
    const date = `${String(wall.year)}-${String(wall.month).padStart(2, '0')}-${String(wall.day).padStart(2, '0')}`;
    let day = daysByDate.get(date);
    if (day === undefined) {
      day = {
        date,
        label: UK_DAY_LABEL_FORMATTER.format(instant),
        slots: new Array<CarbonIntensityCell | null>(CARBON_INTENSITY_SLOTS_PER_DAY).fill(null),
      };
      daysByDate.set(date, day);
    }
    const slot = slotIndexFor(instant);
    // A clock-change day holds 46 or 50 half hours, two of which share a
    // column; the first reading to land there is the one the grid keeps.
    day.slots[slot] ??= { intensity: period.intensity, index: period.index };
  }
  return [...daysByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

/**
 * Averages the window down the columns, so each half hour of the day carries
 * one figure: the mean of every day at that time.
 *
 * @param window - the readings, oldest first
 * @returns one row per half hour, 00:00 first
 */
export function buildCarbonIntensitySlotProfile(
  window: CarbonIntensityWindow,
): CarbonIntensitySlotProfile[] {
  const bySlot = new Map<number, number[]>();
  for (const period of window.periods) {
    const slot = slotIndexFor(new Date(period.from));
    const readings = bySlot.get(slot) ?? [];
    readings.push(period.intensity);
    bySlot.set(slot, readings);
  }
  return CARBON_INTENSITY_COLUMN_LABELS.flatMap((label, slot) => {
    const readings = bySlot.get(slot);
    if (readings === undefined || readings.length === 0) {
      return [];
    }
    const total = readings.reduce((sum, reading) => sum + reading, 0);
    return [
      {
        label,
        dayCount: readings.length,
        averageIntensity: Math.round(total / readings.length),
        lowestIntensity: Math.min(...readings),
        highestIntensity: Math.max(...readings),
      },
    ];
  });
}

/** The half hour of the day with the lowest average intensity. */
export function cleanestSlot(
  profile: CarbonIntensitySlotProfile[],
): CarbonIntensitySlotProfile | undefined {
  return profile.reduce<CarbonIntensitySlotProfile | undefined>(
    (cleanest, slot) =>
      cleanest === undefined || slot.averageIntensity < cleanest.averageIntensity ? slot : cleanest,
    undefined,
  );
}

/** The half hour of the day with the highest average intensity. */
export function dirtiestSlot(
  profile: CarbonIntensitySlotProfile[],
): CarbonIntensitySlotProfile | undefined {
  return profile.reduce<CarbonIntensitySlotProfile | undefined>(
    (dirtiest, slot) =>
      dirtiest === undefined || slot.averageIntensity > dirtiest.averageIntensity ? slot : dirtiest,
    undefined,
  );
}

/** One row of the table behind the chart, with its figures already written. */
export interface CarbonIntensityTableRow {
  halfHour: string;
  average: string;
  cleanest: string;
  dirtiest: string;
}

/**
 * Writes the half-hour profile as table rows.
 *
 * The figures are formatted here rather than in the chart component so the
 * rows can cross into the client-side table as plain data.
 *
 * @param profile - the half hours of the day, 00:00 first
 * @returns one row per half hour, ready for the table
 */
export function buildCarbonIntensityTableRows(
  profile: CarbonIntensitySlotProfile[],
): CarbonIntensityTableRow[] {
  return profile.map((slot) => ({
    halfHour: slot.label,
    average: formatCount(slot.averageIntensity),
    cleanest: formatCount(slot.lowestIntensity),
    dirtiest: formatCount(slot.highestIntensity),
  }));
}
