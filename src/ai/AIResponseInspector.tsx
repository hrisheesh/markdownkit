"use client";

import React from "react";

import { diagnoseMarkdownFlowCitations, type MarkdownFlowCitationDiagnostic, type MarkdownFlowSourceInput } from "./citations";
import type { MarkdownFlowStreamSnapshot } from "./stream";
import type { MarkdownFlowTelemetryEvent } from "./telemetry";

export interface AIResponseInspectorEvent {
  event: MarkdownFlowTelemetryEvent;
  timestamp: number;
}

export interface AIResponseInspectorProps {
  snapshot: MarkdownFlowStreamSnapshot;
  events?: readonly AIResponseInspectorEvent[];
  /** Optional source metadata; legacy stream citations are used by default. */
  sources?: readonly MarkdownFlowSourceInput[];
}

/** Development-only view of parser state. It deliberately never sends data anywhere. */
export function AIResponseInspector({ snapshot, events = [], sources }: AIResponseInspectorProps) {
  const diagnostics = snapshot.diagnostics;
  const citationDiagnostics = React.useMemo(
    () => diagnoseMarkdownFlowCitations(snapshot.content, sources ?? snapshot.citations),
    [snapshot.citations, snapshot.content, sources],
  );
  const citationDiagnosticKey = citationDiagnostics.map((diagnostic) => (
    diagnostic.type === "invalid-source-id"
      ? `${diagnostic.type}:${diagnostic.sourceId}`
      : diagnostic.type === "unmatched-citation-token"
        ? `${diagnostic.type}:${diagnostic.citationId}`
        : diagnostic.type
  )).join("|");

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    citationDiagnostics.forEach((diagnostic) => {
      const detail = diagnostic.type === "no-citation-tokens"
        ? "sources were supplied but the response contains no citation tokens"
        : diagnostic.type === "unmatched-citation-token" ? diagnostic.citationId : diagnostic.sourceId;
      console.warn(`[Markdown Flow] ${diagnostic.type}: ${detail}`);
    });
  }, [citationDiagnosticKey, citationDiagnostics]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <details className="my-4 rounded-lg border border-dashed border-[#6e6e73] bg-[#fbfbfd] p-3 text-xs text-[#1d1d1f]" data-markdown-flow-inspector>
      <summary className="cursor-pointer font-medium">Markdown Flow development inspector</summary>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <dt>Status</dt><dd>{snapshot.status}</dd>
        <dt>Segments</dt><dd>{snapshot.segments.length}</dd>
        <dt>Chunks</dt><dd>{diagnostics?.chunkCount ?? 0}</dd>
        <dt>Characters received</dt><dd>{diagnostics?.characterCount ?? snapshot.content.length}</dd>
        <dt>Elapsed</dt><dd>{diagnostics?.startedAt ? `${Math.max(0, (diagnostics.updatedAt - diagnostics.startedAt) / 1000).toFixed(2)}s` : "—"}</dd>
      </dl>
      <ol className="mt-3 space-y-2" aria-label="Response segments">
        {snapshot.segments.map((segment, index) => (
          <li key={segment.id} className="rounded border border-black/[0.08] bg-white p-2">
            <strong>#{index + 1} {segment.type}</strong>
            {segment.type !== "markdown" && <> · {segment.language} · {segment.lifecycle}</>}
            <pre className="internal-scroll mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-[11px]"><code>{segment.content}</code></pre>
          </li>
        ))}
      </ol>
      <h3 className="mt-3 font-medium">Validation and resolution events</h3>
      {events.length ? (
        <ol className="mt-2 space-y-1" aria-label="Validation and resolution events">
          {events.map(({ event, timestamp }, index) => <li key={`${timestamp}-${index}`} className="rounded bg-white px-2 py-1"><code>{event.type}</code> · {event.outcome}{"blockType" in event ? ` · ${event.blockType}` : ""}{"resolver" in event ? ` · ${event.resolver}` : ""}</li>)}
        </ol>
      ) : <p className="mt-2 text-[#6e6e73]">No validation, fallback, or resolver events have occurred.</p>}
      <h3 className="mt-3 font-medium">Source citation events</h3>
      {citationDiagnostics.length ? (
        <ol className="mt-2 space-y-1" aria-label="Source citation events">
          {citationDiagnostics.map((diagnostic, index) => <CitationDiagnosticEvent key={`${citationDiagnosticKey}-${index}`} diagnostic={diagnostic} />)}
        </ol>
      ) : <p className="mt-2 text-[#6e6e73]">No source citation issues detected.</p>}
      <p className="mt-3 text-[#6e6e73]">Development only. This panel is not rendered in production and does not emit telemetry.</p>
    </details>
  );
}

function CitationDiagnosticEvent({ diagnostic }: { diagnostic: MarkdownFlowCitationDiagnostic }) {
  const detail = diagnostic.type === "no-citation-tokens"
    ? "sources were supplied but the response contains no citation tokens"
    : diagnostic.type === "unmatched-citation-token" ? diagnostic.citationId : diagnostic.sourceId;
  return <li className="rounded bg-white px-2 py-1"><code>{diagnostic.type}</code> · {detail}</li>;
}
