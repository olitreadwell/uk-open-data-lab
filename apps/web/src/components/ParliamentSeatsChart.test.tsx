import { fireEvent, render, screen } from '@testing-library/react';
import type { ParliamentSeatSummary } from '@uk-open-data-connectors/uk-sources';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import {
  buildParliamentSeatCells,
  buildParliamentSeatRows,
  ParliamentSeatsChart,
} from './ParliamentSeatsChart';

expect.extend(toHaveNoViolations);

/** A three-party Commons in the shape the Members API returns it. */
const SUMMARY: ParliamentSeatSummary = {
  seatCount: 8,
  partyCount: 3,
  majorityThreshold: 5,
  partiesWithOneSeat: 1,
  largestParty: {
    party: {
      id: 15,
      name: 'Labour',
      abbreviation: 'Lab',
      backgroundColour: 'd50000',
      foregroundColour: 'ffffff',
      isIndependent: false,
    },
    seatCount: 5,
    maleCount: 3,
    femaleCount: 2,
    nonBinaryCount: 0,
    unallocatedSeatCount: 0,
  },
  seats: [
    {
      party: {
        id: 15,
        name: 'Labour',
        abbreviation: 'Lab',
        backgroundColour: 'd50000',
        foregroundColour: 'ffffff',
        isIndependent: false,
      },
      seatCount: 5,
      maleCount: 3,
      femaleCount: 2,
      nonBinaryCount: 0,
      unallocatedSeatCount: 0,
    },
    {
      party: {
        id: 4,
        name: 'Conservative',
        abbreviation: 'Con',
        backgroundColour: '0063ba',
        foregroundColour: 'ffffff',
        isIndependent: false,
      },
      seatCount: 2,
      maleCount: 1,
      femaleCount: 1,
      nonBinaryCount: 0,
      unallocatedSeatCount: 0,
    },
    {
      party: {
        id: 1,
        name: 'Speaker',
        abbreviation: 'Spk',
        backgroundColour: null,
        foregroundColour: null,
        isIndependent: false,
      },
      seatCount: 1,
      maleCount: 1,
      femaleCount: 0,
      nonBinaryCount: 0,
      unallocatedSeatCount: 0,
    },
  ],
};

describe('buildParliamentSeatCells', () => {
  it('draws one square per seat, grouped by party in order', () => {
    const cells = buildParliamentSeatCells(SUMMARY.seats);
    expect(cells).toHaveLength(8);
    expect(cells.filter((cell) => cell.partyName === 'Labour')).toHaveLength(5);
    expect(cells[0]?.colour).toBe('#d50000');
    expect(cells[7]?.colour).toBeNull();
  });
});

describe('buildParliamentSeatRows', () => {
  it('works out each party share of the house', () => {
    const rows = buildParliamentSeatRows(SUMMARY.seats, SUMMARY.seatCount);
    expect(rows[0]).toEqual({
      name: 'Labour',
      seatCount: 5,
      share: '62.5%',
      women: 2,
      men: 3,
    });
  });
});

describe('ParliamentSeatsChart', () => {
  it('names the largest party in the accessible chart label', () => {
    render(<ParliamentSeatsChart summary={SUMMARY} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Labour holds 5 of 8/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ParliamentSeatsChart summary={SUMMARY} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exposes the parties and their seats in a keyboard-reachable table', () => {
    const { container } = render(<ParliamentSeatsChart summary={SUMMARY} />);
    const summary = container.querySelector('summary');
    if (summary === null) {
      throw new Error('Expected a chart data table summary');
    }
    fireEvent.click(summary);
    expect(screen.getByRole('columnheader', { name: 'Party' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Women' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Labour' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '62.5%' })).toBeInTheDocument();
  });

  it('renders a fallback label for an empty house', () => {
    render(
      <ParliamentSeatsChart
        summary={{ ...SUMMARY, seatCount: 0, partyCount: 0, seats: [], partiesWithOneSeat: 0 }}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(/seats by party/i);
  });
});
