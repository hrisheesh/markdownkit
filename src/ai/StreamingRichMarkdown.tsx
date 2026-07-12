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
  type MarkdownFlowStreamDiagnostics,
} from "./stream";
import type { MarkdownFlowCitation, MarkdownFlowDataset, MarkdownFlowResponse, MarkdownFlowStreamEvent } from "./protocol";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "./telemetry";
import { AIResponseInspector, type AIResponseInspectorEvent } from "./AIResponseInspector";

export interface UseMarkdownFlowStreamOptions {
  citations?: readonly MarkdownFlowCitation[];
  datasets?: readonly MarkdownFlowDataset[];
  telemetry?: MarkdownFlowTelemetry;
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
  diagnostics?: MarkdownFlowStreamDiagnostics,
): MarkdownFlowStreamSnapshot {
  const segments = parser.getSegments();
  return { content: segments.map((segment) => segment.content).join(""), segments, status, error, citations, datasets, diagnostics };
}

/** State and controls for provider-neutral, incrementally rendered Markdown streams. */
export function useMarkdownFlowStream(initialContent = "", options: UseMarkdownFlowStreamOptions = {}): MarkdownFlowStreamController {
  const [parser] = React.useState(() => {
    const nextParser = createMarkdownFlowStream(initialContent);
    if (initialContent) nextParser.finish();
    return nextParser;
  });

  const diagnostics = React.useRef<MarkdownFlowStreamDiagnostics>({
    chunkCount: initialContent ? 1 : 0,
    characterCount: initialContent.length,
    startedAt: 0,
    updatedAt: 0,
  });
  const recordChunk = React.useCallback((length: number) => {
    diagnostics.current = {
      ...diagnostics.current,
      chunkCount: diagnostics.current.chunkCount + 1,
      characterCount: diagnostics.current.characterCount + length,
      startedAt: diagnostics.current.startedAt || Date.now(),
      updatedAt: Date.now(),
    };
  }, []);
  const [snapshot, setSnapshot] = React.useState(() => makeSnapshot(
    parser,
    initialContent ? "complete" : "streaming",
    options.citations ?? [],
    options.datasets ?? [],
    undefined,
    { chunkCount: initialContent ? 1 : 0, characterCount: initialContent.length, startedAt: 0, updatedAt: 0 },
  ));

  React.useEffect(() => {
    emitMarkdownFlowTelemetry(options.telemetry, { type: "stream", outcome: snapshot.status, segmentCount: snapshot.segments.length });
  }, [options.telemetry, snapshot.segments.length, snapshot.status]);

  const append = React.useCallback((delta: string) => {
    parser.append(delta);
    recordChunk(delta.length);
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [parser, recordChunk]);
  const replace = React.useCallback((content: string) => {
    parser.reset(content);
    diagnostics.current = { chunkCount: content ? 1 : 0, characterCount: content.length, startedAt: Date.now(), updatedAt: Date.now() };
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [parser]);
  const apply = React.useCallback((event: MarkdownFlowStreamEvent) => {
    if (event.type === "text") recordChunk(event.delta.length);
    setSnapshot((previous) => ({ ...applyMarkdownFlowStreamEvent(parser, previous, event), diagnostics: diagnostics.current }));
  }, [parser, recordChunk]);
  const applyResponse = React.useCallback((response: MarkdownFlowResponse) => {
    diagnostics.current = { chunkCount: 1, characterCount: response.content.length, startedAt: Date.now(), updatedAt: Date.now() };
    setSnapshot(() => ({ ...applyMarkdownFlowResponse(parser, response), diagnostics: diagnostics.current }));
  }, [parser]);
  const complete = React.useCallback(() => {
    parser.finish();
    setSnapshot((previous) => makeSnapshot(parser, "complete", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [parser]);
  const fail = React.useCallback((message: string) => {
    setSnapshot((previous) => makeSnapshot(parser, "error", previous.citations, previous.datasets, message, diagnostics.current));
  }, [parser]);
  const cancel = React.useCallback(() => {
    setSnapshot((previous) => makeSnapshot(parser, "cancelled", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [parser]);
  const retry = React.useCallback((content = "") => {
    parser.reset(content);
    diagnostics.current = { chunkCount: content ? 1 : 0, characterCount: content.length, startedAt: Date.now(), updatedAt: Date.now() };
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
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
  /** Optional privacy-safe production observability hook. */
  telemetry?: MarkdownFlowTelemetry;
  /** Chat-friendly anchoring. "if-at-bottom" avoids interrupting a reader who has scrolled away. */
  scrollBehavior?: "none" | "if-at-bottom" | "always";
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Shows local parser state in development; stripped from production output. */
  debug?: boolean;
}

function shallowEqualProps(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftKeys = Object.keys(left);
  return leftKeys.length === Object.keys(right).length && leftKeys.every((key) => left[key] === right[key]);
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
}, (previous, next) => previous.segment === next.segment
  && previous.status === next.status
  && shallowEqualProps(previous.markdownProps, next.markdownProps));

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
  telemetry,
  scrollBehavior = "none",
  scrollContainerRef,
  debug = false,
  ...markdownProps
}: StreamingRichMarkdownProps) {
  const activeStream = React.useMemo(() => {
    if (stream) return stream;
    const parser = createMarkdownFlowStream(content);
    if (status === "complete") parser.finish();
    return makeSnapshot(parser, status, citations ?? [], [], error);
  }, [citations, content, error, status, stream]);
  const segments = activeStream.segments;
  const [debugEvents, setDebugEvents] = React.useState<readonly AIResponseInspectorEvent[]>([]);
  const activeTelemetry = React.useMemo<MarkdownFlowTelemetry | undefined>(() => {
    if (!debug || process.env.NODE_ENV === "production") return telemetry;
    return {
      context: telemetry?.context,
      track(event, context) {
        setDebugEvents((previous) => [...previous.slice(-24), { event, timestamp: Date.now() }]);
        telemetry?.track(event, context);
      },
    };
  }, [debug, telemetry]);

  React.useEffect(() => {
    emitMarkdownFlowTelemetry(activeTelemetry, { type: "stream", outcome: activeStream.status, segmentCount: segments.length });
  }, [activeStream.status, activeTelemetry, segments.length]);

  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container || scrollBehavior === "none") return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 64;
    if (scrollBehavior === "always" || isNearBottom) container.scrollTo(0, container.scrollHeight);
  }, [scrollBehavior, scrollContainerRef, segments]);

  return (
    <div aria-live="polite" aria-busy={activeStream.status === "streaming"}>
      {segments.map((segment) => <RenderSegment key={segment.id} segment={segment} markdownProps={{ ...markdownProps, citations: activeStream.citations, telemetry: activeTelemetry }} status={activeStream.status} />)}
      {activeStream.error && <div role="alert" className="my-4 text-sm text-[#b42318]">{activeStream.error}</div>}
      {debug && <AIResponseInspector snapshot={activeStream} events={debugEvents} />}
    </div>
  );
}
