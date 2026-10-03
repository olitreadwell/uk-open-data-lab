'use client';

import type { PoliceCategoryCount, PoliceMonthCount } from '@uk-open-data-connectors/uk-sources';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount, formatIsoMonthShort } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

/** How many crime types get a colour of their own; the rest share one band. */
const LEADING_CATEGORY_COUNT = 5;

/** Column key the crime types outside the leading group are counted under. */
const OTHER_TYPES_KEY = 'otherTypes';

/** One colour per leading crime type, in rank order. */
const CATEGORY_FILLS = [
  'var(--accent-violet-fg)',
  'var(--accent-indigo-fg)',
  'var(--accent-sky-fg)',
  'var(--accent-teal-fg)',
  'var(--accent-amber-fg)',
] as const;

interface PoliceCrimeChartProps {
  /** Published months, oldest first. */
  months: PoliceMonthCount[];
  /** Offence counts across the whole window, biggest crime type first. */
  categoryCounts: PoliceCategoryCount[];
  /** The place the window counts around, e.g. "Leeds city centre". */
  locationLabel: string;
}

/** One column: a published month, with a count behind every band it carries. */
export interface PoliceCrimeMonthRow {
  month: string;
  monthLabel: string;
  total: number;
  [categorySlug: string]: string | number;
}

/** One row of the table behind the chart: a crime type and its share. */
interface PoliceCrimeTableRow {
  name: string;
  recordCount: number;
  share: string;
}

/**
 * Flattens the months into one row per column, with the leading crime types as
 * their own bands and everything else added up behind them.
 *
 * @param months - published months, oldest first
 * @param categoryCounts - offence counts across the window, biggest first
 * @returns one row per month, with a key per leading crime type
 */
export function buildPoliceCrimeMonthRows(
  months: PoliceMonthCount[],
  categoryCounts: PoliceCategoryCount[],
): PoliceCrimeMonthRow[] {
  const leading = categoryCounts.slice(0, LEADING_CATEGORY_COUNT);
  return months.map((month) => {
    const countsBySlug = new Map(
      month.categoryCounts.map((count) => [count.slug, count.recordCount]),
    );
    const row: PoliceCrimeMonthRow = {
      month: month.month,
      monthLabel: formatIsoMonthShort(month.month),
      total: month.recordCount,
    };
    let leadingRecordCount = 0;
    for (const category of leading) {
      const recordCount = countsBySlug.get(category.slug) ?? 0;
      row[category.slug] = recordCount;
      leadingRecordCount += recordCount;
    }
    row[OTHER_TYPES_KEY] = month.recordCount - leadingRecordCount;
    return row;
  });
}

/**
 * Turns the window's crime type counts into table rows, with each type's share
 * of the offences counted.
 *
 * @param categoryCounts - offence counts across the window, biggest first
 * @returns one row per crime type, with its share as a percentage
 */
export function buildPoliceCrimeTableRows(
  categoryCounts: PoliceCategoryCount[],
): PoliceCrimeTableRow[] {
  const total = categoryCounts.reduce((sum, category) => sum + category.recordCount, 0);
  return categoryCounts.map((category) => ({
    name: category.name,
    recordCount: category.recordCount,
    share: total === 0 ? '0%' : `${((category.recordCount / total) * 100).toFixed(1)}%`,
  }));
}

/**
 * Builds the tooltip shown while hovering (mouse) or scrubbing (touch) the
 * chart. Recharts calls this with its own tooltip props, so the crime types
 * the chart stacks are passed in alongside them.
 *
 * @param props - recharts tooltip props
 * @param leading - the crime types the chart gives a band of their own
 * @returns the tooltip for the hovered column, or nothing
 */
function renderPoliceCrimeTooltip(
  props: TooltipContentProps,
  leading: PoliceCategoryCount[],
): React.ReactElement | null {
  const { active, payload } = props;
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as PoliceCrimeMonthRow | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="recorded-crime-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">
        {row.monthLabel}: {formatCount(row.total)} offences
      </p>
      {leading.map((category) => (
        <p
          key={category.slug}
          className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]"
        >
          {category.name}: {formatCount(Number(row[category.slug]))}
        </p>
      ))}
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        Other crime types: {formatCount(Number(row[OTHER_TYPES_KEY]))}
      </p>
    </div>
  );
}

/**
 * Recorded crime within a mile of one point, month by month: one column per
 * published month with the crime types stacked inside it, so the steady mix
 * and the moving monthly totals read at once.
 */
export function PoliceCrimeChart({
  months,
  categoryCounts,
  locationLabel,
}: PoliceCrimeChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rows = buildPoliceCrimeMonthRows(months, categoryCounts);
  const leading = categoryCounts.slice(0, LEADING_CATEGORY_COUNT);
  const recordCount = months.reduce((sum, month) => sum + month.recordCount, 0);
  const topCategory = categoryCounts[0];

  const label =
    topCategory === undefined
      ? `Recorded crime within a mile of ${locationLabel}, by month`
      : `Recorded crime within a mile of ${locationLabel}, by month: ${formatCount(recordCount)} offences across ${String(months.length)} months, ${topCategory.name} leading with ${formatCount(topCategory.recordCount)}`;

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
    <div style={{ height: '360px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          role="img"
          aria-label={label}
          data={rows}
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <XAxis
            type="category"
            dataKey="monthLabel"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
          />
          <YAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <Tooltip
            content={(props) => renderPoliceCrimeTooltip(props, leading)}
            cursor={{ fill: 'var(--color-border)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-muted)' }} />
          {leading.map((category, index) => (
            <Bar
              key={category.slug}
              dataKey={category.slug}
              name={category.name}
              stackId="recorded-crime"
              fill={CATEGORY_FILLS[index] ?? 'var(--color-muted)'}
              isAnimationActive={!prefersReducedMotion}
            />
          ))}
          <Bar
            dataKey={OTHER_TYPES_KEY}
            name="Other crime types"
            stackId="recorded-crime"
            fill="var(--color-muted)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!prefersReducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartExplain>
        Each column is one published month and the colours stacked inside it are the crime types.
        The same two bands run through every column, so the mix stays steady while the monthly
        totals move.
      </ChartExplain>
      <ChartDataTable
        summary="View the crime types as a table"
        columns={[
          { key: 'name', header: 'Crime type' },
          { key: 'recordCount', header: 'Offences', format: (value) => formatCount(Number(value)) },
          { key: 'share', header: 'Share of the window' },
        ]}
        rows={buildPoliceCrimeTableRows(categoryCounts)}
      />
    </div>
  );
}
