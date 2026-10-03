import { renderToReadableStream } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { CATEGORY_SLUGS, MICROSITES } from '@/lib/microsites';

import MicrositePage, { generateMetadata } from './page';

/** Builds the category/slug params for a microsite, or a miss for unknown slugs. */
function paramsFor(slug: string): { category: string; slug: string } {
  const microsite = MICROSITES.find((candidate) => candidate.slug === slug);
  return {
    category: microsite === undefined ? 'nope' : CATEGORY_SLUGS[microsite.category],
    slug,
  };
}

const notFoundMock = vi.fn();
vi.mock('next/navigation', () => ({
  notFound: (): never => {
    notFoundMock();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/cycle-hire-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/cycle-hire-data')>();
  return {
    ...actual,
    fetchCycleHireIndex: vi.fn().mockResolvedValue({
      stationCount: 798,
      dockCount: 20992,
      bikeCount: 8492,
      electricBikeCount: 967,
      sizeBuckets: [
        { dockCount: 10, stationCount: 1 },
        { dockCount: 24, stationCount: 3 },
        { dockCount: 63, stationCount: 1 },
      ],
      largestStations: [
        {
          id: 'BikePoints_532',
          name: 'Jubilee Plaza, Canary Wharf',
          dockCount: 63,
          bikeCount: 37,
          electricBikeCount: 1,
          emptyDockCount: 26,
          temporary: false,
        },
        {
          id: 'BikePoints_193',
          name: 'Bankside Mix, Bankside',
          dockCount: 60,
          bikeCount: 5,
          electricBikeCount: 0,
          emptyDockCount: 55,
          temporary: false,
        },
      ],
    }),
  };
});

vi.mock('@/lib/gauge-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gauge-data')>();
  return {
    ...actual,
    fetchGaugeStationSample: vi.fn().mockResolvedValue([]),
    buildGaugeStationIndex: vi.fn().mockReturnValue({
      stationCount: 2095,
      riverCount: 808,
      measureCount: 2933,
      topRivers: [
        { riverName: 'River Thames', stationCount: 55 },
        { riverName: 'Tide', stationCount: 34 },
      ],
    }),
    fetchGaugeLiveLevel: vi.fn().mockResolvedValue({
      stationReference: '1029TH',
      stationLabel: 'Bourton Dickler',
      measureId: 'm1',
      latestLevelMetres: 0.071,
      latestReadingTime: '2026-09-23T08:00:00Z',
      changeMetres: 0.003,
      windowHours: 25,
      trend: 'steady' as const,
    }),
  };
});

vi.mock('@/lib/ons-catalogue-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ons-catalogue-data')>();
  return {
    ...actual,
    fetchOnsCatalogueSummary: vi.fn().mockResolvedValue({
      datasetCount: 338,
      nationalStatisticCount: 281,
      unflaggedCount: 17,
      yearCounts: [
        { year: '2022', datasetCount: 4 },
        { year: '2023', datasetCount: 180 },
        { year: '2024', datasetCount: 130 },
        { year: '2026', datasetCount: 10 },
      ],
    }),
  };
});

vi.mock('@/lib/food-hygiene-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/food-hygiene-data')>();
  return {
    ...actual,
    fetchFoodHygieneSummary: vi.fn().mockResolvedValue({
      authorityCount: 363,
      establishmentCount: 612721,
      fhrsAuthorityCount: 331,
      fhisAuthorityCount: 32,
      largestAuthorities: [
        {
          localAuthorityId: 374,
          localAuthorityCode: '402',
          localAuthorityName: 'Birmingham',
          establishmentCount: 10239,
          scheme: 'fhrs' as const,
        },
        {
          localAuthorityId: 397,
          localAuthorityCode: '413',
          localAuthorityName: 'Leeds',
          establishmentCount: 7428,
          scheme: 'fhrs' as const,
        },
      ],
    }),
  };
});

vi.mock('@/lib/planning-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/planning-data')>();
  return {
    ...actual,
    fetchPlanningDatasetSummary: vi.fn().mockResolvedValue({
      datasetCount: 201,
      entityCount: 25355887,
      emptyDatasetCount: 84,
      largestDatasets: [
        {
          dataset: 'title-boundary',
          name: 'Title boundary',
          entityCount: 22740586,
          themes: ['administrative', 'housing'],
          typology: 'geography',
          phase: 'beta',
          licence: 'ogl3',
        },
        {
          dataset: 'flood-risk-zone',
          name: 'Flood risk zone',
          entityCount: 780636,
          themes: ['environment'],
          typology: 'geography',
          phase: 'beta',
          licence: 'ogl3',
        },
      ],
    }),
  };
});

