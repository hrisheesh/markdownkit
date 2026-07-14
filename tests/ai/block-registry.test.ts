import { describe, expect, it } from "vitest";

import {
  createMarkdownFlow,
  createMarkdownFlowInstructions,
  MARKDOWN_FLOW_BLOCK_REGISTRY,
  MARKDOWN_FLOW_BLOCK_TYPES,
  validateMarkdownFlowBlock,
} from "../../src/ai";

describe("Markdown Flow block registry", () => {
  it("provides a valid minimal contract for every built-in block", () => {
    expect(MARKDOWN_FLOW_BLOCK_TYPES).toHaveLength(18);
    for (const type of MARKDOWN_FLOW_BLOCK_TYPES) {
      const block = MARKDOWN_FLOW_BLOCK_REGISTRY[type];
      expect(block.description).not.toHaveLength(0);
      expect(block.usage).not.toHaveLength(0);
      expect(validateMarkdownFlowBlock(type, block.minimalExample, { allowExternalUrls: true })).toEqual({ valid: true });
    }
  });

  it("generates compact enabled-block contracts for instruction requests", () => {
    const instructions = createMarkdownFlowInstructions({ preset: "analytics" });
    expect(instructions).toContain("- chart:");
    expect(instructions).toContain("- metrics:");
    expect(instructions).toContain("- mermaid:");
  });

  it("creates a matched preset policy, instructions, source contract, and dataset allowlist", () => {
    const flow = createMarkdownFlow({
      preset: "rag",
      sources: [{ id: "source-1", filename: "brief.pdf" }],
      availableDatasets: [{ id: "sales", description: "Monthly sales" }],
    });

    expect(flow.version).toBe("markdown-flow/v1");
    expect(flow.citationFormat).toBe("[cite:source-id]");
    expect(flow.blockTypes).toEqual(MARKDOWN_FLOW_BLOCK_TYPES);
    expect(flow.policy.allowedDatasetIds).toEqual(["sales"]);
    expect(flow.instructions).toContain("source-1 (brief.pdf)");
    expect(flow.instructions).toContain("- callout:");
  });
});
