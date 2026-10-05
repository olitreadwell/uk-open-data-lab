import { Container, Stack } from '@uk-open-data-lab/ui';

import { MicrositeGallery } from '@/components/MicrositeGallery';
import type { MicrositeGalleryCard } from '@/components/MicrositeGallery';
import { ReportIssueButton } from '@/components/ReportIssueButton';
import {
  FEATURED_STATION_REFERENCE,
  fetchGaugeLiveLevel,
  fetchGaugeStationSample,
  preferredMeasureIdsFor,
} from '@/lib/gauge-data';
import { categorySlugFor, SHOWN_MICROSITES } from '@/lib/microsites';
import type { MicrositeConfig } from '@/lib/microsites';
import { formatLevelMetres } from '@/lib/uk-format';

function getMicrosite(slug: string): MicrositeConfig | undefined {
  return SHOWN_MICROSITES.find((candidate) => candidate.slug === slug);
}

export default async function HomePage(): Promise<React.ReactElement> {
  const stations = await fetchGaugeStationSample();
  const level = await fetchGaugeLiveLevel(
    preferredMeasureIdsFor(stations, FEATURED_STATION_REFERENCE),
  );

  const cards = [
    {
      config: getMicrosite('gauge-index'),
      statLabel: `${level.stationLabel} right now`,
      statValue: formatLevelMetres(level.latestLevelMetres),
    },
  ].filter(
    (card): card is { config: MicrositeConfig; statLabel: string; statValue: string } =>
      card.config !== undefined,
  );
  // The home page shows every published microsite; only the curated ones carry
  // a headline stat fetched at deploy time.
  const statBySlug = new Map(
    cards.map((card) => [
      card.config.slug,
      { statLabel: card.statLabel, statValue: card.statValue },
    ]),
  );
  // The full microsite list is in ship order (oldest first); show the newest first.
  const galleryCards: MicrositeGalleryCard[] = [...SHOWN_MICROSITES].reverse().map((config) => {
    const stat = statBySlug.get(config.slug);
    return {
      slug: config.slug,
      categorySlug: categorySlugFor(config),
      eyebrow: config.eyebrow,
      title: config.title,
      description: config.description,
      accent: config.accent,
      dataSource: config.dataSource,
      chartType: config.chartType,
      category: config.category,
      ...(stat !== undefined ? { statLabel: stat.statLabel, statValue: stat.statValue } : {}),
    };
  });

  // The line under the heading states how many sources the site reads, so it
  // cannot go stale the way a hand-written list of sources does.
  const dataSourceCount = new Set(galleryCards.map((card) => card.dataSource)).size;

  return (
    <>
      <Container size="wide">
        <Stack className="max-w-3xl gap-4 py-[var(--spacing-2xl)]">
          <h1 className="numeral-heading-3xl">
            Small experiments digging through UK public data for the funny and the surprising.
          </h1>
          <p className="numeral-paragraph-lg text-[var(--color-muted)]">
            {galleryCards.length} live microsite{galleryCards.length === 1 ? '' : 's'}. Every figure
            comes from a keyless public API read at deploy time, across {dataSourceCount} UK data
            sources; each story lists its own source and licence.
          </p>
        </Stack>
        <div className="pb-[var(--spacing-3xl)]">
          <MicrositeGallery cards={galleryCards} />
        </div>
      </Container>
      <ReportIssueButton />
    </>
  );
}
