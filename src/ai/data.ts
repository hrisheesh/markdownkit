"use client";

import React from "react";

import type { MarkdownFlowCitation, MarkdownFlowDatasetSchema } from "./protocol";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "./telemetry";

export type MarkdownFlowResolverStatus = "loading" | "ready" | "unavailable" | "denied" | "error";

export interface MarkdownFlowResolverResult<T> {
  status: MarkdownFlowResolverStatus;
  value?: T;
  message?: string;
  updatedAt?: number;
}

export interface MarkdownFlowDatasetRequest {
  id: string;
  fields: readonly string[];
}

export interface MarkdownFlowResolvedDataset {
  id: string;
  data: readonly Record<string, string | number | boolean | null>[];
  schema: MarkdownFlowDatasetSchema;
}

/** Resolves source details from a host-authorized RAG source store. */
export interface MarkdownFlowCitationResolver {
  resolve(citationId: string): Promise<MarkdownFlowResolverResult<MarkdownFlowCitation>>;
}

/** Resolves an allowlisted dataset after the host has applied tenant and user permissions. */
export interface MarkdownFlowDatasetResolver {
  resolve(request: MarkdownFlowDatasetRequest): Promise<MarkdownFlowResolverResult<MarkdownFlowResolvedDataset>>;
}

export interface MarkdownFlowDatasetState extends MarkdownFlowResolverResult<MarkdownFlowResolvedDataset> {
  refresh(): void;
}

const datasetCache = new WeakMap<MarkdownFlowDatasetResolver, Map<string, MarkdownFlowResolverResult<MarkdownFlowResolvedDataset>>>();
const citationCache = new WeakMap<MarkdownFlowCitationResolver, Map<string, MarkdownFlowCitation>>();

function validateResolvedDataset(
  request: MarkdownFlowDatasetRequest,
  result: MarkdownFlowResolverResult<MarkdownFlowResolvedDataset>,
): MarkdownFlowResolverResult<MarkdownFlowResolvedDataset> {
  if (result.status !== "ready" || !result.value) return result;
  const dataset = result.value;
  const allowed = new Set(dataset.schema.fields);
  const missingField = request.fields.some((field) => !allowed.has(field)
    || dataset.data.some((row) => !(field in row)));
  if (dataset.id !== request.id || missingField) {
    return { status: "error", message: "The approved data does not contain the requested fields." };
  }
  return result;
}

/**
 * Resolves trusted data independently of the model narrative. Results are cached
 * per resolver and requested field set; calling `refresh` only reloads the data.
 */
export function useMarkdownFlowDataset(
  request: MarkdownFlowDatasetRequest | undefined,
  resolver: MarkdownFlowDatasetResolver | undefined,
): MarkdownFlowDatasetState {
  const requestId = request?.id;
  const requestFields = request ? [...request.fields].sort().join("\u0000") : "";
  const requestKey = requestId ? `${requestId}\u0000${requestFields}` : "";
  const stableRequest = React.useMemo(() => requestId ? {
    id: requestId,
    fields: requestFields ? requestFields.split("\u0000") : [],
  } : undefined, [requestFields, requestId]);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [result, setResult] = React.useState<MarkdownFlowResolverResult<MarkdownFlowResolvedDataset>>(() => {
    if (!request || !resolver) return { status: "unavailable" };
    return datasetCache.get(resolver)?.get(requestKey) ?? { status: "loading" };
  });

  React.useEffect(() => {
    let active = true;
    if (!stableRequest || !resolver) {
      void Promise.resolve().then(() => { if (active) setResult({ status: "unavailable" }); });
      return () => { active = false; };
    }
    const cache = datasetCache.get(resolver) ?? new Map<string, MarkdownFlowResolverResult<MarkdownFlowResolvedDataset>>();
    datasetCache.set(resolver, cache);
    if (refreshToken === 0) {
      const cached = cache.get(requestKey);
      if (cached) {
        void Promise.resolve().then(() => { if (active) setResult(cached); });
        return () => { active = false; };
      }
    }
    void Promise.resolve().then(() => { if (active) setResult({ status: "loading" }); });
    void resolver.resolve(stableRequest)
      .then((next) => validateResolvedDataset(stableRequest, next))
      .catch(() => ({ status: "error" as const, message: "Approved data could not be loaded." }))
      .then((next) => {
        cache.set(requestKey, next);
        if (active) setResult(next);
      });
    return () => { active = false; };
  }, [requestKey, refreshToken, resolver, stableRequest]);

  return { ...result, refresh: () => setRefreshToken((value) => value + 1) };
}

/** Resolves only citation IDs present in a narrative when the host has not already supplied their metadata. */
export function useMarkdownFlowCitations(
  citationIds: readonly string[],
  citations: readonly MarkdownFlowCitation[] | undefined,
  resolver: MarkdownFlowCitationResolver | undefined,
  telemetry?: MarkdownFlowTelemetry,
): readonly MarkdownFlowCitation[] {
  const key = [...new Set(citationIds)].sort().join("\u0000");
  const ids = React.useMemo(() => key ? key.split("\u0000") : [], [key]);
  const suppliedKey = (citations ?? []).map((citation) => [citation.id, citation.chunk_id, citation.document_id, citation.filename, citation.contextual_header, citation.text_preview].join("\u0001")).join("\u0000");
  // The signature deliberately controls identity so an equivalent caller array does not retrigger resolution.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supplied = React.useMemo(() => citations ?? [], [suppliedKey]);
  const [resolved, setResolved] = React.useState<readonly MarkdownFlowCitation[]>([]);

  React.useEffect(() => {
    let active = true;
    if (!resolver || ids.length === 0) {
      void Promise.resolve().then(() => { if (active) setResolved([]); });
      return () => { active = false; };
    }
    const suppliedIds = new Set(supplied.map((citation) => citation.id.replace(/[\[\]]/g, "")));
    const missing = ids.filter((id) => !suppliedIds.has(id));
    if (missing.length) emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "citation", outcome: "loading" });
    const cache = citationCache.get(resolver) ?? new Map<string, MarkdownFlowCitation>();
    citationCache.set(resolver, cache);
    void Promise.all(missing.map(async (id) => {
      const cached = cache.get(id);
      if (cached) return cached;
      const result = await resolver.resolve(id);
      if (result.status === "ready" && result.value) {
        cache.set(id, result.value);
        emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "citation", outcome: "ready" });
        return result.value;
      }
      emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "citation", outcome: result.status });
      return undefined;
    })).then((next) => {
      if (active) setResolved(next.filter((citation): citation is MarkdownFlowCitation => Boolean(citation)));
    }).catch(() => {
      emitMarkdownFlowTelemetry(telemetry, { type: "resolver", resolver: "citation", outcome: "error" });
      if (active) setResolved([]);
    });
    return () => { active = false; };
  // `suppliedKey` changes whenever relevant supplied citation metadata changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, key, resolver, suppliedKey, telemetry]);

  return React.useMemo(() => {
    const byId = new Map<string, MarkdownFlowCitation>();
    [...supplied, ...resolved].forEach((citation) => byId.set(citation.id.replace(/[\[\]]/g, ""), citation));
    return [...byId.values()];
  }, [resolved, supplied]);
}
