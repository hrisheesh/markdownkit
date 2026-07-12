"use client";

import React from "react";

import { DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, isMarkdownFlowBlockType, type MarkdownFlowRenderPolicy } from "../../ai/protocol";
import { validateMarkdownFlowBlock } from "../../ai/validation";
import { validateMarkdownFlowArtifactBlock, type MarkdownFlowArtifactRegistry } from "../../ai/artifacts";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";
import type { MarkdownFlowDatasetResolver } from "../../ai/data";
import type { RichBlockRenderers } from "./RichMarkdown";
import RichBlockValidationError from "./RichBlockValidationError";
import RichArtifactBlock from "./RichArtifactBlock";
import RichChart from "./RichChart";
import RichDatasetChart from "./RichDatasetChart";
import RichCodeBlock from "./RichCodeBlock";
import RichMediaBlock from "./RichMediaBlock";
import RichStructuredBlock from "./RichStructuredBlock";
import RichMermaid from "./RichMermaid";

export interface RichBlockRendererProps {
  language: string;
  code: string;
  blockRenderers?: RichBlockRenderers;
  renderPolicy?: MarkdownFlowRenderPolicy;
  artifactRegistry?: MarkdownFlowArtifactRegistry;
  datasetResolver?: MarkdownFlowDatasetResolver;
  telemetry?: MarkdownFlowTelemetry;
  containsTooManyAiBlocks?: boolean;
}

function ArtifactFallbackTelemetry({ telemetry, blockType }: { telemetry?: MarkdownFlowTelemetry; blockType: string }) {
  React.useEffect(() => { emitMarkdownFlowTelemetry(telemetry, { type: "block", outcome: "fallback", blockType }); }, [blockType, telemetry]);
  return null;
}

function BlockAdherenceTelemetry({ active, blockType, telemetry }: { active: boolean; blockType: string; telemetry?: MarkdownFlowTelemetry }) {
  React.useEffect(() => { if (active) emitMarkdownFlowTelemetry(telemetry, { type: "block", outcome: "accepted", blockType }); }, [active, blockType, telemetry]);
  return null;
}

function hasDatasetReference(code: string): boolean {
  try { const config: unknown = JSON.parse(code); return typeof config === "object" && config !== null && "dataset" in config; } catch { return false; }
}

/** Canonical dispatch pipeline for every rich fenced block. */
export default function RichBlockRenderer({ language, code, blockRenderers, renderPolicy, artifactRegistry, datasetResolver, telemetry, containsTooManyAiBlocks }: RichBlockRendererProps) {
  const isStrictAiBlock = Boolean(renderPolicy && isMarkdownFlowBlockType(language));
  if (language === "artifact" && (artifactRegistry || renderPolicy)) {
    if (containsTooManyAiBlocks) return <RichBlockValidationError reason="This response exceeds the configured number of AI blocks." blockType={language} telemetry={telemetry} />;
    const validation = validateMarkdownFlowArtifactBlock(code, artifactRegistry, renderPolicy);
    if (!validation.valid) {
      if (validation.definition) return <><ArtifactFallbackTelemetry telemetry={telemetry} blockType="artifact" />{validation.definition.fallback({ name: validation.definition.name, version: validation.definition.version, reason: validation.reason, state: validation.state ?? "invalid" })}</>;
      return <RichBlockValidationError reason={validation.reason} blockType="artifact" telemetry={telemetry} />;
    }
    return <RichArtifactBlock artifact={validation.artifact} telemetry={telemetry} />;
  }
  if (renderPolicy && isMarkdownFlowBlockType(language)) {
    if (containsTooManyAiBlocks) return <RichBlockValidationError reason="This response exceeds the configured number of AI blocks." blockType={language} telemetry={telemetry} />;
    const validation = validateMarkdownFlowBlock(language, code, renderPolicy);
    if (!validation.valid) return <RichBlockValidationError reason={validation.reason} blockType={language} telemetry={telemetry} />;
  }
  const blockRenderer = blockRenderers?.[language];
  if (blockRenderer) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} />{blockRenderer({ language, code })}</>;
  if (language === "mermaid") return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} /><RichMermaid chart={code} /></>;
  if (language === "chart") {
    if (hasDatasetReference(code)) {
      if (!renderPolicy) return <RichBlockValidationError reason="Dataset charts require a render policy." blockType="chart" telemetry={telemetry} />;
      return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} /><RichDatasetChart configStr={code} resolver={datasetResolver} maxDataPoints={renderPolicy.maxChartDataPoints ?? DEFAULT_MARKDOWN_FLOW_RENDER_POLICY.maxChartDataPoints} telemetry={telemetry} /></>;
    }
    return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} /><RichChart configStr={code} /></>;
  }
  if (["embed", "image", "map"].includes(language)) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} /><RichMediaBlock type={language as "embed" | "image" | "map"} configStr={code} /></>;
  if (["callout", "metrics", "timeline", "steps", "comparison", "accordion", "tabs", "cards", "filetree", "progress", "checklist", "status", "quote"].includes(language)) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={language} telemetry={telemetry} /><RichStructuredBlock type={language as "callout" | "metrics" | "timeline" | "steps" | "comparison" | "accordion" | "tabs" | "cards" | "filetree" | "progress" | "checklist" | "status" | "quote"} configStr={code} /></>;
  return <RichCodeBlock language={language} code={code} />;
}
