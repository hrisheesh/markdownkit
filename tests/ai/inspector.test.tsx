// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AIResponseInspector } from "../../src/ai/AIResponseInspector";

describe("AIResponseInspector", () => {
  it("shows local parser metadata without a telemetry dependency", () => {
    render(
      <AIResponseInspector snapshot={{
        content: "Hello",
        status: "streaming",
        citations: [],
        datasets: [],
        diagnostics: { chunkCount: 2, characterCount: 5, startedAt: 1, updatedAt: 2 },
        segments: [{ id: "markdown-0", type: "markdown", content: "Hello" }],
      }} events={[{ event: { type: "block", outcome: "invalid", blockType: "chart" }, timestamp: 1 }]} />,
    );

    expect(screen.getByText("Markdown Flow development inspector")).toBeInTheDocument();
    expect(screen.getByText("Chunks")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/invalid · chart/)).toBeInTheDocument();
  });
});
