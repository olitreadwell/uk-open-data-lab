import { Container } from '@uk-open-data-lab/ui';

export default function Loading(): React.ReactElement {
  return (
    <Container size="default" className="py-[var(--spacing-3xl)]">
      <div role="status" aria-busy="true" className="space-y-4">
        <p className="sr-only">Loading…</p>
        <div className="h-4 w-24 rounded bg-[var(--color-neutral-200)] motion-safe:animate-pulse" />
        <div className="h-10 w-full max-w-lg rounded bg-[var(--color-neutral-200)] motion-safe:animate-pulse" />
        <div className="h-5 w-full max-w-xl rounded bg-[var(--color-neutral-200)] motion-safe:animate-pulse" />
      </div>
    </Container>
  );
}
