# React Markdown renderer: build a polished document surface

Markdown Flow is for React products that need more than raw Markdown-to-HTML conversion. It renders safe GitHub-flavored Markdown while providing a consistent product UI for tables, code, mathematics, Mermaid diagrams, charts, media, structured blocks, and citations.

## Install

```bash
npm install markdown-flow
```

Import the full stylesheet once in your application shell and render content with `RichMarkdown`.

```tsx
import { RichMarkdown } from "markdown-flow";
import "markdown-flow/styles.css";

export function Article({ content }: { content: string }) {
  return <RichMarkdown content={content} />;
}
```

## Choose the right entry point

| Entry point | Best for |
| --- | --- |
| `markdown-flow` | Product documentation, knowledge content, rich Markdown, citations, and structured blocks. |
| `markdown-flow/core` | A smaller client bundle for sanitized GitHub-flavored Markdown only. |
| `markdown-flow/server` | Server Components, static output, email previews, and traditional SSR routes. |
| `markdown-flow/ai` | Streaming LLM answers, RAG metadata, policies, and business artifacts. |

## Why not render raw HTML from Markdown or an LLM?

Raw HTML gives content too much influence over the product UI and does not provide a contract for charts, citations, data access, or streaming. Markdown Flow sanitizes Markdown and uses explicit, validated configuration for rich blocks. It does not execute model-generated JavaScript, JSX, CSS, or arbitrary components.

For a human-authored extension, provide an explicit local renderer:

```tsx
import { RichMarkdown, type RichBlockRenderers } from "markdown-flow";

const blockRenderers: RichBlockRenderers = {
  notice: ({ code }) => <aside role="note">{code}</aside>,
};

export function ReleaseNotes({ content }: { content: string }) {
  return <RichMarkdown content={content} blockRenderers={blockRenderers} />;
}
```

For LLM output, use the AI entry point and a narrow `renderPolicy` rather than unconstrained custom renderers. See the [complete AI integration guide](./LLM_INTEGRATION.md).

## Next steps

- [Normal and server integration](./LLM_INTEGRATION.md#normal-markdown-integration)
- [Streaming answers in Next.js](./NEXTJS_AI_STREAMING.md)
- [RAG citations and trusted artifacts](./RAG_CITATIONS_AND_ARTIFACTS.md)
