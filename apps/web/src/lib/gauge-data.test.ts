import { parseFloodReadings, parseFloodStations } from '@uk-open-data-connectors/uk-sources';
import type { FloodMeasure, FloodStation } from '@uk-open-data-connectors/uk-sources';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildGaugeLiveLevel,
  buildGaugeStationIndex,
  FEATURED_STATION_LABEL,
  FEATURED_STATION_REFERENCE,
  fetchGaugeLiveLevel,
  fetchGaugeStationSample,
  preferredMeasureIdsFor,
} from './gauge-data';

const STATIONS_SNAPSHOT = parseFloodStations(
  JSON.parse(
    readFileSync(path.join(process.cwd(), 'src/fixtures/flood-stations-sample.json'), 'utf8'),
  ) as unknown,
);

const READINGS_SNAPSHOT = parseFloodReadings(
  JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'src/fixtures/flood-station-readings-sample.json'),
      'utf8',
    ),
  ) as unknown,
);

const FEATURED = { reference: FEATURED_STATION_REFERENCE, label: FEATURED_STATION_LABEL };

/** Minimal measure builder for the preference tests. */
function measure(id: string, qualifier: string): FloodMeasure {
  return {
    id,
    parameter: 'level',
    parameterName: 'Water Level',
    qualifier,
    unitName: 'mASD',
    periodSeconds: 900,
  };
}

/** Minimal station builder for the index tests. */
function station(notation: string, riverName: string): FloodStation {
  return {
    id: `https://example.test/stations/${notation}`,
    notation,
    label: notation,
    riverName,
    catchmentName: '',
    latitude: 51,
    longitude: -1,
    measures: [],
  };
}

describe('buildGaugeStationIndex', () => {
  it('counts stations, rivers, and measures from the committed snapshot', () => {
    const index = buildGaugeStationIndex(STATIONS_SNAPSHOT);
    expect(index.stationCount).toBe(2095);
    expect(index.riverCount).toBe(808);
    expect(index.measureCount).toBe(2933);
  });

  it('ranks the River Thames first', () => {
    const index = buildGaugeStationIndex(STATIONS_SNAPSHOT);
    expect(index.topRivers[0]).toEqual({ riverName: 'River Thames', stationCount: 55 });
    expect(index.topRivers).toHaveLength(10);
  });

  it('breaks a tie on the river name so the order is stable', () => {
    const index = buildGaugeStationIndex([station('A', 'River Zed'), station('B', 'River Aa')]);
    expect(index.topRivers.map((river) => river.riverName)).toEqual(['River Aa', 'River Zed']);
  });

  it('ignores stations that name no river', () => {
    const index = buildGaugeStationIndex([station('A', 'River Aa'), station('B', '')]);
    expect(index.stationCount).toBe(2);
    expect(index.riverCount).toBe(1);
  });

  it('caps the river list at the requested size', () => {
    const index = buildGaugeStationIndex(
      [station('A', 'River Aa'), station('B', 'River Bb'), station('C', 'River Cc')],
      2,
    );
    expect(index.topRivers).toHaveLength(2);
  });

  it('returns empty rankings for an empty sample', () => {
    const index = buildGaugeStationIndex([]);
    expect(index).toEqual({ stationCount: 0, riverCount: 0, measureCount: 0, topRivers: [] });
  });
});

describe('preferredMeasureIdsFor', () => {
  it('puts the stage gauge ahead of the others at the featured station', () => {
    const preferred = preferredMeasureIdsFor(STATIONS_SNAPSHOT, FEATURED_STATION_REFERENCE);
    expect(preferred).toHaveLength(2);
    expect(preferred[0]).toContain('-stage-');
    expect(preferred[1]).toContain('-downstage-');
  });

  it('returns nothing for a station that is not in the sample', () => {
    expect(preferredMeasureIdsFor(STATIONS_SNAPSHOT, 'NOPE')).toEqual([]);
  });

  it('keeps every measure when none is the stage gauge', () => {
    const gauge: FloodStation = {
      ...station('A', 'River Aa'),
      measures: [measure('m-down', 'Downstream Stage'), measure('m-tidal', 'Tidal Level')],
    };
    expect(preferredMeasureIdsFor([gauge], 'A')).toEqual(['m-down', 'm-tidal']);
  });
});

