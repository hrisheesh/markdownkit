import React from "react";

import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";

export default function RichBlockValidationError({ reason, blockType = "unknown", telemetry }: { reason: string; blockType?: string; telemetry?: MarkdownFlowTelemetry }) {
  React.useEffect(() => {
    emitMarkdownFlowTelemetry(telemetry, { type: "block", outcome: "invalid", blockType, reason });
  }, [blockType, reason, telemetry]);

  return (
    <div role="alert" className="rich-block-state my-6 px-4 py-3.5 text-sm leading-6 sm:px-5">
      This AI block could not be rendered safely.
      {process.env.NODE_ENV !== "production" && <span> {reason}</span>}
    </div>
  );
}
