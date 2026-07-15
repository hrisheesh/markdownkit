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

  it("accepts common JSON5, wrappers, arrays, and item aliases in normalize mode", () => {
    expect(validateMarkdownFlowBlock("tabs", "{ sections: [{ heading: 'Overview', text: 'Readable', }], extra: true, }")).toEqual({ valid: true });
    expect(normalizeMarkdownFlowBlock("cards", "[{ heading: 'Launch', text: 'Ready' }]")).toMatchObject({
      code: JSON.stringify({ cards: [{ title: "Launch", description: "Ready" }] }),
    });
    expect(validateMarkdownFlowBlock("filetree", JSON.stringify({ payload: { entries: [{ label: "src", kind: "directory" }] } }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("tabs", "{ tabs: [{ label: 'Overview', content: 'Readable', }] }", undefined, { normalization: "strict" })).toMatchObject({ valid: false });
  });

  it("normalizes common Chart.js and Apex-style series without weakening strict mode", () => {
    const chartJs = { type: "column", data: { labels: ["Jan", "Feb"], datasets: [{ label: "Users", data: [12, 18] }] } };
    expect(validateMarkdownFlowBlock("chart", JSON.stringify(chartJs))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify(chartJs), undefined, { normalization: "strict" })).toMatchObject({ valid: false });

    const apex = { type: "line", categories: ["Jan", "Feb"], series: [{ name: "Users", data: [12, 18] }] };
    expect(validateMarkdownFlowBlock("chart", JSON.stringify(apex))).toEqual({ valid: true });
  });

  it("accepts bounded empty collections so the renderer can show a neutral state", () => {
    expect(validateMarkdownFlowBlock("tabs", JSON.stringify({ title: "Details", tabs: [] }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("comparison", JSON.stringify({ columns: [], rows: [] }))).toEqual({ valid: true });
  });
});
