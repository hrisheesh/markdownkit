# Provider integrations

Markdown Flow renders the answer after your server has made the model request. It does not call a provider, retrieve documents, or grant a model access to sources, datasets, or React components.

Every example follows the same ownership boundary:

```text
server: authenticate → retrieve/filter → call provider → emit text + approved source metadata
client: receive stream → normalize provider events → AIResponse renders under a preset/policy
```

Install the renderer and styles once:

```bash
npm install markdown-flow
```

```tsx
import "markdown-flow/styles.css";
```

## Generic SSE

This is the recommended default: have the server emit Markdown Flow events and keep the client independent of any provider.

```tsx
"use client";

import { useEffect } from "react";
import { AIResponse, readMarkdownFlowSSE, useAIResponse } from "markdown-flow/ai";

export function Answer() {
  const response = useAIResponse();

  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/answer", { signal: abort.signal })
      .then(async (result) => {
        if (!result.ok) throw new Error("Answer request failed");
        for await (const event of readMarkdownFlowSSE(result)) response.apply(event);
      })
      .catch(() => { if (!abort.signal.aborted) response.fail("The answer could not be completed."); });
    return () => { abort.abort(); response.cancel(); };
  }, [response]);

  return <AIResponse stream={response} preset="chat" scrollBehavior="if-at-bottom" />;
}
```

The route can be as small as:

```text
data: {"type":"text","delta":"A streamed answer"}

data: {"type":"complete"}
```

## Next.js App Router

Use the same client component in a Client Component. Keep the provider client and all authorization in a route handler or server action.

```tsx
// app/answer/page.tsx
import { Answer } from "./Answer";
export default function AnswerPage() { return <Answer />; }
```

```ts
// app/api/answer/route.ts
export async function GET() {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"text","delta":"Hello from the server."}\\n\\n'));
      controller.enqueue(encoder.encode('data: {"type":"complete"}\\n\\n'));
      controller.close();
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}
```

For the complete Next.js boundary, see [Next.js streaming](./NEXTJS_AI_STREAMING.md).

## OpenAI

No OpenAI package is required by Markdown Flow. If your server already receives an OpenAI stream, normalize its chunks on the client or in a server-to-client adapter.

```ts
import { normalizeOpenAIStream } from "markdown-flow/ai";

for await (const event of normalizeOpenAIStream(openaiStream)) {
  // Send event as SSE, or pass it to response.apply(event) in a client-owned stream.
}
```

`normalizeOpenAIStream` supports Chat Completions `choices[].delta.content` and Responses API `response.output_text.delta`. It only forwards text and completion/error events; function-call arguments are never rendered as Markdown.

## Anthropic

```ts
import { normalizeAnthropicStream } from "markdown-flow/ai";

for await (const event of normalizeAnthropicStream(messageStream)) {
  // `content_block_delta` text becomes { type: "text" }.
}
```

Only Anthropic `text_delta` content is forwarded. Tool-input JSON remains application data and must be validated by the host before it is used anywhere.

## Vercel AI SDK

```ts
import { normalizeVercelAIStream } from "markdown-flow/ai";

for await (const event of normalizeVercelAIStream(textStream)) {
  // Supports `text-delta` parts and finish events.
}
```

Use this when you own the stream parts. For `toDataStreamResponse()` or another HTTP streaming response, use the generic SSE client example instead.

## RAG sources

The server authorizes source records before sending them. The model only writes a source token; it does not create a link or gain access to a document.

```tsx
import { AIResponse } from "markdown-flow/ai";

const sources = [{
  id: "policy-42", chunk_id: "chunk-9", document_id: "policy", filename: "retention.pdf",
  text_preview: "Exports are available to workspace administrators.",
}];

export function GroundedAnswer({ content }: { content: string }) {
  return <AIResponse content={content} sources={sources} preset="rag" />;
}
// Model text: "Exports are available to administrators. [cite:policy-42]"
```

## Trusted components

Components are opt-in application code. The host owns the schema and may deny an input; generated Markdown cannot import or execute arbitrary components.

```tsx
import { AIResponse } from "markdown-flow/ai";

function OrderStatus({ input }: { input: { orderId: string } }) {
  return <a href={`/orders/${encodeURIComponent(input.orderId)}`}>View order</a>;
}

export function AnswerWithOrder({ content }: { content: string }) {
  return <AIResponse content={content} components={{
    order: {
      component: OrderStatus,
      schema: { parse: (input) => typeof input === "object" && input !== null && typeof (input as { orderId?: unknown }).orderId === "string"
        ? { valid: true, value: input as { orderId: string } }
        : { valid: false, reason: "orderId is required." } },
      authorize: (input) => input.orderId.startsWith("visible_"),
    },
  }} />;
}
```

## Analytics

For analytics, the server authorizes a dataset ID and permitted fields; the model selects a presentation, not raw records or a query.

```tsx
<AIResponse
  content={answer}
  preset="analytics"
  policy={{
    allowedDatasetIds: ["monthly-revenue"],
    allowedDatasetFields: { "monthly-revenue": ["month", "revenue"] },
  }}
  datasetResolver={{
    resolve: async (id) => id === "monthly-revenue"
      ? { status: "ready", value: { id, data: authorizedRows } }
      : { status: "denied" },
  }}
/>
```

The model can now request a chart using `"dataset": "monthly-revenue"`, `"x": "month"`, and `"y": "revenue"`. It cannot request another dataset or field.

## Maintained compatibility

The OpenAI, Anthropic, and Vercel adapters are dependency-free and covered by replay fixtures plus an `AIResponse` integration test. Provider request APIs change more often than their text-event shapes, so Markdown Flow intentionally does not wrap provider clients. Keep provider SDK versions in your application and use the adapter at the stream boundary.
