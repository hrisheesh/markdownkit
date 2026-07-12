# Markdown Flow

**The React renderer for AI answers.**

Markdown Flow turns ordinary Markdown into a finished product surface: readable prose, tables, mathematics, code, diagrams, charts, citations, and trusted application artifacts. It is built for React and Next.js teams that need a dependable renderer today—and a controlled, real-time answer UI when they add AI.

> The model produces compact semantic Markdown. Your product keeps control of data, permissions, components, and actions.

<p align="center">
  <a href="https://www.npmjs.com/package/markdown-flow"><img src="https://img.shields.io/npm/v/markdown-flow?color=4c5be8&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/markdown-flow"><img src="https://img.shields.io/npm/dm/markdown-flow?color=171717" alt="npm downloads" /></a>
  <a href="https://github.com/hrisheesh/markdown-flow"><img src="https://img.shields.io/badge/React-18%2B-149eca?logo=react" alt="React 18 or later" /></a>
  <a href="https://github.com/hrisheesh/markdown-flow"><img src="https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript" alt="TypeScript ready" /></a>
</p>

## Why it exists

Markdown is an excellent authoring format, but generic renderers stop at rendering text. AI products introduce a harder problem: an answer needs to stream smoothly, cite evidence, visualize approved data, and occasionally show product-specific UI—without asking the model to generate a webpage or run application code.

Generating HTML, JSX, spreadsheets, or mini-apps from a model is an expensive and fragile interface. It wastes output tokens on presentation details, breaks easily during streaming, and gives untrusted text too much control over the product surface.

Markdown Flow was created to make that boundary explicit:

```text
Your retrieval and application data
        ↓
LLM emits Markdown + approved JSON blocks
        ↓
Markdown Flow validates and streams stable UI
        ↓
Trusted React components, citations, charts, and artifacts
```

The model describes intent in compact Markdown and approved JSON blocks. Markdown Flow validates that intent and renders it with trusted React code. Your application remains the authority for every piece of data, every permission, and every action.

## What makes it different

| Instead of | Markdown Flow does |
| --- | --- |
| A basic Markdown renderer that only turns text into HTML | Delivers a complete React reading surface with rich blocks, charts, diagrams, math, citations, and safe fallbacks. |
| Asking an LLM to generate HTML, JSX, or a spreadsheet | Uses compact Markdown plus an intentionally small, versioned response contract. |
| Re-rendering the entire answer for every streamed token | Keeps completed sections mounted and holds incomplete rich fences in an accessible pending state. |
| Putting private analytics rows or source text into every prompt | Lets models reference host-authorized citations and datasets by ID; the app resolves them securely. |
| Letting a model choose arbitrary components or execute generated code | Uses a host-registered, schema-validated, versioned artifact registry. |

This is the difference between rendering model output and operating a reliable AI answer surface.

## Built for real product work

- **Knowledge and support assistants** — stream grounded answers with source citations and readable technical content.
- **RAG applications** — keep retrieval and source permissions in your application while presenting cited results clearly.
- **Analytics copilots** — let a model select an approved chart or metric view without exposing entire datasets in prompt context.
- **Internal business tools** — render account health, incident, order, or workflow artifacts using trusted host components.
- **Documentation and content products** — render polished Markdown, diagrams, code, math, and media in React or Next.js.

## Install

```bash
npm install markdown-flow
```

Markdown Flow supports React 18 and React 19. Import the stylesheet once in the client application shell:

```tsx
import "markdown-flow/styles.css";
```

When answers can contain math, also import its optional stylesheet. The KaTeX parser and stylesheet load only for content with math delimiters.

```tsx
import "markdown-flow/math.css";
```

## AI quick start

```tsx
import { AIResponse } from "markdown-flow/ai";
import "markdown-flow/styles.css";

export function AssistantAnswer({ content }: { content: string }) {
  return <AIResponse content={content} />;
}
```

`AIResponse` renders ordinary Markdown immediately and keeps incomplete Markdown Flow blocks in a stable pending state while a response streams. It defaults to the conservative `chat` preset.

For token streaming, append provider deltas to the controller and pass it straight to the renderer:

