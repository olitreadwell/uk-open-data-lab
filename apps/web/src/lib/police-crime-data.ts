import {
  DEFAULT_POLICE_CRIME_LOCATION,
  fetchPoliceCrimeSummary as fetchPoliceCrimeSummaryLive,
  parsePoliceCrimeSummary,
} from '@uk-open-data-connectors/uk-sources';
import type { PoliceCrimeSummary } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Each month answers in a second or two; this is the ceiling on one call. */
export const POLICE_CRIME_LIVE_TIMEOUT_MS = 30_000;

/** The API's label for a case that closed without a suspect identified. */
export const NO_SUSPECT_OUTCOME = 'Investigation complete; no suspect identified';

/** The point the story counts around, with the name the page gives it. */
export const RECORDED_CRIME_LOCATION = DEFAULT_POLICE_CRIME_LOCATION;

// Committed snapshot, so the static build still works when the API is slow,
// rate-limited, or unreachable from the build runner.
const POLICE_CRIME_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/police-recorded-crime-sample.json',
);

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Counts recorded crime within a mile of a point at build time.
 *
 * The adapter behind this reads the published months one at a time through the
 * wrapper below, so each build re-reads the API instead of replaying a cached
 * response. Falls back to the committed snapshot when the API is slow,
 * rate-limited, or unreachable. The fallback is logged, not swallowed.
 *
 * @returns offence counts by month, crime type, and outcome
 */
export async function fetchRecordedCrimeSummary(): Promise<PoliceCrimeSummary> {
  try {
    return await fetchPoliceCrimeSummaryLive({
      fetchImpl: (input, init) =>
        globalThis.fetch(input, {
          ...init,
          // A one second cache window keeps each build reading the source. The
          // obvious `cache: 'no-store'` is not usable: it marks the fetch
          // dynamic, and the static export refuses to prerender a route that
          // makes one, which silently pushes every story onto its snapshot.
          next: { revalidate: 1 },
          signal: AbortSignal.timeout(POLICE_CRIME_LIVE_TIMEOUT_MS),
          headers: { accept: 'application/json' },
        }),
    });
  } catch (error) {
    console.warn(
      `Falling back to the committed recorded crime snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return parsePoliceCrimeSummary(readSnapshot(POLICE_CRIME_SNAPSHOT_PATH));
  }
}
