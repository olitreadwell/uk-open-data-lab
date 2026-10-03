import { fireEvent, render, screen } from '@testing-library/react';
import type { FoodHygieneAuthority } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { FoodHygieneRegistersChart } from './FoodHygieneRegistersChart';

expect.extend(toHaveNoViolations);

function register(localAuthorityName: string, establishmentCount: number): FoodHygieneAuthority {
  return {
    localAuthorityId: 1,
    localAuthorityCode: '001',
    localAuthorityName,
    establishmentCount,
    scheme: 'fhrs',
  };
}

const REGISTERS: FoodHygieneAuthority[] = [
  register('Birmingham', 10239),
  register('Leeds', 7428),
  register('Glasgow City', 6632),
];

describe('FoodHygieneRegistersChart', () => {
  it('names the largest register in the accessible chart label', () => {
    render(<FoodHygieneRegistersChart registers={REGISTERS} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Birmingham leads with 10239/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FoodHygieneRegistersChart registers={REGISTERS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the registers in a keyboard-reachable table', () => {
    const { container } = render(<FoodHygieneRegistersChart registers={REGISTERS} />);
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Establishments' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Birmingham' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '10,239' })).toBeInTheDocument();
  });

  it('renders a fallback label for an empty register list', () => {
    render(<FoodHygieneRegistersChart registers={[]} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/by number of establishments/i);
  });
});
