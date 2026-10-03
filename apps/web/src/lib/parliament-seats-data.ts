import { fetchParliamentSeats, parseParliamentSeats } from '@uk-open-data-connectors/uk-sources';
import type { ParliamentSeatSummary } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The Members API can take tens of seconds to answer; this is the build ceiling. */
export const PARLIAMENT_SEATS_LIVE_TIMEOUT_MS = 60_000;

// Committed snapshot, so the static build still works when the Members API is
// slow, blocked, or unreachable from the build runner.
const PARLIAMENT_SEATS_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/parliament-seats-sample.json',
);

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Reads the House of Commons state of the parties at build time.
 *
 * The adapter behind this asks the Members API for the current date, so each
 * build re-reads the source instead of replaying a cached response. Falls back
 * to the committed snapshot when the API is slow, blocked, or unreachable. The
 * fallback is logged, not swallowed.
 *
 * @returns the seat total, the party count, and the ranking for the Commons
 */
export async function fetchParliamentSeatSummary(): Promise<ParliamentSeatSummary> {
  try {
    return await fetchParliamentSeats({
      fetchImpl: (input, init) =>
        globalThis.fetch(input, {
          ...init,
          // A one second cache window keeps each build reading the source. The
          // obvious `cache: 'no-store'` is not usable: it marks the fetch
          // dynamic, and the static export refuses to prerender a route that
          // makes one, which silently pushes every story onto its snapshot.
          next: { revalidate: 1 },
          signal: AbortSignal.timeout(PARLIAMENT_SEATS_LIVE_TIMEOUT_MS),
          headers: { accept: 'application/json' },
        }),
    });
  } catch (error) {
    console.warn(
      `Falling back to the committed Parliament seats snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return parseParliamentSeats(readSnapshot(PARLIAMENT_SEATS_SNAPSHOT_PATH));
  }
}
