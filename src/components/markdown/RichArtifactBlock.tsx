"use client";

import React from "react";

import type { MarkdownFlowArtifactFallbackProps, MarkdownFlowValidatedArtifact } from "../../ai/artifacts";
import type { MarkdownFlowResolverResult } from "../../ai/data";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";

export interface MarkdownFlowArtifactStateProps {
  state: MarkdownFlowArtifactFallbackProps["state"];
  message?: string;
  onRetry?: () => void;
}

/** Accessible default UI for loading and failure states in custom artifacts. */
export function MarkdownFlowArtifactState({ state, message, onRetry }: MarkdownFlowArtifactStateProps) {
  const text = message ?? ({
    loading: "Loading approved data…",
    unavailable: "Approved data is unavailable.",
    denied: "This artifact is not available to you.",
    error: "Approved data could not be loaded.",
    invalid: "This artifact could not be rendered safely.",
  }[state]);
  return (
    <div role={state === "error" || state === "invalid" ? "alert" : "status"} className="my-8 border-y border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-sm text-[#6e6e73]">
      <p>{text}</p>
      {onRetry && (state === "unavailable" || state === "error") && <button type="button" onClick={onRetry} className="mt-3 rounded-md border border-hairline px-3 py-1.5 font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40">Retry</button>}
    </div>
  );
}

function ResolvedArtifactRenderer({ artifact, telemetry }: { artifact: MarkdownFlowValidatedArtifact; telemetry?: MarkdownFlowTelemetry }) {
  const { definition, input } = artifact;
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [result, setResult] = React.useState<MarkdownFlowResolverResult<unknown>>({ status: "loading" });
  const refresh = React.useCallback(() => setRefreshToken((value) => value + 1), []);

  React.useEffect(() => {
    let active = true;
    // The parent only mounts this branch for artifacts with a resolver.
    void definition.resolver!(input)
      .then((next) => { if (active) setResult(next); })
      .catch(() => { if (active) setResult({ status: "error", message: "Approved data could not be loaded." }); });
    return () => { active = false; };
  }, [definition, input, refreshToken]);

  React.useEffect(() => {
    emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "artifact", outcome: result.status });
  }, [result.status, telemetry]);

  if (result.status === "ready" && result.value !== undefined) {
    return <>{definition.render({ name: definition.name, version: definition.version, input, value: result.value, refresh })}</>;
  }
  const state = result.status === "ready" ? "unavailable" : result.status;
  return <>{definition.fallback({ name: definition.name, version: definition.version, reason: result.message ?? "The artifact is not available.", state, retry: refresh })}</>;
}

export default function RichArtifactBlock({ artifact, telemetry }: { artifact: MarkdownFlowValidatedArtifact; telemetry?: MarkdownFlowTelemetry }) {
  if (!artifact.definition.resolver) {
    return <>{artifact.definition.render({ name: artifact.definition.name, version: artifact.definition.version, input: artifact.input, value: artifact.input })}</>;
  }
  return <ResolvedArtifactRenderer key={`${artifact.definition.name}\u0000${artifact.definition.version}`} artifact={artifact} telemetry={telemetry} />;
}
