import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { aiStreamReplays } from "../fixtures/ai-stream-replays.mjs";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../..", import.meta.url));
const packageCss = readFileSync(`${root}/dist/styles.css`, "utf8");
for (const selector of [".markdown-render", ".rich-block-frame", ".rich-media-embed", ".rich-explore-tabs", ".rich-highlight-card", ".rich-block-fallback"]) {
  assert.match(packageCss, new RegExp(selector.replace(".", "\\.")), `dist/styles.css is missing ${selector}`);
}
const { RichMarkdown } = require(root);
const { validateMarkdownFlowBlock } = require(root);
const {
  MarkdownFlowStreamParser,
  normalizeMarkdownFlowContent,
  joinMarkdownFlowNodes,
  extractMarkdownFlowCitationIds,
  AIResponse,
  StreamingRichMarkdown,
  createMarkdownFlowInstructions,
  markdownFlowResponseSchema,
  normalizeMarkdownFlowStreamChunk,
  createMarkdownFlowArtifactRegistry,
  validateMarkdownFlowArtifactBlock,
} = require(`${root}/dist/ai/index.js`);
const { RichMarkdownCore } = require(`${root}/dist/core.js`);
const { StaticMarkdown } = require(`${root}/dist/server.js`);

function render(Component, props) {
  return renderToStaticMarkup(React.createElement(Component, props));
}

const documentMarkup = render(RichMarkdown, {
  content: "# Product update\n\n- Fast\n- Safe\n\n<script>window.__unsafe = true</script>\n\n```alert\nRelease ready\n```",
  blockRenderers: {
    alert: ({ code }) => React.createElement("aside", { "data-renderer": "alert", role: "note" }, code),
  },
  components: {
    h1: ({ children }) => React.createElement("h1", { "data-override": "heading" }, children),
  },
});

assert.match(documentMarkup, /data-override="heading"/);
assert.match(documentMarkup, /data-renderer="alert"/);
assert.doesNotMatch(documentMarkup, /<script/i);
assert.doesNotMatch(documentMarkup, /window\.__unsafe/);

const coreMarkup = render(RichMarkdownCore, { content: "## Core document\n\nSafe and portable." });
assert.match(coreMarkup, /Core document/);

const wideTableMarkup = render(RichMarkdown, {
  content: "| Feature | Interactive charts | Reliable table fallback | Token overhead | Streaming friendly |\n| --- | --- | --- | --- | --- |\n| Long-form response | Works without breaking normal words into single characters | Preserves readable columns | Minimal | Yes |",
});
assert.match(wideTableMarkup, /min-w-full w-max/);
assert.match(wideTableMarkup, /break-normal wrap-normal/);

const duplicateComparisonMarkup = render(RichMarkdown, {
  content: "```comparison\n{\"columns\":[\"Interactive charts\",\"Interactive charts\"],\"rows\":[{\"label\":\"Reliable table fallback\",\"values\":[\"Included\",\"Included\"]},{\"label\":\"Reliable table fallback\",\"values\":[true,true]}]}\n```",
});
assert.match(duplicateComparisonMarkup, /Interactive charts/);
assert.match(duplicateComparisonMarkup, /Reliable table fallback/);

const staticMarkup = render(StaticMarkdown, {
  content: "## Server document\n\n```chart\n{ type: 'line' }\n```",
});
assert.match(staticMarkup, /Server document/);
assert.match(staticMarkup, /type: &#x27;line&#x27;/);
assert.doesNotMatch(staticMarkup, /recharts|svg/i);

assert.deepEqual(
  validateMarkdownFlowBlock("chart", '{"type":"line","data":[{"name":"Jan","value":12}],"keys":["value"]}'),
  { valid: true },
);
assert.deepEqual(
  validateMarkdownFlowBlock(
    "chart",
    '{"dataset":"revenue-by-month","type":"line","x":"month","y":"revenue"}',
    {
      allowedBlocks: ["chart"],
      allowedDatasetIds: ["revenue-by-month"],
      allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] },
    },
  ),
  { valid: true },
);
assert.match(
  validateMarkdownFlowBlock(
    "chart",
    '{"dataset":"revenue-by-month","type":"line","x":"month","y":"margin"}',
    {
      allowedBlocks: ["chart"],
      allowedDatasetIds: ["revenue-by-month"],
      allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] },
    },
  ).reason,
  /outside the approved dataset schema/,
);

