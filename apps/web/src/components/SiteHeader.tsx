import Link from 'next/link';

/** Sticky, blurred site header: wordmark plus the About link. */
export function SiteHeader(): React.ReactElement {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/70">
      <div className="mx-auto flex h-14 w-full max-w-[var(--layout-wide)] items-center justify-between px-[var(--layout-outside-space)]">
        <Link href="/" className="numeral-text-mono text-sm font-medium tracking-tight">
          uk-open-data-lab
        </Link>
        <nav aria-label="Site">
          <Link
            href="/about"
            className="numeral-paragraph-sm text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
