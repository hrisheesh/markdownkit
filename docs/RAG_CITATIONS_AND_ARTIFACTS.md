# RAG citations, trusted datasets, and AI artifacts

Markdown Flow separates what a model may describe from what the application may authorize. This is the key to using RAG and business data without turning a model response into an execution surface.

## Grounded citations

Retrieve and authorize sources on the server. Give the model bounded excerpts and stable IDs, then supply the full trusted citation metadata alongside the rendered response.

```text
Prompt context: Source [cite:policy-42] — approved excerpt
Model output: The retention period is 30 days [cite:policy-42].
Renderer metadata: { id, chunk_id, document_id, filename, text_preview }
```

The model can reference `[cite:policy-42]`; it cannot use that text as authority to fetch another document. A `citationResolver` must enforce tenant and user access before it returns any record.

## Dataset-backed charts

Do not serialize a large analytics table into model output. Let the model request a visual using an approved dataset ID and a narrow set of fields:

````md
```chart
{"type":"line","dataset":"revenue-by-month","x":"month","y":"revenue"}
```
````

The host validates the block against `allowedDatasetIds` and `allowedDatasetFields`, then resolves rows only after its own authorization checks. This reduces prompt size, keeps data fresh, and prevents a model from selecting arbitrary fields.

## Custom business artifacts

An artifact is a host-registered React component—not generated code. It has a name, version, strict input schema, permission boundary, optional authorized resolver, renderer, and fallback state. The model can select only a name and version you allow in `renderPolicy`.

Use this for account health, order status, incident summaries, workflow state, or domain-specific cards. Keep all mutations in normal product actions with server-side authorization and explicit confirmation.

Read the [complete RAG, datasets, and artifact guide](./LLM_INTEGRATION.md#rag-citations-and-trusted-datasets) for working code and the [production checklist](./LLM_INTEGRATION.md#security-and-production-checklist) before release.
