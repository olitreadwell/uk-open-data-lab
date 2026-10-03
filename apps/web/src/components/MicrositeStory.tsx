import { Container, Stack } from '@uk-open-data-lab/ui';
import Link from 'next/link';

import { getMicrositeAccentStyles } from './microsite-styles';
import type { MicrositeAccent } from './microsite-styles';
import { MicrositeEyebrow } from './MicrositeEyebrow';
import { MicrositeReferences } from './MicrositeReferences';
import type { MicrositeReference } from './MicrositeReferences';

interface RelatedStoryLink {
  label: string;
  href: string;
}

interface MicrositeStoryProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  paragraphs: string[];
  keyFacts: string[];
  howToRead: string;
  sourceUrl: string;
  updatedLabel: string;
  related: RelatedStoryLink[];
  accent: MicrositeAccent;
  chart: React.ReactNode;
  stats: React.ReactNode;
  dataNote: string;
  references: MicrositeReference[];
}

/** One microsite story: narrative, key facts, chart, headline stats, and sources. */
export function MicrositeStory({
  id,
  eyebrow,
  title,
  description,
  paragraphs,
  keyFacts,
  howToRead,
  sourceUrl,
  updatedLabel,
  related,
  accent,
  chart,
  stats,
  dataNote,
  references,
}: MicrositeStoryProps): React.ReactElement {
  const styles = getMicrositeAccentStyles(accent);
  return (
    <section id={id} className="scroll-mt-16 border-b border-[var(--color-border)]">
      <Container size="wide">
        <Stack className="max-w-3xl gap-6 py-[var(--spacing-2xl)]">
          <MicrositeEyebrow
            className={`numeral-text-eyebrow ${styles.eyebrow}`}
            eyebrow={eyebrow}
          />
          <h1 className="numeral-heading-2xl">{title}</h1>
          <p className="numeral-paragraph-lg text-[var(--color-muted)]">{description}</p>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="numeral-paragraph-md text-[var(--color-muted)]">
              {paragraph}
            </p>
          ))}
        </Stack>
        <div className="mb-[var(--spacing-lg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:p-6">
          <h2 className="numeral-text-eyebrow text-[var(--color-muted)]">Key facts</h2>
          <ul className="mt-3 space-y-2">
            {keyFacts.map((fact) => (
              <li key={fact} className="numeral-paragraph-md text-[var(--color-muted)]">
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:p-6">
          <p className="numeral-paragraph-sm mb-3 text-[var(--color-muted)]">
            <span className="numeral-text-eyebrow text-[var(--color-muted)]">
              How to read this chart
            </span>
            {`. ${howToRead}`}
          </p>
          {chart}
        </div>
        {stats}
        <div className="max-w-3xl pb-[var(--spacing-2xl)] text-[var(--color-muted)]">
          <p className="numeral-paragraph-sm">
            {updatedLabel} ·{' '}
            <a className="underline" href={sourceUrl}>
              Open source data
            </a>
          </p>
          <p className="numeral-paragraph-sm mt-1">{dataNote}</p>
        </div>
        <MicrositeReferences references={references} />
        {related.length > 0 && (
          <div className="max-w-3xl pb-[var(--spacing-2xl)]">
            <h2 className="numeral-text-eyebrow text-[var(--color-muted)]">Related stories</h2>
            <ul className="mt-3 space-y-2">
              {related.map((item) => (
                <li key={item.href}>
                  <Link className="underline" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
