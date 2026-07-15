import {
  MARKDOWN_FLOW_LLM_BLOCK_TYPES,
  MARKDOWN_FLOW_PROTOCOL,
  type MarkdownFlowBlockType,
  type MarkdownFlowProtocol,
  type MarkdownFlowRenderPolicy,
  type MarkdownFlowStreamEvent,
} from "./protocol";
import { createMarkdownFlowBlockInstructions } from "./blockRegistry";
import { createMarkdownFlowCitationGuidance, toMarkdownFlowSource, type MarkdownFlowSourceInput } from "./citations";
import { getAIResponsePresetPolicy, type AIResponsePreset } from "./presets";

export type MarkdownFlowJsonSchema = Readonly<Record<string, unknown>>;

export interface MarkdownFlowDatasetInstruction {
  id: string;
  description?: string;
}

export interface MarkdownFlowInstructionsOptions {
  protocol?: MarkdownFlowProtocol;
  /** Uses the corresponding built-in policy unless `allowedBlocks` is supplied. */
  preset?: AIResponsePreset;
  allowedBlocks?: readonly MarkdownFlowBlockType[];
  availableDatasets?: readonly (string | MarkdownFlowDatasetInstruction)[];
  /** Trusted source metadata used to generate citation guidance. */
  sources?: readonly MarkdownFlowSourceInput[];
  /** Compatibility alias for sources. */
  citations?: readonly MarkdownFlowSourceInput[];
  /** Require strict JSON inside rich blocks. Defaults to true for model output. */
  strict?: boolean;
}

export type MarkdownFlowValidationMode = "normalize" | "strict";

export interface CreateMarkdownFlowOptions extends Omit<MarkdownFlowInstructionsOptions, "strict"> {
  validationMode?: MarkdownFlowValidationMode;
}

export interface MarkdownFlowConfiguration {
  instructions: string;
  policy: MarkdownFlowRenderPolicy;
  blockTypes: readonly MarkdownFlowBlockType[];
  citationFormat: "[cite:source-id]";
  version: MarkdownFlowProtocol;
}

export const MARKDOWN_FLOW_CITATION_FORMAT = "[cite:source-id]" as const;

export interface MarkdownFlowToolDefinition {
  name: "markdown_flow_response";
  description: string;
  inputSchema: MarkdownFlowJsonSchema;
  strict: true;
}

const responseProperties = {
  protocol: { const: MARKDOWN_FLOW_PROTOCOL, type: "string" },
  content: { type: "string", description: "Markdown Flow Markdown, including only approved fenced blocks." },
} as const;

/**
 * Provider-neutral JSON Schema for a structured Markdown Flow response. The
 * server remains responsible for supplying citations and datasets as trusted
 * transport metadata rather than accepting them from the model.
 */
export const markdownFlowResponseSchema: MarkdownFlowJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://markdown-flow.dev/schemas/markdown-flow-response-v1.json",
  title: "Markdown Flow response",
  type: "object",
  additionalProperties: false,
  required: ["protocol", "content"],
  properties: responseProperties,
} as const;

/** A provider-neutral tool definition that can be adapted to an SDK's function/tool format. */
export const markdownFlowResponseTool: MarkdownFlowToolDefinition = {
  name: "markdown_flow_response",
  description: "Return a safe Markdown Flow response using ordinary Markdown and only approved fenced blocks.",
  inputSchema: markdownFlowResponseSchema,
  strict: true,
};

function formatDataset(dataset: string | MarkdownFlowDatasetInstruction): string {
  return typeof dataset === "string" ? dataset : dataset.description ? `${dataset.id} (${dataset.description})` : dataset.id;
}

/**
 * Produces a concise, versioned instruction block suitable for any LLM
 * provider. It deliberately describes presentation rules only; authorization,
 * retrieval, citations, and dataset resolution stay application-owned.
 */
