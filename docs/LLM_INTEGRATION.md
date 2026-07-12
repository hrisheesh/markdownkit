# Markdown Flow integration guide

This guide shows how to use Markdown Flow from basic Markdown rendering through production LLM, RAG, and business-artifact integrations. The examples use TypeScript and React; the LLM transport is deliberately provider-neutral.

## Table of contents

- [Normal Markdown integration](#normal-markdown-integration)
- [Server rendering](#server-rendering)
- [The AI response model](#the-ai-response-model)
- [Building the model request](#building-the-model-request)
- [Retrieval and embeddings](#retrieval-and-embeddings)
- [Rendering a completed response](#rendering-a-completed-response)
- [Streaming an SSE response](#streaming-an-sse-response)
- [RAG, citations, and trusted datasets](#rag-citations-and-trusted-datasets)
- [Custom business artifacts](#custom-business-artifacts)
- [Render policies and limits](#render-policies-and-limits)
- [Telemetry and operations](#telemetry-and-operations)
- [Security and production checklist](#security-and-production-checklist)
- [API reference](#api-reference)

## Normal Markdown integration

Install the package and import the full stylesheet once in your client entry point, application layout, or global stylesheet.

```bash
npm install markdown-flow
```

```tsx
import { RichMarkdown } from "markdown-flow";
import "markdown-flow/styles.css";

export function KnowledgeArticle({ content }: { content: string }) {
  return <RichMarkdown content={content} />;
}
```

`RichMarkdown` renders safe Markdown with GitHub-flavored tables and task lists, math, code, Mermaid, charts, media, structured blocks, and source citation badges. The input remains untrusted and is sanitized before rendering.

For human-authored custom fenced content, supply an explicit renderer:

```tsx
import { RichMarkdown, type RichBlockRenderers } from "markdown-flow";

const blockRenderers: RichBlockRenderers = {
  alert: ({ code }) => <aside role="note">{code}</aside>,
};

export function ReleaseNotes({ content }: { content: string }) {
  return <RichMarkdown content={content} blockRenderers={blockRenderers} />;
}
```

Use a strict AI policy instead of unconstrained custom renderers for model output.

## Server rendering

Use the server entry point where browser APIs and interactive rich blocks are not appropriate, for example a React Server Component, static page generation, email preview, or a traditional SSR route.

```tsx
import { StaticMarkdown } from "markdown-flow/server";
import "markdown-flow/core.css";

export default function Page({ content }: { content: string }) {
  return <StaticMarkdown content={content} />;
}
```

For a smaller client Markdown-only bundle, use `RichMarkdownCore` from `markdown-flow/core`. Choose the full root entry only when its rich rendering features are needed.

## The AI response model

The LLM-facing protocol is `markdown-flow/v1`. A completed response is an envelope:

```ts
type MarkdownFlowResponse = {
  protocol: "markdown-flow/v1";
  content: string;
  citations?: MarkdownFlowCitation[];
  datasets?: MarkdownFlowDataset[];
};
```

`content` is normal Markdown. It can include approved fenced blocks. Citations and datasets are trusted metadata sent by the application, not claims created by the model.

````md
The conversion rate improved after the onboarding change [cite:onboarding-study].

```metrics
{
  "title": "Impact",
  "metrics": [
    { "label": "Conversion", "value": "14.2%", "change": "+2.1 pp" },
    { "label": "Time to value", "value": "3.4 min", "change": "-18%" }
  ]
}
```
````

### Supported built-in block types

`callout`, `metrics`, `timeline`, `steps`, `comparison`, `accordion`, `tabs`, `cards`, `filetree`, `progress`, `checklist`, `status`, `quote`, `chart`, `mermaid`, `embed`, `image`, and `map` are eligible for the initial protocol. A surface should enable only the types it genuinely needs.

Every AI block except Mermaid must use strict JSON: double-quoted strings and keys, no comments, no trailing commas, and no extra properties. Markdown Flow validates allowed types, properties, data bounds, URLs, dataset IDs, and field access before it invokes a rich renderer.

## Building the model request

### Prompt/instructions path

Use `createMarkdownFlowInstructions` with any LLM provider. Add its return value to system or developer instructions alongside your product-specific rules and retrieved context.

```ts
import { createMarkdownFlowInstructions } from "markdown-flow/ai";

const instructions = createMarkdownFlowInstructions({
  allowedBlocks: ["callout", "metrics", "chart"],
  availableDatasets: [
    { id: "revenue-by-month", description: "Authorized monthly revenue for the current tenant" },
  ],
  citations: retrievedSources.map((source) => ({
    id: source.id,
    filename: source.filename,
  })),
});

const request = {
  messages: [
    { role: "system", content: "Answer only from the supplied context. Cite source IDs in square brackets." },
    { role: "developer", content: instructions },
    { role: "user", content: question },
  ],
};
```

The helper instructs the model to use ordinary Markdown, use only approved blocks, emit strict JSON in rich blocks, avoid HTML/CSS/JavaScript/React, and reference approved datasets rather than copying large data into text.

## Retrieval and embeddings

Embeddings belong to your application’s retrieval layer, not to Markdown Flow. Markdown Flow does not create, store, transmit, or interpret embedding vectors. Retrieve relevant, authorized source excerpts first, then put only a bounded selection of text and stable source IDs into the model request.

```ts
const queryVector = await embeddings.embed(question);
const matches = await vectorStore.search({
  vector: queryVector,
  tenantId: session.tenantId,
  userId: session.userId,
  limit: 6,
});

const retrievedSources = matches.map((match) => ({
  id: match.sourceId,
  filename: match.filename,
  excerpt: match.authorizedExcerpt,
}));

const instructions = createMarkdownFlowInstructions({
  allowedBlocks: ["callout", "chart"],
  citations: retrievedSources.map(({ id, filename }) => ({ id, filename })),
});

const modelContext = retrievedSources
  .map(({ id, filename, excerpt }) => `Source [${id}] — ${filename}\n${excerpt}`)
  .join("\n\n");
```

Do not send raw vectors, an entire vector index, secret metadata, or unfiltered corpus content to the model. Enforce tenant and user filtering before similarity search; ensure excerpts are authorized before constructing the prompt; and keep source IDs stable so the model can cite them. For numeric or frequently changing data, prefer an approved dataset reference and resolve it after the model responds instead of placing rows in model context.

### Server request-to-response outline

Keep the provider call, retrieval, and metadata assembly on the server. The provider returns Markdown content (or a strict `{ protocol, content }` envelope); the server attaches only citation records that it already authorized for this request.

```ts
import {
  createMarkdownFlowInstructions,
  type MarkdownFlowResponse,
} from "markdown-flow/ai";

export async function answerQuestion(question: string, session: Session): Promise<MarkdownFlowResponse> {
  const sources = await retrieveAuthorizedSources({ question, session, limit: 6 });
  const instructions = createMarkdownFlowInstructions({
    allowedBlocks: ["callout", "metrics", "chart"],
    availableDatasets: [{ id: "revenue-by-month", description: "Monthly revenue" }],
    citations: sources.map(({ id, filename }) => ({ id, filename })),
  });

  const content = await provider.generateText({
    instructions,
    prompt: [
      "Answer only from these sources and cite source IDs in square brackets.",
      ...sources.map((source) => `[${source.id}] ${source.excerpt}`),
      `Question: ${question}`,
    ].join("\n\n"),
  });

  return {
    protocol: "markdown-flow/v1",
    content,
    citations: sources.map(({ id, chunkId, documentId, filename, excerpt }) => ({
      id,
      chunk_id: chunkId,
      document_id: documentId,
      filename,
      text_preview: excerpt,
    })),
  };
}
```

Validate the provider’s structured envelope before returning it when using tool calling. Do not accept citations, datasets, artifact permissions, or authorization decisions from the provider response; derive them from server-side state.

### Structured-output/tool path

Where a provider supports strict structured output or function tools, adapt the provider-neutral schema/tool export:

```ts
import { createMarkdownFlowResponseTool, markdownFlowResponseSchema } from "markdown-flow/ai";

const tool = createMarkdownFlowResponseTool({
  allowedBlocks: ["callout", "chart"],
});

// Adapt `tool.inputSchema` or `markdownFlowResponseSchema` to your SDK.
// The validated model result should have { protocol, content }.
```

Structured output improves envelope adherence, but it does not replace renderer validation. The content itself remains untrusted and is still validated by the render policy.

### What to put in context

Give the model only the retrieved source excerpts, source IDs, and allowlisted dataset descriptions it needs. Do not place API keys, full private datasets, authorization rules, hidden prompts, or customer secrets in model-visible instructions. The model can request presentation; it never receives the authority to fetch arbitrary data.

## Rendering a completed response

For a completed envelope, use `applyResponse`. This enforces the protocol version and keeps citations/datasets separate from the generated text.

```tsx
"use client";

import { StreamingRichMarkdown, useMarkdownFlowStream } from "markdown-flow/ai";
import { useEffect } from "react";
import "markdown-flow/styles.css";

export function CompletedAnswer({ response }: { response: import("markdown-flow/ai").MarkdownFlowResponse }) {
  const stream = useMarkdownFlowStream();

  const { applyResponse } = stream;

  useEffect(() => {
    applyResponse(response);
  }, [applyResponse, response]);

  return (
    <StreamingRichMarkdown
      stream={stream}
      renderPolicy={{ allowedBlocks: ["callout", "metrics", "chart"] }}
    />
  );
}
```

If no stream controller is needed, render the content directly with `RichMarkdown` and pass trusted citations separately.

## Streaming an SSE response

For real-time LLM output, `useMarkdownFlowStream` owns the incremental parser and state. Feed it provider-neutral events.

```tsx
"use client";

import { useEffect } from "react";
import {
  readMarkdownFlowSSE,
  StreamingRichMarkdown,
  useMarkdownFlowStream,
} from "markdown-flow/ai";
import "markdown-flow/styles.css";

export function AssistantAnswer({ request }: { request: RequestInit }) {
  const stream = useMarkdownFlowStream();
  const { apply, cancel, fail } = stream;

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/assistant", { ...request, signal: controller.signal });
        if (!response.ok) throw new Error("The assistant request failed.");

        for await (const event of readMarkdownFlowSSE(response)) {
          apply(event);
        }
      } catch (error) {
        if (!controller.signal.aborted) fail("The response could not be completed.");
      }
    })();

    return () => {
      controller.abort();
      cancel();
    };
  }, [apply, cancel, fail, request]);

  return (
    <StreamingRichMarkdown
      stream={stream}
      renderPolicy={{ allowedBlocks: ["callout", "metrics", "chart"] }}
      scrollBehavior="if-at-bottom"
    />
  );
}
```

`readMarkdownFlowSSE` accepts ordinary `data:` events containing plain text, common provider-shaped chunks, or already normalized events. `[DONE]` becomes a `complete` event. For a provider SDK's async iterable, use `normalizeMarkdownFlowStream`; for individual chunks, use `normalizeMarkdownFlowStreamChunk`.

The parser handles fences split across arbitrary chunks. A rich block remains a pending accessible placeholder until its closing fence arrives; only then is it parsed, validated, and rendered. Completed segments stay mounted while the trailing segment updates.

### Send normalized events from your server

Your API can emit a simple SSE event stream:

```text
data: {"type":"text","delta":"Revenue increased "}

data: {"type":"citation","citation":{"id":"revenue-q2","chunk_id":"c-17","document_id":"d-4","filename":"Q2 report.pdf","text_preview":"..."}}

data: {"type":"text","delta":"18%. [cite:revenue-q2]"}

data: {"type":"complete"}

```

Available events are `text`, `citation`, `dataset`, `error`, and `complete`. The API is responsible for deciding whether a citation or dataset is authorized before it is emitted.

## RAG, citations, and trusted datasets

### Citations

Use collision-safe source tokens in the answer, for example `[cite:policy-42]`, and send the citation records alongside the response or as stream events. Plain numbers and bracketed prose such as `[1]` are never treated as citations.

```tsx
<StreamingRichMarkdown
  stream={stream}
  citationResolver={{
    async resolve(id) {
      const source = await getAuthorizedSource(id);
      return source
        ? { status: "ready", value: source }
        : { status: "denied" };
    },
  }}
/>
```

Only resolve IDs the narrative contains. The resolver is host-owned and may return `loading`, `ready`, `unavailable`, `denied`, or `error`. Never resolve a source without tenant/user authorization.

### Dataset-backed charts

For a large dataset, let the model select an approved visual using a reference:

````md
```chart
{
  "type": "line",
  "title": "Monthly revenue",
  "dataset": "revenue-by-month",
  "x": "month",
  "y": "revenue"
}
```
````

Give the renderer a narrow policy and resolver:

```tsx
const renderPolicy = {
  allowedBlocks: ["chart"],
  allowedDatasetIds: ["revenue-by-month"],
  allowedDatasetFields: {
    "revenue-by-month": ["month", "revenue"],
  },
} as const;

<StreamingRichMarkdown
  stream={stream}
  renderPolicy={renderPolicy}
  datasetResolver={{
    async resolve({ id, fields }) {
      const data = await readAuthorizedDataset(currentTenantId, id, fields);
      return data
        ? { status: "ready", value: { id, data: data.rows, schema: { fields: data.fields } } }
        : { status: "denied" };
    },
  }}
/>
```

The resolver verifies that its returned ID and fields match the approved request. Results are cached by resolver, dataset ID, and field set; `useMarkdownFlowDataset` exposes `refresh()` when data must be reloaded without regenerating the narrative.

## Custom business artifacts

Use custom artifacts for domain UI such as an account-health panel, order status, incident summary, or SQL result preview. Register every artifact in application code; the model cannot name or execute arbitrary components.

```tsx
import {
  createMarkdownFlowArtifactRegistry,
  type MarkdownFlowArtifactDefinition,
} from "markdown-flow/ai";

const accountHealth: MarkdownFlowArtifactDefinition<{ accountId: string }, Account> = {
  name: "account-health",
  version: "1",
  schema: {
    parse(input: unknown) {
      if (typeof input === "object" && input && "accountId" in input && typeof input.accountId === "string") {
        return { valid: true, value: { accountId: input.accountId } };
      }
      return { valid: false, reason: "accountId is required." };
    },
  },
  authorize: ({ accountId }) => canReadAccount(accountId),
  async resolver({ accountId }) {
    const account = await loadAuthorizedAccount(accountId);
    return account ? { status: "ready", value: account } : { status: "denied" };
  },
  render: ({ value }) => <AccountHealthCard account={value} />,
  fallback: ({ reason }) => <p role="status">Account data is unavailable: {reason}</p>,
};

const artifactRegistry = createMarkdownFlowArtifactRegistry([accountHealth]);
```

The model emits the `artifact` fenced block with a strict JSON envelope:

````md
```artifact
{
  "name": "account-health",
  "version": "1",
  "input": { "accountId": "acct_123" }
}
```
````

Enable it explicitly:

```tsx
<StreamingRichMarkdown
  stream={stream}
  artifactRegistry={artifactRegistry}
  renderPolicy={{
    allowedArtifacts: ["account-health"],
    allowedArtifactVersions: { "account-health": ["1"] },
  }}
/>
```

An artifact needs a strict schema, host-rendered UI, fallback state, and—when it loads data—host authorization. Keep mutations behind normal application actions and confirmation flows; an LLM artifact should not create privileged side effects.

## Render policies and limits

Use the smallest policy that solves each product surface. A support assistant does not need maps or arbitrary media; an analytics assistant may need only metrics and one chart dataset.

```ts
const supportPolicy = {
  allowedBlocks: ["callout", "steps", "checklist"],
  maxBlockCharacters: 8_000,
  maxBlocks: 8,
} as const;

const analyticsPolicy = {
  allowedBlocks: ["metrics", "chart"],
  allowedDatasetIds: ["revenue-by-month"],
  allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] },
  maxChartDataPoints: 120,
  allowExternalUrls: false,
} as const;
```

Defaults are deliberately bounded: 20,000 characters per block, 32 blocks, 250 rows, and 250 chart points. External embeds and images are disabled by default. Policies also control allowed artifact names and versions.

## Telemetry and operations

Pass telemetry to `RichMarkdown`, `StreamingRichMarkdown`, or `useMarkdownFlowStream` to observe rendering without capturing sensitive content.

```ts
import type {
  MarkdownFlowTelemetry,
  MarkdownFlowTelemetryContext,
  MarkdownFlowTelemetryEvent,
} from "markdown-flow/ai";

const telemetry: MarkdownFlowTelemetry = {
  context: { requestId: traceId, surface: "analytics-assistant" },
  track(event: MarkdownFlowTelemetryEvent, context?: MarkdownFlowTelemetryContext) {
    analytics.track("markdown_flow", { event, context });
  },
};
```

Events cover accepted/invalid/fallback blocks, render duration and counts, stream status, and citation/dataset/artifact resolver outcomes. Events deliberately omit model text, URLs, citation bodies, dataset rows, resolver messages, and user identifiers. Use a host-generated trace ID and apply your retention and sampling policy in your own observability system.

Useful production alerts include an increase in invalid or fallback blocks, resolver denial/error rate, stream failure rate, and abnormal response/block size.

## Security and production checklist

Before shipping an AI surface:

1. Keep model credentials, retrieval, authorization, and data resolution on trusted server code.
2. Add `createMarkdownFlowInstructions` or the structured schema to every model request; do not rely on the renderer to infer intent.
3. Use a narrow `renderPolicy` per surface and keep external URLs disabled unless required.
4. Send citation and dataset metadata from the host. Never grant data access based on model text alone.
5. Validate and authorize every custom artifact input; version and allowlist artifacts explicitly.
6. Apply moderation and prompt-injection controls before rendering content, especially in RAG applications.
7. Enforce request, response, block, row, and dataset limits at the API boundary as well as in rendering policy.
8. Test arbitrary stream chunk boundaries, truncated fences, provider errors, cancellation, retry, and screen-reader states.
9. Use privacy-safe telemetry; do not put prompts, completions, rows, URLs, or customer identifiers in telemetry context.
10. Review retention, tenant isolation, cache keys, rate limits, and audit requirements for your deployment.

Markdown Flow sanitizes presentation input and provides validation/fallbacks. It does not replace application authorization, moderation, data classification, or threat modeling.

## API reference

| Export | Purpose |
| --- | --- |
| `RichMarkdown` | Full static rich renderer |
| `StaticMarkdown` | Server-safe, Markdown-only renderer |
| `StreamingRichMarkdown` | Accessible incremental renderer for LLM output |
| `useMarkdownFlowStream` | Controller with `append`, `replace`, `apply`, `applyResponse`, `complete`, `fail`, `cancel`, and `retry` |
| `createMarkdownFlowInstructions` | Provider-neutral instruction generator |
| `markdownFlowResponseSchema` | Provider-neutral response envelope schema |
| `createMarkdownFlowResponseTool` | Provider-neutral structured-output tool definition |
| `normalizeMarkdownFlowStream` / `normalizeMarkdownFlowStreamChunk` | Convert common provider chunk shapes to Markdown Flow events |
| `readMarkdownFlowSSE` | Read standard UTF-8 SSE into Markdown Flow events |
| `validateMarkdownFlowBlock` | Validate a built-in AI block against a policy |
| `useMarkdownFlowCitations` / `useMarkdownFlowDataset` | Resolve host-authorized RAG metadata and data |
| `createMarkdownFlowArtifactRegistry` | Register versioned business artifacts |
| `emitMarkdownFlowTelemetry` | Best-effort privacy-safe telemetry emitter |

## Publishing a release

```bash
npm run lint
npm run build:package
npm run test:render
npm run check:size
npm run test:compat
npm pack --dry-run
```

Then, after review:

```bash
npm login
npm publish --access public
npm view markdown-flow@0.1.3 version
```

The `prepack` lifecycle rebuilds the distribution and removes source maps from the public npm tarball. Local development builds still generate them.
