'use client';

import { Button, Container, Stack } from '@uk-open-data-lab/ui';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.ReactElement {
  // Log the real error for debugging, but never render its message to the
  // user: it can leak internal/API details such as request URLs.
  console.error(error);

  return (
    <Container size="narrow" className="py-[var(--spacing-3xl)] text-center">
      <Stack className="items-center gap-6">
        <p className="numeral-text-eyebrow text-[var(--color-danger)]">Something went wrong</p>
        <h1 className="numeral-heading-2xl">An unexpected error occurred</h1>
        <p className="numeral-paragraph-md text-[var(--color-muted)]">
          We hit an error loading this page. Try again.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Link href="/" className="numeral-button numeral-button-secondary numeral-button-lg">
            Back to home
          </Link>
        </div>
      </Stack>
    </Container>
  );
}
