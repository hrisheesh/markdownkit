"use client";

import React from "react";

import type { MarkdownFlowDatasetResolver } from "../../ai/data";
import { useMarkdownFlowDataset } from "../../ai/data";
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
    <div role={status === "loading" ? "status" : "alert"} className="my-8 border-y border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-sm text-[#6e6e73]">
      {message}
      {status !== "loading" && <button type="button" onClick={onRefresh} className="ml-3 font-medium text-[#007aff] underline underline-offset-2">Retry</button>}
    </div>
  );
}

/** Renders a chart from host-authorized data, never rows supplied by model output. */
export default function RichDatasetChart({ configStr, resolver, maxDataPoints }: { configStr: string; resolver?: MarkdownFlowDatasetResolver; maxDataPoints: number }) {
  const config = React.useMemo(() => parseConfig(configStr), [configStr]);
  const fields = React.useMemo(() => config ? [...new Set([config.x, config.y, ...(config.keys ?? []), ...(config.lines ?? []), ...(config.bars ?? []), ...(config.areas ?? [])].filter((field): field is string => Boolean(field)))] : [], [config]);
  const state = useMarkdownFlowDataset(config ? { id: config.dataset, fields } : undefined, resolver);

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
