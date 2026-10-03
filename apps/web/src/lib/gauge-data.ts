import {
  parseFloodReadings,
  parseFloodStations,
  summarizeFloodReadings,
  UkSourceError,
} from '@uk-open-data-connectors/uk-sources';
import type {
  FloodReading,
  FloodReadingSummary,
  FloodStation,
} from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// The Environment Agency flood-monitoring API for England. Keyless, published
// under the Open Government Licence v3.0.
export const FLOOD_STATIONS_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/stations?_limit=3000';

/** The agency caps the response below the requested limit: 3000 returns 2095. */
export const FLOOD_STATIONS_REQUESTED_LIMIT = 3000;

/** Station behind the live reading: Bourton Dickler on the River Dikler. */
export const FEATURED_STATION_REFERENCE = '1029TH';
export const FEATURED_STATION_LABEL = 'Bourton Dickler';
export const FEATURED_STATION_URL =
  'https://environment.data.gov.uk/flood-monitoring/id/stations/1029TH/readings?_limit=200&_sorted';

/** Qualifier the agency uses for the upstream gauge a flood warning keys off. */
export const PRIMARY_FLOOD_QUALIFIER = 'Stage';

// The agency takes about nine seconds to answer for the full station list, so
// the five second default that the connector probe uses is too tight.
export const LIVE_PROBE_TIMEOUT_MS = 60_000;

// Committed snapshots, so the static build still works when the agency API is
// slow or unreachable from the build runner.
const STATIONS_FIXTURE_PATH = path.join(process.cwd(), 'src/fixtures/flood-stations-sample.json');
const READINGS_FIXTURE_PATH = path.join(
  process.cwd(),
  'src/fixtures/flood-station-readings-sample.json',
);

/** How many gauges one river carries in the station sample. */
export interface GaugeRiverCount {
  riverName: string;
  stationCount: number;
}

/** Rolled-up shape of the Environment Agency station network. */
export interface GaugeStationIndex {
  stationCount: number;
  riverCount: number;
  measureCount: number;
  topRivers: GaugeRiverCount[];
}

/** The live water level at one station, flattened for the story. */
export interface GaugeLiveLevel {
  stationReference: string;
  stationLabel: string;
  measureId: string;
  latestLevelMetres: number;
  latestReadingTime: string;
  changeMetres: number;
  windowHours: number;
  trend: FloodReadingSummary['trend'];
}

/** Identifies the station whose level the story shows. */
export interface FeaturedStation {
  reference: string;
  label: string;
  /** Measure ids to try in order, from the station's own measure list. */
  preferredMeasureIds?: string[];
}

/** Hours between two ISO timestamps, rounded. */
function hoursBetween(earlierIso: string, laterIso: string): number {
  return Math.round((Date.parse(laterIso) - Date.parse(earlierIso)) / 3_600_000);
}

/**
 * Counts the sample by river and keeps the busiest ones.
 *
 * @param stations - stations parsed from the agency station endpoint
 * @param topRiverLimit - how many rivers to keep in `topRivers`
 * @returns station, river, and measure counts plus the top rivers
 */
export function buildGaugeStationIndex(
  stations: FloodStation[],
  topRiverLimit = 10,
): GaugeStationIndex {
  const stationCountByRiver = new Map<string, number>();
  let measureCount = 0;
  for (const station of stations) {
    measureCount += station.measures.length;
    if (station.riverName === '') {
      continue;
    }
    stationCountByRiver.set(
      station.riverName,
      (stationCountByRiver.get(station.riverName) ?? 0) + 1,
    );
  }

  const topRivers: GaugeRiverCount[] = [...stationCountByRiver.entries()]
    .map(([riverName, stationCount]) => ({ riverName, stationCount }))
    .sort((left, right) => {
      if (right.stationCount !== left.stationCount) {
        return right.stationCount - left.stationCount;
      }
      return left.riverName.localeCompare(right.riverName);
    })
    .slice(0, topRiverLimit);

  return {
    stationCount: stations.length,
    riverCount: stationCountByRiver.size,
    measureCount,
    topRivers,
  };
}

/**
 * Orders one station's measure ids with the upstream stage gauge first.
 *
 * A station publishes more than one level: Bourton Dickler reports a stage
 * and a downstream stage, for example. The stage is the one flood warnings
 * are read from, so the story shows that one.
 *
 * @param stations - stations from the agency station endpoint
 * @param reference - the station reference to look up
 * @returns measure ids, the stage gauge first, or an empty list when unknown
 */
export function preferredMeasureIdsFor(stations: FloodStation[], reference: string): string[] {
  const station = stations.find((candidate) => candidate.notation === reference);
  if (station === undefined) {
    return [];
  }
  const stageMeasures = station.measures.filter(
    (measure) => measure.qualifier === PRIMARY_FLOOD_QUALIFIER,
  );
  const otherMeasures = station.measures.filter(
    (measure) => measure.qualifier !== PRIMARY_FLOOD_QUALIFIER,
  );
  return [...stageMeasures, ...otherMeasures].map((measure) => measure.id);
}

