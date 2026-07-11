# Release notes

## 0.1.2 — Framework resilience, accessibility, and package quality

Released 2026-07-12

### Package quality and framework resilience

- Added controlled, per-render custom fenced-block renderers and standard Markdown element overrides.
- Added lightweight `core` and server-safe `server` entry points for React Server Components and SSR.
- Added render-regression, accessibility-contract, package-size, and React 18/19 consumer compatibility checks.
- Improved interactive semantics for citations, accordions, tabs, progress indicators, and chart summaries.
- Added framework-focused examples and documented the supported integration paths.
- Kept the default import unchanged: `RichMarkdown` remains available from `@hrisheesh/markdown-render`.

### Performance and package impact

This release was compared with the published `0.1.1` package in an isolated React 19.2.4 SSR environment, alternating package order across six rounds. The default renderer remained effectively performance-neutral: small Markdown measured **4.8% faster**, a large document measured **6.6% faster**, and rich blocks were **0.7% slower**, which is within benchmark noise.

The full-root distribution change is intentionally modest: **+1.4 kB ESM**, **+1.5 kB CJS**, **+348 B CSS**, and **+17.2 kB (1.9%)** for the npm tarball. The optional Markdown-only `core` entry is approximately **5.7 kB ESM including its shared chunk** and is additive—not a replacement for the complete root renderer.

## 0.1.1

- First public package release with interactive Markdown, structured document blocks, charts, Mermaid diagrams, math, code, and safe media previews.
