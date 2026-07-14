// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createMarkdownFlowCitationGuidance,
  diagnoseMarkdownFlowCitations,
  toMarkdownFlowSource,
} from "../../src/ai/citations";
import { AIResponseInspector } from "../../src/ai/AIResponseInspector";

describe("Markdown Flow source contract", () => {
  it("adapts existing citation metadata and creates token guidance", () => {
    const source = toMarkdownFlowSource({
      id: "source-1",
      filename: "Research notes",
      text_preview: "Relevant supporting text.",
    });

    expect(source).toEqual({
      id: "source-1",
      title: "Research notes",
      preview: "Relevant supporting text.",
      url: undefined,
    });
    expect(createMarkdownFlowCitationGuidance([source])).toContain("Use exactly: [cite:source-1]");
    expect(createMarkdownFlowCitationGuidance([source])).toContain("- source-1");
  });

  it("reports source and token mismatches without affecting rendering", () => {
    expect(diagnoseMarkdownFlowCitations("Supported [cite:known] and [cite:unknown]", [
      { id: "known" },
      { id: "[unused]" },
      { id: "cite:unnecessary" },
    ])).toEqual([
      { type: "invalid-source-id", sourceId: "[unused]", reason: "brackets" },
      { type: "invalid-source-id", sourceId: "cite:unnecessary", reason: "cite-prefix" },
      { type: "unmatched-citation-token", citationId: "unknown" },
    ]);
  });

  it("shows source diagnostics and warns only through the development inspector", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { unmount } = render(React.createElement(AIResponseInspector, {
      snapshot: {
          content: "Answer [cite:unknown]",
          status: "complete",
          citations: [],
          datasets: [],
          segments: [],
      },
      sources: [{ id: "known" }],
    }));

    expect(screen.getByLabelText("Source citation events")).toHaveTextContent("unmatched-citation-token · unknown");
    expect(warning).toHaveBeenCalledWith("[Markdown Flow] unmatched-citation-token: unknown");

    warning.mockClear();
    unmount();
    render(React.createElement(AIResponseInspector, {
      snapshot: { content: "Answer", status: "complete", citations: [], datasets: [], segments: [] },
      sources: [{ id: "known" }],
    }));

    expect(screen.getByLabelText("Source citation events")).toHaveTextContent("no-citation-tokens");
    expect(warning).toHaveBeenCalledWith("[Markdown Flow] no-citation-tokens: sources were supplied but the response contains no citation tokens");
    warning.mockRestore();
  });
});
