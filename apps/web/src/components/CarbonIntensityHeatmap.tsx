import type { CarbonIntensityBandCount } from '@uk-open-data-connectors/uk-sources';

import type { CarbonIntensityDay, CarbonIntensitySlotProfile } from '@/lib/carbon-intensity-data';
import {
  buildCarbonIntensityTableRows,
  CARBON_INTENSITY_BAND_FILLS,
} from '@/lib/carbon-intensity-data';
import { formatCount } from '@/lib/uk-format';

import { ChartDataTable } from './ChartDataTable';
import { ChartExplain } from './ChartNotes';

/** The window's own totals, which the chart's summary sentence and key use. */
export interface CarbonIntensityChartSummary {
  periodCount: number;
  averageIntensity: number;
  lowestIntensity: number;
  highestIntensity: number;
  bandCounts: CarbonIntensityBandCount[];
}

interface CarbonIntensityHeatmapProps {
  /** One row per UK day, oldest first, each with 48 half-hour slots. */
  days: CarbonIntensityDay[];
  /** The same readings averaged down each half hour of the day. */
  profile: CarbonIntensitySlotProfile[];
  summary: CarbonIntensityChartSummary;
}

/** Width of one half-hour cell, in the SVG's own units. */
const CELL_WIDTH = 13;

/** Height of one day's row, in the SVG's own units. */
const ROW_HEIGHT = 14;

/** Width kept clear on the left for the day labels. */
const DAY_LABEL_WIDTH = 68;

/** Height kept clear above the grid for the half-hour labels. */
const HOUR_LABEL_HEIGHT = 16;

/** Label every Nth day on the left, so the rows stay readable. */
const DAY_LABEL_EVERY = 5;

/** Label every Nth half hour along the top, which is every two hours. */
const HOUR_LABEL_EVERY = 4;

/** The clock label for one half-hour column, e.g. "09:30". */
function halfHourLabel(slot: number): string {
  const minutes = slot * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`;
}

/**
 * Draws the window as a grid: one row per day, one column per half hour, and
 * each cell filled with the grade the operator gave that reading. The pale
 * band is where the grid ran cleanest.
 */
export function CarbonIntensityHeatmap({
  days,
  profile,
  summary,
}: CarbonIntensityHeatmapProps): React.ReactElement {
  const width = DAY_LABEL_WIDTH + 48 * CELL_WIDTH;
  const height = HOUR_LABEL_HEIGHT + days.length * ROW_HEIGHT;
  const firstDay = days[0];
  const lastDay = days.at(-1);
  const label =
    firstDay === undefined || lastDay === undefined
      ? 'Half-hourly carbon intensity for Great Britain'
      : `Half-hourly carbon intensity for Great Britain: ${formatCount(summary.periodCount)} readings from ${firstDay.label} to ${lastDay.label}, averaging ${String(summary.averageIntensity)} gCO2/kWh, from ${String(summary.lowestIntensity)} at the cleanest half hour to ${String(summary.highestIntensity)} at the dirtiest`;

  return (
    <div>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="mx-auto h-auto w-full max-w-[720px]"
      >
        <title>{label}</title>
        <rect
          x={DAY_LABEL_WIDTH}
          y={HOUR_LABEL_HEIGHT}
          width={48 * CELL_WIDTH}
          height={days.length * ROW_HEIGHT}
          fill="var(--color-border)"
          fillOpacity={0.35}
        />
        {Array.from({ length: 48 }, (_unused, slot) => {
          if (slot % HOUR_LABEL_EVERY !== 0) {
            return null;
          }
          return (
            <text
              key={`hour-${String(slot)}`}
              x={DAY_LABEL_WIDTH + slot * CELL_WIDTH}
              y={HOUR_LABEL_HEIGHT - 4}
              fontSize={9}
              fill="var(--color-muted)"
            >
              {halfHourLabel(slot)}
            </text>
          );
        })}
        {days.map((day, rowIndex) => (
          <g key={day.date}>
            {rowIndex % DAY_LABEL_EVERY === 0 ? (
              <text
                x={DAY_LABEL_WIDTH - 6}
                y={HOUR_LABEL_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT - 5}
                fontSize={9}
                textAnchor="end"
                fill="var(--color-muted)"
              >
                {day.label}
              </text>
            ) : null}
            {day.slots.map((cell, slot) =>
              cell === null ? null : (
                <rect
                  key={`${day.date}-${String(slot)}`}
                  x={DAY_LABEL_WIDTH + slot * CELL_WIDTH + 0.5}
                  y={HOUR_LABEL_HEIGHT + rowIndex * ROW_HEIGHT + 0.5}
                  width={CELL_WIDTH - 1}
                  height={ROW_HEIGHT - 1}
                  rx={1.5}
                  fill={CARBON_INTENSITY_BAND_FILLS[cell.index]}
                >
                  <title>{`${day.label}, ${halfHourLabel(slot)}: ${String(cell.intensity)} gCO2/kWh (${cell.index})`}</title>
                </rect>
              ),
            )}
          </g>
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {summary.bandCounts.map((band) => (
          <li
            key={band.index}
            className="numeral-text-eyebrow flex items-center gap-1 text-[10px] text-[var(--color-muted)]"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: CARBON_INTENSITY_BAND_FILLS[band.index] }}
            />
            {band.index}: {formatCount(band.periodCount)} half hours
          </li>
        ))}
      </ul>
      <ChartExplain>
        Each row is one UK day and each column one half hour, so the pale band is where the grid ran
        cleanest. Every cell takes its colour from the operator's own grade for that reading, and
        hovering a cell gives its figure.
      </ChartExplain>
      <ChartDataTable
        summary="View the half hours as a table"
        columns={[
          { key: 'halfHour', header: 'Half hour' },
          { key: 'average', header: 'Average gCO2/kWh' },
          { key: 'cleanest', header: 'Cleanest' },
          { key: 'dirtiest', header: 'Dirtiest' },
        ]}
        rows={buildCarbonIntensityTableRows(profile)}
      />
    </div>
  );
}
