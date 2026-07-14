"use client";

import React from "react";

import type { MarkdownFlowDatasetResolver } from "../../ai/data";
import { useMarkdownFlowDataset } from "../../ai/data";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";
import RichChart, { type ChartConfig } from "./RichChart";

type DatasetChartConfig = Omit<ChartConfig, "data"> & {
  dataset: string;
  x?: string;
  y?: string;
};

function parseConfig(configStr: string): DatasetChartConfig | null {
  try {
    const config: unknown = JSON.parse(configStr);
    return typeof config === "object" && config !== null && "dataset" in config ? config as DatasetChartConfig : null;
  } catch {
    return null;
  }
}

function DataState({ status, onRefresh }: { status: "loading" | "unavailable" | "denied" | "error"; onRefresh: () => void }) {
  const message = status === "loading"
    ? "Loading approved data…"
    : status === "denied"
      ? "You do not have access to this data."
      : status === "unavailable"
        ? "Data is unavailable."
        : "Approved data could not be loaded.";
  return (
    <div role={status === "loading" ? "status" : "alert"} aria-live="polite" className="rich-block-state my-6 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 text-sm leading-6 sm:px-5">
      <span className="inline-flex items-center gap-2.5">{status === "loading" && <span className="size-2 animate-pulse rounded-full bg-brand-blue shadow-[0_0_0_4px_rgba(79,99,217,0.08)]" aria-hidden="true" />}{message}</span>
      {status === "unavailable" || status === "error" ? <button type="button" onClick={onRefresh} className="rich-block-control px-2.5 text-xs font-semibold text-brand-blue">Retry</button> : null}
    </div>
  );
}

/** Renders a chart from host-authorized data, never rows supplied by model output. */
export default function RichDatasetChart({ configStr, resolver, maxDataPoints, telemetry }: { configStr: string; resolver?: MarkdownFlowDatasetResolver; maxDataPoints: number; telemetry?: MarkdownFlowTelemetry }) {
  const config = React.useMemo(() => parseConfig(configStr), [configStr]);
  const fields = React.useMemo(() => config ? [...new Set([config.x, config.y, ...(config.keys ?? []), ...(config.lines ?? []), ...(config.bars ?? []), ...(config.areas ?? [])].filter((field): field is string => Boolean(field)))] : [], [config]);
  const state = useMarkdownFlowDataset(config ? { id: config.dataset, fields } : undefined, resolver);

  React.useEffect(() => {
    emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "dataset", outcome: config ? state.status : "error" });
  }, [config, state.status, telemetry]);

  if (!config) return <DataState status="error" onRefresh={state.refresh} />;
  if (state.status !== "ready" || !state.value) {
    return <DataState status={state.status === "ready" ? "error" : state.status} onRefresh={state.refresh} />;
  }
  if (state.value.data.length > maxDataPoints) return <DataState status="error" onRefresh={state.refresh} />;

  const data = state.value.data.map((row) => {
    const chartRow: Record<string, string | number> = { name: String(row[config.x ?? "name"] ?? "") };
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number") chartRow[key] = value;
    });
    return chartRow;
  });
  const keys = config.keys ?? (config.y ? [config.y] : []);
  return <RichChart config={{ ...config, data, keys }} />;
}
