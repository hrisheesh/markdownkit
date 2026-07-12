"use client";

import React from "react";
import type { Components } from "react-markdown";

import type { RichMarkdownProps } from "../components/markdown/RichMarkdown";
import {
  createMarkdownFlowArtifactRegistry,
  type MarkdownFlowArtifactDefinition,
  type MarkdownFlowArtifactFallbackProps,
  type MarkdownFlowArtifactRegistry,
  type MarkdownFlowArtifactSchema,
} from "./artifacts";
import { getAIResponsePresetPolicy, type AIResponsePreset } from "./presets";
import type { MarkdownFlowCitation, MarkdownFlowRenderPolicy } from "./protocol";
import {
  StreamingRichMarkdown,
  useMarkdownFlowStream,
  type MarkdownFlowStreamController,
  type StreamingRichMarkdownProps,
  type UseMarkdownFlowStreamOptions,
} from "./StreamingRichMarkdown";

export type AIResponseComponent<TInput = Record<string, unknown>> =
  | React.ComponentType<{ input: TInput }>
  | {
    component: React.ComponentType<{ input: TInput }>;
    schema?: MarkdownFlowArtifactSchema<TInput>;
    version?: string;
    fallback?: React.ComponentType<MarkdownFlowArtifactFallbackProps>;
    authorize?: (input: TInput) => boolean;
  };

export type AIResponseComponents = Readonly<Record<string, AIResponseComponent | undefined>>;

export interface UseAIResponseOptions extends Omit<UseMarkdownFlowStreamOptions, "citations"> {
  /** Source metadata displayed for citations in the answer. */
  sources?: readonly MarkdownFlowCitation[];
  /** Compatibility alias for sources. */
  citations?: readonly MarkdownFlowCitation[];
}

/** A concise alias for the provider-neutral streaming controller. */
export function useAIResponse(initialContent = "", options: UseAIResponseOptions = {}): MarkdownFlowStreamController {
  const { sources, citations, ...streamOptions } = options;
  return useMarkdownFlowStream(initialContent, { ...streamOptions, citations: sources ?? citations });
}

export interface AIResponseProps extends Omit<StreamingRichMarkdownProps, "citations" | "artifactRegistry" | "renderPolicy" | "components"> {
  /** The accumulated response text for non-streaming integrations. */
  content?: string;
  /** A controller returned by useAIResponse or useMarkdownFlowStream. */
  stream?: MarkdownFlowStreamController | StreamingRichMarkdownProps["stream"];
  /** Source metadata rendered as inline citation badges. */
  sources?: readonly MarkdownFlowCitation[];
  /** Compatibility alias for sources. */
  citations?: readonly MarkdownFlowCitation[];
  /** A conservative capability set for common answer types. Defaults to chat. */
  preset?: AIResponsePreset;
  /** Additional or replacement render-policy settings for this response. */
  policy?: MarkdownFlowRenderPolicy;
  /** Compatibility alias for policy. */
  renderPolicy?: MarkdownFlowRenderPolicy;
  /** Trusted application components exposed through fenced artifact envelopes. */
  components?: AIResponseComponents;
  /** Advanced registry for artifacts that need resolvers or richer render props. */
  artifactRegistry?: MarkdownFlowArtifactRegistry;
  /** Standard Markdown element overrides, kept separate from trusted AI components. */
  markdownComponents?: Components;
  /** Shows the local development inspector. It never renders in production. */
  debug?: boolean;
}

const objectInputSchema: MarkdownFlowArtifactSchema<Record<string, unknown>> = {
  parse(input) {
    return input && typeof input === "object" && !Array.isArray(input)
      ? { valid: true, value: input as Record<string, unknown> }
      : { valid: false, reason: "Component input must be an object." };
  },
};

function ComponentFallback({ reason }: MarkdownFlowArtifactFallbackProps) {
  return <div role="status" className="my-4 rounded-lg border border-black/[0.08] bg-[#fbfbfd] px-4 py-3 text-sm text-[#6e6e73]">{reason}</div>;
}

function componentDefinitions(components?: AIResponseComponents): MarkdownFlowArtifactDefinition[] {
  if (!components) return [];
  return Object.entries(components).flatMap(([name, registration]) => {
    if (!registration) return [];
    const definition = typeof registration === "function"
      ? { component: registration, schema: objectInputSchema, version: "1", fallback: ComponentFallback }
      : { schema: objectInputSchema, version: "1", fallback: ComponentFallback, ...registration };
    const Component = definition.component;
    return [{
      name,
      version: definition.version,
      schema: definition.schema,
      authorize: definition.authorize,
      fallback: (props: MarkdownFlowArtifactFallbackProps) => React.createElement(definition.fallback, props),
      render: ({ input }) => <Component input={input as Record<string, unknown>} />,
    } as MarkdownFlowArtifactDefinition];
  });
}

function mergePolicy(
  preset: AIResponsePreset,
  policy: MarkdownFlowRenderPolicy | undefined,
  definitions: readonly MarkdownFlowArtifactDefinition[],
): MarkdownFlowRenderPolicy {
  const base = getAIResponsePresetPolicy(preset);
  const active = { ...base, ...policy };
  if (!definitions.length) return active;

  const versions = { ...active.allowedArtifactVersions } as Record<string, readonly string[]>;
  for (const definition of definitions) {
    versions[definition.name] = Array.from(new Set([...(versions[definition.name] ?? []), definition.version]));
  }
  return {
    ...active,
    allowedArtifacts: Array.from(new Set([...(active.allowedArtifacts ?? []), ...definitions.map(({ name }) => name)])),
    allowedArtifactVersions: versions,
  };
}

/**
 * The product-facing renderer for AI answers: Markdown, sources, streams, and
 * explicitly registered application components in one small API.
 */
export function AIResponse({
  sources,
  citations,
  preset = "chat",
  policy,
  renderPolicy,
  components,
  artifactRegistry,
  markdownComponents,
  ...props
}: AIResponseProps) {
  const definitions = React.useMemo(() => componentDefinitions(components), [components]);
  const registry = React.useMemo(() => {
    if (!definitions.length) return artifactRegistry;
    return createMarkdownFlowArtifactRegistry([...(artifactRegistry?.artifacts ?? []), ...definitions]);
  }, [artifactRegistry, definitions]);
  const activePolicy = React.useMemo(
    () => mergePolicy(preset, policy ?? renderPolicy, definitions),
    [definitions, policy, preset, renderPolicy],
  );

  return (
    <StreamingRichMarkdown
      {...props}
      citations={sources ?? citations}
      renderPolicy={activePolicy}
      artifactRegistry={registry}
      components={markdownComponents as RichMarkdownProps["components"]}
    />
  );
}
