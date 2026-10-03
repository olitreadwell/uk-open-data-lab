import { fireEvent, render, screen } from '@testing-library/react';
import type { AncientWoodlandSizeBand } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { AncientWoodlandChart, buildWoodlandBandRows } from './AncientWoodlandChart';

expect.extend(toHaveNoViolations);

/** Two bands in the shape the layer returns them. */
const SIZE_BANDS: AncientWoodlandSizeBand[] = [
  {
    label: 'Under 1 hectare',
    minHectares: 0,
    maxHectares: 1,
    recordCount: 14725,
    categoryCounts: { asnw: 11992, paws: 2701, awp: 32 },
  },
  {
    label: '100 hectares or more',
    minHectares: 100,
    recordCount: 294,
    categoryCounts: { asnw: 105, paws: 189, awp: 0 },
  },
];

describe('buildWoodlandBandRows', () => {
  it('flattens each band into one row per woodland type', () => {
    const rows = buildWoodlandBandRows(SIZE_BANDS);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      label: 'Under 1 hectare',
      asnw: 11992,
      paws: 2701,
      awp: 32,
      recordCount: 14725,
    });
    expect(rows[1]?.paws).toBe(189);
  });
});

describe('AncientWoodlandChart', () => {
  it('names the busiest size band in the accessible chart label', () => {
    render(<AncientWoodlandChart sizeBands={SIZE_BANDS} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Under 1 hectare leads with 14,725/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AncientWoodlandChart sizeBands={SIZE_BANDS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the bands and the woodland types in a keyboard-reachable table', () => {
    const { container } = render(<AncientWoodlandChart sizeBands={SIZE_BANDS} />);
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Size band' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Semi-natural' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Planted' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Under 1 hectare' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2,701' })).toBeInTheDocument();
  });

  it('renders a fallback label for an empty layer', () => {
    render(<AncientWoodlandChart sizeBands={[]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/by size band/i);
  });
});
