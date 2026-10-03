import {
  buildBankRateCsvUrl,
  formatBankRateQueryDate,
  parseBankRateCsv,
  summarizeBankRateSeries,
} from '@uk-open-data-connectors/uk-sources';
import type { BankRateSummary } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The Bank of England database answers in a few seconds; this is the build ceiling. */
export const BANK_RATE_LIVE_TIMEOUT_MS = 30_000;

// Committed snapshot, so the static build still works when the database is
// slow or unreachable from the build runner.
const BANK_RATE_SNAPSHOT_PATH = path.join(process.cwd(), 'src/fixtures/bank-rate-sample.csv');

/** Reads the committed CSV snapshot as text, or throws with the failing path. */
function readSnapshot(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

/**
 * Reads the daily Bank Rate series at build time.
 *
 * The database answer is one CSV row per business day, so the summary is
 * worked out from the same read the chart draws. Falls back to the committed
 * snapshot when the database is slow, blocked, or unreachable; the fallback is
 * logged, not swallowed.
 *
 * @returns the rolled-up series the story draws
 */
export async function fetchBankRateSummary(): Promise<BankRateSummary> {
  const url = buildBankRateCsvUrl(formatBankRateQueryDate(new Date()));
  try {
    const response = await globalThis.fetch(url, {
      // A one second cache window keeps each build reading the source. The
      // obvious `cache: 'no-store'` is not usable: it marks the fetch dynamic,
      // and the static export refuses to prerender a route that makes one,
      // which silently pushes every story onto its committed snapshot.
      next: { revalidate: 1 },
      signal: AbortSignal.timeout(BANK_RATE_LIVE_TIMEOUT_MS),
      headers: { accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return summarizeBankRateSeries(parseBankRateCsv(await response.text()));
  } catch (error) {
    console.warn(
      `Falling back to the committed Bank Rate snapshot: ${error instanceof Error ? error.message : String(error)}`,
    );
    return summarizeBankRateSeries(parseBankRateCsv(readSnapshot(BANK_RATE_SNAPSHOT_PATH)));
  }
}
