import {
  parsePlanningDatasets,
  PLANNING_DATASETS_URL,
  summarizePlanningDatasets,
} from '@uk-open-data-connectors/uk-sources';
import type { PlanningDatasetSummary } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The catalogue answers in a few seconds; this is the build-time ceiling. */
export const PLANNING_LIVE_TIMEOUT_MS = 30_000;

// Committed snapshot, so the static build still works when the platform API is
// slow or unreachable from the build runner.
const PLANNING_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/planning-datasets-sample.json',
);

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Reads the Planning Data dataset catalogue at build time.
 *
 * Falls back to the committed snapshot when the platform API is slow, blocked,
 * or unreachable. The fallback is logged, not swallowed.
 *
 * @returns dataset, record, and empty-dataset counts for the story
 */
export async function fetchPlanningDatasetSummary(): Promise<PlanningDatasetSummary> {
  try {
    const response = await globalThis.fetch(PLANNING_DATASETS_URL, {
      // A one second cache window keeps each build reading the source. The
      // obvious `cache: 'no-store'` is not usable: it marks the fetch dynamic,
      // and the static export refuses to prerender a route that makes one,
      // which silently pushed every story onto its committed snapshot.
      next: { revalidate: 1 },
      signal: AbortSignal.timeout(PLANNING_LIVE_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${PLANNING_DATASETS_URL}`);
    }
    return summarizePlanningDatasets(parsePlanningDatasets(await response.json()));
  } catch (error) {
    console.warn(
      `Falling back to the committed planning dataset snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return summarizePlanningDatasets(parsePlanningDatasets(readSnapshot(PLANNING_SNAPSHOT_PATH)));
  }
}
