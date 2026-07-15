import React from "react";
import JSON5 from "json5";

import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";

function readableValues(value: unknown, depth = 0): string[] {
  if (depth > 3) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.slice(0, 12).flatMap((item) => readableValues(item, depth + 1));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const preferred = ["title", "heading", "label", "name", "body", "description", "content", "text", "value", "detail"];
  const direct = preferred.flatMap((key) => readableValues(record[key], depth + 1));
  if (direct.length) return direct;
  const containers = ["items", "tabs", "cards", "files", "metrics", "rows", "images", "locations"];
  return containers.flatMap((key) => readableValues(record[key], depth + 1));
}

function fallbackContent(code?: string): { lines: string[]; raw?: string } {
  if (!code?.trim()) return { lines: [] };
  try {
    const lines = [...new Set(readableValues(JSON5.parse(code.replace(/^`+|`+$/g, "").trim())))].slice(0, 8);
    return lines.length ? { lines } : { lines: [], raw: code.trim().slice(0, 2_000) };
  } catch {
    return { lines: [], raw: code.trim().slice(0, 2_000) };
  }
}

export default function RichBlockValidationError({ reason, blockType = "unknown", code, telemetry }: { reason: string; blockType?: string; code?: string; telemetry?: MarkdownFlowTelemetry }) {
  const content = React.useMemo(() => fallbackContent(code), [code]);
  React.useEffect(() => {
    emitMarkdownFlowTelemetry(telemetry, { type: "block", outcome: "invalid", blockType, reason });
  }, [blockType, reason, telemetry]);

  return (
    <div role="note" className="rich-block-fallback my-6 px-4 py-4 sm:px-5">
      <p className="rich-block-fallback-label">{content.lines.length || content.raw ? "Rendered as plain content" : "Block unavailable"}</p>
      {content.lines.length > 0 && <div className="rich-block-fallback-copy">{content.lines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}</div>}
      {content.raw && <pre className="rich-block-fallback-raw"><code>{content.raw}</code></pre>}
      {!content.lines.length && !content.raw && <p className="rich-block-fallback-copy">This block is unavailable under the current rendering policy.</p>}
      {process.env.NODE_ENV !== "production" && <p className="rich-block-fallback-reason">{reason}</p>}
    </div>
  );
}