vi.mock('@/lib/bank-rate-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/bank-rate-data')>();
  return {
    ...actual,
    fetchBankRateSummary: vi.fn().mockResolvedValue({
      observationCount: 13077,
      changeCount: 258,
      levelCount: 114,
      firstObservation: { date: '1975-01-02', ratePercent: 11.5 },
      latestObservation: { date: '2026-09-24', ratePercent: 3.75 },
      highestSpell: {
        startDate: '1979-11-15',
        endDate: '1980-07-02',
        ratePercent: 17,
        dayCount: 231,
      },
      lowestSpell: {
        startDate: '2020-03-19',
        endDate: '2021-12-15',
        ratePercent: 0.1,
        dayCount: 637,
      },
      longestSpell: {
        startDate: '2009-03-05',
        endDate: '2016-08-03',
        ratePercent: 0.5,
        dayCount: 2709,
      },
      spells: [
        { startDate: '1975-01-02', endDate: '1975-01-17', ratePercent: 11.5, dayCount: 16 },
        { startDate: '2009-03-05', endDate: '2016-08-03', ratePercent: 0.5, dayCount: 2709 },
      ],
    }),
  };
});

vi.mock('@/lib/ancient-woodland-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ancient-woodland-data')>();
  return {
    ...actual,
    fetchAncientWoodlandProfile: vi.fn().mockResolvedValue({
      recordCount: 53638,
      totalHectares: 365049.84601722023,
      largestRecordHectares: 719.427161103768,
      averageRecordHectares: 6.805806443514305,
      categoryCounts: { asnw: 39233, paws: 14341, awp: 64 },
      categoryHectares: { asnw: 215100.2, paws: 149811.8, awp: 137.8 },
      sizeBands: [
        {
          label: 'Under 1 hectare',
          minHectares: 0,
          maxHectares: 1,
          recordCount: 14725,
          categoryCounts: { asnw: 11992, paws: 2701, awp: 32 },
        },
        {
          label: '2 to 5 hectares',
          minHectares: 2,
          maxHectares: 5,
          recordCount: 13728,
          categoryCounts: { asnw: 9883, paws: 3832, awp: 13 },
        },
      ],
    }),
  };
});

vi.mock('@/lib/police-crime-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/police-crime-data')>();
  return {
    ...actual,
    fetchRecordedCrimeSummary: vi.fn().mockResolvedValue({
      monthCount: 12,
      recordCount: 17835,
      firstMonth: '2025-08',
      latestMonth: '2026-07',
      categoryCounts: [
        { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 4942 },
        { slug: 'shoplifting', name: 'Shoplifting', recordCount: 3311 },
        { slug: 'other-theft', name: 'Other theft', recordCount: 1586 },
        { slug: 'anti-social-behaviour', name: 'Anti-social behaviour', recordCount: 1496 },
        { slug: 'public-order', name: 'Public order', recordCount: 1461 },
        { slug: 'drugs', name: 'Drugs', recordCount: 964 },
        { slug: 'possession-of-weapons', name: 'Possession of weapons', recordCount: 193 },
      ],
      outcomeCounts: [
        { outcome: 'Investigation complete; no suspect identified', recordCount: 7866 },
        { outcome: 'Unable to prosecute suspect', recordCount: 3046 },
        { outcome: 'Under investigation', recordCount: 1778 },
        { outcome: null, recordCount: 1496 },
      ],
      months: [
        {
          month: '2026-06',
          recordCount: 1452,
          categoryCounts: [
            { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 403 },
            { slug: 'shoplifting', name: 'Shoplifting', recordCount: 317 },
          ],
        },
        {
          month: '2026-07',
          recordCount: 1417,
          categoryCounts: [
            { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 419 },
            { slug: 'shoplifting', name: 'Shoplifting', recordCount: 297 },
          ],
        },
      ],
      busiestMonth: { month: '2025-10', recordCount: 1691, categoryCounts: [] },
      quietestMonth: { month: '2026-02', recordCount: 1314, categoryCounts: [] },
      topCategory: {
        slug: 'violent-crime',
        name: 'Violence and sexual offences',
        recordCount: 4942,
      },
      topOutcome: {
        outcome: 'Investigation complete; no suspect identified',
        recordCount: 7866,
      },
    }),
  };
});

