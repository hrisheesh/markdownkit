# Quality and compatibility

Markdown Flow is a React presentation layer for AI answers. This page states what is checked today, how to reproduce it, and what those checks do not prove.

## Supported environment

| Area | Supported / verified |
| --- | --- |
| React | React 18.3.1 and React 19.2.4 packed-package consumer checks |
| Rendering | Client rendering and server-safe static rendering |
| Next.js | App Router streaming guide and an SSR/hydration fixture for a completed AI response |
| Runtime | Node 20 in CI |
| Browsers | Modern evergreen browsers; validate your target browser/device matrix in your application |

Markdown Flow does not claim a separate browser certification program. Run the included playground and your own end-to-end tests for browsers, extensions, fonts, data volume, and accessibility requirements specific to your product.

## Checks in the repository

```bash
npm run lint
npm run build:package
npm run test:unit
npm run test:render
npm run test:a11y
npm run test:security
npm run test:compat
npm run check:size
npm run bench:streaming
```

The test suites cover stream chunk boundaries, malformed and incomplete structured blocks, citation token handling, policy validation, resolver and artifact boundaries, accessibility markup, security fixtures, Next.js-style SSR/hydration, and React 18/19 packed consumers. The repository also includes a Next.js App Router playground; run your application's hydration path too, especially if it adds component overrides or client-only behavior.

## Security boundary

Model output is untrusted data. Markdown Flow sanitizes Markdown output and keeps model-provided structured blocks behind policy validation, host authorization, and host-owned rendering. It does not authenticate users, authorize datasets, secure your provider keys, or make a model response trustworthy by itself.

Read the [production checklist](./LLM_INTEGRATION.md#security-and-production-checklist) before shipping.

## Bundle-cost method

`npm run check:size` measures package files and the reachable local ESM import graph from the root, AI, and core entries. It reports initial and lazy feature graphs and enforces budgets. It is repeatable, but it is not a promise of an application's final bundle: your bundler, shared dependencies, configuration, and imports determine that. The AI CommonJS budget includes development-only inspector code; browser ESM consumers keep rich features behind lazy boundaries.

Mermaid, charts, math parsing, and syntax highlighting are loaded only for relevant content. Import `markdown-flow/math.css` only on surfaces that support math.

## Streaming benchmark method

`npm run bench:streaming` feeds a fixed mixed Markdown/structured-block response in chunks. It verifies exact source preservation and reports reuse of completed parser node objects as later chunks arrive. This is the behavior users feel: a completed section stays stable while the active tail changes.

It intentionally does not claim that Markdown Flow is faster than every other renderer. Wall-clock rendering depends on your React tree, device, CSS, and rich features. Use a representative application profile for that question.

## Development inspector

Use `debug` while developing to inspect local parser state and pending blocks:

```tsx
<AIResponse stream={response} debug />
```

The inspector renders only outside production and never emits telemetry. It includes response text, so do not expose a development build to untrusted viewers.
