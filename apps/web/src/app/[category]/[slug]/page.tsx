import type { CarbonIntensityIndex } from '@uk-open-data-connectors/uk-sources';
import { Container } from '@uk-open-data-lab/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AncientWoodlandChart } from '@/components/AncientWoodlandChart';
import { BankRateChart } from '@/components/BankRateChart';
import { CarbonIntensityHeatmap } from '@/components/CarbonIntensityHeatmap';
import { CycleHireDocksChart } from '@/components/CycleHireDocksChart';
import { FoodHygieneRegistersChart } from '@/components/FoodHygieneRegistersChart';
import { GaugeRiversChart } from '@/components/GaugeRiversChart';
import { MicrositeStory } from '@/components/MicrositeStory';
import { OnsCatalogueChart } from '@/components/OnsCatalogueChart';
import { ParliamentSeatsChart } from '@/components/ParliamentSeatsChart';
import { PlanningDatasetChart } from '@/components/PlanningDatasetChart';
import { PoliceCrimeChart } from '@/components/PoliceCrimeChart';
import { ReportIssueButton } from '@/components/ReportIssueButton';
import { StatCard } from '@/components/StatCard';
import { fetchAncientWoodlandProfile } from '@/lib/ancient-woodland-data';
import { fetchBankRateSummary } from '@/lib/bank-rate-data';
import {
  buildCarbonIntensityDays,
  buildCarbonIntensitySlotProfile,
  cleanestSlot,
  dirtiestSlot,
  fetchCarbonIntensitySummary,
} from '@/lib/carbon-intensity-data';
import { fetchCycleHireIndex } from '@/lib/cycle-hire-data';
import { fetchFoodHygieneSummary } from '@/lib/food-hygiene-data';
import {
  buildGaugeStationIndex,
  FEATURED_STATION_REFERENCE,
  fetchGaugeLiveLevel,
  fetchGaugeStationSample,
  preferredMeasureIdsFor,
} from '@/lib/gauge-data';
import {
  categorySlugFor,
  fillStoryDataNote,
  formatBuildDate,
  freshnessLabelFor,
  micrositePathFor,
  MICROSITES,
  relatedMicrositesFor,
} from '@/lib/microsites';
import {
  countDatasetsStampedIn,
  fetchOnsCatalogueSummary,
  ONS_PEAK_STAMP_YEARS,
} from '@/lib/ons-catalogue-data';
import { fetchParliamentSeatSummary } from '@/lib/parliament-seats-data';
import { fetchPlanningDatasetSummary } from '@/lib/planning-data';
import {
  fetchRecordedCrimeSummary,
  NO_SUSPECT_OUTCOME,
  RECORDED_CRIME_LOCATION,
} from '@/lib/police-crime-data';
import {
  formatCount,
  formatIsoDateLong,
  formatIsoMonthLong,
  formatLevelMetres,
  formatRatePercent,
  formatTrendLabel,
} from '@/lib/uk-format';

