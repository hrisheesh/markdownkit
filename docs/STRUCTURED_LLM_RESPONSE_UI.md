# Structured LLM response UI

Markdown Flow lets a model request a small set of host-approved visual blocks without generating JSX, HTML, or application code.

```tsx
<AIResponse
  content={answer}
  components={{ order: OrderCard }}
  policy={{ allowedBlocks: ["callout", "chart"] }}
/>
```

The model can emit prose and approved fenced JSON blocks. It cannot select arbitrary React components or fetch application data. Each block is parsed, validated against the render policy, authorized/resolved by host code where needed, and then rendered by trusted React code.

For full source permissions, datasets, schemas, versions, and fallbacks, read [RAG citations and trusted artifacts](./RAG_CITATIONS_AND_ARTIFACTS.md) and the [integration guide](./LLM_INTEGRATION.md).
