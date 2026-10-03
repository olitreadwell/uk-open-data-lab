import { parseOnsDatasets, summarizeOnsDatasets } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  countDatasetsStampedIn,
  fetchOnsCatalogueSummary,
  ONS_PEAK_STAMP_YEARS,
} from './ons-catalogue-data';

const RAW_SNAPSHOT = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/ons-datasets-sample.json'), 'utf8'),
) as unknown;

const SNAPSHOT_SUMMARY = summarizeOnsDatasets(parseOnsDatasets(RAW_SNAPSHOT));

describe('countDatasetsStampedIn', () => {
  it('adds up the years the page reports together', () => {
    expect(countDatasetsStampedIn(SNAPSHOT_SUMMARY, ONS_PEAK_STAMP_YEARS)).toBe(310);
  });

  it('returns zero for years with no records', () => {
    expect(countDatasetsStampedIn(SNAPSHOT_SUMMARY, ['1999'])).toBe(0);
  });
});

describe('fetchOnsCatalogueSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the live catalogue when the ONS API answers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    const summary = await fetchOnsCatalogueSummary();
    expect(summary.datasetCount).toBe(338);
    expect(summary.nationalStatisticCount).toBe(281);
    expect(summary.yearCounts.at(-1)).toEqual({ year: '2026', datasetCount: 10 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back to the committed snapshot when the fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const summary = await fetchOnsCatalogueSummary();
    expect(summary.datasetCount).toBe(338);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('committed ONS catalogue snapshot'));
  });

  it('falls back to the committed snapshot on an error status', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const summary = await fetchOnsCatalogueSummary();
    expect(summary.datasetCount).toBe(338);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });
});
