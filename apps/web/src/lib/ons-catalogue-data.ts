import {
  ONS_DATASETS_URL,
  parseOnsDatasets,
  summarizeOnsDatasets,
} from '@uk-open-data-connectors/uk-sources';
import type { OnsDatasetSummary } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The ONS beta API answers in about two seconds; this is the build-time ceiling. */
export const ONS_LIVE_PROBE_TIMEOUT_MS = 30_000;

/**
 * The two years that carry most of the catalogue's last-updated stamps,
 * counted together on the page as one headline figure.
 */
export const ONS_PEAK_STAMP_YEARS: readonly string[] = ['2023', '2024'];

// Committed snapshot, so the static build still works when the ONS API is
// slow or unreachable from the build runner.
const ONS_SNAPSHOT_PATH = path.join(process.cwd(), 'src/fixtures/ons-datasets-sample.json');

/** Fetches a URL with the build-time timeout, or throws. */
async function fetchJson(url: string): Promise<unknown> {
  const response = await globalThis.fetch(url, {
    // A one second cache window keeps each build reading the source. The
    // obvious `cache: 'no-store'` is not usable: it marks the fetch dynamic,
    // and the static export refuses to prerender a route that makes one, which
    // silently pushed every story onto its committed snapshot.
    next: { revalidate: 1 },
    signal: AbortSignal.timeout(ONS_LIVE_PROBE_TIMEOUT_MS),
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
 * Counts the datasets whose last-updated stamp falls in any of the given years.
 *
 * @param summary - catalogue summary from {@link fetchOnsCatalogueSummary}
 * @param years - the years to add up, as four digit strings
 * @returns how many dataset records carry a stamp in those years
 */
export function countDatasetsStampedIn(
  summary: OnsDatasetSummary,
  years: readonly string[],
): number {
  return summary.yearCounts
    .filter((yearCount) => years.includes(yearCount.year))
    .reduce((total, yearCount) => total + yearCount.datasetCount, 0);
}

/**
 * Reads the ONS beta API dataset catalogue at build time.
 *
 * Falls back to the committed snapshot when the API is slow, blocked, or
 * unreachable. The fallback is logged, not swallowed.
 *
 * @returns dataset, flag, and per-year counts for the catalogue
 */
export async function fetchOnsCatalogueSummary(): Promise<OnsDatasetSummary> {
  try {
    return summarizeOnsDatasets(parseOnsDatasets(await fetchJson(ONS_DATASETS_URL)));
  } catch (error) {
    console.warn(
      `Falling back to the committed ONS catalogue snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return summarizeOnsDatasets(parseOnsDatasets(readSnapshot(ONS_SNAPSHOT_PATH)));
  }
}
