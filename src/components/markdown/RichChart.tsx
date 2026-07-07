"use client";

import React, { useMemo, useId } from "react";
import JSON5 from "json5";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";

type ChartConfig = {
  type: "bar" | "line" | "pie" | "area" | "radar" | "composed";
  title?: string;
  data: Record<string, string | number>[];
  keys?: string[]; // main keys for bar/line/area/radar
  colors?: string[];
  // For composed chart specifically
  lines?: string[];
  bars?: string[];
  areas?: string[];
};

type TooltipPayloadEntry = {
  color?: string;
  name?: string;
  value?: string | number;
};

const DEFAULT_COLORS = ["#3f6df6", "#ff5f56", "#ffbd2e", "#27c93f", "#a855f7"];

// Custom Glassmorphism Tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 border-b border-hairline-soft pb-1 text-sm font-black text-ink">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-bold text-charcoal">
            <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="ml-auto tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RichChart({ configStr }: { configStr: string }) {
  const chartId = useId();
  const shouldReduceMotion = useReducedMotion();
  
  const config = useMemo<ChartConfig | null>(() => {
    try {
      // Strip any stray backticks the LLM might have injected inside the block
        const cleanStr = configStr.replace(/^`+|`+$/g, "").trim();
        return JSON5.parse(cleanStr);
      } catch {
      return null;
    }
  }, [configStr]);

  if (!config || !config.data || !config.type) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="my-6 overflow-hidden rounded-2xl border border-brand-coral/20 bg-brand-coral/10 p-5 text-sm font-bold text-brand-coral shadow-sm"
      >
        <div className="mb-2 font-black uppercase tracking-wider text-brand-coral-deep">⚠ Chart Config Error</div>
        <div>Invalid JSON configuration for chart.</div>
      </motion.div>
    );
  }

  const { type, title, data, keys = ["value"], colors = DEFAULT_COLORS, lines, bars, areas } = config;

  // Shared Axis Config
  const axisProps = {
    tick: { fontSize: 11, fill: "#8a8a8a", fontWeight: 600 },
    axisLine: false,
    tickLine: false,
    tickMargin: 8,
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {keys.map((key, i) => (
                  <linearGradient key={`color-${key}-${chartId}`} id={`color-${key}-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={1} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "20px" }} iconType="circle" />
              {keys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`url(#color-${key}-${chartId})`}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 1500}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 2 }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "20px" }} iconType="circle" />
              {keys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: colors[i % colors.length] }}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 2000}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {keys.map((key, i) => (
                  <linearGradient key={`colorArea-${key}-${chartId}`} id={`colorArea-${key}-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 2 }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "20px" }} iconType="circle" />
              {keys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  fillOpacity={1}
                  fill={`url(#colorArea-${key}-${chartId})`}
                  strokeWidth={3}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 2000}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "10px" }} iconType="circle" />
              {keys.map((key, i) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.5}
                  strokeWidth={2}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 2000}
                  animationEasing="ease-out"
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        );

      case "composed":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {(bars || []).map((key, i) => (
                  <linearGradient key={`colorBar-${key}-${chartId}`} id={`colorBar-${key}-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={1} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "20px" }} iconType="circle" />
              {(areas || []).map((key) => (
                <Area key={key} type="monotone" dataKey={key} fill="#f3f4f6" stroke="none" />
              ))}
              {(bars || []).map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`url(#colorBar-${key}-${chartId})`}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 1500}
                />
              ))}
              {(lines || []).map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[(i + (bars?.length || 0)) % colors.length]}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 2000}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "pie":
        const pieKey = keys[0];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold", paddingTop: "10px" }} iconType="circle" />
              <Pie
                data={data}
                dataKey={pieKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                stroke="none"
                isAnimationActive={!shouldReduceMotion}
                animationDuration={shouldReduceMotion ? 0 : 1500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex h-40 items-center justify-center text-sm font-bold text-steel">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="my-6 w-full min-w-0 overflow-hidden rounded-lg border border-hairline bg-white p-3 pb-1 shadow-sm transition-all duration-300 ease-out hover:border-hairline-soft hover:shadow-md sm:p-6 sm:pb-2"
    >
      {title && <h3 className="mb-4 px-2 text-center text-xs font-black uppercase text-ink sm:mb-6 sm:text-[13px]">{title}</h3>}
      {renderChart()}
    </motion.div>
  );
}