export function createMarkdownFlowInstructions(options: MarkdownFlowInstructionsOptions = {}): string {
  const protocol = options.protocol ?? MARKDOWN_FLOW_PROTOCOL;
  const allowedBlocks = options.allowedBlocks ?? (options.preset ? getAIResponsePresetPolicy(options.preset).allowedBlocks ?? [] : MARKDOWN_FLOW_LLM_BLOCK_TYPES);
  const strictJson = options.strict ?? true;
  const datasets = options.availableDatasets?.map(formatDataset) ?? [];
  const sources = options.sources ?? options.citations ?? [];
  const citations = sources.map((source) => {
    const normalized = toMarkdownFlowSource(source);
    return normalized.title ? `${normalized.id} (${normalized.title})` : normalized.id;
  });

  const lines = [
    `Markdown Flow contract: ${protocol}.`,
    "Write the answer as normal Markdown. Use a fenced Markdown Flow block only when it makes the answer clearer.",
    `Allowed block types: ${allowedBlocks.join(", ") || "none"}.`,
    strictJson
      ? "Each rich block must use strict JSON with double-quoted keys and strings; do not use JSON5, comments, trailing commas, HTML, CSS, JavaScript, React, or unapproved block types."
      : "Each rich block must contain a JSON object; do not emit HTML, CSS, JavaScript, React, or unapproved block types.",
    "Use the form ```block-type followed by its JSON configuration and a closing ``` fence. Keep prose in Markdown.",
    "Never emit an empty or placeholder rich block. Arrays such as items, tabs, cards, files, metrics, rows, images, and locations must contain meaningful entries. If valid block data is unavailable, use ordinary Markdown instead.",
    `Never invent sources or data. Cite only supplied source IDs using the exact token ${MARKDOWN_FLOW_CITATION_FORMAT} in normal Markdown, and reference approved datasets instead of copying large datasets.`,
  ];

  if (allowedBlocks.length) lines.push("Enabled block contracts:\n" + createMarkdownFlowBlockInstructions(allowedBlocks).join("\n"));

  if (datasets.length) lines.push(`Approved dataset IDs: ${datasets.join(", ")}.`);
  if (citations.length) lines.push(`Available citations: ${citations.join(", ")}.`, createMarkdownFlowCitationGuidance(sources));

  return lines.join("\n");
}

/**
 * Builds the complete, provider-neutral model contract for a response surface.
 * The returned policy is host-owned and can be passed directly to rendering and
 * validation APIs; sources remain instruction metadata only.
 */
export function createMarkdownFlow(options: CreateMarkdownFlowOptions = {}): MarkdownFlowConfiguration {
  const preset = options.preset ?? "chat";
  const presetPolicy = getAIResponsePresetPolicy(preset);
  const blockTypes = options.allowedBlocks ?? presetPolicy.allowedBlocks ?? MARKDOWN_FLOW_LLM_BLOCK_TYPES;
  const datasets = options.availableDatasets ?? [];
  const datasetIds = datasets.map((dataset) => typeof dataset === "string" ? dataset : dataset.id);
  const policy: MarkdownFlowRenderPolicy = {
    ...presetPolicy,
    allowedBlocks: blockTypes,
    ...(datasets.length ? { allowedDatasetIds: datasetIds } : {}),
  };
  const sources = options.sources ?? options.citations;
  const validationMode = options.validationMode ?? "normalize";
  const version = options.protocol ?? MARKDOWN_FLOW_PROTOCOL;

  return {
    instructions: createMarkdownFlowInstructions({
      ...options,
      protocol: version,
      allowedBlocks: blockTypes,
      sources,
      strict: validationMode === "strict",
    }),
    policy,
    blockTypes,
    citationFormat: MARKDOWN_FLOW_CITATION_FORMAT,
    version,
  };
}

/** Creates a fresh tool definition while preserving a provider-neutral shape. */
export function createMarkdownFlowResponseTool(options: MarkdownFlowInstructionsOptions = {}): MarkdownFlowToolDefinition {
  return {
    ...markdownFlowResponseTool,
    description: `${markdownFlowResponseTool.description} ${createMarkdownFlowInstructions(options)}`,
  };
}

