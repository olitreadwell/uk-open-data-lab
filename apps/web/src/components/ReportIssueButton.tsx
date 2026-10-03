'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MicrositeConfig } from '@/lib/microsites';
import { MICROSITES } from '@/lib/microsites';

const ISSUE_TYPES = [
  'Bug',
  'Accessibility',
  'Data or content',
  'Design',
  'Performance',
  'Other',
] as const;
const SEVERITIES = ['Blocks me', 'Annoying', 'Cosmetic', 'Not sure'] as const;
const GITHUB_NEW_ISSUE_URL = 'https://github.com/olitreadwell/uk-open-data-lab/issues/new';
const MAX_TITLE_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 10;
const COPY_FEEDBACK_MS = 2000;

type IssueType = (typeof ISSUE_TYPES)[number];
type Severity = (typeof SEVERITIES)[number];

const MICROSITE_BY_LABEL = new Map<string, MicrositeConfig>(
  MICROSITES.map((microsite) => [microsite.label, microsite]),
);

interface ReportIssueButtonProps {
  /** Page label shown in the prefilled issue, e.g. the microsite title. */
  pageLabel?: string;
}

interface EnvironmentInfo {
  browser: string;
  os: string;
  viewport: string;
  colorScheme: string;
  online: string;
}

/** Detects the browser family from a user agent string.
 * @param userAgent - the navigator user agent to inspect
 * @returns the browser family, or "Unknown"
 */
function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Edg/')) {
    return 'Edge';
  }
  if (userAgent.includes('Chrome/')) {
    return 'Chrome';
  }
  if (userAgent.includes('Firefox/')) {
    return 'Firefox';
  }
  if (userAgent.includes('Safari/')) {
    return 'Safari';
  }
  if (userAgent.includes('OPR/')) {
    return 'Opera';
  }
  return 'Unknown';
}

/** Detects the operating system family from a user agent string.
 * @param userAgent - the navigator user agent to inspect
 * @returns the OS family, or "Unknown"
 */
function detectOs(userAgent: string): string {
  if (userAgent.includes('Windows')) {
    return 'Windows';
  }
  if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
    return 'macOS';
  }
  if (userAgent.includes('Android')) {
    return 'Android';
  }
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'iOS';
  }
  if (userAgent.includes('Linux')) {
    return 'Linux';
  }
  return 'Unknown';
}

/** Reads the browser environment at report time, with safe fallbacks.
 * @returns the environment facts to embed in the issue body
 */
function getEnvironmentInfo(): EnvironmentInfo {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const prefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  return {
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    viewport:
      typeof window === 'undefined' ? 'unknown' : `${window.innerWidth}x${window.innerHeight}`,
    colorScheme: prefersDark ? 'dark' : 'light',
    online: typeof navigator === 'undefined' ? 'unknown' : navigator.onLine ? 'yes' : 'no',
  };
}

/** Picks the report item that matches the current URL, if any.
 * @param pathname - the current window location pathname
 * @returns the matching microsite label, "Home page", or "Other"
 */
function detectItemFromPath(pathname: string): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const slug = segments[segments.length - 1] ?? '';
  if (slug === '') {
    return 'Home page';
  }
  const microsite = MICROSITES.find((candidate) => candidate.slug === slug);
  return microsite?.label ?? 'Other';
}

/** Returns the default report item for the current URL.
 * @returns the matching microsite label, "Home page", or "Other"
 */
function getDefaultItem(): string {
  return typeof window === 'undefined' ? 'Home page' : detectItemFromPath(window.location.pathname);
}

/**
 * Builds the prefilled GitHub new-issue URL for a report.
 *
 * @param input - the report fields and page context to encode
 * @param input.type - the issue category, e.g. Bug or Accessibility
 * @param input.severity - how much the issue blocks the reporter
 * @param input.item - the site area the report is about
 * @param input.description - the reporter's free-text description
 * @param input.expected - what the reporter expected to happen
 * @param input.pageLabel - the page title the report came from
 * @param input.pageUrl - the page URL the report came from
 * @param input.environment - auto-captured browser and viewport facts
 * @returns the GitHub new-issue URL with title and body prefilled
 */
function buildIssueUrl(input: {
  type: IssueType;
  severity: Severity;
  item: string;
  description: string;
  expected: string;
  pageLabel: string;
  pageUrl: string;
  environment: EnvironmentInfo;
}): string {
  const title = `[${input.type}] ${input.description.split('\n')[0] ?? 'Issue report'}`.slice(
    0,
    MAX_TITLE_LENGTH,
  );
  const microsite = MICROSITE_BY_LABEL.get(input.item);
  const sections: Array<string[] | null> = [
    [
      '## Reported from',
      `- Page: ${input.pageLabel} (${input.pageUrl})`,
      `- Type: ${input.type}`,
      `- Item: ${input.item}`,
      `- Severity: ${input.severity}`,
      `- Reported: ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} (NZST)`,
    ],
    ['## Description', input.description],
    input.expected === '' ? null : ['## Expected', input.expected],
    [
      '## Environment',
      `- Browser: ${input.environment.browser}`,
      `- OS: ${input.environment.os}`,
      `- Viewport: ${input.environment.viewport}`,
      `- Color scheme: ${input.environment.colorScheme}`,
      `- Online: ${input.environment.online}`,
      `- URL: ${input.pageUrl}`,
    ],
    microsite === undefined ? null : ['## Data context', microsite.dataNote],
  ];
  const body = [
    ...sections
      .filter((section): section is string[] => section !== null)
      .map((section) => section.join('\n')),
    '<!-- filed from the report-an-issue button; the quality-issue-loop triage will spec this -->',
  ].join('\n\n');
  const params = new URLSearchParams({ title, body });
  return `${GITHUB_NEW_ISSUE_URL}?${params.toString()}`;
}

