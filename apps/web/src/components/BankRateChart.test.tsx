import { fireEvent, render, screen } from '@testing-library/react';
import type { BankRateSpell } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { BankRateChart, buildBankRateStepRows, yearFractionFor } from './BankRateChart';

expect.extend(toHaveNoViolations);

/** Three runs in the shape the database returns them. */
const SPELLS: BankRateSpell[] = [
  { startDate: '1975-01-02', endDate: '1975-01-17', ratePercent: 11.5, dayCount: 16 },
  { startDate: '1975-01-20', endDate: '1975-02-27', ratePercent: 11.25, dayCount: 39 },
  { startDate: '2009-03-05', endDate: '2016-08-03', ratePercent: 0.5, dayCount: 2709 },
];

describe('yearFractionFor', () => {
  it('places a date on a decimal year axis', () => {
    expect(yearFractionFor('1975-01-01')).toBe(1975);
    expect(yearFractionFor('1976-01-01')).toBe(1976);
    expect(yearFractionFor('1975-07-02')).toBeCloseTo(1975.5, 2);
  });

  it('spreads the year by its own length, so a leap year holds one more day', () => {
    // 2 July is the 184th day of 2020 and the 183rd of 2021.
    expect(yearFractionFor('2020-07-02') - 2020).toBeCloseTo(183 / 366, 6);
    expect(yearFractionFor('2021-07-02') - 2021).toBeCloseTo(182 / 365, 6);
  });
});

describe('buildBankRateStepRows', () => {
  it('places one point at the start of each run', () => {
    const rows = buildBankRateStepRows(SPELLS, '2016-08-03');
    expect(rows).toHaveLength(4);
    expect(rows[0]?.startDate).toBe('1975-01-02');
    expect(rows[0]?.ratePercent).toBe(11.5);
    expect(rows[2]?.x).toBeCloseTo(yearFractionFor('2009-03-05'), 6);
  });

  it('closes the line on the last day of the series', () => {
    const rows = buildBankRateStepRows(SPELLS, '2016-08-03');
    const closing = rows.at(-1);
    expect(closing?.ratePercent).toBe(0.5);
    expect(closing?.x).toBeCloseTo(yearFractionFor('2016-08-03'), 6);
    expect(closing?.x).toBeGreaterThan(rows[2]?.x ?? 0);
  });

  it('adds no closing point when the series already ends at the last run', () => {
    expect(buildBankRateStepRows(SPELLS, '2009-03-05')).toHaveLength(3);
  });
});

describe('BankRateChart', () => {
  it('names the high and low of the series in the accessible chart label', () => {
    render(<BankRateChart spells={SPELLS} latestDate="2016-08-03" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      /11.5% at its highest and 0.5% at its lowest/,
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BankRateChart spells={SPELLS} latestDate="2016-08-03" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes every run in a keyboard-reachable table', () => {
    const { container } = render(<BankRateChart spells={SPELLS} latestDate="2016-08-03" />);
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain('2 January 1975');
    expect(rows[0]?.textContent).toContain('11.5%');
    expect(rows[2]?.textContent).toContain('2,709');
  });

  it('draws an empty chart rather than throwing when the series has no runs', () => {
    render(<BankRateChart spells={[]} latestDate="2016-08-03" />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/since 1975/);
  });
});
