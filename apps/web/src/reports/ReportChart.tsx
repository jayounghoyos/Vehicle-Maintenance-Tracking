import { useState } from 'react';
import {
  Area,
  AreaChart,
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
  type BarShapeProps,
  type PieSectorShapeProps,
} from 'recharts';

import { AXIS, GRID, colourAt } from './palette';
import type { ChartType, MetricDefinition, ReportPoint } from './metrics';

type Props = {
  points: ReportPoint[];
  type: ChartType;
  metric: MetricDefinition;
  accent: string;
  height?: number;
};

const AXIS_STYLE = { fill: AXIS, fontSize: 11 };
const SERIES = '#ffffff';

/**
 * One component for all four shapes, because every metric answers with
 * the same {label, value} rows.
 *
 * Per-datum colour goes through the shape prop rather than Cell, which
 * is deprecated and goes away in Recharts 4. Animation is left at its
 * default of 'auto', which already honours prefers-reduced-motion.
 */
export function ReportChart({ points, type, metric, accent, height = 240 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

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

  const fill = (index: number) =>
    hovered === index ? accent : colourAt(metric, points[index], index);

  const tooltip = (
    <Tooltip
      cursor={{ fill: 'rgba(255,255,255,.04)' }}
      formatter={(value) => [`${Number(value).toLocaleString()} ${metric.unit}`, '']}
      contentStyle={{
        background: '#141718',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 12,
        fontSize: 13,
      }}
      labelStyle={{ color: '#fff' }}
      itemStyle={{ color: '#8a928e' }}
    />
  );

  if (type === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={points}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="none"
            shape={(props: PieSectorShapeProps) => (
              <Sector {...props} fill={fill(props.index ?? 0)} />
            )}
            onMouseEnter={(_, index) => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          />
          {tooltip}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const axes = (
    <>
      <CartesianGrid stroke={GRID} vertical={false} />
      <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
      <YAxis
        tick={AXIS_STYLE}
        tickLine={false}
        axisLine={false}
        width={44}
        allowDecimals={false}
      />
      {tooltip}
    </>
  );

  // one series is not a category, so it is drawn in white and the accent
  // is kept for the point under the cursor
  const activeDot = { r: 4, fill: accent, stroke: 'none' };

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={points}>
          {axes}
          <Area
            dataKey="value"
            stroke={SERIES}
            strokeWidth={2}
            fill={SERIES}
            fillOpacity={0.08}
            dot={false}
            activeDot={activeDot}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points}>
          {axes}
          <Line
            dataKey="value"
            stroke={SERIES}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={points}>
        {axes}
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          shape={(props: BarShapeProps) => (
            <Rectangle {...props} fill={fill(props.index ?? 0)} />
          )}
          onMouseEnter={(_, index) => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
