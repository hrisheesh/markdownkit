# Changelog

All notable changes to Markdown Flow are documented here. Markdown Flow follows [Semantic Versioning](https://semver.org/).

For installation, usage, configuration, examples, migration guidance, and troubleshooting, see the [Ultimate User Guide](./README.md).

## 0.2.4 — 2026-07-15

### AI integration and rendering

- Added the simplest response path: `AIResponse` works with a completed or growing `content` string, while `preset="rag"` accepts trusted `sources` without a hand-maintained block policy.
- Added `createMarkdownFlow()` as the shared frontend/backend configuration: it exposes generated `instructions`, the matching render `policy`, enabled `blockTypes`, the citation format, and protocol `version`.
- Expanded `createMarkdownFlowInstructions()` with generated, enabled-block guidance, minimal examples, exact fences, chart `x`/`y` rules, and source-specific citation instructions.
- Added `showcase` alongside `minimal`, `chat`, `rag`, `technical`, and `analytics` presets.
- Added the `markdown-flow` CLI: `generate-prompt`, `generate-config`, `verify-prompt`, and `doctor`, so non-Node backends can consume a static prompt artifact.

### Recovery, rendering, and diagnostics

- Normalization is the default for harmless model variations, including documented aliases and same-line JSON or Mermaid fences. `createMarkdownFlow({ validationMode: "strict" })` produces strict model-contract guidance; low-level parser and validation APIs also expose strict normalization options.
- Added user-safe fallback messaging with actionable development diagnostics, including normalization and citation checks.
- Made `markdown-flow/styles.css` include essential math styling. `core.css` and `math.css` remain optional optimization imports.
- Improved local overflow handling for wide rich content and incremental controlled-string streaming.

- Batched high-frequency stream text updates into animation-frame flushes while preserving chunk diagnostics and response order.
- Made chart field resolution deterministic from explicit `x`/`y` fields and safe defaults.

### Presentation and documentation

- Made the default AI response policy permissive for every supported Markdown Flow block and external media URL. Applications can still opt into an explicit restrictive policy; unsafe URL protocols and unregistered artifacts remain rejected.
- Refined rich Markdown, structured blocks, charts, datasets, media, Mermaid, code, artifacts, and fallback states with a calm, responsive, rounded visual language.
- Consolidated package documentation into a comprehensive Ultimate User Guide in `README.md`; topic files now point to the guide and the changelog remains the release record.

## 0.2.0 — 2026-07-12

- Added `AIResponse`, streaming primitives, citations, response presets, policies, trusted artifacts, and provider-neutral response helpers.
- Added stable incremental rendering and the development inspector.
