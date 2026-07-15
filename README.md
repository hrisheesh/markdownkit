# Markdown Flow — Ultimate User Guide

Markdown Flow is a React renderer for polished Markdown and streamed AI answers. It renders ordinary Markdown, a small validated set of rich blocks, citations, charts, diagrams, and explicitly registered application components. Models supply untrusted presentation text; your application retains ownership of data, authorization, actions, and components.

This is the complete package guide. The files in [`docs/`](./docs/README.md) are short topic redirects; release history is in [CHANGELOG.md](./CHANGELOG.md).

## Contents

- [Install and choose an entry point](#install-and-choose-an-entry-point)
- [Render Markdown in React](#render-markdown-in-react)
- [Render AI and RAG answers](#render-ai-and-rag-answers)
- [Generate backend-neutral prompts and use the CLI](#generate-backend-neutral-prompts-and-use-the-cli)
- [Stream responses](#stream-responses)
- [Citations, datasets, and trusted artifacts](#citations-datasets-and-trusted-artifacts)
- [Presets, policies, and normalization](#presets-policies-and-normalization)
- [All built-in blocks](#all-built-in-blocks)
- [Styling, diagnostics, and telemetry](#styling-diagnostics-and-telemetry)
- [Security configuration](#security-configuration)
- [Provider and framework examples](#provider-and-framework-examples)
- [Migration, troubleshooting, and release notes](#migration-troubleshooting-and-release-notes)

## Install and choose an entry point

```bash
npm install markdown-flow
```

Markdown Flow supports React 18 and 19. Import one of these public entries:

| Import | Use it for |
| --- | --- |
| `markdown-flow` | Full rich Markdown via `RichMarkdown`. |
| `markdown-flow/core` | Sanitized GitHub-flavored Markdown only. |
| `markdown-flow/server` | Server-safe static Markdown. |
| `markdown-flow/ai` | AI responses, streaming, prompts, citations, policies, datasets, and artifacts. |
| `markdown-flow/styles.css` | Complete package CSS, including math/KaTeX. Recommended. |
| `markdown-flow/core.css` + `markdown-flow/math.css` | Split CSS when you intentionally optimize the stylesheet boundary. |

For normal applications, import the complete CSS once at the application shell:

```tsx
import "markdown-flow/styles.css";
```

This is the same complete stylesheet used by the playground: it includes every rich-block surface, spacing rule, responsive layout, local overflow rule, and KaTeX style. No playground CSS, `.chat-markdown` overrides, copied selectors, or parent card styles are required. Do not add a broad parent `overflow-x-auto` simply to make Markdown Flow work.

The smallest AI integration is two imports and one component:

```tsx
import "markdown-flow/styles.css";
import { AIResponse } from "markdown-flow/ai";

export function Answer({ answer }: { answer: string }) {
  return <AIResponse content={answer} />;
}
```

## Render Markdown in React

Use `RichMarkdown` for authored or otherwise non-AI Markdown:

```tsx
import { RichMarkdown } from "markdown-flow";
import "markdown-flow/styles.css";

export function Article({ content }: { content: string }) {
  return <RichMarkdown content={content} />;
}
```

Use `AIResponse` for model output. It applies the AI block protocol and host-owned policy instead of treating model output as a way to run arbitrary UI:

```tsx
import { AIResponse } from "markdown-flow/ai";

export function AssistantAnswer({ content }: { content: string }) {
  return <AIResponse content={content} />;
}
```

Markdown is sanitized for rendering. Markdown Flow never executes model-generated JavaScript, JSX, CSS, React components, tool arguments, or actions.

## Render AI and RAG answers

`AIResponse` is the product-facing component. Its default preset is `chat`; passing a completed string is enough for a basic answer.

```tsx
<AIResponse content={message.content} />
```

For retrieval-augmented generation, send trusted source metadata from your application and choose `rag`:

```tsx
import { AIResponse, type MarkdownFlowSource } from "markdown-flow/ai";

const sources: MarkdownFlowSource[] = [
  {
    id: "policy-42",
    title: "Retention policy",
    preview: "Data is retained for 30 days.",
    url: "/policies/42",
  },
];

<AIResponse content={answer} sources={sources} preset="rag" />
```

`sources` is the preferred name; `citations` remains a compatibility alias. The renderer accepts legacy source field names `filename` and `text_preview` too. A model refers to a supplied source only with `[cite:policy-42]` in normal Markdown. It cannot turn a citation into a fetch, a permission, or a URL it controls.

The recommended end-to-end boundary is:

```text
server: authenticate → authorize → retrieve approved context → generate with contract
client: trusted sources + response text → AIResponse
```

Keep retrieval excerpts and application rules in the server-side model request. Return only the display text and source metadata the current user is authorized to see.

## Generate backend-neutral prompts and use the CLI

Generate the model instruction from the same configuration that renders the answer. This prevents the usual drift between a hand-written prompt, an allowlist, and block schemas.

```ts
import { createMarkdownFlow, createMarkdownFlowInstructions } from "markdown-flow/ai";

const flow = createMarkdownFlow({ preset: "rag", sources });

await provider.generateText({
  system: `${flow.instructions}\n\n${applicationInstructions}`,
});

// Use this when only the instruction string is needed.
const instructions = createMarkdownFlowInstructions({ preset: "technical" });
```

`createMarkdownFlow()` returns a single versioned contract:

| Field | Meaning |
| --- | --- |
| `instructions` | Prompt text for the model system/developer message. |
| `policy` | Matching host-owned render policy. Pass it to a low-level renderer when needed. |
| `blockTypes` | The enabled built-in block types. |
| `citationFormat` | Always `[cite:source-id]`. |
| `version` | The current protocol identifier, `markdown-flow/v1`. |

The generated instructions constrain blocks to the enabled types, include validator-aligned minimal examples, require JSON where appropriate, explain citation syntax, and list approved source IDs and datasets. Add application instructions after the generated contract; do not copy block schemas into a second prompt.

### Static prompts for Python, Go, Java, and other backends

The CLI lets a non-Node service consume a checked-in prompt artifact:

```bash
npx markdown-flow generate-prompt --preset rag --output ../backend/prompts/markdown-flow.txt
npx markdown-flow generate-config --preset rag --format json --output markdown-flow-config.json
npx markdown-flow verify-prompt --preset rag --input ../backend/prompts/markdown-flow.txt
npx markdown-flow doctor
```

Read the generated text from a stable application root and fail loudly if deployment omitted it. Do not silently replace a missing prompt with an empty string:

```python
import os
from pathlib import Path

app_root = Path(os.environ.get("APP_ROOT", Path.cwd())).resolve()
prompt_path = app_root / "prompts" / "markdown-flow.txt"
if not prompt_path.is_file():
    raise RuntimeError(f"Markdown Flow prompt not found: {prompt_path}")

markdown_flow = prompt_path.read_text(encoding="utf-8")
system_prompt = f"{markdown_flow}\n\n{application_instructions}"
```

Set `APP_ROOT` to your deployed backend root, or replace `app_root` with a framework-provided project root. Avoid a fixed chain of `dirname()` or `.parent` calls based on the current module depth; moving the loader will silently point it at a different folder unless you explicitly raise on a missing file.

Run `verify-prompt` in CI after changing a preset or upgrading Markdown Flow. Run `doctor` when diagnosing a package/CLI installation. Regenerate committed artifacts whenever the package version or contract configuration changes.

### Structured provider responses

For providers that support a JSON Schema or function/tool output, adapt the provider-neutral helpers rather than inventing a second envelope:

```ts
import {
  createMarkdownFlowResponseTool,
  markdownFlowResponseSchema,
} from "markdown-flow/ai";

// Adapt `markdownFlowResponseSchema` to your provider's JSON-schema option,
// or adapt this provider-neutral tool definition to its tool format.
const tool = createMarkdownFlowResponseTool({ preset: "rag", sources });
```

The response envelope is `{ protocol: "markdown-flow/v1", content: string }`. Citations and datasets are trusted transport metadata owned by your server, not model-produced fields.

## Stream responses

### Recommended: controlled growing string

Append provider text into ordinary React state and pass the accumulated string to `AIResponse`:

```tsx
"use client";

import { useState } from "react";
import { AIResponse } from "markdown-flow/ai";

export function Answer() {
  const [content, setContent] = useState("");

  async function ask() {
    const response = await fetch("/api/answer");
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      setContent((previous) => previous + decoder.decode(value, { stream: true }));
    }
  }

  return <AIResponse content={content} preset="chat" />;
}
```

When a new value starts with the old value, Markdown Flow treats the suffix as a delta, batches visual updates, and preserves completed segments. A non-append change safely replaces the parsed content. A rich block remains pending until its closing fence arrives, so partial JSON and Mermaid do not mount as broken interactive UI.

Set the terminal state when your transport exposes it:

```tsx
<AIResponse content={content} status="complete" />
<AIResponse content={content} status="error" error="The provider stopped responding." />
```

### Controller mode: events, retries, cancellation, and metadata

Use `useAIResponse()` (or the lower-level `useMarkdownFlowStream()`) when text, citations, datasets, completion, and errors arrive as separate events:

```tsx
"use client";

import { AIResponse, readMarkdownFlowSSE, useAIResponse } from "markdown-flow/ai";

export function EventAnswer() {
  const response = useAIResponse();

  async function ask() {
    const result = await fetch("/api/answer");
    for await (const event of readMarkdownFlowSSE(result)) response.apply(event);
  }

  return <AIResponse stream={response} preset="chat" scrollBehavior="if-at-bottom" />;
}
```

The controller provides `append`, `replace`, `apply`, `applyResponse`, `complete`, `fail`, `cancel`, and `retry`. Provider-neutral events are:

```ts
type MarkdownFlowStreamEvent =
  | { type: "text"; delta: string }
  | { type: "citation"; citation: MarkdownFlowCitation }
  | { type: "dataset"; dataset: MarkdownFlowDataset }
  | { type: "error"; message: string }
  | { type: "complete" };
```

`readMarkdownFlowSSE()` accepts UTF-8 SSE `data:` payloads containing plain text, provider chunks, or these events. For example:

```text
data: {"type":"text","delta":"A streamed answer"}

data: {"type":"complete"}
```

`scrollBehavior` may be `"none"` (default), `"if-at-bottom"` (chat-friendly), or `"always"`; use `scrollContainerRef` for a specific scroll container.

## Citations, datasets, and trusted artifacts

### Citation rules

Use stable, bare source IDs consisting of letters, digits, `_`, and `-`, starting with a letter or digit. Good: `policy-42`, `handbook_2026`. Incorrect: `[cite:policy-42]`, `cite:policy-42`, or IDs containing spaces.

```md
Retention is 30 days. [cite:policy-42]
```

Citation diagnostics identify invalid source IDs, an answer with sources but no citation tokens, and tokens that do not match supplied sources. They are diagnostic only: keep their detail out of production UI.

For lazy source details, use `citationResolver`; it must perform its own authorization. Passing source metadata directly is simpler when you already have display-safe data.

### Dataset-backed charts

For small data, use inline chart rows. For large or sensitive data, have the model request a host-approved dataset and fields instead:

````md
```chart
{"type":"line","dataset":"revenue-by-month","x":"month","y":"revenue"}
```
````

```tsx
<AIResponse
  content={answer}
  preset="analytics"
  policy={{
    allowedDatasetIds: ["revenue-by-month"],
    allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] },
  }}
  datasetResolver={{
    async resolve({ id, fields }) {
      // Re-check tenant and user permissions here. Never trust the request alone.
      return readAuthorizedDataset(id, fields);
    },
  }}
/>
```

The resolver returns a `MarkdownFlowResolverResult` with a `status` of `loading`, `ready`, `unavailable`, `denied`, or `error`. A ready dataset must return the requested ID, a schema containing every requested field, and rows containing those fields. Dataset results are cached by resolver, ID, and field set; `useMarkdownFlowDataset()` exposes a `refresh()` function.

### Trusted application components (artifacts)

Models may request an explicitly registered component through an `artifact` fence. They never send JSX.

```tsx
function OrderCard({ input }: { input: { id: string } }) {
  return <a href={`/orders/${encodeURIComponent(input.id)}`}>Order {input.id}</a>;
}

<AIResponse content={answer} components={{ order: OrderCard }} />
```

The corresponding model payload is a strict JSON envelope:

````md
```artifact
{"name":"order","version":"1","input":{"id":"ord_123"}}
```
````

For a stronger boundary, register an artifact with `createMarkdownFlowArtifactRegistry()`. Every definition supplies a name, version, schema, `render`, fallback, and optionally an `authorize` predicate and an asynchronous resolver. The active render policy must allow both the artifact name and version. Keep mutations in normal application flows with server-side checks and confirmation.

## Presets, policies, and normalization

### Presets

Pass a preset to both `AIResponse` and `createMarkdownFlow()` / `createMarkdownFlowInstructions()`:

| Preset | Appropriate surface |
| --- | --- |
| `minimal` | Plain Markdown; no rich AI blocks. |
| `chat` | Default assistant answer. |
| `rag` | Grounded answer with trusted sources. |
| `technical` | Technical explanation, code-adjacent structure, and diagrams. |
| `analytics` | Metrics and visual analysis. |
| `showcase` | All built-ins for demos and contract tests; avoid as a production default. |

The current `chat`, `rag`, `technical`, and `analytics` presets enable the built-in block vocabulary and external URLs. The preset is a useful product-level intent label, not an authorization system. Use a policy when the capability boundary must be narrower.

### Render policies and limits

`policy` is the preferred `AIResponse` prop; `renderPolicy` is its compatibility alias. A policy can add or replace these settings:

```tsx
<AIResponse
  content={answer}
  preset="rag"
  policy={{
    allowedBlocks: ["callout", "timeline", "chart"],
    maxBlockCharacters: 8_000,
    maxBlocks: 12,
    maxTableRows: 100,
    maxChartDataPoints: 100,
    allowExternalUrls: false,
    allowedDatasetIds: ["revenue-by-month"],
    allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] },
    allowedArtifacts: ["order"],
    allowedArtifactVersions: { order: ["1"] },
  }}
/>
```

Defaults are 20,000 characters per block, 32 blocks, 250 table-like rows, and 250 inline chart points. A policy replaces a preset field when it provides that field; for example, supplying `allowedBlocks` replaces the preset’s block list. Treat `allowExternalUrls` as a deliberate media capability, not a sanitation substitute.

### Normalization versus strict contracts

The default validation mode is `normalize`. It recovers documented, unambiguous model variations:

- case-normalized block language and `mermaidjs` / `mermaid-js`;
- same-line JSON or Mermaid fence bodies;
- JSON5-style single quotes, comments, and trailing commas;
- a top-level item array or an object nested under `config`, `props`, or `payload`;
- common container aliases such as `milestones`, `steps`, `services`, `tasks`, `sections`, `panels`, `entries`, and `nodes`;
- common item aliases such as `heading`, `label`, `name`, or `text` for titles and `completed` for `checked`;
- chart `xAxis` / `yAxis`, `labels` / `categories`, and Chart.js- or Apex-style `datasets` / `series`;
- media aliases such as `href`, `link`, or `src` for `url`.

Normalization keeps only fields supported by the selected block and produces a canonical internal configuration before validation. Unknown fields are ignored in normalize mode; strict mode rejects aliases, JSON5 syntax, wrappers, and extra fields. Validation still enforces size limits, safe `http:`/`https:` media URLs, finite chart values, explicit dataset authorization, and any policy you pass.

Require exact output where your model contract needs it:

```ts
const flow = createMarkdownFlow({ preset: "rag", sources, validationMode: "strict" });

<AIResponse content={answer} validationMode="strict" />
```

Low-level `normalizeMarkdownFlowBlock`, `validateMarkdownFlowBlock`, and `MarkdownFlowNodeParser` also accept strict normalization options.

## All built-in blocks

Put a block in a fenced code block whose language is its block type. Generated prompts request strict JSON because it is the most portable model contract. The default renderer can recover the common JSON5 and schema variations listed above; strict mode requires one exact JSON object with double-quoted keys and strings. HTML, CSS, JavaScript, JSX, and executable content are never accepted.

Do not generate empty demonstration blocks. Arrays such as `items`, `tabs`, `cards`, `files`, `metrics`, `rows`, `images`, and `locations` should contain meaningful entries; use ordinary Markdown when structured data is unavailable. If an upstream model nevertheless sends a valid empty collection, Markdown Flow renders a quiet empty state instead of an error.

````md
```callout
{"title":"Important","body":"Use a policy for a narrow surface.","tone":"warning"}
```
````

The following are compact valid shapes. Optional text fields are omitted where they are not needed. Item arrays must be non-empty and bounded by `maxTableRows`.

| Block | Use | Minimal valid JSON/body |
| --- | --- | --- |
| `callout` | Highlight an important note or decision. | `{"title":"Important"}` or `{"body":"Read this.","tone":"note"}` |
| `metrics` | Display headline values. | `{"metrics":[{"label":"Revenue","value":1200}]}` |
| `timeline` | Show chronological milestones. | `{"items":[{"title":"Launch","date":"2026-07-15"}]}` |
| `steps` | Present ordered instructions. | `{"items":[{"title":"Install dependencies"}]}` |
| `comparison` | Compare options on shared rows. | `{"columns":["Option A"],"rows":[{"label":"Cost","values":["Low"]}]}` |
| `accordion` | Hide optional supporting detail. | `{"items":[{"title":"Details","content":"Supporting information"}]}` |
| `tabs` | Switch between peer views. | `{"tabs":[{"label":"Overview","content":"Summary"}]}` |
| `cards` | Present peer summaries or recommendations. | `{"cards":[{"title":"Option A"}]}` |
| `filetree` | Explain a file/folder layout. | `{"files":[{"name":"src","type":"folder"}]}` |
| `progress` | Show completion toward a total. | `{"items":[{"title":"Migration","value":3,"total":5}]}` |
| `checklist` | Display checked and unchecked tasks. | `{"items":[{"title":"Review","checked":false}]}` |
| `status` | Report rollout, incident, or project state. | `{"items":[{"title":"Deploy","status":"current"}]}` |
| `quote` | Attribute a short quotation. | `{"body":"Keep it simple."}` |
| `chart` | Plot a validated trend or comparison. | `{"type":"bar","data":[{"name":"Jan","value":1}],"x":"name","y":"value"}` |
| `mermaid` | Draw a flow/relationship diagram. | Mermaid text, e.g. `graph TD\n  A-->B` |
| `embed` | Preview an approved external link, video, or document. | `{"url":"https://example.com"}` |
| `image` | Display approved external images. | `{"images":[{"src":"https://example.com/image.png","alt":"Example"}]}` |
| `map` | Compare a small set of coordinate locations. | `{"locations":[{"name":"Office","x":0,"y":0}]}` |

### Structured-block field reference

- `callout`: `title`, `body`, `tone` (`note`, `insight`, `success`, `warning`). At least title or body is required.
- Common `items` blocks (`timeline`, `steps`, `accordion`, `progress`, `checklist`, `status`): each item needs `title`; permitted optional fields are `date`, `description`, `status`, `meta`, `open`, `content`, `value`, `total`, and `checked`. Status values are `complete`, `current`, `upcoming`, and `blocked`.
- `metrics.metrics[]`: `label` and string/number `value`; optional `change`, `detail`.
- `comparison`: up to 12 string `columns`; every `rows[]` item has a string `label` and `values` exactly as long as `columns`. Values may be strings, numbers, or booleans.
- `tabs.tabs[]`: `label` and string `content`, with optional `title`; at most 12 tabs.
- `cards.cards[]`: required `title`; optional `description`, `meta`, `eyebrow`.
- `filetree.files[]`: required `name`; optional `type` (`file` or `folder`), `detail`, and numeric `depth`.
- `quote`: required non-empty `body`; optional `title`, `attribution`, and `role`.

### Chart reference

Allowed types are `bar`, `line`, `pie`, `area`, `radar`, `composed`, `sparkline`, `scatter`, `funnel`, `gauge`, `heatmap`, `waterfall`, and `cohort`.

For inline data, provide non-empty row objects. `x` defaults to `name`; `y` defaults to `value`; `keys` can select series. Numeric series fields must be finite numbers in every row. `scatter` requires numeric `x` and `y`. A `composed` chart may use `bars`, `lines`, and `areas` arrays. `title`, `colors`, and numeric `max` are optional.

For a dataset chart, omit `data`, set `dataset`, and name the requested fields in `x`, `y`, `keys`, `lines`, `bars`, or `areas`. Every requested field must be allowed by the policy and the resolver’s returned schema.

### Media and Mermaid reference

- `embed` allows `title`, `url`, `kind` (`link`, `video`, `document`), `description`, and `publisher`. `url` must be `http:` or `https:` and `allowExternalUrls` must be true.
- `image` allows optional `title`, `layout` (`gallery`, `before-after`), and non-empty `images`. Each image has an `https?` `src` and optional `alt`, `caption`, `label`.
- `map` allows optional `title` and non-empty `locations`; each location needs string `name` and numeric `x`, `y`, with optional `detail`.
- Mermaid is the sole non-JSON block. Its body must be non-empty Mermaid syntax; it is still enabled or disabled through `allowedBlocks`.

## Styling, diagnostics, and telemetry

`styles.css` is the self-contained easy path and includes all rich-block and KaTeX styling. Use `core.css` plus `math.css` only when you intentionally want the split boundary. Load CSS once, not in every response component, and never copy styles from the playground.

Turn on the local development inspector while integrating:

```tsx
<AIResponse content={content} debug />
```

In non-production builds it shows requested, normalized, validated, rendered, and rejected blocks plus stream and citation diagnostics. It does not render in production and does not send telemetry. When a malformed block cannot become its intended component, production renders safely extracted readable text—or escaped raw text when no structure can be recovered—instead of a dead-end validation error. Policy-denied content remains hidden. Diagnostics can include response content, so do not expose them to end users.

For privacy-safe production observability, pass a `telemetry` handler. Stream and resolver events are available; stream diagnostics contain counts and timestamps, not provider payloads. Do not add raw response text to telemetry.

Useful local and CI checks:

```bash
npx markdown-flow doctor
npx markdown-flow verify-prompt --preset rag --input prompts/markdown-flow.txt
npm run lint
npm run build:package
npm run test:unit
npm run test:render
npm run test:a11y
npm run test:security
```

Test your actual provider chunk boundaries, truncated fences, replacements, failed streams, denied source/dataset resolution, narrow containers, and the authorization rules of your product.

## Security configuration

Markdown Flow validates configured rich-block shapes, applies a host policy, and sanitizes presentation input. It is not an authentication, authorization, retrieval, network, secrets, or truthfulness system.

Use this checklist for production integrations:

1. Keep provider API keys and provider calls on trusted server code.
2. Authenticate and authorize before retrieval, before returning source metadata, and inside every dataset/artifact resolver.
3. Generate the prompt from the same preset and allowed-block configuration used by the renderer.
4. Start with the smallest policy that fits the surface; set explicit limits for untrusted or high-volume output.
5. Treat citation tokens as references only. Supply trusted source details yourself; never grant access based on a model token.
6. Keep `allowExternalUrls` false unless the product intentionally needs external embeds/images. Validate any further domain requirements in your own application boundary.
7. Register components in code with schemas, versions, fallbacks, and authorization. Never execute model-generated JSX, JavaScript, CSS, or actions.
8. Use dataset IDs and field allowlists, then verify user/tenant access in the resolver before returning rows.
9. Do not render provider tool calls or tool arguments as Markdown unless your server has deliberately converted safe display text.
10. Test rejection paths, malformed JSON, incomplete streams, and access-denied outcomes as carefully as success paths.

## Provider and framework examples

### Next.js App Router

Import styles in the layout and keep provider calls in a route handler or server action:

```tsx
// app/layout.tsx
import "markdown-flow/styles.css";
```

```tsx
// app/components/assistant-answer.tsx
"use client";

import { AIResponse } from "markdown-flow/ai";

export function AssistantAnswer({ content, sources }: Props) {
  return <AIResponse content={content} sources={sources} preset="rag" />;
}
```

On the server, authorize the request, retrieve approved excerpts, call `createMarkdownFlow({ preset: "rag", sources })`, add `instructions` to the provider prompt, then return text plus display-safe source metadata. Do not return provider credentials, unfiltered corpus data, or the model’s authorization decisions.

### OpenAI streams

Adapt an already-received OpenAI async iterable at the server/client stream boundary:

```ts
import { normalizeOpenAIStream } from "markdown-flow/ai";

for await (const event of normalizeOpenAIStream(openAIStream)) {
  // Serialize `event` to your chosen transport, such as SSE.
}
```

`normalizeOpenAIStreamChunk()` recognizes Chat Completions deltas and Responses API `response.output_text.delta`, terminal `response.completed`, and errors. Function-call events are intentionally ignored.

### Anthropic streams

```ts
import { normalizeAnthropicStream } from "markdown-flow/ai";

for await (const event of normalizeAnthropicStream(anthropicStream)) {
  // Forward text/complete/error events.
}
```

Text deltas and `message_stop` are normalized; tool-use JSON is deliberately not rendered.

### Vercel AI SDK streams

```ts
import { normalizeVercelAIStream } from "markdown-flow/ai";

for await (const event of normalizeVercelAIStream(result.fullStream)) {
  // Forward the provider-neutral event.
}
```

Both `text-delta` / `textDelta` and finish events are supported. Tool parts are ignored. If your UI already accumulates text with the SDK, skip adapters and use controlled `content`.

## Migration, troubleshooting, and release notes

### Release 0.2.5

- Existing `RichMarkdown`, `StreamingRichMarkdown`, `useMarkdownFlowStream`, and `useAIResponse` integrations remain supported.
- Replace duplicated prompt allowlists with `createMarkdownFlowInstructions({ preset, sources })` or `createMarkdownFlow({ preset, sources })`.
- Prefer the one-import stylesheet: `markdown-flow/styles.css`; keep separate `core.css` + `math.css` only intentionally.
- Prefer `<AIResponse content={growingContent} />` for straightforward streaming. Keep a controller for event-level controls.
- Regenerate committed prompt artifacts with `generate-prompt`, then validate with `verify-prompt`.
- Rich blocks and external `http:`/`https:` media are enabled by default. To keep a closed surface, pass an explicit `renderPolicy` with the block allowlist and `allowExternalUrls: false`.
- Streaming responses preserve visual continuity when a generation completes, restarts, or receives delayed provider events.
- The stylesheet and components have a calm, rounded visual refresh; no public component migration is required.
- Known rich blocks normalize common model variations even when no policy is supplied, including JSON5, wrappers, aliases, and popular chart-series shapes.
- Empty or malformed blocks now degrade to neutral empty or readable plain-content states while explicit policy denials remain concealed.
- The playground no longer carries private rich-block overrides; the published `styles.css` is the complete visual implementation.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| A rich block falls back instead of rendering. | Enable `debug`; first check that the fence closes and contains meaningful data. Normalize mode recovers common aliases and JSON5; strict mode requires the exact reference schema. |
| A chart falls back. | Row-oriented data and common `labels`/`categories` plus `datasets`/`series` inputs are supported. Confirm every series has the same number of values and every numeric value is finite. |
| A chart dataset is denied/unavailable. | Confirm dataset ID and requested fields are policy-allowed, then confirm the resolver authorizes and returns matching schema/data. |
| Citations do not appear. | Pass `sources`/`citations`, use `[cite:bare-id]`, and make sure the bare ID matches exactly. |
| A partial block displays as incomplete. | Send the closing fence before `complete`; this is intentional protection against partial JSON/Mermaid. |
| Stream updates reparse unexpectedly. | Preserve the existing content as a prefix when appending. A changed prefix is intentionally treated as replacement content. |
| Embed or image is rejected. | Require an `http:`/`https:` URL and enable `allowExternalUrls`; impose any host/domain policy in your application. |
| A custom component is rejected. | Register it, permit its name and version in policy, provide object input, and make its schema/authorization accept the request. |
| Prompt verification fails after upgrade. | Regenerate the prompt/config artifacts with the installed package version and re-run `verify-prompt`. |

For version-by-version changes, see [CHANGELOG.md](./CHANGELOG.md).
