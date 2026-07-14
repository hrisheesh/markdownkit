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
import type { MarkdownFlowNormalizationMode } from "./model";

export interface UseMarkdownFlowStreamOptions {
  citations?: readonly MarkdownFlowCitation[];
  datasets?: readonly MarkdownFlowDataset[];
  telemetry?: MarkdownFlowTelemetry;
  /** Initial lifecycle state for a stream created with existing content. */
  initialStatus?: MarkdownFlowStreamStatus;
  /** Initial error associated with a stream created in an error state. */
  initialError?: string;
  /** Whether predictable LLM fence variations are recovered or rejected. */
  normalization?: MarkdownFlowNormalizationMode;
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
  const initialStatus = options.initialStatus ?? (initialContent ? "complete" : "streaming");
  const [parser] = React.useState(() => {
    const nextParser = createMarkdownFlowStream(initialContent, { normalization: options.normalization });
    if (initialStatus === "complete") nextParser.finish();
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
    initialStatus,
    options.citations ?? [],
    options.datasets ?? [],
    options.initialError,
    { chunkCount: initialContent ? 1 : 0, characterCount: initialContent.length, startedAt: 0, updatedAt: 0 },
  ));
  const queuedText = React.useRef("");
  const frame = React.useRef<number | null>(null);
  const lifecycle = React.useRef<MarkdownFlowStreamStatus>(initialStatus);

