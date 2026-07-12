# Changelog

All notable changes to Markdown Flow are documented here. Markdown Flow follows [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-07-12

### The AI response surface

- Added `AIResponse`, a product-focused API for completed or streaming answers, citations, response presets, policies, and trusted React components.
- Added `minimal`, `chat`, `rag`, `technical`, and `analytics` presets for small, intentional capability sets.
- Added a provider-neutral `markdown-flow/v1` response contract, instructions generator, structured-output tool definition, SSE reader, and OpenAI, Anthropic, and Vercel AI stream adapters.
- Added stable incremental Markdown rendering: completed segments retain their parser identity while the active tail updates; incomplete rich blocks render a safe pending state.
- Added optional `debug` inspection for local development. It is excluded from production rendering and does not emit telemetry.

### Grounded and trusted rich content

- Added explicit citation, dataset, resolver, artifact registry, schema, version, authorization, fallback, telemetry, and rendering-policy interfaces.
- Added strict validation and safe fallback handling for built-in structured blocks and host-owned artifacts.
- Kept model output as untrusted presentation data: Markdown Flow does not execute model-generated code or authorize model-provided source/data access.

### Documentation and quality

- Reworked the README and documentation around React Markdown, streaming, structured response UI, RAG, provider integrations, security, and operational guidance.
- Added a development-inspector test and a stream-stability benchmark.
- Added a Next.js-style SSR/hydration fixture and verified React 18.3.1 and React 19.2.4 packed-package compatibility, renderer/accessibility/security checks, and package-size budgets.

### Migration from 0.1.x

- Existing public entry points remain available.
- Use `AIResponse` when you want the concise answer-focused API; `StreamingRichMarkdown` and `useMarkdownFlowStream` remain available for lower-level integrations.
- Import `markdown-flow/styles.css` for rich/client surfaces and `markdown-flow/math.css` only where math is enabled.
- Treat the new structured-response helpers as an additive API. Existing `RichMarkdown`, `RichMarkdownCore`, and `StaticMarkdown` integrations continue to work.

## 0.1.3

Initial AI integration surface: streaming parsing, response contracts, citations, datasets, artifacts, policies, telemetry, and provider adapters.
