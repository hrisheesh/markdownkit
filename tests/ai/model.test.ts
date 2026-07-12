import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { joinMarkdownFlowNodes, MarkdownFlowNodeParser, normalizeMarkdownFlowContent } from "../../src/ai/model";

function parseInChunks(content: string, chunks: readonly string[]) {
  const parser = new MarkdownFlowNodeParser();
  for (const chunk of chunks) parser.append(chunk);
  parser.finish();
  return parser.getNodes();
}

describe("MarkdownFlowNodeParser", () => {
  it("keeps a structured fence pending until its closing delimiter arrives", () => {
    const parser = new MarkdownFlowNodeParser();
    parser.append("Before\n```callout\n{\"title\": \"Safe\"}");

    expect(parser.getNodes()).toEqual([
      { id: "markdown-0", type: "markdown", content: "Before\n" },
      expect.objectContaining({ type: "pending", language: "callout", lifecycle: "pending" }),
    ]);

    parser.append("\n```\nAfter");
    parser.finish();
    expect(parser.getNodes()).toEqual([
      { id: "markdown-0", type: "markdown", content: "Before\n" },
      expect.objectContaining({ id: "block-1", type: "block", language: "callout", lifecycle: "ready" }),
      { id: "markdown-2", type: "markdown", content: "After" },
    ]);
  });

  it("leaves ordinary fenced code in markdown", () => {
    const content = "```typescript\nconst answer = 42;\n```\n";
    expect(normalizeMarkdownFlowContent(content)).toEqual([
      { id: "markdown-0", type: "markdown", content },
    ]);
  });

  it("preserves source and normalized nodes across arbitrary Unicode chunk boundaries", () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom("a", " ", "\n", "é", "漢", "🧪", "\u0301", "`", "{"), { maxLength: 160 }).map((characters) => characters.join("")),
      fc.array(fc.integer({ min: 0, max: 12 }), { minLength: 0, maxLength: 64 }),
      (content, splitPoints) => {
        const points = [...new Set(splitPoints.map((point) => Math.min(point, content.length)))].sort((a, b) => a - b);
        const chunks = points.reduce<string[]>((all, point, index) => {
          const start = index === 0 ? 0 : points[index - 1];
          all.push(content.slice(start, point));
          return all;
        }, []);
        chunks.push(content.slice(points.at(-1) ?? 0));

        const whole = normalizeMarkdownFlowContent(content);
        const incremental = parseInChunks(content, chunks);
        expect(incremental).toEqual(whole);
        expect(joinMarkdownFlowNodes(incremental)).toBe(content);
      },
    ), { numRuns: 300 });
  });

  it("has the same final model for every chunking of representative AI responses", () => {
    const response = [
      "# Plan\n\n",
      "```callout\n{\"title\":\"Approved\",\"body\":\"Ship it\"}\n```\n\n",
      "```chart\n{\"type\":\"bar\",\"data\":[{\"month\":\"Jan\",\"value\":1}],\"x\":\"month\",\"y\":\"value\"}\n```\n",
      "```python\nprint('ordinary code')\n```\n",
    ].join("");
    const expected = normalizeMarkdownFlowContent(response);

    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: response.length }), { minLength: 0, maxLength: 50 }), (cuts) => {
      const sorted = [...new Set(cuts)].sort((a, b) => a - b);
      const chunks = [...sorted, response.length].map((end, index) => response.slice(index === 0 ? 0 : sorted[index - 1], end));
      expect(parseInChunks(response, chunks)).toEqual(expected);
    }), { numRuns: 250 });
  });
});
