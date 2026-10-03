import { fireEvent, render, screen } from '@testing-library/react';
import type { OnsDatasetYearCount } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { OnsCatalogueChart } from './OnsCatalogueChart';

expect.extend(toHaveNoViolations);

const YEAR_COUNTS: OnsDatasetYearCount[] = [
  { year: '2022', datasetCount: 4 },
  { year: '2023', datasetCount: 180 },
  { year: '2024', datasetCount: 130 },
];

describe('OnsCatalogueChart', () => {
  it('names the busiest year in the accessible chart label', () => {
    render(<OnsCatalogueChart yearCounts={YEAR_COUNTS} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/2023 leads with 180/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<OnsCatalogueChart yearCounts={YEAR_COUNTS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the years in a keyboard-reachable table', () => {
    const { container } = render(<OnsCatalogueChart yearCounts={YEAR_COUNTS} />);
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Year' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Datasets' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '2023' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '180' })).toBeInTheDocument();
  });

  it('renders a fallback label for an empty catalogue', () => {
    render(<OnsCatalogueChart yearCounts={[]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/by last-updated year/i);
  });
});
