import { fireEvent, render, screen } from '@testing-library/react';
import type { PlanningDataset } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { buildParetoRows, PlanningDatasetChart } from './PlanningDatasetChart';

expect.extend(toHaveNoViolations);

/** One dataset with only the fields the chart reads. */
function dataset(overrides: Partial<PlanningDataset> = {}): PlanningDataset {
  return {
    dataset: 'listed-building',
    name: 'Listed building',
    entityCount: 382270,
    themes: ['heritage'],
    typology: 'geography',
    phase: 'beta',
    licence: 'ogl3',
    ...overrides,
  };
}

const DATASETS: PlanningDataset[] = [
  dataset({ dataset: 'title-boundary', name: 'Title boundary', entityCount: 22740586 }),
  dataset(),
];

describe('buildParetoRows', () => {
  it('adds each dataset share and the running share of the catalogue', () => {
    const rows = buildParetoRows(
      [
        dataset({ dataset: 'a', name: 'A', entityCount: 40 }),
        dataset({ dataset: 'b', name: 'B', entityCount: 10 }),
      ],
      100,
    );
    expect(rows).toEqual([
      { dataset: 'a', name: 'A', entityCount: 40, share: 40, cumulativeShare: 40 },
      { dataset: 'b', name: 'B', entityCount: 10, share: 10, cumulativeShare: 50 },
    ]);
  });

  it('keeps the shares at zero when the catalogue holds no records', () => {
    const rows = buildParetoRows([dataset({ dataset: 'a', name: 'A', entityCount: 0 })], 0);
    expect(rows[0]?.share).toBe(0);
    expect(rows[0]?.cumulativeShare).toBe(0);
  });
});

describe('PlanningDatasetChart', () => {
  it('names the leading dataset in the accessible chart label', () => {
    render(<PlanningDatasetChart datasets={DATASETS} totalEntityCount={25355887} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Title boundary leads with 22,740,586/);
  });

  it('renders a fallback label for an empty catalogue', () => {
    render(<PlanningDatasetChart datasets={[]} totalEntityCount={0} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/planning datasets by number of records/i);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PlanningDatasetChart datasets={DATASETS} totalEntityCount={25355887} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the largest datasets in a keyboard-reachable table', () => {
    const { container } = render(
      <PlanningDatasetChart datasets={DATASETS} totalEntityCount={25355887} />,
    );
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Dataset' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Records' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Title boundary' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '22,740,586' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '89.7%' })).toBeInTheDocument();
  });
});
