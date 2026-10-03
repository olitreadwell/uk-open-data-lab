import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReportIssueButton } from './ReportIssueButton';

expect.extend(toHaveNoViolations);

const OPEN_URL = 'https://github.com/olitreadwell/uk-open-data-lab/issues/new';

afterEach(() => {
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

describe('ReportIssueButton', () => {
  it('opens a dialog with the report form', () => {
    render(<ReportIssueButton pageLabel="Gauge index" />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(screen.getByRole('dialog', { name: 'Report an issue' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /what happened/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /what did you expect/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /severity/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /item/i })).toBeInTheDocument();
  });

  it('associates the helper paragraph with the dialog via aria-describedby', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    const dialog = screen.getByRole('dialog');
    const description = screen.getByText("Prefills a GitHub issue with this page's context.");
    expect(dialog).toHaveAttribute('aria-describedby', 'report-issue-description');
    expect(description).toHaveAttribute('id', 'report-issue-description');
  });

  it('opens a prefilled GitHub issue with page context on submit', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ReportIssueButton pageLabel="Gauge index" />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'The gauge chart shows the wrong river.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open GitHub issue' }));

    expect(open).toHaveBeenCalledTimes(1);
    const url = open.mock.calls[0]?.[0] as string;
    expect(url.startsWith(OPEN_URL)).toBe(true);
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    expect(params.get('title')).toContain('[Bug]');
    expect(params.get('body')).toContain('Gauge index');
    expect(params.get('body')).toContain('The gauge chart shows the wrong river.');
    expect(params.get('body')).toContain('## Environment');
    expect(params.get('body')).toContain('Severity: Not sure');
  });

  it('preselects the current microsite from the URL', () => {
    window.history.pushState({}, '', '/environment/gauge-index');
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(screen.getByRole('combobox', { name: /item/i })).toHaveValue('Gauge index');
  });

  it('includes the microsite data note when a microsite is selected', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    fireEvent.change(screen.getByRole('combobox', { name: /item/i }), {
      target: { value: 'Gauge index' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'The gauge chart shows the wrong river.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open GitHub issue' }));

    const url = open.mock.calls[0]?.[0] as string;
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    expect(params.get('body')).toContain('## Data context');
    expect(params.get('body')).toContain('Environment Agency flood-monitoring');
  });

  it('includes the expected field when filled', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'The gauge chart shows the wrong river.' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /what did you expect/i }), {
      target: { value: 'The chart should start in 1994.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open GitHub issue' }));

    const url = open.mock.calls[0]?.[0] as string;
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    expect(params.get('body')).toContain('## Expected');
    expect(params.get('body')).toContain('The chart should start in 1994.');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<ReportIssueButton />);
    const trigger = screen.getByRole('button', { name: 'Report an issue' });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders the backdrop as a non-focusable, aria-hidden element', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(screen.queryByRole('button', { name: 'Close report dialog' })).not.toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.firstElementChild;
    expect(backdrop).not.toBeNull();
    expect(backdrop).not.toBeInstanceOf(HTMLButtonElement);
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations when open', async () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    const dialog = screen.getByRole('dialog');
    const results = await axe(dialog);
    expect(results).toHaveNoViolations();
  });
});

describe('ReportIssueButton focus trap', () => {
  it('makes the background inert while open and restores it on close', () => {
    const { container } = render(<ReportIssueButton />);
    expect(container).not.toHaveAttribute('inert');
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(container).toHaveAttribute('inert');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container).not.toHaveAttribute('inert');
  });

  it('cycles focus forward and backward within the dialog', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    const copy = screen.getByRole('button', { name: 'Copy link' });

    copy.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(copy).toHaveFocus();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('pulls focus back into the dialog when Tab is pressed from outside', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    const close = screen.getByRole('button', { name: 'Close' });
    const trigger = screen.getByRole('button', { name: 'Report an issue' });

    trigger.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
  });
});

describe('ReportIssueButton min-length hint', () => {
  it('wires the visible hint to the textarea via aria-describedby', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    const textarea = screen.getByRole('textbox', { name: /what happened/i });
    expect(textarea).toHaveAttribute('aria-describedby', 'report-issue-min-length');
    expect(screen.getByText('At least 10 characters')).toHaveAttribute(
      'id',
      'report-issue-min-length',
    );
  });

  it('announces why the submit button is disabled when the description is too short', () => {
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(
      screen.getByText('Add at least 10 characters to enable the submit button.'),
    ).toHaveAttribute('role', 'status');

    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'A sufficiently long description.' },
    });
    expect(
      screen.queryByText('Add at least 10 characters to enable the submit button.'),
    ).not.toBeInTheDocument();
  });
});

describe('ReportIssueButton blocked popup', () => {
  it('keeps the dialog open and offers to copy the link when the popup is blocked', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'The gauge chart shows the wrong river.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open GitHub issue' }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('Your browser blocked the new window. Copy the prefilled link instead.'),
    ).toHaveAttribute('role', 'alert');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    });
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});

describe('ReportIssueButton reset after submit', () => {
  it('resets type, item, description, and copied when the report opens successfully', () => {
    vi.spyOn(window, 'open').mockImplementation(() => ({}) as Window);
    render(<ReportIssueButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), {
      target: { value: 'Accessibility' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /item/i }), {
      target: { value: 'Other' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /what happened/i }), {
      target: { value: 'The gauge chart shows the wrong river.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open GitHub issue' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
    expect(screen.getByRole('combobox', { name: /type/i })).toHaveValue('Bug');
    expect(screen.getByRole('combobox', { name: /item/i })).toHaveValue('Home page');
    expect(screen.getByRole('textbox', { name: /what happened/i })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });
});
