import { useId, useState } from 'react';
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Treemap,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  matchByDataKey,
  type BarShapeProps,
  type PieSectorShapeProps,
} from 'recharts';

import { readableOn } from '../lib/brand';
import { AXIS, DIMMED, GRID, RESTING, hueAt, sliceOpacity, withAlpha } from './palette';
import type { ChartType, MetricDefinition, ReportPoint } from './metrics';

type Props = {
  points: ReportPoint[];
  type: ChartType;
  metric: MetricDefinition;
  accent: string;
  height?: number;
};

const TICK = { fill: AXIS, fontSize: 11 };

/**
 * Recharts pairs old points with new ones by array position by default,
 * and its own docs say that when the array shrinks "some old points are
 * skipped" — which is why widening the range animated and narrowing it
 * jumped. Matching on the key each row already carries means the months
 * that survive the change slide to their new places and the rest leave.
 */
const MATCH = matchByDataKey('key');

/**
 * One component for all four shapes, because every metric answers with
 * the same {label, value} rows.
 *
 * Per-datum colour goes through the shape prop rather than Cell, which
 * the installed version marks deprecated. Animation is left at its
 * default of 'auto', which already honours prefers-reduced-motion.
 */
export function ReportChart({ points, type, metric, accent, height = 240 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gradient = useId();

  if (points.length === 0 || points.every((point) => point.value === 0)) {
    return (
      <p
        className="flex items-center justify-center text-body text-ink-muted"
        style={{ height }}
      >
        Nothing recorded in this range.
      </p>
    );
  }

  // at rest the whole series sits just under full strength, so pointing
  // at one lifts it and drops the others
  const opacity = (index: number) =>
    hovered === null ? RESTING : hovered === index ? 1 : DIMMED;

  // the ring separates its own slices; bars are already apart on the axis
  const sliceAt = (index: number) =>
    hovered === null
      ? metric.tone === 'state'
        ? RESTING
        : sliceOpacity(index, points.length)
      : hovered === index
        ? 1
        : DIMMED;

  const tooltip = (
    <Tooltip
      cursor={false}
      // one series, so the name is dropped rather than shown as "value"
      formatter={(value) => [`${Number(value).toLocaleString()} ${metric.unit}`, '']}
      separator=""
      contentStyle={{
        background: '#141718',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 12,
        fontSize: 13,
        padding: '8px 12px',
      }}
      labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 2 }}
      itemStyle={{ color: '#8a928e', padding: 0 }}
    />
  );

  if (type === 'radial') {
    // outermost ring is the first row, so the reading order matches a list
    const ring = points
      .map((point, index) => ({
        ...point,
        fill: withAlpha(hueAt(metric, point, accent), sliceAt(index)),
      }))
      .reverse();
    return (
      <div className="flex flex-wrap items-center gap-6" style={{ minHeight: height }}>
        <div style={{ width: height, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={ring}
              innerRadius="25%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                animationMatchBy={MATCH}
                background={{ fill: 'rgba(255,255,255,.04)' }}
                cornerRadius={6}
                onMouseEnter={(_, index) => setHovered(points.length - 1 - index)}
                onMouseLeave={() => setHovered(null)}
              />
              {tooltip}
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <Legend
          points={points}
          metric={metric}
          accent={accent}
          hovered={hovered}
          onHover={setHovered}
          opacity={sliceAt}
        />
      </div>
    );
  }

  if (type === 'radar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={points} outerRadius="78%">
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey="label" tick={TICK} />
          <Radar
            dataKey="value"
            animationMatchBy={MATCH}
            stroke={accent}
            strokeWidth={2}
            fill={accent}
            fillOpacity={0.22}
            dot={{ r: 3, fill: accent, stroke: 'none' }}
          />
          {tooltip}
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'treemap') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={points}
          dataKey="value"
          stroke="#141718"
          animationDuration={400}
          content={
            <TreemapTile
              metric={metric}
              points={points}
              accent={accent}
              opacity={sliceAt}
            />
          }
        >
          {tooltip}
        </Treemap>
      </ResponsiveContainer>
    );
  }

  if (type === 'donut') {
    return (
      <div className="flex flex-wrap items-center gap-6" style={{ minHeight: height }}>
        <div style={{ width: height, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={points}
                dataKey="value"
                animationMatchBy={MATCH}
                nameKey="label"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="none"
                shape={(props: PieSectorShapeProps) => {
                  const index = props.index ?? 0;
                  return (
                    <Sector
                      {...props}
                      fill={hueAt(metric, points[index], accent)}
                      fillOpacity={sliceAt(index)}
                    />
                  );
                }}
                onMouseEnter={(_, index) => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
              {tooltip}
            </PieChart>
          </ResponsiveContainer>
        </div>

        <Legend
          points={points}
          metric={metric}
          accent={accent}
          hovered={hovered}
          onHover={setHovered}
          opacity={sliceAt}
        />
      </div>
    );
  }

  const axes = (
    <>
      <CartesianGrid stroke={GRID} vertical={false} />
      <XAxis
        dataKey="label"
        tick={TICK}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
        minTickGap={8}
      />
      <YAxis
        tick={TICK}
        tickLine={false}
        axisLine={false}
        width={44}
        allowDecimals={false}
      />
      {tooltip}
    </>
  );

  const bars = (
    <Bar
      dataKey="value"
      animationMatchBy={MATCH}
      radius={type === 'row' ? [0, 6, 6, 0] : [6, 6, 0, 0]}
      maxBarSize={type === 'row' ? 30 : 56}
      shape={(props: BarShapeProps) => {
        const index = props.index ?? 0;
        return (
          <Rectangle
            {...props}
            fill={hueAt(metric, points[index], accent)}
            fillOpacity={opacity(index)}
          />
        );
      }}
      onMouseEnter={(_, index) => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
    />
  );

  /* Sideways, for the long labels a plate or a person's name gives.
     Height follows the row count so the bars keep their weight. */
  if (type === 'row') {
    return (
      <ResponsiveContainer
        width="100%"
        height={Math.max(height, points.length * 42 + 24)}
      >
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 16 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={128}
          />
          {tooltip}
          {bars}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area' || type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={points} margin={{ top: 8, right: 8 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area
              dataKey="value"
              animationMatchBy={MATCH}
              stroke={accent}
              strokeWidth={2}
              fill={`url(#${gradient})`}
              dot={false}
              activeDot={{ r: 4, fill: accent, stroke: '#141718', strokeWidth: 2 }}
            />
          </AreaChart>
        ) : (
          <LineChart data={points} margin={{ top: 8, right: 8 }}>
            {axes}
            <Line
              dataKey="value"
              animationMatchBy={MATCH}
              stroke={accent}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: accent, stroke: '#141718', strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={points} margin={{ top: 8, right: 8 }}>
        {axes}
        {bars}
      </BarChart>
    </ResponsiveContainer>
  );
}

type LegendProps = {
  points: ReportPoint[];
  metric: MetricDefinition;
  accent: string;
  hovered: number | null;
  onHover: (index: number | null) => void;
  opacity: (index: number) => number;
};

/** A ring with no numbers beside it is decoration. */
function Legend({ points, metric, accent, hovered, onHover, opacity }: LegendProps) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  return (
    <dl className="min-w-0 flex-1 space-y-2 sm:max-w-xs">
      {points.map((point, index) => (
        <div
          key={point.key}
          className="flex items-baseline gap-2.5 transition-opacity"
          // the ramp belongs to the dot; dimming the words with it would
          // make the last row of a long legend unreadable
          style={{ opacity: hovered === null || hovered === index ? 1 : 0.45 }}
          onMouseEnter={() => onHover(index)}
          onMouseLeave={() => onHover(null)}
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: hueAt(metric, point, accent), opacity: opacity(index) }}
          />
          <dt className="min-w-0 flex-1 truncate text-body text-ink-muted">
            {point.label}
          </dt>
          <dd className="text-body font-semibold tabular-nums">
            {point.value.toLocaleString()}
            {total > 0 && (
              <span className="ml-1.5 text-[12px] font-normal text-ink-muted">
                {Math.round((point.value / total) * 100)}%
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type TileProps = {
  metric: MetricDefinition;
  points: ReportPoint[];
  accent: string;
  opacity: (index: number) => number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
};

/** Labels only where a tile is big enough to hold them. */
function TreemapTile({
  metric,
  points,
  accent,
  opacity,
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
}: TileProps) {
  const point = points[index];
  if (!point) return null;
  const roomy = width > 72 && height > 44;
  // derived, never chosen: a dark client accent would swallow dark ink
  const ink = readableOn(hueAt(metric, point, accent));
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={hueAt(metric, point, accent)}
        fillOpacity={opacity(index)}
        stroke="#141718"
        strokeWidth={2}
      />
      {roomy && (
        <>
          <text x={x + 12} y={y + 24} fill={ink} fontSize={12} fontWeight={600}>
            {point.label}
          </text>
          <text x={x + 12} y={y + 42} fill={ink} fontSize={16} fontWeight={700}>
            {point.value.toLocaleString()}
          </text>
        </>
      )}
    </g>
  );
}
