import assert from "node:assert/strict";

import { createMarkdownFlowStream } from "../../dist/ai/index.mjs";

const chunks = [
  "# Investigation\n\nThe service recovered after ",
  "the cache was invalidated.\n\n```callout\n",
  '{"title":"Action","body":"Keep the rollback"}',
  "\n```\n\n## Next steps\n",
  "Monitor error rate for 30 minutes.\n",
];

const parser = createMarkdownFlowStream();
let stableCommittedNodes = 0;
let previousNodes = [];
let naiveCharactersRendered = 0;
let markdownFlowCharactersChanged = 0;

for (const chunk of chunks) {
  parser.append(chunk);
  const nodes = parser.getSegments();
  stableCommittedNodes += nodes.filter((node) => previousNodes.some((previous) => previous.id === node.id && previous === node)).length;
  previousNodes = nodes;
  naiveCharactersRendered += nodes.map((node) => node.content).join("").length;
  markdownFlowCharactersChanged += nodes.at(-1)?.content.length ?? 0;
}
parser.finish();

const finalNodes = parser.getSegments();
assert.equal(finalNodes.map((node) => node.content).join(""), chunks.join(""), "stream parser must preserve the exact source");
assert.ok(stableCommittedNodes > 0, "completed nodes should retain identity while later chunks arrive");

console.log("# Streaming stability benchmark");
console.log("");
console.log("This measures the product behavior Markdown Flow is designed for: completed response sections keep their node identity while only the trailing section changes. It is not a cross-package speed comparison.");
console.log("");
console.log("| Fixture | Chunks | Final nodes | Completed-node identity reuses | Naive cumulative text work | Trailing-node text work |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: |");
console.log(`| Mixed Markdown + structured block | ${chunks.length} | ${finalNodes.length} | ${stableCommittedNodes} | ${naiveCharactersRendered} chars | ${markdownFlowCharactersChanged} chars |`);
console.log("");
console.log("Method: feed a fixed response incrementally, verify source preservation, and count reuse of committed parser node objects. A UI benchmark should additionally profile a representative application because React, CSS, and rich renderers affect wall-clock time.");
