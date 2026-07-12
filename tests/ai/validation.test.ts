import { describe, expect, it } from "vitest";

import { validateMarkdownFlowBlock } from "../../src/ai/validation";

const validChart = JSON.stringify({ type: "bar", data: [{ month: "Jan", value: 4 }], x: "month", y: "value" });

describe("validateMarkdownFlowBlock", () => {
  it("accepts valid blocks and rejects unknown or disabled block types", () => {
    expect(validateMarkdownFlowBlock("chart", validChart)).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("html", "<script>alert(1)</script>")).toMatchObject({ valid: false });
    expect(validateMarkdownFlowBlock("chart", validChart, { allowedBlocks: ["callout"] })).toMatchObject({ valid: false, reason: expect.stringContaining("disabled") });
  });

  it("enforces block, row, chart and external URL limits", () => {
    expect(validateMarkdownFlowBlock("callout", JSON.stringify({ title: "x".repeat(30) }), { maxBlockCharacters: 10 })).toMatchObject({ valid: false, reason: expect.stringContaining("size") });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "bar", data: [{ x: 1 }, { x: 2 }], x: "x", y: "x" }), { maxChartDataPoints: 1 })).toMatchObject({ valid: false });
    expect(validateMarkdownFlowBlock("embed", JSON.stringify({ url: "https://example.com" }))).toMatchObject({ valid: false, reason: expect.stringContaining("disabled") });
    expect(validateMarkdownFlowBlock("embed", JSON.stringify({ url: "https://example.com" }), { allowExternalUrls: true })).toEqual({ valid: true });
  });

  it("validates structured config shapes and dataset chart allowlists", () => {
    expect(validateMarkdownFlowBlock("callout", JSON.stringify({ title: "Safe", script: "nope" }))).toMatchObject({ valid: false });
    expect(validateMarkdownFlowBlock("metrics", JSON.stringify({ metrics: [{ label: "Revenue", value: 4 }] }))).toEqual({ valid: true });
    const datasetChart = JSON.stringify({ type: "line", dataset: "sales", x: "month", y: "revenue" });
    expect(validateMarkdownFlowBlock("chart", datasetChart, { allowedDatasetIds: ["sales"], allowedDatasetFields: { sales: ["month", "revenue"] } })).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", datasetChart, { allowedDatasetIds: ["sales"], allowedDatasetFields: { sales: ["month"] } })).toMatchObject({ valid: false, reason: expect.stringContaining("outside") });
  });
});
