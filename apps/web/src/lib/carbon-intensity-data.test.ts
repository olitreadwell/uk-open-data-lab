import type {
  CarbonIntensityPeriod,
  CarbonIntensityWindow,
} from '@uk-open-data-connectors/uk-sources';
import { describe, expect, it } from 'vitest';

import {
  buildCarbonIntensityDays,
  buildCarbonIntensitySlotProfile,
  cleanestSlot,
  dirtiestSlot,
  resolveUkCarbonIntensityWindow,
  ukMidnightInstant,
} from './carbon-intensity-data';

/** One half hour, in the shape the adapter returns it. */
function period(from: string, intensity: number): CarbonIntensityPeriod {
  const to = new Date(Date.parse(from) + 30 * 60 * 1000).toISOString().slice(0, 16) + 'Z';
  return { from, to, intensity, index: intensity < 100 ? 'low' : 'moderate' };
}

/** A window of readings, oldest first. */
function windowOf(periods: CarbonIntensityPeriod[]): CarbonIntensityWindow {
  return {
    periodCount: periods.length,
    dayCount: periods.length / 48,
    firstPeriodFrom: periods[0]?.from ?? '',
    lastPeriodTo: periods.at(-1)?.to ?? '',
    averageIntensity: 100,
    lowestPeriod: periods[0] ?? period('2026-09-15T00:00Z', 100),
    highestPeriod: periods.at(-1) ?? period('2026-09-15T00:00Z', 100),
    bandCounts: [
      { index: 'very low', periodCount: 0 },
      { index: 'low', periodCount: 0 },
      { index: 'moderate', periodCount: periods.length },
      { index: 'high', periodCount: 0 },
      { index: 'very high', periodCount: 0 },
    ],
    periods,
  };
}

describe('resolveUkCarbonIntensityWindow', () => {
  it('ends the window at UK midnight, not UTC midnight, in British Summer Time', () => {
    expect(resolveUkCarbonIntensityWindow(new Date('2026-09-29T21:41:00Z'))).toEqual({
      from: '2026-08-29T23:00Z',
      to: '2026-09-28T23:00Z',
    });
  });

  it('lines up with UTC midnight in the winter', () => {
    expect(resolveUkCarbonIntensityWindow(new Date('2026-01-15T09:00:00Z'))).toEqual({
      from: '2025-12-16T00:00Z',
      to: '2026-01-15T00:00Z',
    });
  });

  it('counts civil days across a clock change', () => {
    // 26 September 2026 is still British Summer Time, so its midnight runs an
    // hour before UTC midnight even though the window ends after the change.
    expect(resolveUkCarbonIntensityWindow(new Date('2026-10-26T09:00:00Z'))).toEqual({
      from: '2026-09-25T23:00Z',
      to: '2026-10-26T00:00Z',
    });
  });

  it('reads midnight on the clock-change days themselves', () => {
    expect(ukMidnightInstant(2026, 10, 25).toISOString()).toBe('2026-10-24T23:00:00.000Z');
    expect(ukMidnightInstant(2026, 10, 26).toISOString()).toBe('2026-10-26T00:00:00.000Z');
    expect(ukMidnightInstant(2026, 3, 29).toISOString()).toBe('2026-03-29T00:00:00.000Z');
  });
});

describe('buildCarbonIntensityDays', () => {
  it('lays the readings out on UK days and half-hour columns', () => {
    // 23:00Z on 14 September is midnight on the 15th in British Summer Time.
    const days = buildCarbonIntensityDays(
      windowOf([
        period('2026-09-14T23:00Z', 30),
        period('2026-09-14T23:30Z', 40),
        period('2026-09-15T00:00Z', 50),
        period('2026-09-16T22:30Z', 60),
      ]),
    );
    expect(days.map((day) => day.date)).toEqual(['2026-09-15', '2026-09-16']);
    expect(days[0]?.label).toBe('Tue 15 Sept');
    expect(days[0]?.slots).toHaveLength(48);
    expect(days[0]?.slots[0]).toEqual({ intensity: 30, index: 'low' });
    expect(days[0]?.slots[1]).toEqual({ intensity: 40, index: 'low' });
    expect(days[0]?.slots[2]).toEqual({ intensity: 50, index: 'low' });
    expect(days[0]?.slots[3]).toBeNull();
    // 22:30Z on the 16th is 23:30 in local time, the last column of the day.
    expect(days[1]?.slots[47]).toEqual({ intensity: 60, index: 'low' });
  });
});

describe('buildCarbonIntensitySlotProfile', () => {
  it('averages each half hour of the day across the window', () => {
    const profile = buildCarbonIntensitySlotProfile(
      windowOf([
        period('2026-09-14T23:00Z', 80),
        period('2026-09-14T23:30Z', 100),
        period('2026-09-15T23:00Z', 100),
        period('2026-09-15T23:30Z', 120),
      ]),
    );
    expect(profile).toHaveLength(2);
    expect(profile[0]).toEqual({
      label: '00:00',
      dayCount: 2,
      averageIntensity: 90,
      lowestIntensity: 80,
      highestIntensity: 100,
    });
    expect(profile[1]?.averageIntensity).toBe(110);
  });
});

describe('cleanestSlot and dirtiestSlot', () => {
  const profile = [
    {
      label: '00:00',
      dayCount: 2,
      averageIntensity: 90,
      lowestIntensity: 80,
      highestIntensity: 100,
    },
    {
      label: '12:00',
      dayCount: 2,
      averageIntensity: 60,
      lowestIntensity: 50,
      highestIntensity: 70,
    },
    {
      label: '19:00',
      dayCount: 2,
      averageIntensity: 150,
      lowestIntensity: 140,
      highestIntensity: 160,
    },
  ];

  it('picks the lowest and highest averages', () => {
    expect(cleanestSlot(profile)?.label).toBe('12:00');
    expect(dirtiestSlot(profile)?.label).toBe('19:00');
  });

  it('answers nothing for an empty window', () => {
    expect(cleanestSlot([])).toBeUndefined();
    expect(dirtiestSlot([])).toBeUndefined();
  });
});
