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
    expect(validateMarkdownFlowBlock("embed", JSON.stringify({ url: "https://example.com" }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("embed", JSON.stringify({ url: "https://example.com" }), { allowExternalUrls: false })).toMatchObject({ valid: false, reason: expect.stringContaining("disabled") });
  });

  it("validates structured config shapes and dataset chart allowlists", () => {
    expect(validateMarkdownFlowBlock("callout", JSON.stringify({ title: "Safe", script: "nope" }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("callout", JSON.stringify({ title: "Safe", script: "nope" }), undefined, { normalization: "strict" })).toMatchObject({ valid: false });
    expect(validateMarkdownFlowBlock("metrics", JSON.stringify({ metrics: [{ label: "Revenue", value: 4 }] }))).toEqual({ valid: true });
    const datasetChart = JSON.stringify({ type: "line", dataset: "sales", x: "month", y: "revenue" });
    expect(validateMarkdownFlowBlock("chart", datasetChart, { allowedDatasetIds: ["sales"], allowedDatasetFields: { sales: ["month", "revenue"] } })).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", datasetChart, { allowedDatasetIds: ["sales"], allowedDatasetFields: { sales: ["month"] } })).toMatchObject({ valid: false, reason: expect.stringContaining("outside") });
  });

  it("requires every dataset chart series to be approved and keeps inline data separate", () => {
    const datasetChart = JSON.stringify({ type: "composed", dataset: "sales", x: "month", y: "revenue", bars: ["revenue"], lines: ["target"], areas: ["forecast"] });
    const policy = { allowedDatasetIds: ["sales"], allowedDatasetFields: { sales: ["month", "revenue", "target", "forecast"] } };

    expect(validateMarkdownFlowBlock("chart", datasetChart, policy)).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", datasetChart, {
      ...policy,
      allowedDatasetFields: { sales: ["month", "revenue", "target"] },
    })).toMatchObject({ valid: false, reason: expect.stringContaining("outside") });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "bar", dataset: "sales", data: [{ month: "Jan", revenue: 4 }], x: "month", y: "revenue" }), policy)).toMatchObject({
      valid: false,
      reason: expect.stringContaining("inline data or a dataset"),
    });
  });

  it("rejects inline charts with missing or non-numeric resolved fields", () => {
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "bar", data: [{ month: "Jan", revenue: 4 }], x: "month", y: "value" }))).toMatchObject({
      valid: false,
      reason: expect.stringContaining('"value" is missing'),
    });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "line", data: [{ month: "Jan", revenue: "not-a-number" }], x: "month", y: "revenue" }))).toMatchObject({
      valid: false,
      reason: expect.stringContaining('"revenue" must contain finite numeric'),
    });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "scatter", data: [{ x: 1, y: 2 }] }))).toEqual({ valid: true });
    expect(validateMarkdownFlowBlock("chart", JSON.stringify({ type: "scatter", data: [{ x: 1, y: 2 }] }), undefined, { normalization: "strict" })).toMatchObject({
      valid: false,
      reason: expect.stringContaining("require both"),
    });
  });
});
