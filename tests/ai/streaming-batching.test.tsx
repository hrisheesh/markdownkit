// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMarkdownFlowStream } from "../../src/ai/StreamingRichMarkdown";

describe("useMarkdownFlowStream animation-frame batching", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("coalesces text updates into one animation-frame flush", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const handle = callbacks.size + 1;
      callbacks.set(handle, callback);
      return handle;
    });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const { result } = renderHook(() => useMarkdownFlowStream());

    act(() => {
      result.current.append("Hello ");
      result.current.append("world");
    });

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(result.current.content).toBe("");

    act(() => callbacks.get(1)?.(0));

    expect(result.current.content).toBe("Hello world");
    expect(result.current.status).toBe("streaming");
    expect(result.current.diagnostics).toMatchObject({ chunkCount: 2, characterCount: 11 });
  });

  it("flushes queued text before applying a non-text event or completing", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const handle = callbacks.size + 1;
      callbacks.set(handle, callback);
      return handle;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const citation = { id: "source", chunk_id: "chunk", document_id: "doc", filename: "notes.md", text_preview: "Source" };
    const { result } = renderHook(() => useMarkdownFlowStream());

    act(() => {
      result.current.append("Before citation");
      result.current.apply({ type: "citation", citation });
    });

    expect(result.current.content).toBe("Before citation");
    expect(result.current.citations).toEqual([citation]);

    act(() => {
      result.current.append(" and completion");
      result.current.complete();
    });

    expect(result.current).toMatchObject({ content: "Before citation and completion", status: "complete" });

    act(() => callbacks.forEach((callback) => callback(0)));

    expect(result.current).toMatchObject({ content: "Before citation and completion", status: "complete" });
  });

  it("does not revive a completed stream when delayed provider text arrives", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const handle = callbacks.size + 1;
      callbacks.set(handle, callback);
      return handle;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { result } = renderHook(() => useMarkdownFlowStream());

    act(() => {
      result.current.append("Final");
      result.current.complete();
      result.current.append(" late");
      result.current.apply({ type: "text", delta: " provider text" });
    });

    expect(result.current).toMatchObject({ content: "Final", status: "complete" });
    act(() => callbacks.forEach((callback) => callback(0)));
    expect(result.current).toMatchObject({ content: "Final", status: "complete" });
  });
});
