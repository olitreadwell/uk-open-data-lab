'use client';

import type { FoodHygieneAuthority } from '@uk-open-data-connectors/uk-sources';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { formatCount } from '@/lib/uk-format';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

interface FoodHygieneRegistersChartProps {
  registers: FoodHygieneAuthority[];
}

/** Tooltip shown while hovering (mouse) or scrubbing (touch) the chart. */
function FoodHygieneRegistersTooltip({
  active,
  payload,
}: TooltipContentProps): React.ReactElement | null {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const row = payload[0]?.payload as FoodHygieneAuthority | undefined;
  if (row === undefined) {
    return null;
  }
  return (
    <div
      data-testid="food-hygiene-registers-tooltip"
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
    >
      <p className="numeral-paragraph-sm text-[var(--color-fg)]">{row.localAuthorityName}</p>
      <p className="numeral-text-eyebrow text-[10px] text-[var(--color-muted)]">
        {formatCount(row.establishmentCount)} establishments
      </p>
    </div>
  );
}

/**
 * Horizontal bar chart of the food hygiene registers holding the most
 * establishments. The longest bar is the register with the most outlets.
 */
export function FoodHygieneRegistersChart({
  registers,
}: FoodHygieneRegistersChartProps): React.ReactElement {
  const prefersReducedMotion = usePrefersReducedMotion();
  const largest = registers[0];

  const label =
    largest === undefined
      ? 'Food hygiene registers by number of establishments'
      : `Food hygiene registers by number of establishments: ${largest.localAuthorityName} leads with ${largest.establishmentCount}`;

  if (registers.length === 0) {
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

  const chartHeight = Math.max(240, registers.length * 34);

  return (
    <div style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          role="img"
          aria-label={label}
          data={registers}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="localAuthorityName"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <Tooltip content={FoodHygieneRegistersTooltip} cursor={{ fill: 'var(--color-border)' }} />
          <Bar
            dataKey="establishmentCount"
            isAnimationActive={!prefersReducedMotion}
            fill="var(--color-fg)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartExplain>Longer bars mean more establishments on that register.</ChartExplain>
      <ChartDataTable
        summary="View the registers as a table"
        columns={[
          { key: 'localAuthorityName', header: 'Register' },
          {
            key: 'establishmentCount',
            header: 'Establishments',
            format: (value) => formatCount(Number(value)),
          },
        ]}
        rows={registers}
      />
    </div>
  );
}
