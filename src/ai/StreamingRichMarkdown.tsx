"use client";

import React from "react";

import RichMarkdown, { type RichMarkdownProps } from "../components/markdown/RichMarkdown";
import {
  applyMarkdownFlowStreamEvent,
  applyMarkdownFlowResponse,
  createMarkdownFlowStream,
  type MarkdownFlowStreamSegment,
  type MarkdownFlowStreamSnapshot,
  type MarkdownFlowStreamStatus,
} from "./stream";
import type { MarkdownFlowCitation, MarkdownFlowDataset, MarkdownFlowResponse, MarkdownFlowStreamEvent } from "./protocol";

export interface UseMarkdownFlowStreamOptions {
  citations?: readonly MarkdownFlowCitation[];
  datasets?: readonly MarkdownFlowDataset[];
}

export interface MarkdownFlowStreamController extends MarkdownFlowStreamSnapshot {
  append(delta: string): void;
  replace(content: string): void;
  apply(event: MarkdownFlowStreamEvent): void;
  applyResponse(response: MarkdownFlowResponse): void;
  complete(): void;
  fail(message: string): void;
  cancel(): void;
  retry(content?: string): void;
}

function makeSnapshot(
  parser: ReturnType<typeof createMarkdownFlowStream>,
  status: MarkdownFlowStreamStatus,
  citations: readonly MarkdownFlowCitation[],
  datasets: readonly MarkdownFlowDataset[],
  error?: string,
): MarkdownFlowStreamSnapshot {
  const segments = parser.getSegments();
  return { content: segments.map((segment) => segment.content).join(""), segments, status, error, citations, datasets };
}

/** State and controls for provider-neutral, incrementally rendered Markdown streams. */
export function useMarkdownFlowStream(initialContent = "", options: UseMarkdownFlowStreamOptions = {}): MarkdownFlowStreamController {
  const [parser] = React.useState(() => {
    const nextParser = createMarkdownFlowStream(initialContent);
    if (initialContent) nextParser.finish();
    return nextParser;
  });

  const [snapshot, setSnapshot] = React.useState(() => makeSnapshot(
    parser,
    initialContent ? "complete" : "streaming",
    options.citations ?? [],
    options.datasets ?? [],
  ));

  const append = React.useCallback((delta: string) => {
    parser.append(delta);
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets));
  }, [parser]);
  const replace = React.useCallback((content: string) => {
    parser.reset(content);
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets));
  }, [parser]);
  const apply = React.useCallback((event: MarkdownFlowStreamEvent) => {
    setSnapshot((previous) => applyMarkdownFlowStreamEvent(parser, previous, event));
  }, [parser]);
  const applyResponse = React.useCallback((response: MarkdownFlowResponse) => {
    setSnapshot(() => applyMarkdownFlowResponse(parser, response));
  }, [parser]);
  const complete = React.useCallback(() => {
    parser.finish();
    setSnapshot((previous) => makeSnapshot(parser, "complete", previous.citations, previous.datasets));
  }, [parser]);
  const fail = React.useCallback((message: string) => {
    setSnapshot((previous) => makeSnapshot(parser, "error", previous.citations, previous.datasets, message));
  }, [parser]);
  const cancel = React.useCallback(() => {
    setSnapshot((previous) => makeSnapshot(parser, "cancelled", previous.citations, previous.datasets));
  }, [parser]);
  const retry = React.useCallback((content = "") => {
    parser.reset(content);
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets));
  }, [parser]);

  return { ...snapshot, append, replace, apply, applyResponse, complete, fail, cancel, retry };
}

export interface StreamingRichMarkdownProps extends Omit<RichMarkdownProps, "content" | "citations"> {
  /** The accumulated provider text, for simple non-controller integrations. */
  content?: string;
  /** A hook controller returned by useMarkdownFlowStream. Takes precedence over content. */
  stream?: MarkdownFlowStreamSnapshot;
  citations?: readonly MarkdownFlowCitation[];
  status?: MarkdownFlowStreamStatus;
  error?: string;
  /** Chat-friendly anchoring. "if-at-bottom" avoids interrupting a reader who has scrolled away. */
  scrollBehavior?: "none" | "if-at-bottom" | "always";
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const RenderSegment = React.memo(function RenderSegment({
  segment,
  markdownProps,
  status,
}: {
  segment: MarkdownFlowStreamSegment;
  markdownProps: Omit<RichMarkdownProps, "content" | "citations"> & { citations?: readonly MarkdownFlowCitation[] };
  status: MarkdownFlowStreamStatus;
}) {
  if (segment.type === "pending") {
    const stopped = status !== "streaming";
    return (
      <div role={stopped ? "status" : "progressbar"} aria-label={stopped ? "Incomplete AI block" : "Rendering AI block"} className="my-8 border-y border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-sm text-[#6e6e73]">
        {stopped ? "The response ended before this AI block was complete." : `Rendering ${segment.language || "AI"} block…`}
        {stopped && <pre className="internal-scroll mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-[#515154]"><code>{segment.content}</code></pre>}
      </div>
    );
  }

  return <RichMarkdown {...markdownProps} citations={markdownProps.citations ? [...markdownProps.citations] : undefined} content={segment.content} />;
});

/**
 * Renders an LLM response as stable Markdown segments. Completed rich blocks
 * mount once; an unfinished fence gets a pending state instead of a broken UI.
 */
export function StreamingRichMarkdown({
  content = "",
  stream,
  citations,
  status = "streaming",
  error,
  scrollBehavior = "none",
  scrollContainerRef,
  ...markdownProps
}: StreamingRichMarkdownProps) {
  const activeStream = React.useMemo(() => {
    if (stream) return stream;
    const parser = createMarkdownFlowStream(content);
    if (status === "complete") parser.finish();
    return makeSnapshot(parser, status, citations ?? [], [], error);
  }, [citations, content, error, status, stream]);
  const segments = activeStream.segments;

  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container || scrollBehavior === "none") return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 64;
    if (scrollBehavior === "always" || isNearBottom) container.scrollTo(0, container.scrollHeight);
  }, [scrollBehavior, scrollContainerRef, segments]);

  return (
    <div aria-live="polite" aria-busy={activeStream.status === "streaming"}>
      {segments.map((segment) => <RenderSegment key={segment.id} segment={segment} markdownProps={{ ...markdownProps, citations: activeStream.citations }} status={activeStream.status} />)}
      {activeStream.error && <div role="alert" className="my-4 text-sm text-[#b42318]">{activeStream.error}</div>}
    </div>
  );
}
