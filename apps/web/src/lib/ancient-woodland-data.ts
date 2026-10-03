import {
  fetchAncientWoodlandProfile as fetchAncientWoodlandProfileLive,
  parseAncientWoodlandProfile,
} from '@uk-open-data-connectors/uk-sources';
import type { AncientWoodlandProfile } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Each statistics query answers in about a second; this is the build ceiling. */
export const ANCIENT_WOODLAND_LIVE_TIMEOUT_MS = 30_000;

// Committed snapshot, so the static build still works when the layer is slow
// or unreachable from the build runner.
const ANCIENT_WOODLAND_SNAPSHOT_PATH = path.join(
  process.cwd(),
  'src/fixtures/ancient-woodland-sample.json',
);

/** Reads the committed snapshot, or throws with the failing path. */
function readSnapshot(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

/**
 * Counts England's ancient woodland at build time.
 *
 * The adapter behind this asks Natural England's layer for its own totals,
 * woodland types, and size bands through the wrapper below, so each build
 * re-reads the source instead of replaying a cached response. Falls back to
 * the committed snapshot when the layer is slow, blocked, or unreachable. The
 * fallback is logged, not swallowed.
 *
 * @returns record, area, woodland type, and size band counts for the layer
 */
export async function fetchAncientWoodlandProfile(): Promise<AncientWoodlandProfile> {
  try {
    return await fetchAncientWoodlandProfileLive({
      fetchImpl: (input, init) =>
        globalThis.fetch(input, {
          ...init,
          // A one second cache window keeps each build reading the source. The
          // obvious `cache: 'no-store'` is not usable: it marks the fetch
          // dynamic, and the static export refuses to prerender a route that
          // makes one, which silently pushes every story onto its snapshot.
          next: { revalidate: 1 },
          signal: AbortSignal.timeout(ANCIENT_WOODLAND_LIVE_TIMEOUT_MS),
          headers: { accept: 'application/json' },
        }),
    });
  } catch (error) {
    console.warn(
      `Falling back to the committed ancient woodland snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return parseAncientWoodlandProfile(readSnapshot(ANCIENT_WOODLAND_SNAPSHOT_PATH));
  }
}