vi.mock('@/lib/parliament-seats-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/parliament-seats-data')>();
  return {
    ...actual,
    fetchParliamentSeatSummary: vi.fn().mockResolvedValue({
      seatCount: 650,
      partyCount: 18,
      majorityThreshold: 326,
      partiesWithOneSeat: 6,
      largestParty: {
        party: {
          id: 15,
          name: 'Labour',
          abbreviation: 'Lab',
          backgroundColour: 'd50000',
          foregroundColour: 'ffffff',
          isIndependent: false,
        },
        seatCount: 403,
        maleCount: 215,
        femaleCount: 188,
        nonBinaryCount: 0,
        unallocatedSeatCount: 0,
      },
      seats: [
        {
          party: {
            id: 15,
            name: 'Labour',
            abbreviation: 'Lab',
            backgroundColour: 'd50000',
            foregroundColour: 'ffffff',
            isIndependent: false,
          },
          seatCount: 403,
          maleCount: 215,
          femaleCount: 188,
          nonBinaryCount: 0,
          unallocatedSeatCount: 0,
        },
        {
          party: {
            id: 4,
            name: 'Conservative',
            abbreviation: 'Con',
            backgroundColour: '0063ba',
            foregroundColour: 'ffffff',
            isIndependent: false,
          },
          seatCount: 118,
          maleCount: 90,
          femaleCount: 28,
          nonBinaryCount: 0,
          unallocatedSeatCount: 0,
        },
        {
          party: {
            id: 1,
            name: 'Speaker',
            abbreviation: 'Spk',
            backgroundColour: null,
            foregroundColour: null,
            isIndependent: false,
          },
          seatCount: 1,
          maleCount: 1,
          femaleCount: 0,
          nonBinaryCount: 0,
          unallocatedSeatCount: 0,
        },
      ],
    }),
  };
});

