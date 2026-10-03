'use client';

import type { PlanningDataset } from '@uk-open-data-connectors/uk-sources';
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface PlanningDatasetChartProps {
  /** The datasets holding the most records, largest first. */
  datasets: PlanningDataset[];
  /** Records across the whole catalogue, which the running share is of. */
  totalEntityCount: number;
}

/** One bar: a dataset, its records, and its running share of the catalogue. */
interface ParetoRow {
  dataset: string;
  name: string;
  entityCount: number;
  /** Share of all records held by this dataset and the ones above it, as a percentage. */
  cumulativeShare: number;
  /** Share of all records held by this dataset alone, as a percentage. */
  share: number;
}

/** Rounds a percentage to one decimal place, e.g. 89.7. */
function roundShare(share: number): number {
  return Math.round(share * 10) / 10;
}

/**
 * Adds the running share of the catalogue to each dataset, largest first.
 *
 * @param datasets - the largest datasets, largest first
 * @param totalEntityCount - records across the whole catalogue
 * @returns one row per dataset, with its own share and the running share
 */
export function buildParetoRows(
  datasets: PlanningDataset[],
  totalEntityCount: number,
): ParetoRow[] {
  let runningCount = 0;
  return datasets.map((dataset) => {
    runningCount += dataset.entityCount;
    const share = totalEntityCount === 0 ? 0 : (dataset.entityCount / totalEntityCount) * 100;
    const cumulativeShare = totalEntityCount === 0 ? 0 : (runningCount / totalEntityCount) * 100;
    return {
      dataset: dataset.dataset,
      name: dataset.name,
      entityCount: dataset.entityCount,
      cumulativeShare: roundShare(cumulativeShare),
      share: roundShare(share),
    };
  });
}

/** Formats a percentage for the tooltip and the table, e.g. "89.7%". */
function formatShare(share: number): string {
  return `${share.toFixed(1)}%`;
}

/** Tooltip shown while hovering (mouse) or scrubbing (touch) the chart. */
function PlanningDatasetTooltip({
  active,
  payload,
}: TooltipContentProps): React.ReactElement | null {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as ParetoRow | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="planning-dataset-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">{row.name}</p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.entityCount)} records, {formatShare(row.share)} of them all
      </p>
    </div>
  );
}

/**
 * Pareto chart of the datasets holding the most records: a bar per dataset and
 * a line for the running share of the catalogue, so one dataset carrying most
 * of the records is visible at a glance.
 */
export function PlanningDatasetChart({
  datasets,
  totalEntityCount,
}: PlanningDatasetChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rows = buildParetoRows(datasets, totalEntityCount);
  const leader = rows[0];

  const label =
    leader === undefined
      ? 'Planning datasets by number of records'
      : `Planning datasets by number of records: ${leader.name} leads with ${formatCount(leader.entityCount)}`;

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
      <div style={{ height: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            role="img"
            aria-label={label}
            data={rows}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <XAxis
              dataKey="name"
              interval={0}
              height={96}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: 'var(--color-muted)',
                fontSize: 10,
                angle: -35,
                textAnchor: 'end',
              }}
            />
            <YAxis
              yAxisId="records"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatCount(value)}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <YAxis
              yAxisId="share"
              orientation="right"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${String(value)}%`}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <Tooltip content={PlanningDatasetTooltip} cursor={{ fill: 'var(--color-border)' }} />
            <Bar
              yAxisId="records"
              dataKey="entityCount"
              isAnimationActive={!prefersReducedMotion}
              fill="var(--color-fg)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="share"
              dataKey="cumulativeShare"
              isAnimationActive={!prefersReducedMotion}
              stroke="var(--color-muted)"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartExplain>
        Each bar is one dataset, and the line is the share of all the platform's records held by
        that dataset and the ones before it. A line that jumps on the first bar means one dataset
        carries most of the records.
      </ChartExplain>
      <ChartDataTable
        summary="View the largest datasets as a table"
        columns={[
          { key: 'name', header: 'Dataset' },
          { key: 'entityCount', header: 'Records', format: (value) => formatCount(Number(value)) },
          {
            key: 'share',
            header: 'Share of all records',
            format: (value) => formatShare(Number(value)),
          },
        ]}
        rows={rows}
      />
    </div>
  );
}
