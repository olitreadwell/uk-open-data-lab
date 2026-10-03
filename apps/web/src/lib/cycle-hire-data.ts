import { parseTflBikePoints, TFL_BIKE_POINTS_URL } from '@uk-open-data-connectors/uk-sources';
import type { DockingStation } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The TfL list answers in a few seconds; this is the build-time ceiling. */
export const CYCLE_HIRE_LIVE_TIMEOUT_MS = 30_000;

/** How many of the largest docking stations the story names and tabulates. */
export const CYCLE_HIRE_LARGEST_STATION_LIMIT = 10;

// Committed snapshot, so the static build still works when TfL is slow or
// unreachable from the build runner.
const CYCLE_HIRE_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/tfl-bike-points-sample.json',
);

/** How many stations hold a given number of docking points. */
export interface DockSizeBucket {
  /** Docking points, the size this bucket counts. */
  dockCount: number;
  /** Stations with exactly this many docking points. */
  stationCount: number;
}

/** Everything the cycle hire story draws, worked out at build time. */
export interface CycleHireIndex {
  stationCount: number;
  /** Docking points summed across every station. */
  dockCount: number;
  /** Bikes docked at the time the list was read. */
  bikeCount: number;
  electricBikeCount: number;
  /** One entry per dock size, smallest first, for the dot plot. */
  sizeBuckets: DockSizeBucket[];
  /** The stations with the most docking points, largest first. */
  largestStations: DockingStation[];
}

/**
 * Counts how many stations hold each number of docking points.
 *
 * @param stations - docking stations from the TfL list
 * @returns one bucket per dock size, smallest first
 */
export function buildDockSizeBuckets(stations: DockingStation[]): DockSizeBucket[] {
  const stationsBySize = new Map<number, number>();
  for (const station of stations) {
    stationsBySize.set(station.dockCount, (stationsBySize.get(station.dockCount) ?? 0) + 1);
  }
  return [...stationsBySize.entries()]
    .map(([dockCount, stationCount]) => ({ dockCount, stationCount }))
    .sort((left, right) => left.dockCount - right.dockCount);
}

/**
 * Rolls the station list up into the numbers the story prints.
 *
 * @param stations - docking stations from the TfL list
 * @param largestStationLimit - how many stations to keep in `largestStations`
 * @returns station, dock, and bike counts plus the size buckets
 */
export function buildCycleHireIndex(
  stations: DockingStation[],
  largestStationLimit: number = CYCLE_HIRE_LARGEST_STATION_LIMIT,
): CycleHireIndex {
  return {
    stationCount: stations.length,
    dockCount: stations.reduce((total, station) => total + station.dockCount, 0),
    bikeCount: stations.reduce((total, station) => total + station.bikeCount, 0),
    electricBikeCount: stations.reduce((total, station) => total + station.electricBikeCount, 0),
    sizeBuckets: buildDockSizeBuckets(stations),
    largestStations: [...stations]
      .sort(
        (left, right) => right.dockCount - left.dockCount || left.name.localeCompare(right.name),
      )
      .slice(0, largestStationLimit),
  };
}

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Reads the Santander Cycles docking station list at build time.
 *
 * Falls back to the committed snapshot when the API is slow, blocked, or
 * unreachable. The fallback is logged, not swallowed.
 *
 * @returns the rolled-up cycle hire index the story renders
 */
export async function fetchCycleHireIndex(): Promise<CycleHireIndex> {
  try {
    const response = await globalThis.fetch(TFL_BIKE_POINTS_URL, {
      // A one second cache window keeps each build reading the source. The
      // obvious `cache: 'no-store'` is not usable: it marks the fetch dynamic,
      // and the static export refuses to prerender a route that makes one,
      // which silently pushed every story onto its committed snapshot.
      next: { revalidate: 1 },
      signal: AbortSignal.timeout(CYCLE_HIRE_LIVE_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${TFL_BIKE_POINTS_URL}`);
    }
    return buildCycleHireIndex(parseTflBikePoints(await response.json()));
  } catch (error) {
    console.warn(
      `Falling back to the committed cycle hire snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return buildCycleHireIndex(parseTflBikePoints(readSnapshot(CYCLE_HIRE_SNAPSHOT_PATH)));
  }
}
