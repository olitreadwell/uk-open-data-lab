'use client';

import type {
  ParliamentPartySeats,
  ParliamentSeatSummary,
} from '@uk-open-data-connectors/uk-sources';

import { formatCount } from '@/lib/uk-format';

import { ChartDataTable } from './ChartDataTable';
import type { ChartDataColumn } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface ParliamentSeatsChartProps {
  /** The Commons seat counts, parties largest first. */
  summary: ParliamentSeatSummary;
}

/** One square on the waffle: one seat, with the party that holds it. */
export interface ParliamentSeatCell {
  partyId: number;
  partyName: string;
  /** CSS colour for the square, or null when the party publishes none. */
  colour: string | null;
}

/** One row of the seat table, with the share worked out. */
export interface ParliamentSeatRow {
  name: string;
  seatCount: number;
  share: string;
  women: number;
  men: number;
}

/** Columns of the waffle: 26 squares per row, 25 rows for a 650-seat house. */
const WAFFLE_COLUMNS = 26;

/** Colour used for a square when the party publishes none of its own. */
const FALLBACK_SEAT_COLOUR = 'var(--color-muted)';

/** The colour the API publishes, as a CSS hex, or null when it publishes none. */
function seatColourFor(party: ParliamentPartySeats['party']): string | null {
  return party.backgroundColour === null ? null : `#${party.backgroundColour}`;
}

/**
 * Flattens the seat counts into one square per seat, parties largest first.
 *
 * @param seats - the Commons seat counts, parties largest first
 * @returns one cell per seat, in the order the squares are drawn
 */
export function buildParliamentSeatCells(seats: ParliamentPartySeats[]): ParliamentSeatCell[] {
  const cells: ParliamentSeatCell[] = [];
  for (const entry of seats) {
    for (let seat = 0; seat < entry.seatCount; seat += 1) {
      cells.push({
        partyId: entry.party.id,
        partyName: entry.party.name,
        colour: seatColourFor(entry.party),
      });
    }
  }
  return cells;
}

/**
 * Turns the seat counts into the rows the text table shows.
 *
 * @param seats - the Commons seat counts, parties largest first
 * @param seatCount - the house total, for the share column
 * @returns one row per party, with its share of the house
 */
export function buildParliamentSeatRows(
  seats: ParliamentPartySeats[],
  seatCount: number,
): ParliamentSeatRow[] {
  return seats.map((entry) => ({
    name: entry.party.name,
    seatCount: entry.seatCount,
    share: seatCount === 0 ? '0%' : `${((entry.seatCount / seatCount) * 100).toFixed(1)}%`,
    women: entry.femaleCount,
    men: entry.maleCount,
  }));
}

/**
 * One square per seat, coloured by the party that holds it, so the size of a
 * party's block is the seats it holds. The table under the chart carries the
 * numbers and the parties without a colour of their own.
 */
export function ParliamentSeatsChart({ summary }: ParliamentSeatsChartProps): React.ReactElement {
  const cells = buildParliamentSeatCells(summary.seats);
  const rows = buildParliamentSeatRows(summary.seats, summary.seatCount);
  const largest = summary.largestParty;
  const label =
    cells.length === 0
      ? 'House of Commons seats by party'
      : `House of Commons seats by party: ${largest.party.name} holds ${formatCount(largest.seatCount)} of ${formatCount(summary.seatCount)}`;

  if (cells.length === 0) {
    return (
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 720 240"
        className="mx-auto h-auto max-h-[clamp(320px,46vh,560px)] w-full"
      >
        <title>{label}</title>
      </svg>
    );
  }

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        data-testid="parliament-waffle"
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${String(WAFFLE_COLUMNS)}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => (
          <span
            // The squares are presentational: the label above and the table
            // below carry every number for anyone not reading the colours.
            key={`${String(cell.partyId)}-${String(index)}`}
            aria-hidden="true"
            data-party={cell.partyName}
            className="aspect-square rounded-[1px]"
            style={{ backgroundColor: cell.colour ?? FALLBACK_SEAT_COLOUR }}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {summary.seats.map((entry) => (
          <li key={entry.party.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-[2px] border border-[var(--color-border)]"
              style={{ backgroundColor: seatColourFor(entry.party) ?? FALLBACK_SEAT_COLOUR }}
            />
            <span className="numeral-paragraph-sm text-[var(--color-muted)]">
              {entry.party.name} ({formatCount(entry.seatCount)})
            </span>
          </li>
        ))}
      </ul>
      <ChartExplain>
        Each square is one seat and the colour is the party, so the size of a party's block is the
        seats it holds. The table below carries the numbers, including the parties that publish no
        colour of their own.
      </ChartExplain>
      <ChartDataTable
        summary="View the seats as a table"
        columns={PARLIAMENT_SEAT_COLUMNS}
        rows={rows}
      />
    </div>
  );
}

const PARLIAMENT_SEAT_COLUMNS: ChartDataColumn<ParliamentSeatRow>[] = [
  { key: 'name', header: 'Party' },
  { key: 'seatCount', header: 'Seats', format: (value) => formatCount(Number(value)) },
  { key: 'share', header: 'Share' },
  { key: 'women', header: 'Women', format: (value) => formatCount(Number(value)) },
  { key: 'men', header: 'Men', format: (value) => formatCount(Number(value)) },
];
