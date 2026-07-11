import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../..", import.meta.url));
const { RichMarkdown } = require(root);
const { validateMarkdownFlowBlock } = require(root);
const {
  MarkdownFlowStreamParser,
  StreamingRichMarkdown,
  createMarkdownFlowInstructions,
  markdownFlowResponseSchema,
  normalizeMarkdownFlowStreamChunk,
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
  /valid JSON/,
);
assert.match(
  validateMarkdownFlowBlock("embed", '{"url":"https://example.com"}').reason,
  /disabled/,
);

const strictPolicyMarkup = render(RichMarkdown, {
  content: "```chart\n{ type: 'line' }\n```\n\n```callout\n{\"title\":\"Safe\",\"body\":\"Validated output.\"}\n```",
  renderPolicy: { allowedBlocks: ["chart", "callout"] },
});
assert.match(strictPolicyMarkup, /could not be rendered safely/);
assert.match(strictPolicyMarkup, /Validated output/);

const streamParser = new MarkdownFlowStreamParser();
const streamedContent = "Intro\n\n```callout\n{\"title\":\"Ready\",\"body\":\"Rendered once complete.\"}\n```\n\nDone.";
for (const character of streamedContent) streamParser.append(character);
streamParser.finish();
assert.equal(streamParser.getSegments().map((segment) => segment.content).join(""), streamedContent);
assert.equal(streamParser.getSegments().filter((segment) => segment.type === "block").length, 1);

const streamingMarkup = render(StreamingRichMarkdown, {
  content: streamedContent,
  status: "complete",
  renderPolicy: { allowedBlocks: ["callout"] },
});
assert.match(streamingMarkup, /Rendered once complete/);

const instructions = createMarkdownFlowInstructions({
  allowedBlocks: ["callout"],
  availableDatasets: ["revenue-by-month"],
  citations: [{ id: "1", filename: "report.pdf" }],
});
assert.match(instructions, /Allowed block types: callout/);
assert.match(instructions, /Approved dataset IDs: revenue-by-month/);
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
