# Markdown Flow documentation: React Markdown and AI response UI

Markdown Flow is a React presentation layer for polished Markdown and controlled AI responses. These guides cover ordinary Markdown rendering, streamed LLM output, RAG citations, trusted datasets, and host-owned business artifacts.

The core boundary is simple: a model can describe a response in Markdown and approved JSON blocks; your application retains authority over data, permissions, components, and actions.

## Start here

| Goal | Read |
| --- | --- |
| Render Markdown in an existing React or Next.js app | [Normal integration](./LLM_INTEGRATION.md#normal-markdown-integration) |
| Choose a React Markdown renderer and integrate it cleanly | [React Markdown rendering](./REACT_MARKDOWN_RENDERER.md) |
| Render server-side Markdown only | [Server rendering](./LLM_INTEGRATION.md#server-rendering) |
| Stream an LLM response into a chat interface | [Streaming an SSE response](./LLM_INTEGRATION.md#streaming-an-sse-response) |
| Build a Next.js streaming answer route | [Next.js AI streaming](./NEXTJS_AI_STREAMING.md) |
| Copy a provider, RAG, component, or analytics integration | [Provider integrations](./PROVIDER_INTEGRATIONS.md) |
| Send the model the correct response instructions | [Model request contract](./LLM_INTEGRATION.md#building-the-model-request) |
| Add citations and authorized dataset-backed charts | [RAG, citations, and trusted datasets](./LLM_INTEGRATION.md#rag-citations-and-trusted-datasets) |
| Build a CRM, analytics, or workflow artifact | [Custom business artifacts](./LLM_INTEGRATION.md#custom-business-artifacts) |
| Build grounded AI responses with RAG | [RAG citations and artifacts](./RAG_CITATIONS_AND_ARTIFACTS.md) |
| Prepare an AI feature for production | [Security and production checklist](./LLM_INTEGRATION.md#security-and-production-checklist) |
| Upgrade to 0.2.0 | [Changelog and migration notes](../CHANGELOG.md#020--2026-07-12) |
| Review support, checks, bundle cost, and methodology | [Quality and compatibility](./QUALITY.md) |
| Stream Markdown into a React UI | [Streaming Markdown in React](./STREAMING_MARKDOWN_REACT.md) |
| Build safe structured LLM response UI | [Structured LLM response UI](./STRUCTURED_LLM_RESPONSE_UI.md) |

## Core idea

Markdown Flow does not make an LLM generate a webpage. The model emits readable Markdown plus an intentionally small, approved vocabulary of JSON fenced blocks. The host application supplies data, resolves citations, performs authorization, owns the React components, and decides what is allowed to render.

```text
User → application → retrieval / authorized data → LLM request contract
                                                    ↓
                         streamed Markdown Flow response ← LLM
                                                    ↓
              validation + rendering policy + trusted host components
                                                    ↓
                                               end user
```

This keeps the response compact and inspectable while avoiding arbitrary generated HTML, JSX, scripts, or client-side data access.

## Contract at a glance

- Protocol: `markdown-flow/v1`
- Content: standard Markdown plus fenced blocks such as `callout`, `metrics`, `chart`, or `mermaid`
- Model-provided data: untrusted until validated
- Citations and datasets: trusted host metadata, not model authority
- Custom artifacts: registered by the host, versioned, schema-validated, and permission checked
- Streaming: rich fenced blocks are held as pending until the closing fence arrives

For the complete contract and integration examples, read the [integration guide](./LLM_INTEGRATION.md).

## 0.1.3 → 0.2.0 extreme streaming stress test

Two sequential five-minute extreme stream-parser runs compared the committed 0.1.3 baseline (`6681a60`) with the 0.2.0 candidate. The workload used randomized 1–96-character chunks over repeated mixed Markdown and structured-block responses.

| Metric | 0.1.3 | 0.2.0 candidate | Change |
| --- | ---: | ---: | ---: |
| Duration | 300.013s | 300.013s | — |
| Streams completed | 508,503 | 500,516 | -1.6% |
| Chunks processed | 63,871,816 | 62,868,607 | -1.6% |
| Characters processed | 3.082B | 3.033B | -1.6% |
| Throughput | 212,897 chunks/s | 209,553 chunks/s | -1.6% |
| Character throughput | 10.27M chars/s | 10.11M chars/s | -1.6% |
| Append latency p50 / p95 / p99 | 0.13 / 0.25 / 0.29 μs | 0.13 / 0.25 / 0.29 μs | unchanged |
| Peak heap | 82.79 MiB | 82.87 MiB | +0.08 MiB |
| Source-preservation failures | 0 | 0 | pass |
| Parser exceptions | 0 | 0 | pass |
| Completed-node identity reuses | 3.786B | 3.726B | expected from fewer streams |

**Verdict:** no correctness, memory, or percentile-latency regression. The 1.6% throughput variation is normal for two long sequential runs on a shared desktop host; percentile latency was identical.

| AI entry | 0.1.3 | 0.2.0 candidate | Change |
| --- | ---: | ---: | ---: |
| ESM entry | 23.9 kB | 29.5 kB | +5.6 kB |
| CJS entry | 136.3 kB | 142.3 kB | +6.0 kB |
| Browser AI import graph | 91.8 kB / 20.9 kB gzip | 97.4 kB / 22.1 kB gzip | +5.6 kB / +1.2 kB gzip |

The added package cost is the development-only inspector and its types. Current package-size checks pass; see [quality and compatibility](./QUALITY.md) for the repeatable benchmark method and limits.
