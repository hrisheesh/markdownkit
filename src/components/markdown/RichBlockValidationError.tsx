import React from "react";

import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";

export default function RichBlockValidationError({ reason, blockType = "unknown", telemetry }: { reason: string; blockType?: string; telemetry?: MarkdownFlowTelemetry }) {
  React.useEffect(() => {
    emitMarkdownFlowTelemetry(telemetry, { type: "block", outcome: "invalid", blockType, reason });
  }, [blockType, reason, telemetry]);

  return (
    <div role="alert" className="my-8 border-y border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-sm text-[#6e6e73]">
      This AI block could not be rendered safely. {reason}
    </div>
  );
}