const artifacts = createMarkdownFlowArtifactRegistry([{
  name: "customer-health",
  version: "1",
  schema: {
    parse(input) {
      return input && typeof input === "object" && typeof input.accountId === "string"
        ? { valid: true, value: input }
        : { valid: false, reason: "accountId is required." };
    },
  },
  render: ({ value }) => React.createElement("div", null, value.accountId),
  fallback: ({ reason }) => React.createElement("div", null, reason),
}]);
assert.equal(artifacts.get("customer-health", "1")?.name, "customer-health");
assert.equal(
  validateMarkdownFlowArtifactBlock(
    '{"name":"customer-health","version":"1","input":{"accountId":"acme"}}',
    artifacts,
    { allowedArtifacts: ["customer-health"], allowedArtifactVersions: { "customer-health": ["1"] } },
  ).valid,
  true,
);
assert.match(
  validateMarkdownFlowArtifactBlock(
    '{"name":"customer-health","version":"2","input":{"accountId":"acme"}}',
    artifacts,
    { allowedArtifacts: ["customer-health"], allowedArtifactVersions: { "customer-health": ["1"] } },
  ).reason,
  /version is not permitted/,
);
const invalidArtifactMarkup = render(RichMarkdown, {
  content: "```artifact\n{\"name\":\"customer-health\",\"version\":\"1\",\"input\":{}}\n```",
  artifactRegistry: artifacts,
  renderPolicy: { allowedArtifacts: ["customer-health"], allowedArtifactVersions: { "customer-health": ["1"] } },
});
assert.match(invalidArtifactMarkup, /accountId is required/);
assert.match(
  validateMarkdownFlowBlock(
    "chart",
    '{"dataset":"revenue-by-month","type":"line","data":[{"name":"Jan","value":12}],"x":"month","y":"revenue"}',
    { allowedBlocks: ["chart"], allowedDatasetIds: ["revenue-by-month"], allowedDatasetFields: { "revenue-by-month": ["month", "revenue"] } },
  ).reason,
  /inline data or a dataset reference/,
);
assert.match(
  validateMarkdownFlowBlock("chart", "{ type: 'line' }", { allowedBlocks: ["chart"] }).reason,
  /non-empty/,
);
assert.match(
  validateMarkdownFlowBlock("chart", "{ type: 'line' }", { allowedBlocks: ["chart"] }, { normalization: "strict" }).reason,
  /valid JSON/,
);
assert.match(
  validateMarkdownFlowBlock("embed", '{"url":"https://example.com"}', { allowExternalUrls: false }).reason,
  /disabled/,
);

const strictPolicyMarkup = render(RichMarkdown, {
  content: "```chart\n{ type: 'line' }\n```\n\n```callout\n{\"title\":\"Safe\",\"body\":\"Validated output.\"}\n```",
  renderPolicy: { allowedBlocks: ["chart", "callout"] },
});
assert.match(strictPolicyMarkup, /Rendered as plain content/);
assert.match(strictPolicyMarkup, /Validated output/);

const streamParser = new MarkdownFlowStreamParser();
const streamedContent = "Intro\n\n```callout\n{\"title\":\"Ready\",\"body\":\"Rendered once complete.\"}\n```\n\nDone.";
for (const character of streamedContent) streamParser.append(character);
streamParser.finish();
assert.equal(streamParser.getSegments().map((segment) => segment.content).join(""), streamedContent);
assert.equal(streamParser.getSegments().filter((segment) => segment.type === "block").length, 1);
assert.equal(streamParser.getSegments().find((segment) => segment.type === "block")?.lifecycle, "ready");

const normalizedPartial = normalizeMarkdownFlowContent("Before\n\n```callout\n{\"title\":\"Partial\"}", { complete: false });
assert.equal(joinMarkdownFlowNodes(normalizedPartial), "Before\n\n```callout\n{\"title\":\"Partial\"}");
assert.deepEqual(normalizedPartial.at(-1)?.type, "pending");
assert.equal(normalizedPartial.at(-1)?.lifecycle, "pending");

