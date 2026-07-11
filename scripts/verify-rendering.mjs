import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));
const { RichMarkdown } = require(root);
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

const a11yMarkup = render(RichMarkdown, {
  content: "```accordion\n{ title: 'Questions', items: [{ title: 'Is it accessible?', content: 'Yes.', open: true }] }\n```\n\n```progress\n{ items: [{ title: 'Release', value: 75, total: 100 }] }\n```",
});
assert.match(a11yMarkup, /aria-expanded="true"/);
assert.match(a11yMarkup, /role="region"/);
assert.match(a11yMarkup, /role="progressbar"/);

console.log("Render regression checks passed.");
