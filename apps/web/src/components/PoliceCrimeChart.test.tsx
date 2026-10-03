import { fireEvent, render, screen } from '@testing-library/react';
import type { PoliceCategoryCount, PoliceMonthCount } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import {
  buildPoliceCrimeMonthRows,
  buildPoliceCrimeTableRows,
  PoliceCrimeChart,
} from './PoliceCrimeChart';

expect.extend(toHaveNoViolations);

/** Crime types across a window, biggest first, in the shape the API counts them. */
const CATEGORY_COUNTS: PoliceCategoryCount[] = [
  { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 4942 },
  { slug: 'shoplifting', name: 'Shoplifting', recordCount: 3311 },
  { slug: 'other-theft', name: 'Other theft', recordCount: 1586 },
  { slug: 'anti-social-behaviour', name: 'Anti-social behaviour', recordCount: 1496 },
  { slug: 'public-order', name: 'Public order', recordCount: 1461 },
  { slug: 'drugs', name: 'Drugs', recordCount: 964 },
  { slug: 'possession-of-weapons', name: 'Possession of weapons', recordCount: 193 },
];

/** Two published months, oldest first, as the summary returns them. */
const MONTHS: PoliceMonthCount[] = [
  {
    month: '2026-06',
    recordCount: 1452,
    categoryCounts: [
      { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 403 },
      { slug: 'shoplifting', name: 'Shoplifting', recordCount: 317 },
      { slug: 'other-theft', name: 'Other theft', recordCount: 130 },
      { slug: 'anti-social-behaviour', name: 'Anti-social behaviour', recordCount: 136 },
      { slug: 'public-order', name: 'Public order', recordCount: 120 },
      { slug: 'drugs', name: 'Drugs', recordCount: 80 },
      { slug: 'possession-of-weapons', name: 'Possession of weapons', recordCount: 20 },
    ],
  },
  {
    month: '2026-07',
    recordCount: 1417,
    categoryCounts: [
      { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 419 },
      { slug: 'shoplifting', name: 'Shoplifting', recordCount: 297 },
      { slug: 'other-theft', name: 'Other theft', recordCount: 112 },
      { slug: 'anti-social-behaviour', name: 'Anti-social behaviour', recordCount: 123 },
      { slug: 'public-order', name: 'Public order', recordCount: 112 },
      { slug: 'drugs', name: 'Drugs', recordCount: 74 },
      { slug: 'possession-of-weapons', name: 'Possession of weapons', recordCount: 13 },
    ],
  },
];

describe('buildPoliceCrimeMonthRows', () => {
  it('gives every leading crime type a band and adds the rest up behind them', () => {
    const rows = buildPoliceCrimeMonthRows(MONTHS, CATEGORY_COUNTS);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.monthLabel).toBe('Jun 2026');
    expect(rows[0]?.total).toBe(1452);
    expect(rows[0]?.['violent-crime']).toBe(403);
    expect(rows[0]?.shoplifting).toBe(317);
    // The six crime types below the leading five, added up.
    expect(rows[0]?.otherTypes).toBe(1452 - (403 + 317 + 130 + 136 + 120));
    expect(rows[1]?.otherTypes).toBe(1417 - (419 + 297 + 112 + 123 + 112));
  });

  it('counts a leading crime type as zero in a month that does not carry it', () => {
    const rows = buildPoliceCrimeMonthRows(
      [{ month: '2026-07', recordCount: 5, categoryCounts: [] }],
      [{ slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 4942 }],
    );
    expect(rows[0]?.['violent-crime']).toBe(0);
    expect(rows[0]?.otherTypes).toBe(5);
  });
});

describe('buildPoliceCrimeTableRows', () => {
  it('writes each crime type share of the window', () => {
    const rows = buildPoliceCrimeTableRows([
      { slug: 'violent-crime', name: 'Violence and sexual offences', recordCount: 75 },
      { slug: 'shoplifting', name: 'Shoplifting', recordCount: 25 },
    ]);
    expect(rows).toEqual([
      { name: 'Violence and sexual offences', recordCount: 75, share: '75.0%' },
      { name: 'Shoplifting', recordCount: 25, share: '25.0%' },
    ]);
  });

  it('writes a zero share rather than dividing by nothing', () => {
    expect(buildPoliceCrimeTableRows([])).toEqual([]);
    expect(buildPoliceCrimeTableRows([{ slug: 'drugs', name: 'Drugs', recordCount: 0 }])).toEqual([
      { name: 'Drugs', recordCount: 0, share: '0%' },
    ]);
  });
});

describe('PoliceCrimeChart', () => {
  it('names the window and the leading crime type in the accessible chart label', () => {
    render(
      <PoliceCrimeChart
        months={MONTHS}
        categoryCounts={CATEGORY_COUNTS}
        locationLabel="Leeds city centre"
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      /2,869 offences across 2 months, Violence and sexual offences leading with 4,942/,
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PoliceCrimeChart
        months={MONTHS}
        categoryCounts={CATEGORY_COUNTS}
        locationLabel="Leeds city centre"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the crime types and their share in a keyboard-reachable table', () => {
    const { container } = render(
      <PoliceCrimeChart
        months={MONTHS}
        categoryCounts={CATEGORY_COUNTS}
        locationLabel="Leeds city centre"
      />,
    );
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Crime type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Offences' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Share of the window' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Shoplifting' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '3,311' })).toBeInTheDocument();
  });

  it('renders a fallback label when the window holds no months', () => {
    render(<PoliceCrimeChart months={[]} categoryCounts={[]} locationLabel="Leeds city centre" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      /within a mile of Leeds city centre, by month/i,
    );
  });
});
