import { describe, expect, it } from "vitest";

import { MARKDOWN_FLOW_PROTOCOL } from "../../src/ai/protocol";
import { applyMarkdownFlowResponse, applyMarkdownFlowStreamEvent, createMarkdownFlowStream } from "../../src/ai/stream";

const emptySnapshot = { status: "streaming" as const, citations: [], datasets: [] };

describe("stream adapters", () => {
  it("keeps model text separate from citations and datasets", () => {
    const parser = createMarkdownFlowStream();
    const citation = { id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "A source" };
    const dataset = { id: "sales", data: [] };
    let snapshot = applyMarkdownFlowStreamEvent(parser, emptySnapshot, { type: "text", delta: "Hello " });
    snapshot = applyMarkdownFlowStreamEvent(parser, snapshot, { type: "citation", citation });
    snapshot = applyMarkdownFlowStreamEvent(parser, snapshot, { type: "dataset", dataset });
    snapshot = applyMarkdownFlowStreamEvent(parser, snapshot, { type: "complete" });

    expect(snapshot).toMatchObject({ content: "Hello ", status: "complete", citations: [citation], datasets: [dataset] });
  });

  it("normalizes explicit stream errors and validates response protocol", () => {
    const parser = createMarkdownFlowStream();
    const failed = applyMarkdownFlowStreamEvent(parser, emptySnapshot, { type: "error", message: "Provider disconnected" });
    expect(failed).toMatchObject({ status: "error", error: "Provider disconnected" });
    expect(() => applyMarkdownFlowResponse(parser, { protocol: "other/v1" as typeof MARKDOWN_FLOW_PROTOCOL, content: "Nope" })).toThrow("Unsupported Markdown Flow protocol");
  });
});