/**
 * Floating "report an issue" bubble on every page. Opens a small dialog that
 * prefills a GitHub issue with the current page, the reporter's context, and
 * a structured body the quality-issue-loop triage can turn into a spec.
 * Static export cannot hold a token, so the form opens GitHub's new-issue
 * form with everything prefilled instead of posting directly.
 *
 * @param props - component props
 * @param props.pageLabel - optional page label for the prefilled issue
 * @returns the report bubble and its dialog
 */
export function ReportIssueButton({ pageLabel }: ReportIssueButtonProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<IssueType>('Bug');
  const [severity, setSeverity] = useState<Severity>('Not sure');
  const [item, setItem] = useState(getDefaultItem);
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [copied, setCopied] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const pageUrl = typeof window === 'undefined' ? '' : window.location.href;
  const label = pageLabel ?? (typeof document === 'undefined' ? '' : document.title);
  const descriptionTooShort = description.trim().length < MIN_DESCRIPTION_LENGTH;

  useEffect(() => {
    if (!open) {
      return;
    }
    descriptionRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const dialog = dialogRef.current;
      if (dialog === null) {
        return;
      }
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || dialog === null) {
      return;
    }
    const background = Array.from(document.body.children).filter((child) => child !== dialog);
    const hadInert = background.map((child) => child.hasAttribute('inert'));
    background.forEach((child) => child.setAttribute('inert', ''));
    return () => {
      background.forEach((child, index) => {
        if (hadInert[index] === true) {
          child.setAttribute('inert', '');
        } else {
          child.removeAttribute('inert');
        }
      });
    };
  }, [open]);

  const submit = (): void => {
    const url = buildIssueUrl({
      type,
      severity,
      item,
      description,
      expected,
      pageLabel: label,
      pageUrl,
      environment: getEnvironmentInfo(),
    });
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened === null) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    setType('Bug');
    setItem(getDefaultItem());
    setDescription('');
    setCopied(false);
    setOpen(false);
  };

  const copy = async (): Promise<void> => {
    const url = buildIssueUrl({
      type,
      severity,
      item,
      description,
      expected,
      pageLabel: label,
      pageUrl,
      environment: getEnvironmentInfo(),
    });
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Report an issue"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-issue-title"
              aria-describedby="report-issue-description"
              className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            >
              <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <div className="relative w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="report-issue-title" className="numeral-heading-lg">
                      Report an issue
                    </h2>
                    <p
                      id="report-issue-description"
                      className="numeral-paragraph-sm text-[var(--color-muted)]"
                    >
                      Prefills a GitHub issue with this page&apos;s context.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-4"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                  className="grid gap-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1">
                      <span className="numeral-paragraph-sm text-[var(--color-muted)]">Type</span>
                      <select
                        value={type}
                        onChange={(event) => setType(event.target.value as IssueType)}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
                      >
                        {ISSUE_TYPES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="numeral-paragraph-sm text-[var(--color-muted)]">
                        Severity
                      </span>
                      <select
                        value={severity}
                        onChange={(event) => setSeverity(event.target.value as Severity)}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
                      >
                        {SEVERITIES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-1">
                    <span className="numeral-paragraph-sm text-[var(--color-muted)]">Item</span>
                    <select
                      value={item}
                      onChange={(event) => setItem(event.target.value)}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
                    >
                      <option>Home page</option>
                      {MICROSITES.map((microsite) => (
                        <option key={microsite.slug}>{microsite.label}</option>
                      ))}
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="numeral-paragraph-sm text-[var(--color-muted)]">
                      What happened?
                    </span>
                    <textarea
                      ref={descriptionRef}
                      required
                      minLength={MIN_DESCRIPTION_LENGTH}
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe the problem and what you saw."
                      aria-describedby="report-issue-min-length"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
                    />
                    <span
                      id="report-issue-min-length"
                      className="numeral-paragraph-sm text-[var(--color-muted)]"
                    >
                      At least {MIN_DESCRIPTION_LENGTH} characters
                    </span>
                    {descriptionTooShort ? (
                      <p role="status" className="numeral-paragraph-sm text-[var(--color-muted)]">
                        Add at least {MIN_DESCRIPTION_LENGTH} characters to enable the submit
                        button.
                      </p>
                    ) : null}
                  </label>
                  <label className="grid gap-1">
                    <span className="numeral-paragraph-sm text-[var(--color-muted)]">
                      What did you expect?
                    </span>
                    <textarea
                      rows={2}
                      value={expected}
                      onChange={(event) => setExpected(event.target.value)}
                      placeholder="Optional: what should have happened instead?"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={descriptionTooShort}
                      className="numeral-button numeral-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Open GitHub issue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void copy();
                      }}
                      className="numeral-button numeral-button-secondary"
                    >
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  {blocked ? (
                    <p role="alert" className="numeral-paragraph-sm text-[var(--color-muted)]">
                      Your browser blocked the new window. Copy the prefilled link instead.
                    </p>
                  ) : null}
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
