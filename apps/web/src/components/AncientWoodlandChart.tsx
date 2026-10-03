'use client';

import type { AncientWoodlandSizeBand } from '@uk-open-data-connectors/uk-sources';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface AncientWoodlandChartProps {
  /** Size bands from the layer, smallest first. */
  sizeBands: AncientWoodlandSizeBand[];
}

/** One bar: a size band with the three woodland types stacked inside it. */
interface WoodlandBandRow {
  label: string;
  asnw: number;
  paws: number;
  awp: number;
  recordCount: number;
}

/**
 * Flattens the layer's size bands into one row per bar.
 *
 * @param sizeBands - size bands from the layer, smallest first
 * @returns one row per band, with a column per woodland type
 */
export function buildWoodlandBandRows(sizeBands: AncientWoodlandSizeBand[]): WoodlandBandRow[] {
  return sizeBands.map((band) => ({
    label: band.label,
    asnw: band.categoryCounts.asnw,
    paws: band.categoryCounts.paws,
    awp: band.categoryCounts.awp,
    recordCount: band.recordCount,
  }));
}

/** Tooltip shown while hovering (mouse) or scrubbing (touch) the chart. */
function AncientWoodlandTooltip({
  active,
  payload,
}: TooltipContentProps): React.ReactElement | null {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as WoodlandBandRow | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="ancient-woodland-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">{row.label}</p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.recordCount)} records
      </p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.asnw)} semi-natural, {formatCount(row.paws)} planted,{' '}
        {formatCount(row.awp)} wood pasture
      </p>
    </div>
  );
}

/**
 * Stacked bars of England's ancient woodland by size: one bar per size band,
 * with the woodland types stacked inside it, so the shape of the inventory
 * and the planted share of the larger woods read at once.
 */
export function AncientWoodlandChart({ sizeBands }: AncientWoodlandChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rows = buildWoodlandBandRows(sizeBands);
  const largestBand = [...rows].sort((left, right) => right.recordCount - left.recordCount)[0];

  const label =
    largestBand === undefined
      ? 'Ancient woodland records by size band'
      : `Ancient woodland records by size band: ${largestBand.label} leads with ${formatCount(largestBand.recordCount)} records`;

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
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
          />
          <YAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <Tooltip content={AncientWoodlandTooltip} cursor={{ fill: 'var(--color-border)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-muted)' }} />
          <Bar
            dataKey="asnw"
            name="Ancient semi-natural"
            stackId="woodland"
            isAnimationActive={!prefersReducedMotion}
            fill="var(--accent-emerald-fg)"
          />
          <Bar
            dataKey="paws"
            name="Plantation on ancient woodland"
            stackId="woodland"
            isAnimationActive={!prefersReducedMotion}
            fill="var(--accent-amber-fg)"
          />
          <Bar
            dataKey="awp"
            name="Ancient wood pasture"
            stackId="woodland"
            isAnimationActive={!prefersReducedMotion}
            fill="var(--color-muted)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartExplain>
        Each bar is one size band and the colours stacked inside it are the woodland types. Tall
        bars on the left mean the inventory is mostly small woods.
      </ChartExplain>
      <ChartDataTable
        summary="View the size bands as a table"
        columns={[
          { key: 'label', header: 'Size band' },
          { key: 'asnw', header: 'Semi-natural', format: (value) => formatCount(Number(value)) },
          { key: 'paws', header: 'Planted', format: (value) => formatCount(Number(value)) },
          { key: 'awp', header: 'Wood pasture', format: (value) => formatCount(Number(value)) },
          { key: 'recordCount', header: 'Records', format: (value) => formatCount(Number(value)) },
        ]}
        rows={rows}
      />
    </div>
  );
}
