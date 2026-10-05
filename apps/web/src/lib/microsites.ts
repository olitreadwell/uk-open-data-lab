import type { MicrositeAccent } from '@/components/microsite-styles';
import type { MicrositeReference } from '@/components/MicrositeReferences';

import { withHiddenMicrositesRemoved } from './hidden-microsites';
import { PUBLISHED_MICROSITES } from './published-microsites';

/** Who publishes the underlying data for a microsite story. */
export type MicrositeDataSource =
  | 'Environment Agency'
  | 'Office for National Statistics (ONS)'
  | 'Food Standards Agency'
  | 'data.gov.uk'
  | 'Ordnance Survey'
  | 'Met Office'
  | 'Natural England'
  | 'Department for Transport'
  | 'NHS England'
  | 'British Geological Survey'
  | 'Transport for London'
  | 'Planning Data (MHCLG)'
  | 'OpenStreetMap'
  | 'Wikipedia & Wikidata'
  | 'Bank of England'
  | 'Home Office'
  | 'Carbon Intensity (NESO)'
  | 'UK Parliament';

/** The main visualisation used by a microsite story. */
export type MicrositeChartType =
  | 'Line chart'
  | 'Bar chart'
  | 'Rank / slope'
  | 'Map'
  | 'Search & table'
  | 'Tree'
  | 'Pyramid'
  | 'Histogram'
  | 'Scatter'
  | 'Rose / polar'
  | 'Sunburst'
  | 'Streamgraph'
  | 'Cycle plot'
  | 'Dumbbell'
  | 'Ridgeline'
  | 'Waffle'
  | 'Parallel coordinates'
  | 'Tile grid'
  | 'Dot plot'
  | 'Choropleth'
  | 'Marimekko'
  | 'Pareto'
  | 'Heatmap'
  | 'Strip chart'
  | 'Bar-in-bar';

/** The subject area a microsite story belongs to. */
export type MicrositeCategory =
  | 'Agriculture & farming'
  | 'Biodiversity & nature'
  | 'Census & population'
  | 'Economy & business'
  | 'Education'
  | 'Energy & climate'
  | 'Environment & geography'
  | 'Health'
  | 'Open data & digital'
  | 'Society & community'
  | 'Transport';

/** URL slug for each microsite category, used for /category-slug/ routes. */
export const CATEGORY_SLUGS: Record<MicrositeCategory, string> = {
  'Agriculture & farming': 'agriculture',
  'Biodiversity & nature': 'biodiversity',
  'Census & population': 'census',
  'Economy & business': 'economy',
  Education: 'education',
  'Energy & climate': 'energy',
  'Environment & geography': 'environment',
  Health: 'health',
  'Open data & digital': 'open-data',
  'Society & community': 'society',
  Transport: 'transport',
};

/** Category slug for a microsite config. */
export function categorySlugFor(microsite: Pick<MicrositeConfig, 'category'>): string {
  return CATEGORY_SLUGS[microsite.category];
}

/** Category label for a category slug, or undefined when unknown. */
export function categoryLabelForSlug(slug: string): MicrositeCategory | undefined {
  return (Object.entries(CATEGORY_SLUGS) as [MicrositeCategory, string][]).find(
    ([, candidate]) => candidate === slug,
  )?.[0];
}

/** Canonical story path for a microsite: /category-slug/slug/. */
export function micrositePathFor(microsite: Pick<MicrositeConfig, 'slug' | 'category'>): string {
  return `/${CATEGORY_SLUGS[microsite.category]}/${microsite.slug}/`;
}

/** Other published microsites in the same category, same data source ranked first. */
export function relatedMicrositesFor(
  microsite: Pick<MicrositeConfig, 'slug' | 'category' | 'dataSource'>,
  limit = 4,
): MicrositeConfig[] {
  return [...SHOWN_MICROSITES]
    .filter(
      (candidate) => candidate.slug !== microsite.slug && candidate.category === microsite.category,
    )
    .sort((first, second) => {
      const firstSameSource = first.dataSource === microsite.dataSource ? 0 : 1;
      const secondSameSource = second.dataSource === microsite.dataSource ? 0 : 1;
      return firstSameSource - secondSameSource;
    })
    .slice(0, limit);
}

/** Build day in long form, for the "as of" line in a story's source note. */
export function formatBuildDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).format(now);
}

/**
 * Fills a story's source note with the figures from this build.
 *
 * The note is the one place a story states exact totals, and those totals move
 * between builds, so every moving figure is a `{token}` filled from the same
 * read the chart draws: a static note would quote last build's numbers.
 *
 * @param note - the note, with `{token}` placeholders
 * @param values - the build-time values to substitute
 * @returns the note with every placeholder replaced
 */
