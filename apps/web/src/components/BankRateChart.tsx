'use client';

import type { BankRateSpell } from '@uk-open-data-connectors/uk-sources';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount, formatIsoDateLong, formatRatePercent } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface BankRateChartProps {
  /** Runs at one level, oldest first. */
  spells: BankRateSpell[];
  /** The last day the series covers, so the closing step reaches the edge. */
  latestDate: string;
}

/** One point on the step line: the day a run began, and the level it held. */
export interface BankRateStepRow {
  /** Decimal year of the run's first day, for the numeric time axis. */
  x: number;
  startDate: string;
  endDate: string;
  ratePercent: number;
  dayCount: number;
}

/** Milliseconds in a day, for turning a date into a point on the axis. */
const MILLISECONDS_PER_DAY = 86_400_000;

/** How often the time axis is labelled. */
const AXIS_YEARS_PER_TICK = 10;

/**
 * Turns an ISO date into a decimal year, e.g. "1975-01-02" to 1975.003.
 *
 * The x axis is numeric so the gaps in the series read as time rather than as
 * evenly spaced steps.
 *
 * @param isoDate - the date as YYYY-MM-DD
 * @returns the point on the axis that date sits at
 */
export function yearFractionFor(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const startOfYear = Date.parse(`${isoDate.slice(0, 4)}-01-01T00:00:00Z`);
  const startOfNextYear = Date.parse(`${String(year + 1)}-01-01T00:00:00Z`);
  const daysIntoYear = (Date.parse(`${isoDate}T00:00:00Z`) - startOfYear) / MILLISECONDS_PER_DAY;
  const daysInYear = (startOfNextYear - startOfYear) / MILLISECONDS_PER_DAY;
  return year + daysIntoYear / daysInYear;
}

/**
 * Flattens the runs into the points a step line needs, plus one closing point
 * so the final level runs to the end of the series.
 *
 * @param spells - runs at one level, oldest first
 * @param latestDate - the last day the series covers
 * @returns one point per run, and a closing point on the last day
 */
export function buildBankRateStepRows(
  spells: BankRateSpell[],
  latestDate: string,
): BankRateStepRow[] {
  const rows = spells.map(toStepRow);
  const last = rows.at(-1);
  if (last !== undefined && yearFractionFor(latestDate) > last.x) {
    rows.push({ ...last, x: yearFractionFor(latestDate) });
  }
  return rows;
}

/**
 * Turns one run into a point on the step line.
 *
 * @param spell - a run at one level
 * @returns the run as a chart row, placed at its first day
 */
function toStepRow(spell: BankRateSpell): BankRateStepRow {
  return {
    x: yearFractionFor(spell.startDate),
    startDate: spell.startDate,
    endDate: spell.endDate,
    ratePercent: spell.ratePercent,
    dayCount: spell.dayCount,
  };
}

/** Tooltip shown while hovering (mouse) or scrubbing (touch) the chart. */
function BankRateTooltip({ active, payload }: TooltipContentProps): React.ReactElement | null {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as BankRateStepRow | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="bank-rate-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">
        {formatRatePercent(row.ratePercent)}
      </p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatIsoDateLong(row.startDate)} to {formatIsoDateLong(row.endDate)}
      </p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.dayCount)} days at this level
      </p>
    </div>
  );
}

/** Labelled year ticks across the span the series covers. */
function buildAxisTicks(rows: BankRateStepRow[]): number[] {
  const first = rows[0];
  const last = rows.at(-1);
  if (first === undefined || last === undefined) {
    return [];
  }
  const ticks: number[] = [];
  for (
    let year = Math.ceil(first.x / AXIS_YEARS_PER_TICK) * AXIS_YEARS_PER_TICK;
    year <= last.x;
    year += AXIS_YEARS_PER_TICK
  ) {
    ticks.push(year);
  }
  return ticks;
}

/**
 * Step line of the official Bank Rate since 1975: one flat run per level the
 * rate held, so the long holds and the sharp moves both read at once.
 */
export function BankRateChart({ spells, latestDate }: BankRateChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rows = buildBankRateStepRows(spells, latestDate);
  const first = rows[0];
  const last = rows.at(-1);
  const rates = rows.map((row) => row.ratePercent);
  const highest = rates.length === 0 ? 0 : Math.max(...rates);
  const lowest = rates.length === 0 ? 0 : Math.min(...rates);

  const label =
    first === undefined || last === undefined
      ? 'Bank Rate by business day since 1975'
      : `Bank Rate by business day from ${String(Math.floor(first.x))} to ${String(Math.floor(last.x))}: ${formatRatePercent(highest)} at its highest and ${formatRatePercent(lowest)} at its lowest`;

  if (rows.length === 0) {
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
      <div style={{ height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            role="img"
            aria-label={label}
            data={rows}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <XAxis
              type="number"
              dataKey="x"
              domain={['dataMin', 'dataMax']}
              ticks={buildAxisTicks(rows)}
              tickFormatter={(value: number) => String(Math.round(value))}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <YAxis
              type="number"
              domain={[0, Math.ceil(highest)]}
              tickFormatter={(value: number) => `${String(value)}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <Tooltip content={BankRateTooltip} cursor={{ stroke: 'var(--color-border)' }} />
            <Line
              type="stepAfter"
              dataKey="ratePercent"
              stroke="var(--accent-indigo-fg)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={!prefersReducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartExplain>
        The line steps between levels rather than sliding, because the rate only moves when the
        Bank's Monetary Policy Committee decides it should. A flat run is a hold, and each step is
        one decision.
      </ChartExplain>
      <ChartDataTable
        summary="View the runs at each level as a table"
        columns={[
          {
            key: 'startDate',
            header: 'From',
            format: (value) => formatIsoDateLong(String(value)),
          },
          { key: 'endDate', header: 'To', format: (value) => formatIsoDateLong(String(value)) },
          {
            key: 'ratePercent',
            header: 'Bank Rate',
            format: (value) => formatRatePercent(Number(value)),
          },
          { key: 'dayCount', header: 'Days', format: (value) => formatCount(Number(value)) },
        ]}
        rows={spells.map(toStepRow)}
      />
    </div>
  );
}