describe('buildGaugeLiveLevel', () => {
  it('reads the stage gauge out of the committed snapshot', () => {
    const level = buildGaugeLiveLevel(READINGS_SNAPSHOT, {
      ...FEATURED,
      preferredMeasureIds: preferredMeasureIdsFor(STATIONS_SNAPSHOT, FEATURED_STATION_REFERENCE),
    });
    expect(level.measureId).toContain('-stage-');
    expect(level.latestLevelMetres).toBeCloseTo(0.068, 3);
    expect(level.windowHours).toBe(26);
    expect(level.trend).toBe('steady');
    expect(level.stationReference).toBe(FEATURED_STATION_REFERENCE);
    expect(level.stationLabel).toBe(FEATURED_STATION_LABEL);
  });

  it('falls back to the measure with the most readings when nothing is preferred', () => {
    const level = buildGaugeLiveLevel(READINGS_SNAPSHOT, FEATURED);
    expect(level.measureId).toContain('-downstage-');
  });

  it('takes the first preferred measure that actually has readings', () => {
    const level = buildGaugeLiveLevel(
      [{ measureId: 'm2', dateTime: '2026-01-01T00:00:00Z', value: 1 }],
      { ...FEATURED, preferredMeasureIds: ['m1', 'm2'] },
    );
    expect(level.measureId).toBe('m2');
  });

  it('reports the change and window between the earliest and latest reading', () => {
    const level = buildGaugeLiveLevel(
      [
        { measureId: 'm1', dateTime: '2026-01-01T00:00:00Z', value: 1 },
        { measureId: 'm1', dateTime: '2026-01-01T06:00:00Z', value: 1.5 },
        { measureId: 'm2', dateTime: '2026-01-01T00:00:00Z', value: 9 },
      ],
      { ...FEATURED, preferredMeasureIds: ['m1'] },
    );
    expect(level.measureId).toBe('m1');
    expect(level.changeMetres).toBeCloseTo(0.5, 5);
    expect(level.windowHours).toBe(6);
    expect(level.trend).toBe('rising');
  });

  it('keeps one gauge series together when a station mixes measures', () => {
    const level = buildGaugeLiveLevel(
      [
        { measureId: 'm1', dateTime: '2026-01-01T00:00:00Z', value: 1 },
        { measureId: 'm1', dateTime: '2026-01-01T01:00:00Z', value: 2 },
        { measureId: 'm2', dateTime: '2026-01-01T00:00:00Z', value: 9 },
      ],
      FEATURED,
    );
    expect(level.measureId).toBe('m1');
    expect(level.changeMetres).toBe(1);
  });

  it('throws when the station has no readings', () => {
    expect(() => buildGaugeLiveLevel([], FEATURED)).toThrow(/No readings/);
  });
});

describe('fetch fallbacks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the live station list when the agency API answers', async () => {
    const rawSnapshot = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/fixtures/flood-stations-sample.json'), 'utf8'),
    ) as unknown;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(rawSnapshot), { status: 200 })),
    );
    const stations = await fetchGaugeStationSample();
    expect(stations).toHaveLength(2095);
  });

  it('falls back to the committed station snapshot when the fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const stations = await fetchGaugeStationSample();
    expect(stations).toHaveLength(2095);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('station snapshot'));
  });

  it('falls back to the committed readings snapshot on a non-200 reply', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 503 })));
    const level = await fetchGaugeLiveLevel(
      preferredMeasureIdsFor(STATIONS_SNAPSHOT, FEATURED_STATION_REFERENCE),
    );
    expect(level.latestLevelMetres).toBeCloseTo(0.068, 3);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('readings snapshot'));
  });
});
