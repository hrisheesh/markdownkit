# Changelog

All notable changes to Markdown Flow are documented here. Markdown Flow follows [Semantic Versioning](https://semver.org/).

For installation, usage, configuration, examples, migration guidance, and troubleshooting, see the [Ultimate User Guide](./README.md).

## 0.2.5 — 2026-07-15

### Flexible AI output

- Rich blocks now normalize automatically with or without an explicit render policy, making the two-import `AIResponse` integration behave like the complete package experience by default.
- Added tolerant recovery for JSON5 syntax, top-level arrays, `config` / `props` / `payload` wrappers, common field and container aliases, scalar coercion, and extra non-executable fields.
- Added conversion for common Chart.js and Apex-style `labels`, `categories`, `datasets`, and `series` configurations while preserving exact strict-mode validation.
- Valid bounded empty collections now render a neutral empty state. Invalid structures recover readable text or escaped source rather than ending at an opaque validation error.

### Complete package styling

- Made `markdown-flow/styles.css` the single source of truth for rich-block layout, spacing, responsive behavior, media, tabs, highlights, empty states, and fallbacks.
- Removed the playground's duplicate rich-block overrides, ensuring examples and consumer applications use the same published stylesheet.
- Added packaged-CSS regression assertions so missing public selectors fail release validation.

### Safer prompts and integration guidance

- Generated prompts now prohibit empty or placeholder rich blocks and direct models to ordinary Markdown whenever meaningful structured data is unavailable.
- Prompt verification now detects a missing non-empty-block requirement.
- Reworked backend prompt-loading guidance to use a stable application root and fail loudly when the generated prompt artifact is missing.
- Preserved rejection of unsafe URL protocols, prototype-shaped keys, event-handler properties, policy-denied content, unauthorized datasets, and configured size limits.

### Quality and compatibility

- Added regression coverage for default normalization, JSON5, wrappers, aliases, common chart schemas, strict mode, empty states, readable fallbacks, CSS completeness, prompt generation, and security boundaries.
- Kept feature-heavy chart, diagram, syntax-highlighting, and math renderers lazy; JSON5 remains an explicit runtime dependency instead of being duplicated into package bundles.

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
