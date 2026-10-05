import { Container, Stack } from '@uk-open-data-lab/ui';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MicrositeGallery } from '@/components/MicrositeGallery';
import type { MicrositeGalleryCard } from '@/components/MicrositeGallery';
import {
  CATEGORY_DETAILS,
  CATEGORY_SLUGS,
  categoryLabelForSlug,
  MICROSITES,
  SHOWN_MICROSITES,
} from '@/lib/microsites';
import type { MicrositeCategory } from '@/lib/microsites';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { category: string }[] {
  const usedCategories = new Set(MICROSITES.map((microsite) => microsite.category));
  return Object.entries(CATEGORY_SLUGS)
    .filter(([category]) => usedCategories.has(category as MicrositeCategory))
    .map(([, slug]) => ({ category: slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryLabel = categoryLabelForSlug(category);
  if (categoryLabel === undefined) {
    return { title: 'uk-open-data-lab' };
  }
  const categoryDescription = CATEGORY_DETAILS[categoryLabel];
  return {
    title: `${categoryLabel} - uk-open-data-lab`,
    description: categoryDescription,
    openGraph: {
      title: `${categoryLabel} - uk-open-data-lab`,
      description: categoryDescription,
      url: `/${category}/`,
      type: 'website',
    },
  };
}

function toGalleryCard(config: (typeof MICROSITES)[number]): MicrositeGalleryCard {
  return {
    slug: config.slug,
    eyebrow: config.eyebrow,
    title: config.title,
    description: config.description,
    accent: config.accent,
    dataSource: config.dataSource,
    chartType: config.chartType,
    category: config.category,
    categorySlug: CATEGORY_SLUGS[config.category],
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps): Promise<React.ReactElement> {
  const { category } = await params;
  const categoryLabel = categoryLabelForSlug(category);
  if (categoryLabel === undefined) {
    notFound();
  }
  const microsites = SHOWN_MICROSITES.filter((microsite) => microsite.category === categoryLabel);
  const cards = microsites.map(toGalleryCard);
  const sourceCount = new Set(microsites.map((microsite) => microsite.dataSource)).size;

  return (
    <Container size="wide">
      <Stack className="max-w-3xl gap-4 py-[var(--spacing-2xl)]">
        <h1 className="numeral-heading-3xl">{categoryLabel}</h1>
        <p className="numeral-paragraph-lg text-[var(--color-muted)]">
          {CATEGORY_DETAILS[categoryLabel]}
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <dt className="numeral-text-eyebrow text-[var(--color-muted)]">Microsites</dt>
            <dd className="numeral-heading-lg">{cards.length}</dd>
          </div>
          <div>
            <dt className="numeral-text-eyebrow text-[var(--color-muted)]">Data sources</dt>
            <dd className="numeral-heading-lg">{sourceCount}</dd>
          </div>
        </dl>
      </Stack>
      <div className="pb-[var(--spacing-3xl)]">
        <MicrositeGallery
          cards={cards}
          title={null}
          initialCategory={categoryLabel}
          key={category}
        />
      </div>
    </Container>
  );
}
