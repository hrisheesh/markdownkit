# Streaming Markdown in React

Use Markdown Flow when your application receives text incrementally and needs completed answer sections to stay stable while the trailing section grows.

```tsx
"use client";

import { AIResponse, useAIResponse } from "markdown-flow/ai";
import "markdown-flow/styles.css";

export function Answer() {
  const response = useAIResponse();

  async function ask() {
    const result = await fetch("/api/answer");
    const reader = result.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      response.append(decoder.decode(value, { stream: true }));
    }
    response.complete();
  }

  return <><button onClick={ask}>Ask</button><AIResponse stream={response} /></>;
}
```

For SSE and provider-neutral events, use the maintained [provider integration guide](./PROVIDER_INTEGRATIONS.md). For an App Router route, read [Next.js streaming](./NEXTJS_AI_STREAMING.md).

Ordinary code fences remain normal Markdown. Only Markdown Flow structured block languages are held pending until their closing fence arrives, so incomplete model JSON never reaches an interactive renderer.
