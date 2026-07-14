import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import { parseArguments, runCli, verifyPrompt } from "../../tooling/cli/markdown-flow.mjs";

const api = {
  MARKDOWN_FLOW_PROTOCOL: "markdown-flow/v1",
  AI_RESPONSE_PRESETS: ["minimal", "chat", "rag", "technical", "analytics"],
  getAIResponsePresetPolicy(preset) {
    return { allowedBlocks: preset === "technical" ? ["steps", "mermaid"] : ["steps"] };
  },
  createMarkdownFlowInstructions({ allowedBlocks }) {
    return [
      "Markdown Flow contract: markdown-flow/v1.",
      `Allowed block types: ${allowedBlocks.join(", ") || "none"}.`,
      "Each rich block must use strict JSON.",
      "Never invent sources or data. Cite using [cite:source-id].",
    ].join("\n");
  },
};

function createIo(input = "") {
  const stdin = new PassThrough();
  stdin.end(input);
  const stdout = new PassThrough();
  let output = "";
  stdout.on("data", (chunk) => { output += chunk; });
  return { stdin, stdout, get output() { return output; } };
}

test("generate-prompt uses the selected preset policy", async () => {
  const io = createIo();
  await runCli(["generate-prompt", "--preset", "technical"], { api, io });
  assert.match(io.output, /Allowed block types: steps, mermaid/);
});

test("generate-config produces the public policy as JSON", async () => {
  const io = createIo();
  await runCli(["generate-config", "--preset", "minimal", "--format", "json"], { api, io });
  assert.deepEqual(JSON.parse(io.output), {
    protocol: "markdown-flow/v1",
    preset: "minimal",
    renderPolicy: { allowedBlocks: ["steps"] },
  });
});

test("verify-prompt accepts generated instructions and rejects missing safeguards", async () => {
  const goodPrompt = api.createMarkdownFlowInstructions({ allowedBlocks: ["steps"] });
  assert.deepEqual(verifyPrompt(goodPrompt, { protocol: "markdown-flow/v1", allowedBlocks: ["steps"] }), []);
  const io = createIo(goodPrompt);
  await runCli(["verify-prompt"], { api, io });
  assert.equal(io.output, 'Prompt verified for preset "chat".\n');
  assert.match(
    verifyPrompt("Markdown Flow contract: markdown-flow/v1.", { protocol: "markdown-flow/v1", allowedBlocks: [] }).join(" "),
    /missing allowed-block policy/,
  );
});

test("argument parsing rejects unsupported commands and options", () => {
  assert.throws(() => parseArguments(["publish"]), /Unknown command/);
  assert.throws(() => parseArguments(["doctor", "--preset", "chat"]), /Unknown option|--preset/);
  assert.throws(() => parseArguments(["generate-config", "--format"]), /requires a value/);
  assert.throws(() => parseArguments(["generate-prompt", "--preset", "chat", "--preset", "rag"]), /only be provided once/);
});

test("doctor checks the package metadata and bundled API", async () => {
  const io = createIo();
  await runCli(["doctor"], { api, io });
  assert.match(io.output, /✓ installed version/);
  assert.match(io.output, /✓ bundled AI module/);
});