```tsx
"use client";

import { AIResponse, useAIResponse } from "markdown-flow/ai";
import "markdown-flow/styles.css";
import "markdown-flow/math.css";

export function Assistant() {
  const response = useAIResponse();

  // Pass provider text to response.append(delta), then call response.complete().
  return <AIResponse stream={response} preset="technical" scrollBehavior="if-at-bottom" />;
}
```

Sources stay host-owned and are displayed as citation badges. Trusted product UI is registered explicitly; the model can only request the component name and a validated object input.

```tsx
import { AIResponse } from "markdown-flow/ai";

function OrderCard({ input }: { input: { id: string } }) {
  return <a href={`/orders/${input.id}`}>Open order {input.id}</a>;
}

<AIResponse
  content={answer}
  sources={sources}
  preset="rag"
  components={{ order: OrderCard }}
/>;
```

That component is available only through this fenced envelope:

````md
```artifact
{"name":"order","version":"1","input":{"id":"A-42"}}
```
````

Use `minimal`, `chat`, `rag`, `technical`, or `analytics` to choose the built-in block capability set. Pass `policy` when your product needs stricter limits or additional approved blocks.

## Markdown rendering

`RichMarkdown` remains available for documents and content products. It supports GitHub-flavored Markdown, tables, syntax-highlighted code, KaTeX math, Mermaid, charts, media, structured blocks, and citations.

```tsx
import { RichMarkdown } from "markdown-flow";
import "markdown-flow/styles.css";

export function Article({ content }: { content: string }) {
  return <RichMarkdown content={content} />;
}
```

For a compact, server-safe Markdown-only renderer:

```tsx
import { StaticMarkdown } from "markdown-flow/server";
import "markdown-flow/core.css";

export function Document({ content }: { content: string }) {
  return <StaticMarkdown content={content} />;
}
```

The model should receive Markdown Flow's contract. Do not ask it to emit HTML, JSX, or arbitrary component names.

```ts
import { createMarkdownFlowInstructions } from "markdown-flow/ai";

const instructions = createMarkdownFlowInstructions({
  allowedBlocks: ["callout", "metrics", "chart"],
  availableDatasets: [{ id: "revenue-by-month", description: "Authorized monthly revenue" }],
  citations: sources.map(({ id, filename }) => ({ id, filename })),
});

// Add `instructions` to your provider's system/developer instructions.
```

