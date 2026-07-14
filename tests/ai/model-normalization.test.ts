import { describe, expect, it } from "vitest";

import { normalizeMarkdownFlowContent } from "../../src/ai/model";

describe("Markdown Flow fence normalization", () => {
  it("normalizes documented aliases and same-line JSON payloads by default", () => {
    expect(normalizeMarkdownFlowContent("```CALLOUT {\"title\":\"Safe\"}\n```\n")).toEqual([
      expect.objectContaining({ type: "block", language: "callout", content: "```callout\n{\"title\":\"Safe\"}\n```\n" }),
    ]);
    expect(normalizeMarkdownFlowContent("```mermaidjs graph TD; A-->B\n```\n")).toEqual([
      expect.objectContaining({ type: "block", language: "mermaid", content: "```mermaid\ngraph TD; A-->B\n```\n" }),
    ]);
  });

  it("keeps non-canonical fences as ordinary Markdown in strict mode", () => {
    const content = "```CALLOUT {\"title\":\"Safe\"}\n```\n";
    expect(normalizeMarkdownFlowContent(content, { normalization: "strict" })).toEqual([
      { id: "markdown-0", type: "markdown", content },
    ]);
  });
});
