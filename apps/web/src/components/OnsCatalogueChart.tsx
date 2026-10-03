'use client';

import type { OnsDatasetYearCount } from '@uk-open-data-connectors/uk-sources';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface OnsCatalogueChartProps {
  yearCounts: OnsDatasetYearCount[];
}

/** Tooltip shown while hovering (mouse) or scrubbing (touch) the chart. */
function OnsCatalogueTooltip({ active, payload }: TooltipContentProps): React.ReactElement | null {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as OnsDatasetYearCount | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="ons-catalogue-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">{row.year}</p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.datasetCount)} datasets
      </p>
    </div>
  );
}

/**
 * Histogram of the ONS catalogue by the year in each record's last-updated
 * stamp. The tallest bar is the year the API stamped most records with.
 */
export function OnsCatalogueChart({ yearCounts }: OnsCatalogueChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const busiest = [...yearCounts].sort((left, right) => right.datasetCount - left.datasetCount)[0];

  const label =
    busiest === undefined
      ? 'ONS dataset records by last-updated year'
      : `ONS dataset records by last-updated year: ${busiest.year} leads with ${busiest.datasetCount}`;

  if (yearCounts.length === 0) {
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
    <div style={{ height: '320px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          role="img"
          aria-label={label}
          data={yearCounts}
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <XAxis
            type="category"
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <YAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <Tooltip content={OnsCatalogueTooltip} cursor={{ fill: 'var(--color-border)' }} />
          <Bar
            dataKey="datasetCount"
            isAnimationActive={!prefersReducedMotion}
            fill="var(--color-fg)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartExplain>
        Taller bars mean more dataset records carry that year in their stamp.
      </ChartExplain>
      <ChartDataTable
        summary="View the years as a table"
        columns={[
          { key: 'year', header: 'Year' },
          {
            key: 'datasetCount',
            header: 'Datasets',
            format: (value) => formatCount(Number(value)),
          },
        ]}
        rows={yearCounts}
      />
    </div>
  );
}
