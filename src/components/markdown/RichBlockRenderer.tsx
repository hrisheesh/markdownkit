"use client";

import React from "react";

import { DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, isMarkdownFlowBlockType, type MarkdownFlowRenderPolicy } from "../../ai/protocol";
import { normalizeMarkdownFlowBlock, validateMarkdownFlowBlock } from "../../ai/validation";
import type { MarkdownFlowNormalizationMode } from "../../ai/model";
import { validateMarkdownFlowArtifactBlock, type MarkdownFlowArtifactRegistry } from "../../ai/artifacts";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";
import type { MarkdownFlowDatasetResolver } from "../../ai/data";
import type { RichBlockRenderers } from "./RichMarkdown";
import RichBlockValidationError from "./RichBlockValidationError";
import RichArtifactBlock from "./RichArtifactBlock";
import RichMediaBlock from "./RichMediaBlock";
import RichStructuredBlock from "./RichStructuredBlock";

// These renderers carry their own substantial browser dependencies. Keep them
// outside the default answer graph and only fetch them when the matching fence
// is actually present in a response.
const RichChart = React.lazy(() => import("./RichChart"));
const RichDatasetChart = React.lazy(() => import("./RichDatasetChart"));
const RichCodeBlock = React.lazy(() => import("./RichCodeBlock"));
const RichMermaid = React.lazy(() => import("./RichMermaid"));

function FeatureFallback({ label }: { label: string }) {
  return <div role="status" aria-live="polite" className="rich-block-state my-6 flex items-center gap-3 px-4 py-3.5 text-sm"><span className="size-2 shrink-0 animate-pulse rounded-full bg-brand-blue" aria-hidden="true" />Loading {label}…</div>;
}

function LazyFeature({ label, children }: { label: string; children: React.ReactNode }) {
  return <React.Suspense fallback={<FeatureFallback label={label} />}>{children}</React.Suspense>;
}

export interface RichBlockRendererProps {
  language: string;
  code: string;
  blockRenderers?: RichBlockRenderers;
  renderPolicy?: MarkdownFlowRenderPolicy;
  artifactRegistry?: MarkdownFlowArtifactRegistry;
  datasetResolver?: MarkdownFlowDatasetResolver;
  telemetry?: MarkdownFlowTelemetry;
  validationMode?: MarkdownFlowNormalizationMode;
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
export default function RichBlockRenderer({ language, code, blockRenderers, renderPolicy, artifactRegistry, datasetResolver, telemetry, validationMode, containsTooManyAiBlocks }: RichBlockRendererProps) {
  const normalization = { normalization: validationMode } as const;
  const normalizedBlock = normalizeMarkdownFlowBlock(language, code, normalization);
  const activeLanguage = normalizedBlock?.language ?? language;
  const activeCode = normalizedBlock?.code ?? code;
  const isAiBlock = isMarkdownFlowBlockType(activeLanguage);
  const isStrictAiBlock = Boolean(renderPolicy && isAiBlock);
  if (language === "artifact" && (artifactRegistry || renderPolicy)) {
    if (containsTooManyAiBlocks) return <RichBlockValidationError reason="This response exceeds the configured number of AI blocks." blockType={language} telemetry={telemetry} />;
    const validation = validateMarkdownFlowArtifactBlock(code, artifactRegistry, renderPolicy);
    if (!validation.valid) {
      if (validation.definition) return <><ArtifactFallbackTelemetry telemetry={telemetry} blockType="artifact" />{validation.definition.fallback({ name: validation.definition.name, version: validation.definition.version, reason: validation.reason, state: validation.state ?? "invalid" })}</>;
      return <RichBlockValidationError reason={validation.reason} blockType="artifact" telemetry={telemetry} />;
    }
    return <RichArtifactBlock artifact={validation.artifact} telemetry={telemetry} />;
  }
  if (isAiBlock) {
    if (containsTooManyAiBlocks) return <RichBlockValidationError reason="This response exceeds the configured number of AI blocks." blockType={language} telemetry={telemetry} />;
    const validation = validateMarkdownFlowBlock(activeLanguage, activeCode, renderPolicy ?? DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, normalization);
    if (!validation.valid) {
      const policyDenied = /disabled by this render policy|outside the approved|exceeds the configured|not permitted/i.test(validation.reason);
      return <RichBlockValidationError reason={validation.reason} blockType={activeLanguage} code={policyDenied ? undefined : code} telemetry={telemetry} />;
    }
  }
  const blockRenderer = blockRenderers?.[activeLanguage];
  if (blockRenderer) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} />{blockRenderer({ language: activeLanguage, code: activeCode })}</>;
  if (activeLanguage === "mermaid") return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} /><LazyFeature label="diagram"><RichMermaid chart={activeCode} /></LazyFeature></>;
  if (activeLanguage === "chart") {
    if (hasDatasetReference(activeCode)) {
      if (!renderPolicy) return <RichBlockValidationError reason="Dataset charts require an explicit render policy and dataset resolver." blockType="chart" telemetry={telemetry} />;
      return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} /><LazyFeature label="chart"><RichDatasetChart configStr={activeCode} resolver={datasetResolver} maxDataPoints={renderPolicy.maxChartDataPoints ?? DEFAULT_MARKDOWN_FLOW_RENDER_POLICY.maxChartDataPoints} telemetry={telemetry} /></LazyFeature></>;
    }
    return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} /><LazyFeature label="chart"><RichChart configStr={activeCode} /></LazyFeature></>;
  }
  if (["embed", "image", "map"].includes(activeLanguage)) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} /><RichMediaBlock type={activeLanguage as "embed" | "image" | "map"} configStr={activeCode} /></>;
  if (["callout", "metrics", "timeline", "steps", "comparison", "accordion", "tabs", "cards", "filetree", "progress", "checklist", "status", "quote"].includes(activeLanguage)) return <><BlockAdherenceTelemetry active={isStrictAiBlock} blockType={activeLanguage} telemetry={telemetry} /><RichStructuredBlock type={activeLanguage as "callout" | "metrics" | "timeline" | "steps" | "comparison" | "accordion" | "tabs" | "cards" | "filetree" | "progress" | "checklist" | "status" | "quote"} configStr={activeCode} /></>;
  return <LazyFeature label="code highlighter"><RichCodeBlock language={activeLanguage} code={activeCode} /></LazyFeature>;
}
