/**
 * Privacy-safe signals for observing AI rendering in production. Event metadata
 * intentionally excludes model text, dataset rows, citation contents, URLs,
 * and resolver error details.
 */
export type MarkdownFlowTelemetryEvent =
  | { type: "block"; outcome: "accepted" | "invalid" | "fallback"; blockType: string; reason?: string }
  | { type: "render"; outcome: "complete"; durationMs: number; contentLength: number; blockCount: number }
  | { type: "stream"; outcome: "streaming" | "complete" | "error" | "cancelled"; segmentCount: number }
  | { type: "resolver"; outcome: "loading" | "ready" | "unavailable" | "denied" | "error"; resolver: "dataset" | "artifact" | "citation" };

export interface MarkdownFlowTelemetryContext {
  /** A host-generated request or trace ID. Never put user identifiers or model content here. */
  requestId?: string;
  /** A host-defined product area such as "support-assistant". */
  surface?: string;
}

export interface MarkdownFlowTelemetry {
  context?: MarkdownFlowTelemetryContext;
  track(event: MarkdownFlowTelemetryEvent, context?: MarkdownFlowTelemetryContext): void;
}

/** Emits an optional telemetry event without allowing observability failures to affect rendering. */
export function emitMarkdownFlowTelemetry(
  telemetry: MarkdownFlowTelemetry | undefined,
  event: MarkdownFlowTelemetryEvent,
): void {
  try {
    telemetry?.track(event, telemetry.context);
  } catch {
    // Telemetry is strictly best-effort and must never break a response UI.
  }
}
