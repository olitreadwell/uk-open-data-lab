import { Container, Stack } from '@uk-open-data-lab/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About - uk-open-data-lab',
  description: 'What uk-open-data-lab is, where the data comes from, and how the site is built.',
};

export default function AboutPage(): React.ReactElement {
  return (
    <Container size="wide">
      <Stack className="max-w-3xl gap-6 py-[var(--spacing-2xl)]">
        <h1 className="numeral-heading-3xl">About uk-open-data-lab</h1>
        <p className="numeral-paragraph-lg text-[var(--color-muted)]">
          Small experiments digging through UK public data for the funny and the surprising. One
          experiment at a time, each on a real dataset.
        </p>

        <section className="space-y-3">
          <h2 className="numeral-heading-lg">uk-open-data-connectors</h2>
          <p className="numeral-paragraph-md">
            The data here is pulled through{' '}
            <Link
              href="https://github.com/olitreadwell/uk-open-data-connectors"
              className="underline hover:text-[var(--color-fg)]"
            >
              uk-open-data-connectors
            </Link>
            : TypeScript connectors for UK public data, keyless-first, with language-agnostic
            wrappers so any language can call them. Every connector works without an API key;
            optional keys unlock more and stay server-side, read from the environment and never
            exposed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="numeral-heading-lg">Awesome UK Open Data</h2>
          <p className="numeral-paragraph-md">
            Sources start in{' '}
            <Link
              href="https://github.com/olitreadwell/awesome-uk-open-data"
              className="underline hover:text-[var(--color-fg)]"
            >
              awesome-uk-open-data
            </Link>
            , a curated list of UK open data and the APIs that serve it, from central government
            agencies to local councils and the national mapping agencies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="numeral-heading-lg">The gauge index</h2>
          <p className="numeral-paragraph-md">
            The first experiment counts the Environment Agency river gauges and asks which rivers
            carry the most. The River Thames leads with 55 stations across 808 named rivers, and the
            sample runs to a few thousand gauges in all.
          </p>
          <p className="numeral-paragraph-md">
            The station list and the live water level come from the agency flood-monitoring API,
            which is keyless and published under the Open Government Licence v3.0. Both are read at
            deploy time, with committed snapshots as the fallback when the API is unreachable from
            the build runner. The site redeploys daily.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="numeral-heading-lg">How the site works</h2>
          <p className="numeral-paragraph-md">
            A static Next.js export. Data is fetched at build time, so every page is plain HTML with
            no server. Charts render in the browser from the same numbers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="numeral-heading-lg">Open source</h2>
          <p className="numeral-paragraph-md">
            The code is public on{' '}
            <Link
              href="https://github.com/olitreadwell/uk-open-data-lab"
              className="underline hover:text-[var(--color-fg)]"
            >
              GitHub
            </Link>
            . Found a bug or a broken link? Open an issue there.
          </p>
        </section>
      </Stack>
    </Container>
  );
}
