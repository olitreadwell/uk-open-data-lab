/** Minimal site footer: mission line, no link farm. */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto w-full max-w-[var(--layout-wide)] px-[var(--layout-outside-space)] py-6">
        <p className="numeral-paragraph-sm text-[var(--color-muted)]">
          uk-open-data-lab: small experiments in UK public data, with more experiments to come.
        </p>
      </div>
    </footer>
  );
}
