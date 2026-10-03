import { parseTflBikePoints } from '@uk-open-data-connectors/uk-sources';
import type { DockingStation } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildCycleHireIndex, buildDockSizeBuckets, fetchCycleHireIndex } from './cycle-hire-data';

const RAW_SNAPSHOT = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/tfl-bike-points-sample.json'), 'utf8'),
) as unknown;

const SNAPSHOT_STATIONS = parseTflBikePoints(RAW_SNAPSHOT);
const SNAPSHOT_INDEX = buildCycleHireIndex(SNAPSHOT_STATIONS);

/** A station to copy when a test only cares about a few fields. */
const BASE_STATION: DockingStation = {
  id: 'BikePoints_1',
  name: 'Example Dock',
  dockCount: 20,
  bikeCount: 5,
  electricBikeCount: 1,
  emptyDockCount: 15,
  temporary: false,
};

describe('the committed cycle hire snapshot', () => {
  it('holds the docking stations the story quotes', () => {
    expect(SNAPSHOT_INDEX.stationCount).toBe(798);
    expect(SNAPSHOT_INDEX.dockCount).toBe(20992);
  });

  it('puts the Canary Wharf dock at the top of the largest stations', () => {
    const largest = SNAPSHOT_INDEX.largestStations[0];
    expect(largest?.name).toBe('Jubilee Plaza, Canary Wharf');
    expect(largest?.dockCount).toBe(63);
  });

  it('keeps the ten largest stations in size order', () => {
    const sizes = SNAPSHOT_INDEX.largestStations.map((station) => station.dockCount);
    expect(sizes).toHaveLength(10);
    expect([...sizes].sort((left, right) => right - left)).toEqual(sizes);
  });
});

describe('buildDockSizeBuckets', () => {
  it('counts the stations at each dock size, smallest size first', () => {
    const buckets = buildDockSizeBuckets([
      { ...BASE_STATION, id: 'a', name: 'A', dockCount: 12 },
      { ...BASE_STATION, id: 'b', name: 'B', dockCount: 12 },
      { ...BASE_STATION, id: 'c', name: 'C', dockCount: 30 },
    ]);
    expect(buckets).toEqual([
      { dockCount: 12, stationCount: 2 },
      { dockCount: 30, stationCount: 1 },
    ]);
  });

  it('returns nothing for an empty station list', () => {
    expect(buildDockSizeBuckets([])).toEqual([]);
  });
});

describe('buildCycleHireIndex', () => {
  it('totals the stations, docking points, and bikes', () => {
    const stations = [
      {
        ...BASE_STATION,
        id: 'a',
        name: 'A',
        dockCount: 10,
        bikeCount: 4,
        electricBikeCount: 1,
      },
      {
        ...BASE_STATION,
        id: 'b',
        name: 'B',
        dockCount: 20,
        bikeCount: 6,
        electricBikeCount: 2,
      },
    ];
    const index = buildCycleHireIndex(stations);
    expect(index.stationCount).toBe(2);
    expect(index.dockCount).toBe(30);
    expect(index.bikeCount).toBe(10);
    expect(index.electricBikeCount).toBe(3);
  });

  it('caps the largest list at the requested size', () => {
    expect(buildCycleHireIndex(SNAPSHOT_STATIONS, 3).largestStations).toHaveLength(3);
  });

  it('returns zeroed counts for an empty station list', () => {
    expect(buildCycleHireIndex([])).toEqual({
      stationCount: 0,
      dockCount: 0,
      bikeCount: 0,
      electricBikeCount: 0,
      sizeBuckets: [],
      largestStations: [],
    });
  });
});

describe('fetchCycleHireIndex', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the live docking stations when TfL answers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    const index = await fetchCycleHireIndex();
    expect(index.stationCount).toBe(798);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('leaves the fetch uncached, so a build reads the source again', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(RAW_SNAPSHOT), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);
    await fetchCycleHireIndex();
    const [url, init] = fetchImpl.mock.calls[0] as [
      string,
      RequestInit & { next?: { revalidate?: number } },
    ];
    expect(url).toBe('https://api.tfl.gov.uk/BikePoint');
    // `cache: 'no-store'` would mark the fetch dynamic, and the static export
    // refuses to prerender a route that makes one.
    expect(init.cache).toBeUndefined();
    expect(init.next?.revalidate).toBe(1);
  });

  it('falls back to the committed snapshot when the fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const index = await fetchCycleHireIndex();
    expect(index.stationCount).toBe(798);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('committed cycle hire snapshot'));
  });

  it('falls back to the committed snapshot on an error status', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const index = await fetchCycleHireIndex();
    expect(index.dockCount).toBe(20992);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });
});
