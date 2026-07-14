/**
 * Internal contract for Markdown Flow's LLM-facing surface.
 *
 * This module deliberately contains no provider integration or parsing logic.
 * It establishes the stable vocabulary and transport types that later phases
 * validate, stream, and expose through the public `markdown-flow/ai` entry.
 */

export const MARKDOWN_FLOW_PROTOCOL = "markdown-flow/v1" as const;

export type MarkdownFlowProtocol = typeof MARKDOWN_FLOW_PROTOCOL;

/**
 * Built-in visual blocks that are eligible for the initial LLM protocol.
 * Applications will be able to narrow this list through a render policy.
 */
export const MARKDOWN_FLOW_LLM_BLOCK_TYPES = [
  "callout",
  "metrics",
  "timeline",
  "steps",
  "comparison",
  "accordion",
  "tabs",
  "cards",
  "filetree",
  "progress",
  "checklist",
  "status",
  "quote",
  "chart",
  "mermaid",
  "embed",
  "image",
  "map",
] as const;

export type MarkdownFlowBlockType = (typeof MARKDOWN_FLOW_LLM_BLOCK_TYPES)[number];

export interface MarkdownFlowCitation {
  id: string;
  chunk_id: string;
  document_id: string;
  filename: string;
  contextual_header?: string;
  text_preview: string;
}

/**
 * Data supplied by the host application, not by the model. Later phases will
 * validate data against a registered dataset schema before a block can use it.
 */
export interface MarkdownFlowDataset {
  id: string;
  data: unknown;
  schema?: MarkdownFlowDatasetSchema;
}

/** A host-owned allowlist of fields that an artifact may request from a dataset. */
export interface MarkdownFlowDatasetSchema {
  fields: readonly string[];
}

/**
 * A completed, provider-neutral AI response. Citations and datasets travel in
 * trusted metadata rather than being inferred from free-form model text.
 */
export interface MarkdownFlowResponse {
  protocol: MarkdownFlowProtocol;
  content: string;
  citations?: readonly MarkdownFlowCitation[];
  datasets?: readonly MarkdownFlowDataset[];
}

/**
 * Provider-neutral events that the streaming runtime will consume in Phase 2.
 */
export type MarkdownFlowStreamEvent =
  | { type: "text"; delta: string }
  | { type: "citation"; citation: MarkdownFlowCitation }
  | { type: "dataset"; dataset: MarkdownFlowDataset }
  | { type: "error"; message: string }
  | { type: "complete" };

/**
 * Host-controlled limits and capabilities. Runtime enforcement is added in
 * Phase 1; defining the policy shape now avoids provider-specific contracts.
 */
export interface MarkdownFlowRenderPolicy {
  allowedBlocks?: readonly MarkdownFlowBlockType[];
  /** Explicitly registered business artifacts the model may request. */
  allowedArtifacts?: readonly string[];
  /** Optional version allowlists for each permitted business artifact. */
  allowedArtifactVersions?: Readonly<Record<string, readonly string[]>>;
  allowedDatasetIds?: readonly string[];
  /** Per-dataset fields that model output is allowed to select. */
  allowedDatasetFields?: Readonly<Record<string, readonly string[]>>;
  maxBlockCharacters?: number;
  maxBlocks?: number;
  maxTableRows?: number;
  maxChartDataPoints?: number;
  allowExternalUrls?: boolean;
}

export const DEFAULT_MARKDOWN_FLOW_RENDER_POLICY: Readonly<Required<MarkdownFlowRenderPolicy>> = {
  allowedBlocks: MARKDOWN_FLOW_LLM_BLOCK_TYPES,
  allowedArtifacts: [],
  allowedArtifactVersions: {},
  allowedDatasetIds: [],
  allowedDatasetFields: {},
  maxBlockCharacters: 20_000,
  maxBlocks: 32,
  maxTableRows: 250,
  maxChartDataPoints: 250,
  // A response renderer should work without an onboarding policy. Hosts that
  // need a closed surface can opt into a restrictive policy explicitly.
  allowExternalUrls: true,
};

export function isMarkdownFlowBlockType(value: string): value is MarkdownFlowBlockType {
  return (MARKDOWN_FLOW_LLM_BLOCK_TYPES as readonly string[]).includes(value);
}