export function fillStoryDataNote(note: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    note,
  );
}

/** Human-readable freshness line for one microsite, from its data note. */
export function freshnessLabelFor(microsite: Pick<MicrositeConfig, 'dataNote'>): string {
  return microsite.dataNote.includes('live from the browser')
    ? 'Live data, loaded from your browser'
    : 'Data fetched at deploy time; the site redeploys daily';
}

export interface MicrositeConfig {
  slug: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  paragraphs: string[];
  /** Three to five headline facts, pulled from the story's own numbers. */
  keyFacts: string[];
  /** One-line reading guide for the page's main chart. */
  howToRead: string;
  /** Canonical data source URL, reused from the reference list. */
  sourceUrl: string;
  accent: MicrositeAccent;
  dataSource: MicrositeDataSource;
  chartType: MicrositeChartType;
  category: MicrositeCategory;
  dataNote: string;
  references: MicrositeReference[];
}

export const CATEGORY_DETAILS: Record<MicrositeCategory, string> = {
  'Agriculture & farming': 'Farm sizes, crop areas, and livestock counts from the farm surveys.',
  'Biodiversity & nature':
    'Species records, protected sites, and the citizen-science datasets behind them.',
  'Census & population':
    'Who lives where, how old they are, and how the picture shifted between censuses.',
  'Economy & business': 'Prices, trade, employment, and the shape of the business register.',
  Education: 'Schools, pupils, and qualifications, open by local authority.',
  'Energy & climate': 'Generation, emissions, and the weather records that sit behind them.',
  'Environment & geography': 'Rivers, rainfall, coastlines, and the map underneath it all.',
  Health: 'Waiting lists, admissions, and public health counts at local level.',
  'Open data & digital': 'Live searches across the national data portals and their catalogues.',
  'Society & community': 'Local services, charities, and the things people rely on day to day.',
  Transport: 'Roads, rail, and the traffic counters that watch them.',
};

