import {
  parseFoodHygieneAuthorities,
  summarizeFoodHygieneAuthorities,
} from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchFoodHygieneSummary } from './food-hygiene-data';

const RAW_SNAPSHOT = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/food-hygiene-authorities-sample.json'),
    'utf8',
  ),
) as unknown;

const SNAPSHOT_SUMMARY = summarizeFoodHygieneAuthorities(parseFoodHygieneAuthorities(RAW_SNAPSHOT));

describe('the committed food hygiene snapshot', () => {
  it('holds the registers the story quotes', () => {
    expect(SNAPSHOT_SUMMARY.authorityCount).toBe(363);
    expect(SNAPSHOT_SUMMARY.establishmentCount).toBe(612721);
    expect(SNAPSHOT_SUMMARY.fhrsAuthorityCount).toBe(331);
    expect(SNAPSHOT_SUMMARY.fhisAuthorityCount).toBe(32);
  });

  it('puts Birmingham at the top of the largest registers', () => {
    const largest = SNAPSHOT_SUMMARY.largestAuthorities[0];
    expect(largest?.localAuthorityName).toBe('Birmingham');
    expect(largest?.establishmentCount).toBe(10239);
  });
});

describe('fetchFoodHygieneSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the live registers when the FSA API answers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    const summary = await fetchFoodHygieneSummary();
    expect(summary.authorityCount).toBe(363);
    expect(summary.establishmentCount).toBe(612721);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('sends the API version header the FSA asks for', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    await fetchFoodHygieneSummary();
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ 'x-api-version': '2' });
  });

  it('falls back to the committed snapshot when the fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const summary = await fetchFoodHygieneSummary();
    expect(summary.authorityCount).toBe(363);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('committed food hygiene snapshot'));
  });

  it('falls back to the committed snapshot on an error status', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const summary = await fetchFoodHygieneSummary();
    expect(summary.establishmentCount).toBe(612721);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });
});