interface MicrositePageProps {
  params: Promise<{ category: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { category: string; slug: string }[] {
  return MICROSITES.map((microsite) => ({
    category: categorySlugFor(microsite),
    slug: microsite.slug,
  }));
}

export async function generateMetadata({ params }: MicrositePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const microsite = MICROSITES.find((candidate) => candidate.slug === slug);
  if (microsite === undefined || categorySlugFor(microsite) !== category) {
    return { title: 'uk-open-data-lab' };
  }
  const path = micrositePathFor(microsite);
  return {
    title: `${microsite.label} - uk-open-data-lab`,
    description: microsite.description,
    openGraph: {
      title: `${microsite.label} - uk-open-data-lab`,
      description: microsite.description,
      url: path,
      type: 'article',
    },
  };
}

export default async function MicrositePage({
  params,
}: MicrositePageProps): Promise<React.ReactElement> {
  const { category, slug } = await params;
  const microsite = MICROSITES.find((candidate) => candidate.slug === slug);
  if (microsite === undefined || categorySlugFor(microsite) !== category) {
    notFound();
  }

  const related = relatedMicrositesFor(microsite).map((candidate) => ({
    label: candidate.label,
    href: micrositePathFor(candidate),
  }));

  const content = await renderStoryContent(slug, microsite.dataNote);

  return (
    <>
      <Container size="wide">
        <nav aria-label="Breadcrumb" className="py-[var(--spacing-2xl)]">
          <ol className="numeral-paragraph-sm flex flex-wrap items-center gap-2 text-[var(--color-muted)]">
            <li>
              <Link href="/" className="underline hover:text-[var(--color-fg)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/${categorySlugFor(microsite)}/`}
                className="underline hover:text-[var(--color-fg)]"
              >
                {microsite.category}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--color-fg)]">
              {microsite.label}
            </li>
          </ol>
        </nav>
      </Container>
      <MicrositeStory
        id={microsite.slug}
        eyebrow={microsite.eyebrow}
        title={microsite.title}
        description={microsite.description}
        paragraphs={microsite.paragraphs}
        keyFacts={microsite.keyFacts}
        howToRead={microsite.howToRead}
        sourceUrl={microsite.sourceUrl}
        updatedLabel={freshnessLabelFor(microsite)}
        related={related}
        accent={microsite.accent}
        chart={content.chart}
        stats={content.stats}
        dataNote={content.dataNote}
        references={microsite.references}
      />
      <ReportIssueButton pageLabel={microsite.label} />
    </>
  );
}

interface StoryContent {
  chart: React.ReactNode;
  stats: React.ReactNode;
  /** Source note for the footer, defaulting to the microsite config's own. */
  dataNote: string;
}

/**
 * Builds the chart, stats, and source note for one story. Each story fetches
 * only the data it draws, so a story page never depends on another story's
 * upstream API.
 *
 * @param slug - microsite slug
 * @param dataNote - the microsite config's source note
 * @returns the chart, stat cards, and source note for the page
 */