  const cancelQueuedFrame = React.useCallback(() => {
    if (frame.current === null) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame.current);
    else window.clearTimeout(frame.current);
    frame.current = null;
  }, []);
  const flushQueuedText = React.useCallback(() => {
    // A lifecycle event may flush synchronously before the scheduled frame.
    // Cancel that frame so an old callback cannot race a subsequent generation.
    cancelQueuedFrame();
    const delta = queuedText.current;
    if (!delta) return;
    queuedText.current = "";
    parser.append(delta);
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [cancelQueuedFrame, parser]);
  const queueText = React.useCallback((delta: string) => {
    if (!delta) return;
    queuedText.current += delta;
    if (frame.current !== null) return;
    frame.current = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame(flushQueuedText)
      : window.setTimeout(flushQueuedText, 0);
  }, [flushQueuedText]);

  React.useEffect(() => cancelQueuedFrame, [cancelQueuedFrame]);

  React.useEffect(() => {
    emitMarkdownFlowTelemetry(options.telemetry, { type: "stream", outcome: snapshot.status, segmentCount: snapshot.segments.length });
  }, [options.telemetry, snapshot.segments.length, snapshot.status]);

  const append = React.useCallback((delta: string) => {
    if (lifecycle.current !== "streaming" || !delta) return;
    recordChunk(delta.length);
    queueText(delta);
  }, [queueText, recordChunk]);
  const replace = React.useCallback((content: string) => {
    queuedText.current = "";
    cancelQueuedFrame();
    parser.reset(content);
    lifecycle.current = "streaming";
    diagnostics.current = { chunkCount: content ? 1 : 0, characterCount: content.length, startedAt: Date.now(), updatedAt: Date.now() };
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [cancelQueuedFrame, parser]);
  const apply = React.useCallback((event: MarkdownFlowStreamEvent) => {
    if (event.type === "text") {
      append(event.delta);
      return;
    }
    if (lifecycle.current !== "streaming") return;
    flushQueuedText();
    setSnapshot((previous) => {
      const next = applyMarkdownFlowStreamEvent(parser, previous, event);
      lifecycle.current = next.status;
      return { ...next, diagnostics: diagnostics.current };
    });
  }, [append, flushQueuedText, parser]);
  const applyResponse = React.useCallback((response: MarkdownFlowResponse) => {
    queuedText.current = "";
    cancelQueuedFrame();
    diagnostics.current = { chunkCount: 1, characterCount: response.content.length, startedAt: Date.now(), updatedAt: Date.now() };
    lifecycle.current = "complete";
    setSnapshot(() => ({ ...applyMarkdownFlowResponse(parser, response), diagnostics: diagnostics.current }));
  }, [cancelQueuedFrame, parser]);
  const complete = React.useCallback(() => {
    if (lifecycle.current !== "streaming") return;
    flushQueuedText();
    parser.finish();
    lifecycle.current = "complete";
    setSnapshot((previous) => makeSnapshot(parser, "complete", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [flushQueuedText, parser]);
  const fail = React.useCallback((message: string) => {
    if (lifecycle.current !== "streaming") return;
    flushQueuedText();
    cancelQueuedFrame();
    lifecycle.current = "error";
    setSnapshot((previous) => makeSnapshot(parser, "error", previous.citations, previous.datasets, message, diagnostics.current));
  }, [cancelQueuedFrame, flushQueuedText, parser]);
  const cancel = React.useCallback(() => {
    if (lifecycle.current !== "streaming") return;
    flushQueuedText();
    cancelQueuedFrame();
    lifecycle.current = "cancelled";
    setSnapshot((previous) => makeSnapshot(parser, "cancelled", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [cancelQueuedFrame, flushQueuedText, parser]);
  const retry = React.useCallback((content = "") => {
    queuedText.current = "";
    cancelQueuedFrame();
    parser.reset(content);
    lifecycle.current = "streaming";
    diagnostics.current = { chunkCount: content ? 1 : 0, characterCount: content.length, startedAt: Date.now(), updatedAt: Date.now() };
    setSnapshot((previous) => makeSnapshot(parser, "streaming", previous.citations, previous.datasets, undefined, diagnostics.current));
  }, [cancelQueuedFrame, parser]);

  return { ...snapshot, append, replace, apply, applyResponse, complete, fail, cancel, retry };
}

export interface UseControlledMarkdownFlowStreamOptions extends UseMarkdownFlowStreamOptions {
  status?: MarkdownFlowStreamStatus;
  error?: string;
}

/**
 * Adapts an accumulated, controlled string to the incremental stream model.
 * Prefix-preserving updates are queued as deltas; edits reset the parser.
 */
export function useControlledMarkdownFlowStream(
  content: string,
  { status = "streaming", error, citations, datasets, telemetry, normalization }: UseControlledMarkdownFlowStreamOptions = {},
): MarkdownFlowStreamController {
  const controller = useMarkdownFlowStream(content, {
    citations,
    datasets,
    telemetry,
    initialStatus: status,
    initialError: error,
    normalization,
  });
  const previousContent = React.useRef(content);
  const previousStatus = React.useRef(status);

  React.useEffect(() => {
    const previous = previousContent.current;
    if (content !== previous) {
      if (content.startsWith(previous)) controller.append(content.slice(previous.length));
      else controller.replace(content);
      previousContent.current = content;
    }
  }, [content, controller]);

  React.useEffect(() => {
    if (status === previousStatus.current) return;
    previousStatus.current = status;
    if (status === "streaming") controller.retry(content);
    else if (status === "complete") controller.complete();
    else if (status === "error") controller.fail(error ?? "");
    else if (status === "cancelled") controller.cancel();
  }, [content, controller, error, status]);

  return {
    ...controller,
    status,
    error,
    citations: citations ?? controller.citations,
    datasets: datasets ?? controller.datasets,
  };
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
      <div role={stopped ? "status" : "progressbar"} aria-label={stopped ? "Incomplete AI block" : "Rendering AI block"} className="rich-block-state rich-stream-pending">
        <div className="rich-stream-row">
          <span className={`rich-stream-icon ${stopped ? "rich-stream-icon-warning" : ""}`} aria-hidden="true">
            {stopped ? "!" : <span className="rich-stream-pulse" />}
          </span>
          <span>{stopped ? "The response ended before this AI block was complete." : `Rendering ${segment.language || "AI"} block…`}</span>
        </div>
        {stopped && <pre className="internal-scroll rich-stream-source"><code>{segment.content}</code></pre>}
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
    <div className="markdown-render min-w-0" aria-live="polite" aria-busy={activeStream.status === "streaming"}>
      {activeStream.status === "streaming" && (
        <div role="status" aria-label="Generating response" className="rich-stream-generating">
          <span className="rich-stream-dots" aria-hidden="true">
            <span className="rich-stream-dot" />
            <span className="rich-stream-dot" />
            <span className="rich-stream-dot" />
          </span>
          Generating response…
        </div>
      )}
      {segments.map((segment) => <RenderSegment key={segment.id} segment={segment} markdownProps={{ ...markdownProps, citations: activeStream.citations, telemetry: activeTelemetry }} status={activeStream.status} />)}
      {activeStream.error && <div role="alert" className="rich-block-state rich-stream-error">{activeStream.error}</div>}
      {debug && <AIResponseInspector snapshot={activeStream} events={debugEvents} />}
    </div>
  );
}