/**
 * Groups readings by measure and picks the series the story shows.
 *
 * A station answers with every measure it publishes, so a raw readings list
 * mixes two gauges. Preference order comes from the station's own measure
 * list; the busiest measure is the fallback when that list is unavailable.
 *
 * @param readings - readings for one station, in any order
 * @param station - the station, plus any measure ids to prefer
 * @returns the selected series and the measure id it belongs to
 */
function selectMeasureReadings(
  readings: FloodReading[],
  station: FeaturedStation,
): { measureId: string; series: FloodReading[] } {
  const readingsByMeasure = new Map<string, FloodReading[]>();
  for (const reading of readings) {
    const existing = readingsByMeasure.get(reading.measureId);
    if (existing === undefined) {
      readingsByMeasure.set(reading.measureId, [reading]);
    } else {
      existing.push(reading);
    }
  }

  for (const measureId of station.preferredMeasureIds ?? []) {
    const series = readingsByMeasure.get(measureId);
    if (series !== undefined && series.length > 0) {
      return { measureId, series };
    }
  }

  let busiestMeasureId = '';
  let busiestSeries: FloodReading[] = [];
  for (const [measureId, series] of readingsByMeasure) {
    if (series.length > busiestSeries.length) {
      busiestMeasureId = measureId;
      busiestSeries = series;
    }
  }
  return { measureId: busiestMeasureId, series: busiestSeries };
}

/**
 * Reads the selected gauge's latest level, its change, and its direction.
 *
 * @param readings - readings for one station, in any order
 * @param station - the station, plus any measure ids to prefer
 * @returns the latest level, the change over the window, and the trend
 */
export function buildGaugeLiveLevel(
  readings: FloodReading[],
  station: FeaturedStation,
): GaugeLiveLevel {
  const { measureId, series } = selectMeasureReadings(readings, station);
  const summary = summarizeFloodReadings(series);
  const { earliest, latest } = summary;
  if (earliest === undefined || latest === undefined || measureId === '') {
    throw new UkSourceError(`No readings found for flood station ${station.reference}`);
  }

  return {
    stationReference: station.reference,
    stationLabel: station.label,
    measureId,
    latestLevelMetres: latest.value,
    latestReadingTime: latest.dateTime,
    changeMetres: latest.value - earliest.value,
    windowHours: hoursBetween(earliest.dateTime, latest.dateTime),
    trend: summary.trend,
  };
}

/** Fetches a URL with the long build-time timeout, or throws. */
async function fetchJson(url: string): Promise<unknown> {
  const response = await globalThis.fetch(url, {
    // A one second cache window keeps each build reading the source. The
    // obvious `cache: 'no-store'` is not usable: it marks the fetch dynamic,
    // and the static export refuses to prerender a route that makes one, which
    // silently pushed every story onto its committed snapshot.
    next: { revalidate: 1 },
    signal: AbortSignal.timeout(LIVE_PROBE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

/** Reads a committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Reads the Environment Agency station network at build time.
 *
 * Falls back to the committed snapshot when the agency API is slow, blocked,
 * or unreachable. The fallback is logged, not swallowed.
 *
 * @returns the station list the gauge story renders
 */
export async function fetchGaugeStationSample(): Promise<FloodStation[]> {
  try {
    return parseFloodStations(await fetchJson(FLOOD_STATIONS_URL));
  } catch (error) {
    console.warn(
      `Falling back to the committed station snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return parseFloodStations(readSnapshot(STATIONS_FIXTURE_PATH));
  }
}

/**
 * Reads the live water level at the featured station.
 *
 * Falls back to the committed readings snapshot on the same terms as
 * `fetchGaugeStationSample`.
 *
 * @param preferredMeasureIds - measure ids to try in order, stage gauge first
 * @returns the live level, change, and trend for the featured station
 */
export async function fetchGaugeLiveLevel(preferredMeasureIds?: string[]): Promise<GaugeLiveLevel> {
  const station: FeaturedStation = {
    reference: FEATURED_STATION_REFERENCE,
    label: FEATURED_STATION_LABEL,
    ...(preferredMeasureIds === undefined ? {} : { preferredMeasureIds }),
  };
  try {
    return buildGaugeLiveLevel(parseFloodReadings(await fetchJson(FEATURED_STATION_URL)), station);
  } catch (error) {
    console.warn(
      `Falling back to the committed readings snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return buildGaugeLiveLevel(parseFloodReadings(readSnapshot(READINGS_FIXTURE_PATH)), station);
  }
}
