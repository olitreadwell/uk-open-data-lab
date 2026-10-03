import {
  parsePlanningDatasets,
  summarizePlanningDatasets,
} from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPlanningDatasetSummary } from './planning-data';

const RAW_SNAPSHOT = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/planning-datasets-sample.json'), 'utf8'),
) as unknown;

const SNAPSHOT_SUMMARY = summarizePlanningDatasets(parsePlanningDatasets(RAW_SNAPSHOT));

describe('the committed planning dataset snapshot', () => {
  it('holds the datasets the story quotes', () => {
    expect(SNAPSHOT_SUMMARY.datasetCount).toBe(201);
    expect(SNAPSHOT_SUMMARY.entityCount).toBe(25355887);
    expect(SNAPSHOT_SUMMARY.emptyDatasetCount).toBe(84);
  });

  it('leaves the pipeline tables out of the dataset count', () => {
    const payload = RAW_SNAPSHOT as { datasets: unknown[] };
    expect(payload.datasets).toHaveLength(222);
  });

  it('puts the title boundary dataset at the top of the largest list', () => {
    const largest = SNAPSHOT_SUMMARY.largestDatasets[0];
    expect(largest?.dataset).toBe('title-boundary');
    expect(largest?.entityCount).toBe(22740586);
  });

  it('keeps the ten largest datasets in size order', () => {
    const sizes = SNAPSHOT_SUMMARY.largestDatasets.map((dataset) => dataset.entityCount);
    expect(sizes).toHaveLength(10);
    expect([...sizes].sort((left, right) => right - left)).toEqual(sizes);
  });
});

describe('fetchPlanningDatasetSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the live catalogue when the platform answers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    const summary = await fetchPlanningDatasetSummary();
    expect(summary.datasetCount).toBe(201);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('asks for a one second cache window rather than an uncached fetch', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    await fetchPlanningDatasetSummary();
    const [url, init] = fetchImpl.mock.calls[0] as [
      string,
      RequestInit & { next?: { revalidate?: number } },
    ];
    expect(url).toBe('https://www.planning.data.gov.uk/dataset.json');
    expect(init.cache).toBeUndefined();
    expect(init.next?.revalidate).toBe(1);
  });

  it('falls back to the committed snapshot when the fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const summary = await fetchPlanningDatasetSummary();
    expect(summary.datasetCount).toBe(201);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('committed planning dataset snapshot'),
    );
  });

  it('falls back to the committed snapshot on an error status', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const summary = await fetchPlanningDatasetSummary();
    expect(summary.entityCount).toBe(25355887);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });
});
