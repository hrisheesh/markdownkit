export const MARKDOWN_FLOW_CITATION_TOKEN = /\[cite:([A-Za-z0-9][A-Za-z0-9_-]*)\]/g;

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
