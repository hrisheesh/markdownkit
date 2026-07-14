import { describe, expect, it } from "vitest";

import { normalizeMarkdownFlowBlock, validateMarkdownFlowBlock } from "../../src/ai/validation";

describe("Markdown Flow validation normalization", () => {
  it("accepts harmless documented language aliases by default", () => {
    expect(validateMarkdownFlowBlock("CALLOUT", JSON.stringify({ title: "Safe" }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("mermaidjs", "graph TD; A-->B")).toEqual({ valid: true });
  });

  it("can opt out of normalization and keeps JSON diagnostics actionable", () => {
    expect(validateMarkdownFlowBlock("CALLOUT", JSON.stringify({ title: "Safe" }), undefined, { normalization: "strict" })).toMatchObject({
      valid: false,
      reason: expect.stringContaining("CALLOUT"),
    });
    expect(validateMarkdownFlowBlock("callout", "{oops")).toMatchObject({
      valid: false,
      reason: expect.stringContaining("valid JSON"),
    });
  });

  it("canonicalizes only documented, unambiguous field aliases", () => {
    expect(normalizeMarkdownFlowBlock("timeline", JSON.stringify({ milestones: [{ title: "Launch" }] }))).toMatchObject({
      normalized: true,
      code: JSON.stringify({ items: [{ title: "Launch" }] }),
    });
    expect(validateMarkdownFlowBlock("checklist", JSON.stringify({ tasks: [{ title: "Review", completed: true }] }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "line", data: [{ month: "Jan", users: 1 }], xAxis: "month", yAxis: "users" }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "line", data: [{ month: "Jan", users: 1 }], xAxis: "month", yAxis: "users" }), undefined, { normalization: "strict" })).toMatchObject({ valid: false });
  });
});