function textEvent(value: unknown): MarkdownFlowStreamEvent[] {
  return typeof value === "string" && value.length ? [{ type: "text", delta: value }] : [];
}

function contentText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  return value.map((part) => {
    if (typeof part === "string") return part;
    if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
    return "";
  }).join("");
}

/**
 * Converts common provider chunk shapes into the Markdown Flow event protocol
 * without importing or coupling to any provider SDK.
 */
export function normalizeMarkdownFlowStreamChunk(chunk: unknown): MarkdownFlowStreamEvent[] {
  if (typeof chunk === "string") return textEvent(chunk);
  if (!chunk || typeof chunk !== "object") return [];

  if ("type" in chunk) {
    if (chunk.type === "complete" || chunk.type === "message_stop" || chunk.type === "response.completed") return [{ type: "complete" }];
    if (chunk.type === "error" && "message" in chunk && typeof chunk.message === "string") return [{ type: "error", message: chunk.message }];
    if (chunk.type === "text" && "delta" in chunk) return textEvent(chunk.delta);
    if (chunk.type === "citation" && "citation" in chunk && chunk.citation && typeof chunk.citation === "object") return [chunk as MarkdownFlowStreamEvent];
    if (chunk.type === "dataset" && "dataset" in chunk && chunk.dataset && typeof chunk.dataset === "object") return [chunk as MarkdownFlowStreamEvent];
  }

  if ("textDelta" in chunk) return textEvent(chunk.textDelta);
  if ("delta" in chunk) {
    if (typeof chunk.delta === "string") return textEvent(chunk.delta);
    if (chunk.delta && typeof chunk.delta === "object" && "text" in chunk.delta) return textEvent(chunk.delta.text);
  }
  if ("text" in chunk) return textEvent(chunk.text);
  if ("choices" in chunk && Array.isArray(chunk.choices)) {
    return chunk.choices.flatMap((choice) => {
      if (!choice || typeof choice !== "object" || !("delta" in choice) || !choice.delta || typeof choice.delta !== "object") return [];
      return textEvent(contentText("content" in choice.delta ? choice.delta.content : undefined));
    });
  }

  return [];
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/**
 * Adapts OpenAI Chat Completions and Responses API event shapes without
 * importing an OpenAI SDK. Provider credentials and request construction stay
 * on the server; this only converts an already-received event into UI events.
 */
export function normalizeOpenAIStreamChunk(chunk: unknown): MarkdownFlowStreamEvent[] {
  const value = objectValue(chunk);
  if (!value) return normalizeMarkdownFlowStreamChunk(chunk);

  if (value.type === "response.output_text.delta") return textEvent(value.delta);
  if (value.type === "response.completed") return [{ type: "complete" }];
  if (value.type === "error") return typeof value.message === "string" ? [{ type: "error", message: value.message }] : [];
  if (typeof value.type === "string" && value.type.includes("function_call")) return [];

  if (Array.isArray(value.choices)) {
    const events = normalizeMarkdownFlowStreamChunk(value);
    const finished = value.choices.some((choice) => {
      const item = objectValue(choice);
      return item?.finish_reason !== null && item?.finish_reason !== undefined;
    });
    return finished ? [...events, { type: "complete" }] : events;
  }

  return normalizeMarkdownFlowStreamChunk(chunk);
}

/**
 * Adapts Anthropic Messages streaming events without importing an Anthropic
 * SDK. Tool-use JSON deltas are deliberately ignored: Markdown Flow only
 * renders text that the host chooses to pass through.
 */
export function normalizeAnthropicStreamChunk(chunk: unknown): MarkdownFlowStreamEvent[] {
  const value = objectValue(chunk);
  if (!value) return normalizeMarkdownFlowStreamChunk(chunk);
  if (value.type === "message_stop") return [{ type: "complete" }];
  if (value.type === "error") {
    const error = objectValue(value.error);
    return typeof error?.message === "string" ? [{ type: "error", message: error.message }] : [];
  }
  if (value.type === "content_block_delta") {
    const delta = objectValue(value.delta);
    return delta?.type === "text_delta" ? textEvent(delta.text) : [];
  }
  return normalizeMarkdownFlowStreamChunk(chunk);
}

/**
 * Adapts Vercel AI SDK text-stream parts without importing the AI SDK. Both
 * current `text-delta` parts and the common `textDelta` shape are supported.
 */
export function normalizeVercelAIStreamChunk(chunk: unknown): MarkdownFlowStreamEvent[] {
  const value = objectValue(chunk);
  if (!value) return normalizeMarkdownFlowStreamChunk(chunk);
  if (value.type === "text-delta") return textEvent(value.delta ?? value.textDelta);
  if (value.type === "finish" || value.type === "finish-step") return [{ type: "complete" }];
  if (typeof value.type === "string" && value.type.startsWith("tool-")) return [];
  if (value.type === "error") return typeof value.error === "string"
    ? [{ type: "error", message: value.error }]
    : typeof value.message === "string" ? [{ type: "error", message: value.message }] : [];
  return normalizeMarkdownFlowStreamChunk(chunk);
}

/** Normalizes any async iterable of provider chunks into Markdown Flow events. */
export async function* normalizeMarkdownFlowStream(chunks: AsyncIterable<unknown>): AsyncGenerator<MarkdownFlowStreamEvent> {
  for await (const chunk of chunks) {
    yield* normalizeMarkdownFlowStreamChunk(chunk);
  }
}

async function* normalizeProviderStream(
  chunks: AsyncIterable<unknown>,
  normalize: (chunk: unknown) => MarkdownFlowStreamEvent[],
): AsyncGenerator<MarkdownFlowStreamEvent> {
  for await (const chunk of chunks) yield* normalize(chunk);
}

/** Converts an OpenAI SDK async iterable into provider-neutral UI events. */
export function normalizeOpenAIStream(chunks: AsyncIterable<unknown>): AsyncGenerator<MarkdownFlowStreamEvent> {
  return normalizeProviderStream(chunks, normalizeOpenAIStreamChunk);
}

/** Converts an Anthropic SDK async iterable into provider-neutral UI events. */
export function normalizeAnthropicStream(chunks: AsyncIterable<unknown>): AsyncGenerator<MarkdownFlowStreamEvent> {
  return normalizeProviderStream(chunks, normalizeAnthropicStreamChunk);
}

/** Converts a Vercel AI SDK async iterable into provider-neutral UI events. */
export function normalizeVercelAIStream(chunks: AsyncIterable<unknown>): AsyncGenerator<MarkdownFlowStreamEvent> {
  return normalizeProviderStream(chunks, normalizeVercelAIStreamChunk);
}

function parseSseEvent(data: string): MarkdownFlowStreamEvent[] {
  const trimmed = data.trim();
  if (!trimmed || trimmed === "[DONE]") return trimmed === "[DONE]" ? [{ type: "complete" }] : [];
  try {
    return normalizeMarkdownFlowStreamChunk(JSON.parse(trimmed));
  } catch {
    return textEvent(data);
  }
}

/**
 * Reads a standard UTF-8 server-sent-events response. Each `data:` payload can
 * be plain text, a provider chunk, or an already-normalized stream event.
 */
export async function* readMarkdownFlowSSE(response: Response): AsyncGenerator<MarkdownFlowStreamEvent> {
  if (!response.body) throw new Error("The response does not contain a readable stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    let boundary = buffer.match(/\r?\n\r?\n/);
    while (boundary?.index !== undefined) {
      const event = buffer.slice(0, boundary.index);
      buffer = buffer.slice(boundary.index + boundary[0].length);
      const data = event.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
      yield* parseSseEvent(data);
      boundary = buffer.match(/\r?\n\r?\n/);
    }

    if (done) break;
  }

  const trailingData = buffer.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
  yield* parseSseEvent(trailingData);
}
