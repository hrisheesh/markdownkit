# Next.js streaming Markdown and AI responses

This guide shows the boundary for a Next.js AI answer: the server owns model access and retrieval; the Client Component streams provider-neutral events into Markdown Flow.

## 1. Add styles once

```tsx
// app/layout.tsx
import "markdown-flow/styles.css";
```

## 2. Render the stream in a Client Component

```tsx
"use client";

import { useEffect } from "react";
import { readMarkdownFlowSSE, StreamingRichMarkdown, useMarkdownFlowStream } from "markdown-flow/ai";

export function AssistantAnswer({ question }: { question: string }) {
  const stream = useMarkdownFlowStream();
  const { apply, cancel, fail } = stream;

  useEffect(() => {
    const abort = new AbortController();

    void fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: abort.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Assistant request failed.");
        for await (const event of readMarkdownFlowSSE(response)) apply(event);
      })
      .catch(() => { if (!abort.signal.aborted) fail("The response could not be completed."); });

    return () => { abort.abort(); cancel(); };
  }, [apply, cancel, fail, question]);

  return <StreamingRichMarkdown stream={stream} renderPolicy={{ allowedBlocks: ["callout", "metrics", "chart"] }} />;
}
```

## 3. Keep the route server-owned

Your route must authenticate the request, retrieve authorized context, attach `createMarkdownFlowInstructions` to the model request, and write SSE events. The browser should receive text, trusted citations/datasets, errors, and completion—not provider credentials or unrestricted data access.

```text
data: {"type":"text","delta":"Here is the result..."}

data: {"type":"complete"}
```

`StreamingRichMarkdown` does not render an incomplete fenced rich block. It presents an accessible pending state until the closing fence arrives, avoiding broken JSON charts or artifacts while a response is streaming.

For the full provider-neutral request, RAG, and security contract, read the [integration guide](./LLM_INTEGRATION.md).
