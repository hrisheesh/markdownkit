// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AIResponse } from "../../src/ai/AIResponse";
import {
  normalizeAnthropicStream,
  normalizeAnthropicStreamChunk,
  normalizeOpenAIStream,
  normalizeOpenAIStreamChunk,
  normalizeVercelAIStream,
  normalizeVercelAIStreamChunk,
} from "../../src/ai/integration";
import { applyMarkdownFlowStreamEvent, createMarkdownFlowStream } from "../../src/ai/stream";

const replays = {
  openai: [
    { choices: [{ delta: { content: "Open" }, finish_reason: null }] },
    { type: "response.output_text.delta", delta: "AI" },
    { choices: [{ delta: {}, finish_reason: "stop" }] },
  ],
  anthropic: [
    { type: "content_block_delta", delta: { type: "text_delta", text: "Anth" } },
    { type: "content_block_delta", delta: { type: "text_delta", text: "ropic" } },
    { type: "message_stop" },
  ],
  vercel: [
    { type: "text-delta", delta: "Vercel " },
    { type: "text-delta", textDelta: "AI SDK" },
    { type: "finish" },
  ],
} as const;

async function eventsOf(stream: AsyncIterable<unknown>, normalize: (chunks: AsyncIterable<unknown>) => AsyncIterable<{ type: string; delta?: string }>) {
  const events = [] as { type: string; delta?: string }[];
  for await (const event of normalize(stream)) events.push(event);
  return events;
}

async function* replay(values: readonly unknown[]) {
  yield* values;
}

describe("provider adapters", () => {
  it("normalizes OpenAI, Anthropic, and Vercel AI SDK replay fixtures without provider dependencies", async () => {
    await expect(eventsOf(replay(replays.openai), normalizeOpenAIStream)).resolves.toEqual([
      { type: "text", delta: "Open" }, { type: "text", delta: "AI" }, { type: "complete" },
    ]);
    await expect(eventsOf(replay(replays.anthropic), normalizeAnthropicStream)).resolves.toEqual([
      { type: "text", delta: "Anth" }, { type: "text", delta: "ropic" }, { type: "complete" },
    ]);
    await expect(eventsOf(replay(replays.vercel), normalizeVercelAIStream)).resolves.toEqual([
      { type: "text", delta: "Vercel " }, { type: "text", delta: "AI SDK" }, { type: "complete" },
    ]);
  });

  it("renders adapted provider output through the normal policy-owned AI response surface", () => {
    const parser = createMarkdownFlowStream();
    let snapshot = { status: "streaming" as const, citations: [], datasets: [] };
    for (const chunk of replays.anthropic) {
      for (const event of normalizeAnthropicStreamChunk(chunk)) snapshot = applyMarkdownFlowStreamEvent(parser, snapshot, event);
    }

    render(<AIResponse content={snapshot.content} status={snapshot.status} preset="chat" />);
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("does not treat non-text provider parts as renderable Markdown", () => {
    expect(normalizeAnthropicStreamChunk({ type: "content_block_delta", delta: { type: "input_json_delta", partial_json: "{}" } })).toEqual([]);
    expect(normalizeOpenAIStreamChunk({ type: "response.function_call_arguments.delta", delta: "{}" })).toEqual([]);
    expect(normalizeVercelAIStreamChunk({ type: "tool-input-delta", delta: "{}" })).toEqual([]);
  });
});
