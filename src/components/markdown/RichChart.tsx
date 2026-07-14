"use client";

import React, { useId, useMemo } from "react";
import JSON5 from "json5";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartConfig = {
  type: "bar" | "line" | "pie" | "area" | "radar" | "composed" | "sparkline" | "scatter" | "funnel" | "gauge" | "heatmap" | "waterfall" | "cohort";
  title?: string;
  data: Record<string, string | number>[];
  /** Field used for category labels or the horizontal axis. Defaults to `name`. */
  x?: string;
  /** Field used for the primary numeric series. Defaults to `value`. */
  y?: string;
  keys?: string[];
  colors?: string[];
  lines?: string[];
  bars?: string[];
  areas?: string[];
  max?: number;
};

type TooltipPayloadEntry = { color?: string; name?: string; value?: string | number };

const DEFAULT_COLORS = ["#4F63D9", "#2F9A62", "#9A62C7", "#D8842F", "#D85672"];
const chartHeight = 304;

function uniqueValues(values: readonly string[]) {
  return [...new Set(values)];
}

export function resolveChartFields(config: Pick<ChartConfig, "x" | "y" | "keys" | "bars" | "lines" | "areas">) {
  return {
    xKey: config.x ?? "name",
    seriesKeys: uniqueValues(config.keys?.length ? config.keys : config.y ? [config.y] : ["value"]),
    bars: uniqueValues(config.bars ?? []),
    lines: uniqueValues(config.lines ?? []),
    areas: uniqueValues(config.areas ?? []),
  };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string | number }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-xl border border-black/[0.07] bg-white/95 px-3.5 py-3 shadow-[0_16px_36px_-18px_rgba(18,20,22,0.42)] backdrop-blur-md">
      <p className="mb-2.5 text-xs font-semibold tracking-[-0.01em] text-[#1d1d1f]">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`tooltip-entry-${index}`} className="flex items-center gap-2 text-xs text-[#6e6e73]">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-[#1d1d1f]">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RichChart({ configStr, config: suppliedConfig }: { configStr?: string; config?: ChartConfig }) {
  const chartId = useId().replace(/:/g, "");
  const config = useMemo<ChartConfig | null>(() => {
    try {
      return suppliedConfig ?? JSON5.parse((configStr ?? "").replace(/^`+|`+$/g, "").trim());
    } catch {
      return null;
    }
  }, [configStr, suppliedConfig]);

  if (!config?.data || !config.type) {
    return <div role="alert" className="rich-block-state my-6 px-4 py-3.5 text-sm leading-6 sm:px-5">This chart configuration is incomplete.</div>;
  }

  if (config.data.length === 0) {
    return <section className="rich-block-state my-7 px-4 py-5 sm:px-5" aria-label={config.title || "Chart"}><p className="text-sm font-semibold text-[#1d1d1f]">{config.title || "Chart"}</p><p className="mt-1 text-sm leading-6">There are no observations to display yet.</p></section>;
  }

  const { type, title, data, max = 100 } = config;
  // LLM output is untrusted: de-duplicate series names so a repeated field cannot
  // create duplicate React keys, duplicate SVG IDs, or duplicate chart traces.
  const { xKey, seriesKeys: keys, bars: configuredBars, lines: configuredLines, areas: configuredAreas } = resolveChartFields(config);
  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const bars = configuredBars.length || type !== "composed" ? configuredBars : keys;
  const lines = configuredLines.filter((key) => !bars.includes(key));
  const areas = configuredAreas.filter((key) => !bars.includes(key) && !lines.includes(key));
  const series = type === "pie" || type === "funnel" || type === "gauge"
    ? data.map((item) => String(item[xKey] ?? "value"))
    : type === "composed"
      ? [...bars, ...lines, ...areas]
      : ["bar", "line", "area", "radar"].includes(type)
        ? keys
        : [];
  const axisProps = { tick: { fontSize: 11, fill: "#85898f", fontWeight: 500 }, axisLine: false, tickLine: false, tickMargin: 10 };
  const grid = <CartesianGrid strokeDasharray="2 7" vertical={false} stroke="#e7e8e9" />;
  const chartMargin = { top: 18, right: 12, left: -18, bottom: 2 };
  const gradientId = (key: string, index: number) => `chart-${chartId}-${index}-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const scatterXKey = config.x ?? (keys.includes("x") ? "x" : keys[0] ?? xKey);
  const scatterYKey = config.y ?? keys.find((key) => key !== scatterXKey) ?? "value";

  const renderChart = () => {
    if (type === "sparkline") return (
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 10, right: 2, left: 2, bottom: 2 }}><Tooltip cursor={{ stroke: "#d1d1d6", strokeWidth: 1 }} content={<CustomTooltip />} />{keys.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2.75} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />)}</LineChart>
      </ResponsiveContainer>
    );
    if (type === "scatter") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ScatterChart margin={chartMargin}><CartesianGrid strokeDasharray="2 8" stroke="#ececea" /><XAxis dataKey={scatterXKey} name={scatterXKey} {...axisProps} type="number" /><YAxis dataKey={scatterYKey} name={scatterYKey} {...axisProps} type="number" /><Tooltip cursor={{ strokeDasharray: "2 6" }} content={<CustomTooltip />} /><Scatter data={data} fill={colors[0]} isAnimationActive={false} /></ScatterChart>
      </ResponsiveContainer>
    );
    if (type === "funnel") {
      const valueKey = keys[0] || "value";
      const values = data.map((item) => Math.max(Number(item[valueKey]) || 0, 0));
      const largest = Math.max(...values, 1);

      return (
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-2.5 py-2">
          {data.map((item, index) => {
            const value = values[index];
            const previous = values[index - 1];
            const conversion = index === 0 || previous === 0 ? null : Math.round((value / previous) * 100);
            const width = Math.max((value / largest) * 100, 18);
            const color = colors[index % colors.length];

            return (
              <div key={`funnel-row-${index}`} className="grid grid-cols-[minmax(5.75rem,0.8fr)_minmax(0,2.2fr)_auto] items-center gap-3 sm:grid-cols-[minmax(7rem,1fr)_minmax(0,3fr)_auto] sm:gap-4">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-[#1d1d1f]">{item[xKey]}</p>{conversion !== null && <p className="mt-0.5 text-[11px] text-[#86868b]">{conversion}% continue</p>}</div>
                <div className="flex h-11 items-center justify-center rounded-xl bg-black/[0.035] px-1.5">
                  <div className="h-8 rounded-lg shadow-[0_5px_14px_rgba(0,0,0,0.10)] transition-[width,transform] duration-500 ease-out hover:scale-y-[1.04]" style={{ width: `${width}%`, backgroundColor: color }} />
                </div>
                <span className="w-12 text-right text-sm font-semibold tabular-nums tracking-[-0.02em] text-[#1d1d1f]">{value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      );
    }
    if (type === "gauge") {
      const value = Math.min(Math.max(Number(data[0]?.[keys[0]]) || 0, 0), max);
      return <div className="relative h-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "value", value }, { name: "remaining", value: max - value }]} dataKey="value" startAngle={180} endAngle={0} cx="50%" cy="68%" innerRadius="62%" outerRadius="88%" paddingAngle={0} stroke="none" isAnimationActive={false}><Cell fill={colors[0]} /><Cell fill="#e5e5ea" /></Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-x-0 bottom-[20%] text-center"><p className="text-[30px] font-semibold tracking-[-0.045em] text-[#1d1d1f]">{value}</p><p className="text-xs text-[#86868b]">of {max}</p></div></div>;
    }
    if (type === "heatmap" || type === "cohort") return <div className="grid content-start gap-1.5 pt-3" style={{ gridTemplateColumns: `minmax(4.5rem, 1fr) repeat(${keys.length}, minmax(2.5rem, 1fr))` }}><span />{keys.map((key) => <span key={key} className="truncate px-1 text-center text-[11px] font-medium text-[#86868b]">{key}</span>)}{data.flatMap((row, rowIndex) => [<span key={`label-${rowIndex}`} className="self-center truncate pr-2 text-xs font-medium text-[#6e6e73]">{row[xKey]}</span>, ...keys.map((key, keyIndex) => { const raw = Number(row[key]) || 0; const opacity = Math.min(Math.max(raw / max, 0.08), 1); return <span key={`${rowIndex}-${keyIndex}`} title={`${row[xKey]} · ${key}: ${raw}`} className="flex h-16 min-h-9 items-center justify-center rounded-lg text-[11px] font-medium text-[#1d1d1f] sm:h-[4.5rem]" style={{ backgroundColor: `${colors[0]}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` }}>{raw}</span>; })])}</div>;
    if (type === "waterfall") {
      let running = 0;
      const waterfall = data.map((item) => { const amount = Number(item[keys[0]]) || 0; const start = running; running += amount; return { name: String(item[xKey] ?? ""), start, end: running, amount, direction: amount >= 0 ? "gain" : "loss" }; });
      const highest = Math.max(...waterfall.flatMap((item) => [item.start, item.end]), 0);
      const lowest = Math.min(...waterfall.flatMap((item) => [item.start, item.end]), 0);
      const padding = Math.max((highest - lowest) * 0.12, 12);
      const domainMin = lowest - padding;
      const domainMax = highest + padding;
      const height = 248;
      const top = 18;
      const baseline = 34;
      const plotHeight = height - top - baseline;
      const y = (value: number) => top + ((domainMax - value) / (domainMax - domainMin || 1)) * plotHeight;
      const step = 680 / Math.max(waterfall.length, 1);
      const barWidth = Math.min(94, step * 0.58);

      return <div className="h-full pt-2"><svg className="h-full w-full overflow-visible" viewBox={`0 0 720 ${height}`} role="img" aria-label={title || "Waterfall chart"}>{[0.25, 0.5, 0.75].map((fraction) => <line key={fraction} x1="28" x2="704" y1={top + plotHeight * fraction} y2={top + plotHeight * fraction} stroke="#e5e5ea" strokeDasharray="2 6" />)}{waterfall.map((item, index) => { const x = 42 + index * step; const startY = y(item.start); const endY = y(item.end); const rectY = Math.min(startY, endY); const rectHeight = Math.max(Math.abs(endY - startY), 3); const color = item.direction === "gain" ? colors[0] : "#ff375f"; return <g key={`waterfall-bar-${index}`} className="group"><title>{`${item.name}: ${item.amount >= 0 ? "+" : ""}${item.amount.toLocaleString()} · total ${item.end.toLocaleString()}`}</title>{index > 0 && <line x1={x - step + barWidth} x2={x} y1={y(waterfall[index - 1].end)} y2={startY} stroke="#c7c7cc" strokeDasharray="3 3" /> }<rect x={x} y={rectY} width={barWidth} height={rectHeight} rx="7" fill={color} className="transition-opacity duration-200 group-hover:opacity-80" /><text x={x + barWidth / 2} y={rectY - 8} textAnchor="middle" className="fill-[#515154] text-[11px] font-medium">{`${item.amount >= 0 ? "+" : ""}${item.amount}`}</text><text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="fill-[#86868b] text-[11px] font-medium">{String(item.name)}</text></g>; })}</svg></div>;
    }
    if (type === "bar") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={chartMargin}>
          <defs>{keys.map((key, index) => <linearGradient key={key} id={gradientId(key, index)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity="0.94" /><stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity="0.62" /></linearGradient>)}</defs>
          {grid}<XAxis dataKey={xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip cursor={{ fill: "rgba(0,122,255,0.045)" }} content={<CustomTooltip />} />
          {keys.map((key, index) => <Bar key={key} dataKey={key} fill={`url(#${gradientId(key, index)})`} radius={[6, 6, 2, 2]} maxBarSize={38} isAnimationActive={false} />)}
        </BarChart>
      </ResponsiveContainer>
    );
    if (type === "line") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={chartMargin}>
          {grid}<XAxis dataKey={xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip cursor={{ stroke: "#d1d1d6", strokeWidth: 1 }} content={<CustomTooltip />} />
          {keys.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2.75} dot={false} activeDot={{ r: 4.5, strokeWidth: 3, stroke: "#fff", fill: colors[index % colors.length] }} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    );
    if (type === "area") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={data} margin={chartMargin}>
          <defs>{keys.map((key, index) => <linearGradient key={key} id={gradientId(key, index)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity="0.3" /><stop offset="78%" stopColor={colors[index % colors.length]} stopOpacity="0.06" /><stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity="0" /></linearGradient>)}</defs>
          {grid}<XAxis dataKey={xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip cursor={{ stroke: "#d1d1d6", strokeWidth: 1 }} content={<CustomTooltip />} />
          {keys.map((key, index) => <Area key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} fill={`url(#${gradientId(key, index)})`} strokeWidth={2.75} activeDot={{ r: 4.5 }} isAnimationActive={false} />)}
        </AreaChart>
      </ResponsiveContainer>
    );
    if (type === "radar") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#e5e5ea" /><PolarAngleAxis dataKey={xKey} tick={{ fill: "#86868b", fontSize: 11, fontWeight: 500 }} /><PolarRadiusAxis tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {keys.map((key, index) => <Radar key={key} name={key} dataKey={key} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.16} strokeWidth={2.4} isAnimationActive={false} />)}
        </RadarChart>
      </ResponsiveContainer>
    );
    if (type === "composed") return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={data} margin={{ top: 22, right: 2, left: -18, bottom: 2 }} barCategoryGap="38%">
          <defs>{bars.map((key, index) => <linearGradient key={key} id={gradientId(key, index)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity="0.9" /><stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity="0.48" /></linearGradient>)}</defs>
          {grid}<XAxis dataKey={xKey} {...axisProps} /><YAxis yAxisId="bars" {...axisProps} width={42} /><YAxis yAxisId="lines" orientation="right" tick={{ fontSize: 11, fill: "#86868b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={9} width={42} />
          <Tooltip cursor={{ fill: "rgba(0,122,255,0.04)" }} content={<CustomTooltip />} />
          {areas.map((key, index) => <Area key={key} yAxisId="lines" type="monotone" dataKey={key} fill={colors[(bars.length + lines.length + index) % colors.length]} fillOpacity={0.09} stroke="none" isAnimationActive={false} />)}
          {bars.map((key, index) => <Bar key={key} yAxisId="bars" dataKey={key} fill={`url(#${gradientId(key, index)})`} radius={[7, 7, 3, 3]} maxBarSize={32} isAnimationActive={false} />)}
          {lines.map((key, index) => <Line key={key} yAxisId="lines" type="monotone" dataKey={key} stroke={colors[(bars.length + index) % colors.length]} strokeWidth={3} dot={{ r: 2.5, fill: "#fff", strokeWidth: 2, stroke: colors[(bars.length + index) % colors.length] }} activeDot={{ r: 5, fill: colors[(bars.length + index) % colors.length], stroke: "#fff", strokeWidth: 3 }} isAnimationActive={false} />)}
        </ComposedChart>
      </ResponsiveContainer>
    );
    const pieKey = keys[0];
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart><Tooltip content={<CustomTooltip />} /><Pie data={data} dataKey={pieKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={102} innerRadius={74} paddingAngle={2} stroke="#fbfbfd" strokeWidth={3} isAnimationActive={false}>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie></PieChart>
      </ResponsiveContainer>
    );
  };

  const frameClassName = type === "sparkline"
    ? "h-28"
    : type === "heatmap" || type === "cohort"
      ? "h-auto min-h-[17rem] sm:min-h-[19rem]"
      : "h-[17rem] sm:h-[19rem]";

  return (
    <section className="rich-block-frame my-8 w-full min-w-0 max-w-full overflow-hidden bg-white" aria-label={`${title || "Untitled"} ${type} chart`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div><p className="rich-block-eyebrow">{type} chart</p><h3 className="rich-block-title mt-1.5">{title || "Untitled chart"}</h3><p className="mt-1 text-[11px] font-medium text-[#8b8f95]">{data.length} observations</p></div>
        {series.length > 0 && <div className="flex max-w-full flex-wrap gap-x-4 gap-y-2" aria-label="Chart legend">{series.map((name, index) => <span key={`legend-item-${index}`} className="flex items-center gap-1.5 text-[11px] font-medium text-[#6f7379]"><span className="size-2 rounded-[3px]" style={{ backgroundColor: colors[index % colors.length] }} />{name}</span>)}</div>}
      </div>
      <div
        className={`internal-scroll mt-1 w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden px-4 pb-5 sm:px-5 sm:pb-6 ${frameClassName}`}
        role="group"
        aria-label={`${title || "Untitled"} ${type} chart plot with ${data.length} observations`}
      >
        <div className="h-full min-w-[18rem]">{renderChart()}</div>
      </div>
    </section>
  );
}