const ordinaryCodeParser = new MarkdownFlowStreamParser();
const ordinaryCode = "Before\n\n```typescript\nconst answer = 42;\n```\n\nAfter";
for (const character of ordinaryCode) ordinaryCodeParser.append(character);
ordinaryCodeParser.finish();
assert.equal(ordinaryCodeParser.getSegments().map((segment) => segment.content).join(""), ordinaryCode);
assert.equal(ordinaryCodeParser.getSegments().some((segment) => segment.type === "pending"), false);
assert.equal(ordinaryCodeParser.getSegments().some((segment) => segment.type === "block"), false);

for (const replay of aiStreamReplays) {
  const parser = new MarkdownFlowStreamParser();
  replay.chunks.forEach((chunk) => parser.append(chunk));
  if (!replay.incomplete) parser.finish();
  assert.equal(parser.getSegments().map((segment) => segment.content).join(""), replay.expected, `${replay.name} should preserve all provider text`);
  if (replay.incomplete) assert.equal(parser.getSegments().at(-1)?.type, "pending", `${replay.name} should retain a pending block`);
}

const streamingMarkup = render(StreamingRichMarkdown, {
  content: streamedContent,
  status: "complete",
  renderPolicy: { allowedBlocks: ["callout"] },
});
assert.match(streamingMarkup, /Rendered once complete/);
const pendingStreamingMarkup = render(StreamingRichMarkdown, { content: "```callout\n{\"title\":\"Partial\"}", status: "error" });
assert.match(pendingStreamingMarkup, /role="status"/);
assert.match(pendingStreamingMarkup, /Incomplete AI block/);
assert.match(render(StreamingRichMarkdown, { content: "", status: "error", error: "Provider stopped." }), /role="alert"/);

const aiResponseMarkup = render(AIResponse, {
  content: "Grounded answer [cite:source-1]\n\n```artifact\n{\"name\":\"order\",\"version\":\"1\",\"input\":{\"id\":\"A-42\"}}\n```",
  status: "complete",
  preset: "rag",
  sources: [{ id: "source-1", chunk_id: "chunk-1", document_id: "doc-1", filename: "guide.md", text_preview: "Grounding source" }],
  components: {
    order: ({ input }) => React.createElement("div", { "data-order": input.id }, input.id),
  },
});
assert.match(aiResponseMarkup, /data-order="A-42"/);
assert.match(aiResponseMarkup, /Show source: guide.md/);
assert.deepEqual(extractMarkdownFlowCitationIds("Step 1 [1] is ordinary prose; [cite:source-1] is a source."), ["source-1"]);
const numericCitationMarkup = render(RichMarkdown, {
  content: "Step 1 is not a source. [1] is not a source either.",
  citations: [{ id: "1", chunk_id: "chunk-1", document_id: "doc-1", filename: "guide.md", text_preview: "Grounding source" }],
});
assert.doesNotMatch(numericCitationMarkup, /Show source: guide.md/);

const instructions = createMarkdownFlowInstructions({
  allowedBlocks: ["callout"],
  availableDatasets: ["revenue-by-month"],
  citations: [{ id: "1", filename: "report.pdf" }],
});
assert.match(instructions, /Allowed block types: callout/);
assert.match(instructions, /Approved dataset IDs: revenue-by-month/);
assert.match(instructions, /\[cite:source-id\]/);
assert.deepEqual(markdownFlowResponseSchema.required, ["protocol", "content"]);
assert.deepEqual(normalizeMarkdownFlowStreamChunk({ choices: [{ delta: { content: "Hello" } }] }), [{ type: "text", delta: "Hello" }]);
assert.deepEqual(normalizeMarkdownFlowStreamChunk({ type: "message_stop" }), [{ type: "complete" }]);

const a11yMarkup = render(RichMarkdown, {
  content: "```accordion\n{ title: 'Questions', items: [{ title: 'Is it accessible?', content: 'Yes.', open: true }] }\n```\n\n```progress\n{ items: [{ title: 'Release', value: 75, total: 100 }] }\n```",
});
assert.match(a11yMarkup, /aria-expanded="true"/);
assert.match(a11yMarkup, /role="region"/);
assert.match(a11yMarkup, /role="progressbar"/);

console.log("Render regression checks passed.");