async function renderStoryContent(slug: string, dataNote: string): Promise<StoryContent> {
  // Every story states its build-day totals in the source note, so the note is
  // filled from the same read the chart draws rather than kept as static text.
  const buildDate = formatBuildDate();
  switch (slug) {
    case 'gauge-index': {
      const stations = await fetchGaugeStationSample();
      const index = buildGaugeStationIndex(stations);
      const level = await fetchGaugeLiveLevel(
        preferredMeasureIdsFor(stations, FEATURED_STATION_REFERENCE),
      );
      const busiestRiver = index.topRivers[0];
      return {
        chart: <GaugeRiversChart rivers={index.topRivers} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Gauges in the sample"
              value={formatCount(index.stationCount)}
              accent="cyan"
              testId="gauge-stations"
              dataValue={index.stationCount}
            />
            <StatCard
              label={busiestRiver === undefined ? 'Busiest river' : busiestRiver.riverName}
              value={
                busiestRiver === undefined ? 'No data' : formatCount(busiestRiver.stationCount)
              }
              accent="cyan"
              testId="gauge-busiest-river"
              dataValue={busiestRiver?.stationCount}
            />
            <StatCard
              label={`${level.stationLabel}, ${formatTrendLabel(level.trend)}`}
              value={formatLevelMetres(level.latestLevelMetres)}
              accent="cyan"
              testId="gauge-live-level"
              dataValue={level.latestLevelMetres}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          stationCount: formatCount(index.stationCount),
          asOf: buildDate,
        }),
      };
    }
    case 'ons-dataset-catalogue': {
      const catalogue = await fetchOnsCatalogueSummary();
      const peakYearsCount = countDatasetsStampedIn(catalogue, ONS_PEAK_STAMP_YEARS);
      return {
        chart: <OnsCatalogueChart yearCounts={catalogue.yearCounts} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Datasets in the catalogue"
              value={formatCount(catalogue.datasetCount)}
              accent="teal"
              testId="ons-datasets"
              dataValue={catalogue.datasetCount}
            />
            <StatCard
              label={`Stamped ${ONS_PEAK_STAMP_YEARS.join(' or ')}`}
              value={formatCount(peakYearsCount)}
              accent="teal"
              testId="ons-stamped-recently"
              dataValue={peakYearsCount}
            />
            <StatCard
              label="Flagged as national statistics"
              value={formatCount(catalogue.nationalStatisticCount)}
              accent="teal"
              testId="ons-national-statistics"
              dataValue={catalogue.nationalStatisticCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          datasetCount: formatCount(catalogue.datasetCount),
          asOf: buildDate,
        }),
      };
    }
    case 'food-hygiene-registers': {
      const summary = await fetchFoodHygieneSummary();
      const largestRegister = summary.largestAuthorities[0];
      return {
        chart: <FoodHygieneRegistersChart registers={summary.largestAuthorities} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Establishments listed"
              value={formatCount(summary.establishmentCount)}
              accent="amber"
              testId="food-hygiene-establishments"
              dataValue={summary.establishmentCount}
            />
            <StatCard
              label="Registers listed"
              value={formatCount(summary.authorityCount)}
              accent="amber"
              testId="food-hygiene-registers"
              dataValue={summary.authorityCount}
            />
            <StatCard
              label={
                largestRegister === undefined
                  ? 'Largest register'
                  : largestRegister.localAuthorityName
              }
              value={
                largestRegister === undefined
                  ? 'No data'
                  : formatCount(largestRegister.establishmentCount)
              }
              accent="amber"
              testId="food-hygiene-largest-register"
              dataValue={largestRegister?.establishmentCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          registerCount: formatCount(summary.authorityCount),
          establishmentCount: formatCount(summary.establishmentCount),
          asOf: buildDate,
        }),
      };
    }
    case 'cycle-hire-docks': {
      const index = await fetchCycleHireIndex();
      const largestStation = index.largestStations[0];
      return {
        chart: (
          <CycleHireDocksChart buckets={index.sizeBuckets} stationCount={index.stationCount} />
        ),
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Docking stations"
              value={formatCount(index.stationCount)}
              accent="sky"
              testId="cycle-hire-stations"
              dataValue={index.stationCount}
            />
            <StatCard
              label="Docking points"
              value={formatCount(index.dockCount)}
              accent="sky"
              testId="cycle-hire-docking-points"
              dataValue={index.dockCount}
            />
            <StatCard
              label={largestStation === undefined ? 'Largest station' : largestStation.name}
              value={
                largestStation === undefined ? 'No data' : formatCount(largestStation.dockCount)
              }
              accent="sky"
              testId="cycle-hire-largest-station"
              dataValue={largestStation?.dockCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          stationCount: formatCount(index.stationCount),
          dockCount: formatCount(index.dockCount),
          asOf: buildDate,
        }),
      };
    }
    case 'planning-datasets': {
      const summary = await fetchPlanningDatasetSummary();
      const largestDataset = summary.largestDatasets[0];
      return {
        chart: (
          <PlanningDatasetChart
            datasets={summary.largestDatasets}
            totalEntityCount={summary.entityCount}
          />
        ),
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Datasets listed"
              value={formatCount(summary.datasetCount)}
              accent="violet"
              testId="planning-datasets"
              dataValue={summary.datasetCount}
            />
            <StatCard
              label="Records behind them"
              value={formatCount(summary.entityCount)}
              accent="violet"
              testId="planning-records"
              dataValue={summary.entityCount}
            />
            <StatCard
              label={largestDataset === undefined ? 'Largest dataset' : largestDataset.name}
              value={
                largestDataset === undefined ? 'No data' : formatCount(largestDataset.entityCount)
              }
              accent="violet"
              testId="planning-largest-dataset"
              dataValue={largestDataset?.entityCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          datasetCount: formatCount(summary.datasetCount),
          entityCount: formatCount(summary.entityCount),
          emptyDatasetCount: formatCount(summary.emptyDatasetCount),
          asOf: buildDate,
        }),
      };
    }
    case 'ancient-woodland': {
      const woodland = await fetchAncientWoodlandProfile();
      const smallestBand = woodland.sizeBands[0];
      const hectareCount = Math.round(woodland.totalHectares);
      return {
        chart: <AncientWoodlandChart sizeBands={woodland.sizeBands} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Records in the layer"
              value={formatCount(woodland.recordCount)}
              accent="emerald"
              testId="ancient-woodland-records"
              dataValue={woodland.recordCount}
            />
            <StatCard
              label="Hectares covered"
              value={formatCount(hectareCount)}
              accent="emerald"
              testId="ancient-woodland-hectares"
              dataValue={hectareCount}
            />
            <StatCard
              label={smallestBand === undefined ? 'Under one hectare' : smallestBand.label}
              value={smallestBand === undefined ? 'No data' : formatCount(smallestBand.recordCount)}
              accent="emerald"
              testId="ancient-woodland-smallest-band"
              dataValue={smallestBand?.recordCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          recordCount: formatCount(woodland.recordCount),
          hectareCount: formatCount(hectareCount),
          smallWoodCount: formatCount(smallestBand?.recordCount ?? 0),
          asOf: buildDate,
        }),
      };
    }
    case 'bank-rate': {
      const series = await fetchBankRateSummary();
      const latest = series.latestObservation;
      const runCount = series.spells.length;
      return {
        chart: <BankRateChart spells={series.spells} latestDate={latest.date} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Newest reading"
              value={formatRatePercent(latest.ratePercent)}
              accent="indigo"
              testId="bank-rate-latest"
              dataValue={latest.ratePercent}
            />
            <StatCard
              label={`Days at ${formatRatePercent(series.longestSpell.ratePercent)}`}
              value={formatCount(series.longestSpell.dayCount)}
              accent="indigo"
              testId="bank-rate-longest-hold"
              dataValue={series.longestSpell.dayCount}
            />
            <StatCard
              label="Readings in the series"
              value={formatCount(series.observationCount)}
              accent="indigo"
              testId="bank-rate-readings"
              dataValue={series.observationCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          observationCount: formatCount(series.observationCount),
          latestDate: formatIsoDateLong(latest.date),
          spellCount: formatCount(runCount),
          levelCount: formatCount(series.levelCount),
          asOf: buildDate,
        }),
      };
    }
    case 'recorded-crime': {
      const summary = await fetchRecordedCrimeSummary();
      const topCategory = summary.topCategory;
      const noSuspect = summary.outcomeCounts.find(
        (outcome) => outcome.outcome === NO_SUSPECT_OUTCOME,
      );
      return {
        chart: (
          <PoliceCrimeChart
            months={summary.months}
            categoryCounts={summary.categoryCounts}
            locationLabel={RECORDED_CRIME_LOCATION.label}
          />
        ),
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label={`Offences around ${RECORDED_CRIME_LOCATION.label}`}
              value={formatCount(summary.recordCount)}
              accent="rose"
              testId="recorded-crime-offences"
              dataValue={summary.recordCount}
            />
            <StatCard
              label={topCategory.name}
              value={formatCount(topCategory.recordCount)}
              accent="rose"
              testId="recorded-crime-leading-type"
              dataValue={topCategory.recordCount}
            />
            <StatCard
              label="Closed with no suspect identified"
              value={formatCount(noSuspect?.recordCount ?? 0)}
              accent="rose"
              testId="recorded-crime-no-suspect"
              dataValue={noSuspect?.recordCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          recordCount: formatCount(summary.recordCount),
          monthCount: String(summary.monthCount),
          firstMonth: formatIsoMonthLong(summary.firstMonth),
          latestMonth: formatIsoMonthLong(summary.latestMonth),
          asOf: buildDate,
        }),
      };
    }
    case 'carbon-intensity': {
      const window = await fetchCarbonIntensitySummary();
      const days = buildCarbonIntensityDays(window);
      const profile = buildCarbonIntensitySlotProfile(window);
      const cleanest = cleanestSlot(profile);
      const dirtiest = dirtiestSlot(profile);
      const lastReadingDay = days.at(-1);
      const bandCount = (index: CarbonIntensityIndex): number =>
        window.bandCounts.find((band) => band.index === index)?.periodCount ?? 0;
      return {
        chart: (
          <CarbonIntensityHeatmap
            days={days}
            profile={profile}
            summary={{
              periodCount: window.periodCount,
              averageIntensity: window.averageIntensity,
              lowestIntensity: window.lowestPeriod.intensity,
              highestIntensity: window.highestPeriod.intensity,
              bandCounts: window.bandCounts,
            }}
          />
        ),
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Average across the window"
              value={`${formatCount(window.averageIntensity)} gCO2/kWh`}
              accent="lime"
              testId="carbon-intensity-average"
              dataValue={window.averageIntensity}
            />
            <StatCard
              label={
                cleanest === undefined
                  ? 'Cleanest half hour'
                  : `Cleanest half hour (${cleanest.label})`
              }
              value={`${formatCount(cleanest?.averageIntensity ?? 0)} gCO2/kWh`}
              accent="lime"
              testId="carbon-intensity-cleanest"
              dataValue={cleanest?.averageIntensity}
            />
            <StatCard
              label={
                dirtiest === undefined
                  ? 'Dirtiest half hour'
                  : `Dirtiest half hour (${dirtiest.label})`
              }
              value={`${formatCount(dirtiest?.averageIntensity ?? 0)} gCO2/kWh`}
              accent="lime"
              testId="carbon-intensity-dirtiest"
              dataValue={dirtiest?.averageIntensity}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          periodCount: formatCount(window.periodCount),
          dayCount: String(days.length),
          lastReadingDate:
            lastReadingDay === undefined ? '' : formatIsoDateLong(lastReadingDay.date),
          averageIntensity: formatCount(window.averageIntensity),
          cleanestSlot: cleanest?.label ?? '',
          cleanestAverage: formatCount(cleanest?.averageIntensity ?? 0),
          dirtiestSlot: dirtiest?.label ?? '',
          dirtiestAverage: formatCount(dirtiest?.averageIntensity ?? 0),
          veryLowCount: formatCount(bandCount('very low')),
          lowCount: formatCount(bandCount('low')),
          moderateCount: formatCount(bandCount('moderate')),
          highCount: formatCount(bandCount('high')),
          veryHighCount: formatCount(bandCount('very high')),
          lowestIntensity: formatCount(window.lowestPeriod.intensity),
          highestIntensity: formatCount(window.highestPeriod.intensity),
          asOf: buildDate,
        }),
      };
    }
    case 'parliament-seats': {
      const summary = await fetchParliamentSeatSummary();
      const largestParty = summary.largestParty;
      return {
        chart: <ParliamentSeatsChart summary={summary} />,
        stats: (
          <dl className="grid gap-6 py-[var(--spacing-2xl)] sm:grid-cols-3">
            <StatCard
              label="Seats in the Commons"
              value={formatCount(summary.seatCount)}
              accent="purple"
              testId="parliament-seats"
              dataValue={summary.seatCount}
            />
            <StatCard
              label={largestParty.party.name}
              value={formatCount(largestParty.seatCount)}
              accent="purple"
              testId="parliament-largest-party"
              dataValue={largestParty.seatCount}
            />
            <StatCard
              label="Parties holding a seat"
              value={formatCount(summary.partyCount)}
              accent="purple"
              testId="parliament-parties"
              dataValue={summary.partyCount}
            />
          </dl>
        ),
        dataNote: fillStoryDataNote(dataNote, {
          seatCount: formatCount(summary.seatCount),
          partyCount: formatCount(summary.partyCount),
          largestParty: largestParty.party.name,
          largestPartySeats: formatCount(largestParty.seatCount),
          asOf: buildDate,
        }),
      };
    }
    default:
      return { chart: null, stats: null, dataNote };
  }
}