Full request-to-response, SSE, RAG, dataset, artifact, security, and operations guidance is in the [documentation](https://github.com/hrisheesh/markdown-flow/tree/main/docs).

Copy-paste provider, Next.js, RAG, trusted-component, and analytics examples are in the [integration guide](https://github.com/hrisheesh/markdown-flow/blob/main/docs/PROVIDER_INTEGRATIONS.md).

## What a rich response looks like

Normal Markdown remains the default. A model uses a fenced block only when it communicates better than prose.

````md
Revenue increased 18% quarter over quarter [cite:revenue-q2].

```chart
{
  "type": "bar",
  "title": "Quarterly revenue",
  "data": [
    { "quarter": "Q1", "revenue": 120 },
    { "quarter": "Q2", "revenue": 142 }
  ],
  "x": "quarter",
  "y": "revenue"
}
```
````

For large or sensitive data, the model references a host-owned dataset instead of serializing rows into its answer. The application validates the ID and fields, performs authorization, and resolves the data.

## 0.1.3 release: AI-ready without a renderer regression

`0.1.3` introduces the `markdown-flow/ai` integration surface:

- versioned `markdown-flow/v1` response and stream contracts;
- concise provider-neutral instructions and a structured-output tool/schema;
- strict built-in block validation and render policies;
- incremental streaming parser, pending states, cancellation, retry, and scroll anchoring;
- citation and dataset resolver interfaces for RAG;
- host-owned custom artifact registry with schema, authorization, resolver, fallback, and version controls;
- privacy-safe telemetry hooks;
- source maps excluded from the public npm tarball while retained for ordinary local builds.

### Controlled stress test: 0.1.2 → 0.1.3

The comparison used the published `0.1.2` package and the packed `0.1.3` candidate in the same React 19.2.4 server-rendering environment. Package order alternated across rounds to reduce warm-up bias. These numbers are directional measurements, not a guarantee for every product.

| Workload | 0.1.3 change | Assessment |
| --- | ---: | --- |
| Short Markdown | +2.1% render time | Benchmark noise / effectively neutral |
| Long document | -0.6% render time | Slightly faster |
| Tables | -0.4% render time | Slightly faster |
| Rich blocks | +2.6% render time | Benchmark noise / effectively neutral |
| Charts | +3.6% render time | Benchmark noise / effectively neutral |

AI-specific checks for `0.1.3`:

| Check | Result |
| --- | ---: |
| Fence parser, 13.7 kB delivered one character at a time | ~0.207 ms median |
| Strict block validation | ~485,000 validations/sec |
| React compatibility | React 18.3.1 and React 19.2.4 passed |
| npm package size | 913.9 kB → 907.8 kB compressed (-0.67%) |
| Public source maps | Present in 0.1.2 → none in 0.1.3 |

The release also passed linting, package build, render verification, size budgets, compatibility testing, and package-content verification.

## Package entry points

| Import | Use it for |
| --- | --- |
| `markdown-flow` | Full rich Markdown rendering and strict policies |
| `markdown-flow/core` | Lightweight sanitized GFM rendering |
| `markdown-flow/server` | Server-safe static Markdown rendering |
| `markdown-flow/ai` | `AIResponse`, `useAIResponse`, streaming, LLM contract, RAG, resolvers, artifacts, and telemetry |
| `markdown-flow/styles.css` | Full renderer styles |
| `markdown-flow/math.css` | Optional KaTeX styles and fonts |
| `markdown-flow/core.css` | Core renderer styles |

## Browser import costs

The published ESM entry points keep Mermaid, charts, syntax highlighting, and math parsing out of the initial answer graph. Those features load only when their corresponding fenced block or math delimiter appears. `styles.css` is math-free; import `math.css` only on surfaces that support math.

Run `npm run build:package && npm run check:size` to generate a current table and enforce the import-graph budgets. The measurement follows package-relative ESM imports, so it is a repeatable package cost check rather than a claim about an application's final bundler output.

## Security model

Markdown Flow is a presentation layer, not an authorization system. Treat model output as untrusted.

- Keep provider keys, retrieval, tenant checks, and dataset access on your server.
- Use `renderPolicy` to allow only the blocks, data IDs, fields, URLs, and limits appropriate to each surface.
- Supply citations and datasets as trusted metadata; never let the model invent authority.
- Register custom artifacts explicitly. They validate input and are host-rendered; model output never executes code.
- Monitor invalid blocks, fallbacks, errors, and resolver outcomes through optional privacy-safe telemetry.

See the [security and production checklist](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md#security-and-production-checklist) before shipping an AI-facing experience.

## Documentation

- [Documentation overview](https://github.com/hrisheesh/markdown-flow/tree/main/docs)
- [React Markdown renderer](https://github.com/hrisheesh/markdown-flow/blob/main/docs/REACT_MARKDOWN_RENDERER.md)
- [Next.js AI streaming](https://github.com/hrisheesh/markdown-flow/blob/main/docs/NEXTJS_AI_STREAMING.md)
- [RAG citations and trusted artifacts](https://github.com/hrisheesh/markdown-flow/blob/main/docs/RAG_CITATIONS_AND_ARTIFACTS.md)
- [Complete integration guide](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md)
- [Streaming and SSE](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md#streaming-an-sse-response)
- [RAG, citations, and datasets](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md#rag-citations-and-trusted-datasets)
- [Custom business artifacts](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md#custom-business-artifacts)
- [API reference](https://github.com/hrisheesh/markdown-flow/blob/main/docs/LLM_INTEGRATION.md#api-reference)

## Release commands

Review the package locally before publishing:

```bash
npm run lint
npm run build:package
npm run test:unit
npm run test:render
npm run test:a11y
npm run test:security
npm run test:coverage
npm run check:size
npm run test:compat
npm pack --dry-run
```

Publish only after review:

```bash
npm login
npm publish --access public
npm view markdown-flow@0.1.3 version
```

`npm publish` runs `prepack`, which rebuilds the package and removes source maps from the public tarball. It does not publish this repository's ignored planning files.

## License

MIT © 2026 Hrisheesh Kumar. See [LICENSE](LICENSE).