describe('MicrositePage', () => {
  it('renders the gauge story with narrative, chart, and sources', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('gauge-index'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('more gauges than any other river in England');
    expect(html).toContain('The agency marks some stations as closed or suspended');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Open source data');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Flood-monitoring API reference');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/environment"');
    expect(html).toContain('Gauge index');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched index', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('gauge-index'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('2,095');
    expect(html).toContain('River Thames');
    expect(html).toContain('Bourton Dickler, steady');
  });

  it('renders exactly one h1 with the microsite title before any h2', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('gauge-index'))} />,
    );
    const html = await new Response(stream).text();
    const h1s = html.match(/<h1[^>]*>(.*?)<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain('more gauges than any other river in England');
    const headingIndexes = ['<h1', '<h2', '<h3', '<h4', '<h5', '<h6']
      .map((tag) => html.indexOf(tag))
      .filter((index) => index !== -1);
    expect(Math.min(...headingIndexes)).toBe(html.indexOf('<h1'));
  });

  it('returns a unique document title for the gauge microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('gauge-index')) }),
    ).resolves.toEqual({
      title: 'Gauge index - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Gauge index - uk-open-data-lab',
        description: expect.any(String),
        url: '/environment/gauge-index/',
        type: 'article',
      },
    });
  });

  it('returns a generic title for an unknown microsite', async () => {
    await expect(generateMetadata({ params: Promise.resolve(paramsFor('nope')) })).resolves.toEqual(
      {
        title: 'uk-open-data-lab',
      },
    );
  });

  it('renders the ONS catalogue story with narrative, chart, and sources', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('ons-dataset-catalogue'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('The ONS dataset API lists 338 datasets');
    expect(html).toContain('The national statistic flag is the ONS marking its own output');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('ONS Developer Hub');
    expect(html).toContain('href="/open-data"');
    expect(html).toContain('ONS catalogue');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched catalogue', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('ons-dataset-catalogue'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="ons-datasets" data-value="338"');
    expect(html).toContain('data-testid="ons-stamped-recently" data-value="310"');
    expect(html).toContain('data-testid="ons-national-statistics" data-value="281"');
    expect(html).toContain('View the years as a table');
    expect(html).toContain('>2023<');
    expect(html).toContain('>180<');
  });

  it('returns a unique document title for the ONS catalogue microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('ons-dataset-catalogue')) }),
    ).resolves.toEqual({
      title: 'ONS catalogue - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'ONS catalogue - uk-open-data-lab',
        description: expect.any(String),
        url: '/open-data/ons-dataset-catalogue/',
        type: 'article',
      },
    });
  });

  it('renders the food hygiene story with narrative, chart, and sources', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('food-hygiene-registers'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('Birmingham lists 10,239 food outlets');
    expect(html).toContain('Scotland runs a separate scheme');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Food Hygiene Rating Scheme API help');
    expect(html).toContain('Food Hygiene Information Scheme');
    expect(html).toContain('href="/health"');
    expect(html).toContain('Food hygiene registers');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched registers', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('food-hygiene-registers'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="food-hygiene-establishments" data-value="612721"');
    expect(html).toContain('data-testid="food-hygiene-registers" data-value="363"');
    expect(html).toContain('data-testid="food-hygiene-largest-register" data-value="10239"');
    expect(html).toContain('View the registers as a table');
    expect(html).toContain('>Birmingham<');
    expect(html).toContain('>10,239<');
  });

  it('returns a unique document title for the food hygiene microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('food-hygiene-registers')) }),
    ).resolves.toEqual({
      title: 'Food hygiene registers - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Food hygiene registers - uk-open-data-lab',
        description: expect.any(String),
        url: '/health/food-hygiene-registers/',
        type: 'article',
      },
    });
  });

  it('renders the cycle hire story with narrative, chart, and sources', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('cycle-hire-docks'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('798 cycle hire docks hold space for 20 to 39 bikes');
    expect(html).toContain('A docking point is the fixed part of the network');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('BikePoint docking station API');
    expect(html).toContain('TfL open data terms and licences');
    expect(html).toContain('href="/transport"');
    expect(html).toContain('Cycle hire docks');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched docking stations', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('cycle-hire-docks'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="cycle-hire-stations" data-value="798"');
    expect(html).toContain('data-testid="cycle-hire-docking-points" data-value="20992"');
    expect(html).toContain('data-testid="cycle-hire-largest-station" data-value="63"');
    expect(html).toContain('View the dock sizes as a table');
    expect(html).toContain('Jubilee Plaza, Canary Wharf');
    expect(html).toContain('>20,992<');
  });

  it('returns a unique document title for the cycle hire microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('cycle-hire-docks')) }),
    ).resolves.toEqual({
      title: 'Cycle hire docks - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Cycle hire docks - uk-open-data-lab',
        description: expect.any(String),
        url: '/transport/cycle-hire-docks/',
        type: 'article',
      },
    });
  });

  it('renders the planning datasets story with narrative, chart, and sources', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('planning-datasets'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('nearly nine in ten of the records');
    expect(html).toContain('The ranking is lopsided');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Planning Data API documentation');
    expect(html).toContain('Open Government Licence v3.0');
    expect(html).toContain('href="/open-data"');
    expect(html).toContain('Planning datasets');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched dataset catalogue', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('planning-datasets'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="planning-datasets" data-value="201"');
    expect(html).toContain('data-testid="planning-records" data-value="25355887"');
    expect(html).toContain('data-testid="planning-largest-dataset" data-value="22740586"');
    expect(html).toContain('View the largest datasets as a table');
    expect(html).toContain('Title boundary');
    expect(html).toContain('>22,740,586<');
  });

  it('returns a unique document title for the planning datasets microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('planning-datasets')) }),
    ).resolves.toEqual({
      title: 'Planning datasets - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Planning datasets - uk-open-data-lab',
        description: expect.any(String),
        url: '/open-data/planning-datasets/',
        type: 'article',
      },
    });
  });

  it('renders the ancient woodland story copy', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('ancient-woodland'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('Ancient woodland is land that has been wooded since at least 1600');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Ancient Woodland (England) layer (Natural England)');
    expect(html).toContain('Open Government Licence v3.0');
    expect(html).toContain('href="/biodiversity"');
    expect(html).toContain('Ancient woodland');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched layer', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('ancient-woodland'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="ancient-woodland-records" data-value="53638"');
    expect(html).toContain('data-testid="ancient-woodland-hectares" data-value="365050"');
    expect(html).toContain('data-testid="ancient-woodland-smallest-band" data-value="14725"');
    expect(html).toContain('View the size bands as a table');
    expect(html).toContain('Under 1 hectare');
    expect(html).toContain('>53,638<');
  });

  it('renders the Bank Rate story copy', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('bank-rate'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('Bank Rate held 0.5% for 2,709 days');
    expect(html).toContain('The database writes one row per business day');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Interactive Statistical Database (Bank of England)');
    expect(html).toContain('Terms and conditions (Bank of England)');
    expect(html).toContain('href="/economy"');
    expect(html).toContain('Bank Rate');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched series', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('bank-rate'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="bank-rate-latest" data-value="3.75"');
    expect(html).toContain('data-testid="bank-rate-longest-hold" data-value="2709"');
    expect(html).toContain('data-testid="bank-rate-readings" data-value="13077"');
    expect(html).toContain('View the runs at each level as a table');
    expect(html).toContain('2 January 1975');
  });

  it('fills the Bank Rate source note from the series it fetched', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('bank-rate'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('13,077 daily readings running to 24 September 2026');
    expect(html).toContain('in 2 runs at 114 levels');
  });

  it('returns a unique document title for the Bank Rate microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('bank-rate')) }),
    ).resolves.toEqual({
      title: 'Bank Rate - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Bank Rate - uk-open-data-lab',
        description: expect.any(String),
        url: '/economy/bank-rate/',
        type: 'article',
      },
    });
  });

  it('returns a unique document title for the ancient woodland microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('ancient-woodland')) }),
    ).resolves.toEqual({
      title: 'Ancient woodland - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Ancient woodland - uk-open-data-lab',
        description: expect.any(String),
        url: '/biodiversity/ancient-woodland/',
        type: 'article',
      },
    });
  });

  it('renders the recorded crime story copy', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('recorded-crime'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('in every month of the last year');
    expect(html).toContain('Nothing about that edge follows a ward, a postcode, or a police area');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Police API documentation (data.police.uk)');
    expect(html).toContain('Open Government Licence v3.0');
    expect(html).toContain('href="/society"');
    expect(html).toContain('Recorded crime');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched window', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('recorded-crime'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="recorded-crime-offences" data-value="17835"');
    expect(html).toContain('data-testid="recorded-crime-leading-type" data-value="4942"');
    expect(html).toContain('data-testid="recorded-crime-no-suspect" data-value="7866"');
    expect(html).toContain('View the crime types as a table');
    expect(html).toContain('Shoplifting');
    expect(html).toContain('>3,311<');
  });

  it('fills the recorded crime source note from the window it fetched', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('recorded-crime'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain(
      '17,835 offences within a mile of 53.7997, -1.5492 across the 12 published months from August 2025 to July 2026',
    );
  });

  it('returns a unique document title for the recorded crime microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('recorded-crime')) }),
    ).resolves.toEqual({
      title: 'Recorded crime - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Recorded crime - uk-open-data-lab',
        description: expect.any(String),
        url: '/society/recorded-crime/',
        type: 'article',
      },
    });
  });

  it('renders the Parliament seats story copy', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('parliament-seats'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('a party needs 326 of them to hold more than half the chamber');
    expect(html).toContain('A vacant seat is listed as its own party');
    expect(html).toContain('Key facts');
    expect(html).toContain('How to read this chart');
    expect(html).toContain('Sources and further reading');
    expect(html).toContain('Members API reference (UK Parliament)');
    expect(html).toContain('Open Parliament Licence v3.0');
    expect(html).toContain('href="/society"');
    expect(html).toContain('Parliament seats');
    expect(html.match(/<h1[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('reads the headline numbers out of the fetched seat counts', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('parliament-seats'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('data-testid="parliament-seats" data-value="650"');
    expect(html).toContain('data-testid="parliament-largest-party" data-value="403"');
    expect(html).toContain('data-testid="parliament-parties" data-value="18"');
    expect(html).toContain('View the seats as a table');
    expect(html).toContain('Labour');
    expect(html).toContain('>403<');
  });

  it('fills the Parliament seats source note from the seats it fetched', async () => {
    const stream = await renderToReadableStream(
      <MicrositePage params={Promise.resolve(paramsFor('parliament-seats'))} />,
    );
    const html = await new Response(stream).text();
    expect(html).toContain('The house held 650 seats across 18 parties');
    expect(html).toContain('Labour held the largest block at 403');
  });

  it('returns a unique document title for the Parliament seats microsite', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve(paramsFor('parliament-seats')) }),
    ).resolves.toEqual({
      title: 'Parliament seats - uk-open-data-lab',
      description: expect.any(String),
      openGraph: {
        title: 'Parliament seats - uk-open-data-lab',
        description: expect.any(String),
        url: '/society/parliament-seats/',
        type: 'article',
      },
    });
  });
});
