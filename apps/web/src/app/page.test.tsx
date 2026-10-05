import { renderToReadableStream } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { HIDDEN_MICROSITES } from '@/lib/hidden-microsites';
import { CATEGORY_SLUGS, MICROSITES } from '@/lib/microsites';
import { PUBLISHED_MICROSITES } from '@/lib/published-microsites';

import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

/** Category slug for a microsite slug, for link assertions. */
function categorySlugForTest(slug: string): string {
  const microsite = MICROSITES.find((candidate) => candidate.slug === slug);
  return microsite === undefined ? 'nope' : CATEGORY_SLUGS[microsite.category];
}

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

describe('HomePage', () => {
  it('renders the mission line and the visible microsite cards', async () => {
    const stream = await renderToReadableStream(<HomePage />);
    const html = await new Response(stream).text();
    expect(html).toContain('Small experiments digging through UK public data');
    expect(html).toContain('more gauges than any other river in England');
    for (const slug of HIDDEN_MICROSITES) {
      expect(html).not.toContain(`href="/${categorySlugForTest(slug)}/${slug}"`);
    }
  });

  it('links every visible card to its story page and omits hidden ones', async () => {
    const stream = await renderToReadableStream(<HomePage />);
    const html = await new Response(stream).text();
    for (const slug of PUBLISHED_MICROSITES) {
      expect(html).toContain(`href="/${categorySlugForTest(slug)}/${slug}"`);
    }
  });

  it('shows the live river level on the card', async () => {
    const stream = await renderToReadableStream(<HomePage />);
    const html = await new Response(stream).text();
    expect(html).toContain('0.07 m');
  });
});
