// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AIResponse } from "../../src/ai/AIResponse";

describe("AIResponse controlled content streaming", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("batches append-only controlled updates and replaces non-prefix edits", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const handle = callbacks.size + 1;
      callbacks.set(handle, callback);
      return handle;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const { rerender } = render(<AIResponse content="Hello" sources={[{ id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "Source" }]} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();

    rerender(<AIResponse content="Hello wor" sources={[{ id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "Source" }]} />);
    rerender(<AIResponse content="Hello world" sources={[{ id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "Source" }]} />);
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();

    act(() => callbacks.forEach((callback) => callback(0)));
    expect(screen.getByText("Hello world")).toBeInTheDocument();

    rerender(<AIResponse content="Goodbye" status="complete" sources={[{ id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "Source" }]} />);
    expect(screen.getByText("Goodbye")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /incomplete ai block/i })).not.toBeInTheDocument();
  });

  it("returns a controlled response to streaming when a new generation starts", () => {
    const { rerender } = render(<AIResponse content="First" status="complete" />);
    expect(screen.queryByRole("status", { name: /generating response/i })).not.toBeInTheDocument();

    rerender(<AIResponse content="Second" status="streaming" />);

    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /generating response/i })).toBeInTheDocument();
  });
});