export const MICROSITES: MicrositeConfig[] = withHiddenMicrositesRemoved<MicrositeConfig>([
  {
    slug: 'gauge-index',
    keyFacts: [
      'River Thames: 55 gauges, more than any other river in the sample.',
      'The sample spreads across 808 named rivers.',
      'Water level is what nearly every station publishes; flow, rainfall, wind, and temperature fill in the rest.',
      'The agency leaves the map position empty on its groundwater boreholes, so those carry no coordinates.',
    ],
    howToRead: 'Longer bars mean more gauges on that river; hover a bar for the exact count.',
    sourceUrl: 'https://environment.data.gov.uk/flood-monitoring/doc/reference',
    label: 'Gauge index',
    eyebrow: 'the gauge index',
    title: 'The River Thames carries more gauges than any other river in England.',
    description:
      "The Environment Agency's flood-monitoring list runs to thousands of stations across England. The River Thames holds 55 of them, more than any other river in the sample, and almost all of the network watches water level rather than rain.",
    paragraphs: [
      'The gauges exist to warn people about flooding. Most sit on a river or a stream and take a reading every 15 minutes. Where a station publishes flow as well as level, the flow is worked out from the level rather than measured on its own.',
      'The agency marks some stations as closed or suspended, and leaves the status field empty on others, so those counts move as the list is edited. The groundwater boreholes carry no coordinates at all, because the agency leaves the map position empty for those.',
      'The agency writes "Tide" in the river field for tidal monitoring sites. That is why it sits second in the chart without being a river.',
    ],
    accent: 'cyan',
    dataSource: 'Environment Agency',
    chartType: 'Bar chart',
    category: 'Environment & geography',
    dataNote:
      'Data: Environment Agency flood-monitoring API, /id/stations. The list holds the {stationCount} rows the endpoint returned for _limit=3000 on {asOf}. The agency caps the response below the requested limit, so treat the count as a floor rather than the whole network. The agency adds and removes stations through the day, so the total moves by a few between builds. River names are as the agency publishes them, including "Tide" at tidal sites. The live level comes from Bourton Dickler on the River Dikler, which reports every 15 minutes in metres above ordnance datum.',
    references: [
      {
        label: 'Flood-monitoring API reference (Environment Agency)',
        url: 'https://environment.data.gov.uk/flood-monitoring/doc/reference',
        kind: 'data',
      },
      {
        label: 'Bourton Dickler station record (Environment Agency)',
        url: 'https://environment.data.gov.uk/flood-monitoring/id/stations/1029TH',
        kind: 'data',
      },
      {
        label: 'Check for flooding in England (GOV.UK)',
        url: 'https://www.gov.uk/check-flooding',
        kind: 'news',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'ons-dataset-catalogue',
    keyFacts: [
      '338 dataset records are listed, every one of them in state "published".',
      '310 of the 338 carry a last-updated stamp from 2023 or 2024.',
      '281 records are flagged as national statistics, 40 are not, and 17 leave the flag out.',
      'The tag "ltla" appears on 286 records, more than any other keyword.',
    ],
    howToRead:
      'Each bar is one year. Taller bars mean more dataset records carry that year in their last-updated stamp.',
    sourceUrl: 'https://api.beta.ons.gov.uk/v1/datasets?limit=1000',
    label: 'ONS catalogue',
    eyebrow: 'the ONS catalogue',
    title: 'The ONS dataset API lists 338 datasets, and 310 of them carry a 2023 or 2024 stamp.',
    description:
      'One keyless endpoint holds the ONS beta API dataset catalogue: 338 records, 281 of them flagged as national statistics, and 310 stamped 2023 or 2024 in the last-updated field.',
    paragraphs: [
      'The catalogue call is open. It needs no key and no login, and one request returned all 338 records.',
      'last_updated is the API stamp on the dataset record, not the day the data behind it was published. It moves when the record changes, which is why 180 records sit in 2023, 130 in 2024, and only 12 in 2025 or 2026.',
      'The national statistic flag is the ONS marking its own output against the Code of Practice for Statistics. 281 records carry it. Forty do not, and 17 leave the field out entirely.',
      'Keywords are thin. Eleven records list none at all, and one tag, ltla, covers 286 of the 338.',
    ],
    accent: 'teal',
    dataSource: 'Office for National Statistics (ONS)',
    chartType: 'Histogram',
    category: 'Open data & digital',
    dataNote:
      'Data: ONS beta API, /v1/datasets?limit=1000. The call returned {datasetCount} records on {asOf}, which is the whole catalogue: the response reports a total_count of {datasetCount} against a limit of 1000. last_updated is the timestamp the API holds for the dataset record, so it moves when the record changes rather than when the data behind it is released. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/ons-datasets-sample.json and logs that it did.',
    references: [
      {
        label: 'ONS beta API dataset catalogue (Office for National Statistics)',
        url: 'https://api.beta.ons.gov.uk/v1/datasets?limit=1000',
        kind: 'data',
      },
      {
        label: 'ONS Developer Hub (Office for National Statistics)',
        url: 'https://developer.ons.gov.uk/',
        kind: 'data',
      },
      {
        label: 'The Code of Practice for Statistics (Office for Statistics Regulation)',
        url: 'https://osr.statisticsauthority.gov.uk/the-code-of-practice-for-statistics/',
        kind: 'data',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'food-hygiene-registers',
    keyFacts: [
      'Birmingham: 10,239 establishments, the largest register in the country.',
      '363 registers between them hold more than 612,000 establishments.',
      '331 registers run the five-point rating scheme; the 32 Scottish ones run pass or improve.',
    ],
    howToRead:
      'Longer bars mean more establishments on that register; hover a bar for the exact count.',
    sourceUrl: 'https://api.ratings.food.gov.uk/help',
    label: 'Food hygiene registers',
    eyebrow: 'the food hygiene registers',
    title: 'Birmingham lists 10,239 food outlets, more than any other register in the UK.',
    description:
      'The Food Standards Agency publishes 363 local authority food hygiene registers holding more than 612,000 establishments. Birmingham holds the most at 10,239, and the 32 Scottish registers run their own scheme.',
    paragraphs: [
      'Every food business sits on a register kept by its local authority, and the Food Standards Agency collects those registers into one list with a count of establishments against each one. The count is premises on the register, not premises that have been inspected.',
      'Scotland runs a separate scheme. Its 32 registers report pass or improve rather than a score out of five, so the FSA files them under a different scheme type from the 331 registers elsewhere in the UK.',
      'The registers vary in size. River Tees holds 3 establishments and Hull and Goole Port holds 5, while the median register holds 1,317. Those two smallest registers cover port health rather than a local authority district.',
    ],
    accent: 'amber',
    dataSource: 'Food Standards Agency',
    chartType: 'Bar chart',
    category: 'Health',
    dataNote:
      'Data: Food Standards Agency Food Hygiene Rating Scheme API, /Authorities/basic, called with the x-api-version: 2 header the FSA requires. The call returned {registerCount} registers holding {establishmentCount} establishments on {asOf}. Establishment counts are the FSA totals for each register, and they count premises on the register rather than premises inspected. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/food-hygiene-authorities-sample.json and logs that it did.',
    references: [
      {
        label: 'Food Hygiene Rating Scheme API help (Food Standards Agency)',
        url: 'https://api.ratings.food.gov.uk/help',
        kind: 'data',
      },
      {
        label: 'Food hygiene ratings open data (Food Standards Agency)',
        url: 'https://ratings.food.gov.uk/open-data',
        kind: 'data',
      },
      {
        label: 'Food Hygiene Information Scheme (Food Standards Scotland)',
        url: 'https://www.foodstandards.gov.scot/consumer-advice/fhis',
        kind: 'data',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'cycle-hire-docks',
    keyFacts: [
      'Jubilee Plaza at Canary Wharf: 63 docking points, the largest station in London.',
      'Most of the 798 stations hold between 20 and 39 docking points, and two hold 60 or more.',
      'A docking point is the space a bike locks into, not the bike parked in it.',
      'TfL takes docking points out of service through the day, so the network total moves between builds.',
    ],
    howToRead:
      'Each dot is one docking station, stacked at the number of docking points it holds; taller stacks mean more stations of that size.',
    sourceUrl: 'https://api.tfl.gov.uk/BikePoint',
    label: 'Cycle hire docks',
    eyebrow: 'the cycle hire docks',
    title: "Most of London's 798 cycle hire docks hold space for 20 to 39 bikes.",
    description:
      'Transport for London lists 798 Santander Cycles docking stations. Most of them hold space for 20 to 39 bikes, and the largest, Jubilee Plaza at Canary Wharf, holds 63.',
    paragraphs: [
      'A docking point is the fixed part of the network: the post a bike locks into. TfL reports the docked bikes and the empty docks in the same call, and both move through the day, so the docking points are what the shape of the network is measured in.',
      'Most stations are small. The 20 to 39 band covers more than two thirds of them, and only two stations hold 60 or more: Jubilee Plaza at Canary Wharf with 63 and Bankside Mix with 60.',
      'Capacity moves as well as bikes. A station taken out of service reports no docking points until it comes back, and the network total follows it down and up, so the exact totals on this page are the ones the list carried on the build day. TfL counts electric bikes in the same list, so the bikes docked at a station split into standard and electric.',
    ],
    accent: 'sky',
    dataSource: 'Transport for London',
    chartType: 'Dot plot',
    category: 'Transport',
    dataNote:
      'Data: Transport for London Unified API, /BikePoint. The call returned {stationCount} docking stations holding {dockCount} docking points on {asOf}. A docking point is a space a bike locks into, so the counts describe capacity rather than the bikes in them; the docked bikes and the empty docks come from the same call and move through the day. TfL keeps closed stations in the list until it removes them, and the count drops those. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/tfl-bike-points-sample.json and logs that it did.',
    references: [
      {
        label: 'BikePoint docking station API (Transport for London)',
        url: 'https://api.tfl.gov.uk/BikePoint',
        kind: 'data',
      },
      {
        label: 'Unified API documentation (Transport for London)',
        url: 'https://api-portal.tfl.gov.uk/',
        kind: 'data',
      },
      {
        label: 'Cycle hire usage data (Transport for London)',
        url: 'https://cycling.data.tfl.gov.uk/',
        kind: 'data',
      },
      {
        label: 'TfL open data terms and licences (Transport for London)',
        url: 'https://tfl.gov.uk/info-for/open-data-users/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'planning-datasets',
    keyFacts: [
      'More than 200 datasets are listed, each with the number of records behind it.',
      'Title boundary holds nearly nine in ten of the records; the nine datasets behind it hold about a tenth between them.',
      'Dozens of the listed datasets hold no records yet, most of them still in alpha.',
      'A dataset identifier such as listed-building is the same string the API takes in its dataset= parameter.',
    ],
    howToRead:
      'Each bar is one dataset and the line is the running share of all records; a line that jumps on the first bar means one dataset carries most of them.',
    sourceUrl: 'https://www.planning.data.gov.uk/dataset.json',
    label: 'Planning datasets',
    eyebrow: 'the planning datasets',
    title:
      "One dataset holds nearly nine in ten of the records on England's planning data platform.",
    description:
      'The Planning Data platform lists every planning and housing dataset the government publishes for England, with a record count for each. One dataset, title boundary, holds nearly nine in ten of the records, and dozens of the listed datasets hold none at all.',
    paragraphs: [
      'Local councils and government bodies publish planning and housing data, and the platform collects it into one catalogue with a schema per dataset. That catalogue call returns every dataset the platform knows about with the number of records held for each one, so the list doubles as a ranking of what has actually been published.',
      'The ranking is lopsided. Title boundary, the index polygons HM Land Registry draws around registered titles, holds the great majority of the records on its own. The datasets a reader might expect from a planning platform, conservation areas, listed buildings, flood risk zones, brownfield land, all sit well below it.',
      'Not every listed dataset holds data yet. Dozens are empty, most of them in alpha while the specification is worked out, and the platform lists them anyway, which keeps the identifier reserved and shows the shape of the data before the records land.',
    ],
    accent: 'violet',
    dataSource: 'Planning Data (MHCLG)',
    chartType: 'Pareto',
    category: 'Open data & digital',
    dataNote:
      'Data: Planning Data dataset catalogue, /dataset.json, published by the Ministry of Housing, Communities and Local Government under the Open Government Licence v3.0. The call returned {datasetCount} datasets holding {entityCount} records on {asOf}, and {emptyDatasetCount} of those datasets hold no records yet. The file also lists the platform\'s pipeline configuration and provenance tables; the counts here and the chart keep the entries whose realm is "dataset". If the platform is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/planning-datasets-sample.json and logs that it did.',
    references: [
      {
        label:
          'Planning Data dataset catalogue (Ministry of Housing, Communities and Local Government)',
        url: 'https://www.planning.data.gov.uk/dataset.json',
        kind: 'data',
      },
      {
        label:
          'Planning Data API documentation (Ministry of Housing, Communities and Local Government)',
        url: 'https://www.planning.data.gov.uk/docs',
        kind: 'data',
      },
      {
        label: 'Title boundary dataset (Planning Data)',
        url: 'https://www.planning.data.gov.uk/dataset/title-boundary',
        kind: 'data',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'ancient-woodland',
    keyFacts: [
      '53,638 records cover 365,050 hectares of England.',
      '14,725 of those records, more than a quarter, cover less than one hectare.',
      '14,341 records are plantations on ancient woodland sites.',
      'Planted woods outnumber semi-natural ones in both of the largest size bands.',
      'The largest single record covers 719 hectares.',
    ],
    howToRead:
      'Each bar is one size band and the colours stacked inside it are the woodland types; the tall bars on the left are the small woods, which make up most of the inventory.',
    sourceUrl: 'https://naturalengland-defra.opendata.arcgis.com/datasets/ancient-woodland-england',
    label: 'Ancient woodland',
    eyebrow: 'the ancient woodland inventory',
    title:
      "England's ancient woodland inventory holds 53,638 records, and more than a quarter of them cover less than a hectare.",
    description:
      "Natural England's Ancient Woodland Inventory maps land that has been wooded continuously since 1600. The layer holds 53,638 records covering 365,050 hectares, and 14,341 of them are plantations on ancient woodland sites.",
    paragraphs: [
      'Ancient woodland is land that has been wooded since at least 1600, which makes it slow to replace: the soils, the fungi, and the plants behind it take centuries to build. Natural England keeps the inventory as a layer of mapped polygons, and the layer counted 53,638 records covering 365,050 hectares on the day this page was built.',
      'Most of the woods are small. 14,725 records cover less than a hectare, and the 2 to 5 hectare band is the busiest of all at 13,728 records. Only 294 records run to 100 hectares or more, and the largest single record covers 719 hectares against an average of 6.8 hectares across the whole layer.',
      'The layer splits the woods by type. 39,233 records are ancient semi-natural woodland, which keeps its native tree and shrub cover. 14,341 are plantations on ancient woodland sites, where the original cover was felled and replanted, often with conifers. 64 are ancient wood pasture, grazed ground with veteran trees.',
      'Planted woods carry more of the big records than intact ones. In the 50 to 100 hectare band they lead 351 to 336, and above 100 hectares they lead 189 to 105. The layer also counts polygons rather than sites, so a wood mapped as several pieces appears more than once in the total.',
    ],
    accent: 'emerald',
    dataSource: 'Natural England',
    chartType: 'Bar chart',
    category: 'Biodiversity & nature',
    dataNote:
      "Data: Natural England's Ancient Woodland (England) layer, served from the Defra ArcGIS estate under the Open Government Licence v3.0. The layer counted {recordCount} records covering {hectareCount} hectares on {asOf}, and {smallWoodCount} of those records cover less than a hectare. The counts come from the service's own statistics queries, so the page never downloads the polygons. The layer lists records rather than sites: a wood mapped as several polygons appears as several rows, so the count runs above the number of named woods. Natural England's own description of the layer still carries the figures it was published with, 53,637 polygons covering 364,971.81 hectares, which the live counts have moved past. If the layer is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/ancient-woodland-sample.json and logs that it did.",
    references: [
      {
        label: 'Ancient Woodland (England) layer (Natural England)',
        url: 'https://naturalengland-defra.opendata.arcgis.com/datasets/ancient-woodland-england',
        kind: 'data',
      },
      {
        label: 'Natural England open data hub (Defra)',
        url: 'https://naturalengland-defra.opendata.arcgis.com/',
        kind: 'data',
      },
      {
        label:
          'Ancient woodland, ancient trees and veteran trees: advice for making planning decisions (GOV.UK)',
        url: 'https://www.gov.uk/guidance/ancient-woodland-ancient-trees-and-veteran-trees-advice-for-making-planning-decisions',
        kind: 'news',
      },
      {
        label: 'Ancient woodland (Woodland Trust)',
        url: 'https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/habitats/ancient-woodland/',
        kind: 'news',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'bank-rate',
    keyFacts: [
      'The series starts on 2 January 1975 at 11.5% and runs to the last business day the database held on the build day.',
      'The highest level is 17%, held for 231 days from 15 November 1979.',
      'The lowest is 0.1%, held for 637 days from 19 March 2020.',
      'The longest unbroken hold is 2,709 days at 0.5%, from 5 March 2009 to 3 August 2016.',
    ],
    howToRead:
      'The line steps between levels instead of sliding, so each flat run is one hold; hover a step for the dates it covers and how many days it lasted.',
    sourceUrl: 'https://www.bankofengland.co.uk/boeapps/database/',
    label: 'Bank Rate',
    eyebrow: 'the bank rate series',
    title: 'Bank Rate held 0.5% for 2,709 days, the longest run in its 51-year history.',
    description:
      'The Bank of England keeps a Bank Rate reading for every business day since 2 January 1975, when it stood at 11.5%. The rate peaked at 17% in November 1979, fell to 0.1% in March 2020, and its longest unbroken hold is the 2,709 days it spent at 0.5%.',
    paragraphs: [
      'Bank Rate is the interest rate the Bank of England sets, and the database keeps a reading for every business day. The rate that stands on a day is the one set most recently, so the series reads as long flat holds broken by decisions.',
      'It began at 11.5% in January 1975 and climbed to 17% in November 1979, which is still the highest it has been. That 17% lasted 231 days, and the rate did not fall back below 10% until October 1982.',
      'The lowest points came much later. The rate sat at 0.5% for 2,709 days from March 2009 to August 2016, the longest hold in the series, and it fell to 0.1% in March 2020 for 637 days.',
      'The database writes one row per business day, so the chart jumps from Friday to Monday and skips bank holidays. The day counts here are calendar days, weekends included.',
    ],
    accent: 'indigo',
    dataSource: 'Bank of England',
    chartType: 'Line chart',
    category: 'Economy & business',
    dataNote:
      "Data: Bank of England Interactive Statistical Database, series IUDBEDR (official Bank Rate, daily), read from https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp. The database returned {observationCount} daily readings running to {latestDate} on {asOf}, in {spellCount} runs at {levelCount} levels. It writes one row per business day, carrying the level recorded for that day, so a rate announced and withdrawn inside one day has no step of its own: the September 1992 rise to 15% is one example. The Bank's terms place reproduction of Database data under the Open Government Licence v3.0. If the database is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/bank-rate-sample.csv and logs that it did.",
    references: [
      {
        label: 'Interactive Statistical Database (Bank of England)',
        url: 'https://www.bankofengland.co.uk/boeapps/database/',
        kind: 'data',
      },
      {
        label: 'The interest rate Bank Rate (Bank of England)',
        url: 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate',
        kind: 'data',
      },
      {
        label: 'Bank of England statistics (Bank of England)',
        url: 'https://www.bankofengland.co.uk/statistics',
        kind: 'data',
      },
      {
        label: 'Terms and conditions (Bank of England)',
        url: 'https://www.bankofengland.co.uk/legal',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'recorded-crime',
    keyFacts: [
      'The API holds the last 36 months of street-level crime, published by the 44 forces of England, Wales and Northern Ireland. Police Scotland publishes elsewhere.',
      'A call answers for everything within a mile of the point it is given, so the window is a circle around one point rather than a boundary on a map.',
      'Violence and sexual offences is the biggest crime type in every month of the window, with shoplifting second in every month.',
      'An offence carries the outcome recorded against it so far, so the newest month is still full of open investigations.',
      'The five biggest crime types fill most of every column; the other nine share the rest.',
    ],
    howToRead:
      'Each column is one published month and the colours stacked inside it are the crime types; the same two bands run through every column, so the mix stays steady while the monthly totals move.',
    sourceUrl: 'https://data.police.uk/',
    label: 'Recorded crime',
    eyebrow: 'the recorded crime series',
    title:
      'Violence and shoplifting are the two biggest crime types recorded in a mile of Leeds city centre, in every month of the last year.',
    description:
      'The Home Office publishes street-level crime month by month, with the crime type and the outcome recorded for each offence. Within a mile of one point in Leeds city centre, violence and sexual offences has led every month of the last year, with shoplifting second in every one.',
    paragraphs: [
      'The police.uk API holds the last 36 months of street-level crime, published one month at a time by the 44 forces of England, Wales and Northern Ireland. Police Scotland publishes its own figures elsewhere, so nothing here covers Scotland.',
      'A call takes a point and returns every offence recorded within a mile of it, which is why this window is a circle rather than a boundary drawn on a map. Nothing about that edge follows a ward, a postcode, or a police area: it is drawn around a single point.',
      'The mix stays steady. Violence and sexual offences leads every month in the window and shoplifting follows in every one, and between them they hold a little under half of the offences recorded.',
      'Each offence carries the outcome recorded against it so far. The biggest single outcome in the window is an investigation that closed with no suspect identified, and the newest month is still full of cases that are open, so its outcome mix will keep changing for months.',
    ],
    accent: 'rose',
    dataSource: 'Home Office',
    chartType: 'Bar chart',
    category: 'Society & community',
    dataNote:
      'Data: Home Office police.uk recorded crime, /crimes-street/all-crime, published under the Open Government Licence v3.0. The call returned {recordCount} offences within a mile of 53.7997, -1.5492 across the {monthCount} published months from {firstMonth} to {latestMonth} on {asOf}. Every offence carries the crime type the force filed it under and the outcome recorded against it so far; open investigations in a recent month resolve into a final outcome later, so the outcome counts keep moving after a month is published. Coverage is England, Wales and Northern Ireland: Police Scotland publishes elsewhere. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/police-recorded-crime-sample.json and logs that it did.',
    references: [
      {
        label: 'Police API documentation (data.police.uk)',
        url: 'https://data.police.uk/docs/',
        kind: 'data',
      },
      {
        label: 'Recorded crime coverage, licence, and provenance (data.police.uk)',
        url: 'https://data.police.uk/about/',
        kind: 'data',
      },
      {
        label: 'Recorded crime downloads (data.police.uk)',
        url: 'https://data.police.uk/data/',
        kind: 'data',
      },
      {
        label: 'Open Government Licence v3.0',
        url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'carbon-intensity',
    keyFacts: [
      'One reading every half hour, 48 a day, day and night.',
      "Every reading carries the operator's own grade, from very low to very high, and the chart colours each half hour with it.",
      'The dark band runs down the evening peak, when demand is high and the sun has gone.',
      'The window stops at the last complete day, so nothing the page draws is a forecast.',
    ],
    howToRead:
      'Each row is one UK day and each column one half hour, coloured by the grade the operator gave that reading; the pale band is where the grid ran cleanest.',
    sourceUrl: 'https://api.carbonintensity.org.uk/intensity',
    label: 'Carbon intensity',
    eyebrow: 'the grid carbon intensity',
    title:
      "Britain's grid reports a carbon intensity reading every half hour, and the evening peak is the dirtiest stretch of the day.",
    description:
      "The National Energy System Operator grades the British electricity grid's carbon intensity every half hour, from very low to very high. This page draws the last 30 days of it: a reading every half hour, each one coloured by the grade the operator gave it.",
    paragraphs: [
      'Carbon intensity is the weight of carbon dioxide behind a kilowatt hour of electricity, in grams. The operator works it out from the fuels feeding the grid over that half hour, so the number moves as the mix moves and the grade moves with it.',
      'The series is a daily shape. Demand climbs through the morning and peaks in the early evening, and the darkest cells sit in that peak; the cleanest stretch comes somewhere else in the day, where output is high against demand.',
      'Every reading on the page is a settled one. The window stops at the last complete day rather than reaching into the forecast that the API also publishes, so nothing here is a prediction.',
      'The series covers the grid of Great Britain, which is the system the operator runs. Northern Ireland runs its own grid, so nothing on this page covers it.',
    ],
    accent: 'lime',
    dataSource: 'Carbon Intensity (NESO)',
    chartType: 'Heatmap',
    category: 'Energy & climate',
    dataNote:
      "Data: the Carbon Intensity API for Great Britain, run by the National Energy System Operator, read keyless from https://api.carbonintensity.org.uk/intensity. The call returned {periodCount} half-hour readings across {dayCount} complete UK days to {lastReadingDate}, read on {asOf}, averaging {averageIntensity} gCO2/kWh. The cleanest half hour of the day was {cleanestSlot} at {cleanestAverage} gCO2/kWh on average and the dirtiest {dirtiestSlot} at {dirtiestAverage}, both in UK local time. The operator graded {veryLowCount} half hours very low, {lowCount} low, {moderateCount} moderate, {highCount} high and {veryHighCount} very high, and the single readings ran from {lowestIntensity} to {highestIntensity} gCO2/kWh. Each reading is the operator's estimate of the actual mix over that half hour rather than a meter reading, and the series covers Great Britain rather than the whole UK. The API's terms place the data under the Creative Commons Attribution 4.0 licence. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/carbon-intensity-sample.json and logs that it did.",
    references: [
      {
        label: 'Carbon Intensity API (National Energy System Operator)',
        url: 'https://api.carbonintensity.org.uk/intensity',
        kind: 'data',
      },
      {
        label: 'Carbon Intensity API documentation (National Energy System Operator)',
        url: 'https://docs.carbonintensity.org.uk/',
        kind: 'data',
      },
      {
        label: 'Carbon Intensity API terms of use (National Energy System Operator)',
        url: 'https://terms.carbonintensity.org.uk/',
        kind: 'licence',
      },
      {
        label: 'Creative Commons Attribution 4.0 International',
        url: 'https://creativecommons.org/licenses/by/4.0/',
        kind: 'licence',
      },
    ],
  },
  {
    slug: 'parliament-seats',
    keyFacts: [
      'The Commons holds 650 seats, and 326 are needed for a majority.',
      "Every seat is one square, so a party's block is the seats it holds.",
      '18 parties hold at least one seat, and six of them hold exactly one.',
      'A vacant seat is listed as a party, so the parties add up to the whole chamber.',
      'The API publishes a colour for each party; the Speaker and one other carry none.',
    ],
    howToRead:
      'Each square is one seat and the colour is the party, so the size of a block is the seats that party holds. The table under the chart carries the numbers.',
    sourceUrl: 'https://members-api.parliament.uk/index.html',
    label: 'Parliament seats',
    eyebrow: 'the House of Commons',
    title: 'The House of Commons holds 650 seats, and Labour holds 403 of them.',
    description:
      'The UK Parliament Members API counts the seats each party holds in the House of Commons, and the members behind them. Labour holds 403 of the 650 seats, the Conservatives hold 118, and 18 parties hold at least one seat.',
    paragraphs: [
      'The House of Commons holds 650 seats, and a party needs 326 of them to hold more than half the chamber. The Members API counts the seats each party holds and, under each one, how many members are women and how many are men. On the day this page was built the parties held all 650 seats between them.',
      'The chamber is wider than two parties. 18 parties hold at least one seat, and six of them hold exactly one. Behind Labour and the Conservatives, the Liberal Democrats hold 71, Reform UK and the Scottish National Party hold eight each, and Sinn Féin holds seven even though its MPs do not take their seats at Westminster.',
      'The API reports a few things worth reading with care. A vacant seat is listed as its own party, named Vacant, with no member behind it, so the parties add up to the whole chamber while the members named run one short. The Speaker is listed as a party too. Each party carries the colour the API publishes for it, and two of them carry none, so those squares use the grey the page keeps for them.',
      'The totals come from the call the page makes at build time, so the seat counts and the member counts move with it as seats change hands.',
    ],
    accent: 'purple',
    dataSource: 'UK Parliament',
    chartType: 'Waffle',
    category: 'Society & community',
    dataNote:
      "Data: the UK Parliament Members API state of the parties for the House of Commons, read from https://members-api.parliament.uk/api/Parties/StateOfTheParties. The house held {seatCount} seats across {partyCount} parties on {asOf}, and {largestParty} held the largest block at {largestPartySeats}. A vacant seat is listed as its own party and the Speaker is listed as a party, so the parties add up to the whole chamber while the members named behind them can run short by the vacant seat. The API publishes each party's own colour, and a party without one is drawn in grey. Parliament publishes the data under the Open Parliament Licence v3.0. If the API is unreachable at build time the page falls back to the committed snapshot in apps/web/src/fixtures/parliament-seats-sample.json and logs that it did.",
    references: [
      {
        label: 'Members API reference (UK Parliament)',
        url: 'https://members-api.parliament.uk/index.html',
        kind: 'data',
      },
      {
        label:
          'State of the parties endpoint, Commons on 1 October 2026 (UK Parliament Members API)',
        url: 'https://members-api.parliament.uk/api/Parties/StateOfTheParties/1/2026-10-01',
        kind: 'data',
      },
      {
        label: 'Open Parliament Licence v3.0',
        url: 'https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/',
        kind: 'licence',
      },
      {
        label: '2024 United Kingdom general election (Wikipedia)',
        url: 'https://en.wikipedia.org/wiki/2024_United_Kingdom_general_election',
        kind: 'history',
      },
    ],
  },
]);

/**
 * The microsites the site shows right now, in ship order. The lab publishes
 * one story at a time; the rest stay built, tested, and reachable behind
 * their own URLs.
 */
export const SHOWN_MICROSITES: MicrositeConfig[] = MICROSITES.filter((microsite) =>
  PUBLISHED_MICROSITES.includes(microsite.slug),
);
