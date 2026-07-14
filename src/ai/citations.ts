export const MARKDOWN_FLOW_CITATION_TOKEN = /\[cite:([A-Za-z0-9][A-Za-z0-9_-]*)\]/g;

const MARKDOWN_FLOW_CITATION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * A compact, public-facing description of a source available to an AI answer.
 * Existing `MarkdownFlowCitation` objects are accepted anywhere a source is
 * expected, so applications can adopt this contract without changing their
 * current citation envelopes.
 */
export interface MarkdownFlowSource {
  id: string;
  title?: string;
  preview?: string;
  url?: string;
}

/** The legacy source metadata fields accepted by the citation renderer. */
export interface MarkdownFlowLegacyCitationSource {
  id: string;
  filename?: string;
  text_preview?: string;
  url?: string;
}

export type MarkdownFlowSourceInput = MarkdownFlowSource & Partial<Omit<MarkdownFlowLegacyCitationSource, "id" | "url">>;

type MarkdownFlowSourceIdError = "brackets" | "cite-prefix" | "invalid-format";

export type MarkdownFlowCitationDiagnostic =
  | { type: "no-citation-tokens" }
  | { type: "invalid-source-id"; sourceId: string; reason: MarkdownFlowSourceIdError }
  | { type: "unmatched-citation-token"; citationId: string };

function getMarkdownFlowSourceIdError(id: string): MarkdownFlowSourceIdError | undefined {
  if (id.includes("[") || id.includes("]")) return "brackets";
  if (id.startsWith("cite:")) return "cite-prefix";
  return MARKDOWN_FLOW_CITATION_ID.test(id) ? undefined : "invalid-format";
}

/** Converts legacy citation metadata into the lightweight source contract. */
export function toMarkdownFlowSource(source: MarkdownFlowSourceInput): MarkdownFlowSource {
  return {
    id: source.id,
    title: source.title ?? source.filename,
    preview: source.preview ?? source.text_preview,
    url: source.url,
  };
}

/**
 * Produces model guidance for the sources supplied by the host. The guidance
 * uses the same token syntax the renderer already recognizes.
 */
export function createMarkdownFlowCitationGuidance(sources: readonly MarkdownFlowSourceInput[] = []): string {
  const sourceIds = [...new Set(sources.map((source) => source.id).filter((id) => !getMarkdownFlowSourceIdError(id)))];
  const lines = [
    "When a claim is supported by a source, add its exact citation token immediately after the claim.",
    "Use exactly: `[cite:source-id]`. Do not invent source IDs or alter the token syntax.",
  ];

  if (sourceIds.length) {
    lines.push("Allowed citation IDs:", ...sourceIds.map((id) => `- ${id}`), `Use exactly: [cite:${sourceIds[0]}]`);
  }

  return lines.join("\n");
}

/** Alias that makes the source-oriented use case explicit. */
export const createMarkdownFlowSourceCitationGuidance = createMarkdownFlowCitationGuidance;

/**
 * Checks source metadata against the citation tokens in a response. This is
 * diagnostic-only: callers can surface the results without changing rendering.
 */
export function diagnoseMarkdownFlowCitations(content: string, sources: readonly MarkdownFlowSourceInput[] = []): readonly MarkdownFlowCitationDiagnostic[] {
  const diagnostics: MarkdownFlowCitationDiagnostic[] = [];
  const sourceIds = new Set<string>();

  for (const source of sources) {
    const reason = getMarkdownFlowSourceIdError(source.id);
    if (reason) {
      diagnostics.push({ type: "invalid-source-id", sourceId: source.id, reason });
      continue;
    }
    sourceIds.add(source.id);
  }

  const citationIds = new Set(extractMarkdownFlowCitationIds(content));
  if (sourceIds.size && !citationIds.size) diagnostics.push({ type: "no-citation-tokens" });
  for (const citationId of citationIds) {
    if (!sourceIds.has(citationId)) diagnostics.push({ type: "unmatched-citation-token", citationId });
  }

  return diagnostics;
}

export function extractMarkdownFlowCitationIds(content: string): readonly string[] {
  return Array.from(content.matchAll(MARKDOWN_FLOW_CITATION_TOKEN), (match) => match[1]);
}

export type MarkdownFlowCitationTextToken = { type: "text"; value: string } | { type: "citation"; id: string; value: string };

export function tokenizeMarkdownFlowCitations(text: string): readonly MarkdownFlowCitationTextToken[] {
  const tokens: MarkdownFlowCitationTextToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKDOWN_FLOW_CITATION_TOKEN)) {
    const start = match.index ?? 0;
    if (start > cursor) tokens.push({ type: "text", value: text.slice(cursor, start) });
    tokens.push({ type: "citation", id: match[1], value: match[0] });
    cursor = start + match[0].length;
  }
  if (cursor < text.length || !tokens.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}
