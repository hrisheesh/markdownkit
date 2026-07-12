# Markdown Flow documentation

Markdown Flow is a React presentation runtime for Markdown and AI responses. This documentation covers both ordinary Markdown rendering and the `markdown-flow/ai` surface for streamed LLM responses, retrieval-augmented generation, trusted datasets, citations, and custom business artifacts.

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
