#!/usr/bin/env node

import { access, readFile, realpath, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SUPPORTED_FORMATS = new Set(["json"]);

export const usage = `Usage: markdown-flow <command> [options]

Commands:
  generate-prompt  Print Markdown Flow model instructions.
  generate-config  Print a preset render-policy configuration.
  verify-prompt    Validate Markdown Flow instructions from stdin or a file.
  doctor           Check that the installed package API is available.

Options:
  --preset <name>  One of minimal, chat, rag, technical, analytics, showcase (default: chat).
  --format <name>  Output format for generate-config (default: json).
  --output <path>  Write generated output to a file instead of stdout.
  --input <path>   Read verify-prompt input from a file instead of stdin.
  --help           Show this help message.`;

function cliError(message) {
  const error = new Error(message);
  error.isCliError = true;
  return error;
}

export function parseArguments(argv) {
  const [command, ...tokens] = argv;
  if (!command || command === "--help" || command === "-h") return { help: true };
  if (!new Set(["generate-prompt", "generate-config", "verify-prompt", "doctor"]).has(command)) {
    throw cliError(`Unknown command: ${command}. Run \`markdown-flow --help\` for usage.`);
  }

  const options = { command };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--help" || token === "-h") return { help: true };
    if (!token.startsWith("--")) {
      if (command === "verify-prompt" && !options.input) {
        options.input = token;
        continue;
      }
      throw cliError(`Unexpected argument: ${token}. Run \`markdown-flow ${command} --help\` for usage.`);
    }
    const key = token.slice(2);
    if (!new Set(["preset", "format", "output", "input"]).has(key)) {
      throw cliError(`Unknown option: ${token}. Run \`markdown-flow ${command} --help\` for usage.`);
    }
    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) throw cliError(`Option ${token} requires a value.`);
    index += 1;
    if (key === "preset" && !["generate-prompt", "generate-config", "verify-prompt"].includes(command)) {
      throw cliError("--preset is only supported by generate-prompt, generate-config, and verify-prompt.");
    }
    if (key === "input" && command !== "verify-prompt") throw cliError("--input is only supported by verify-prompt.");
    if (key === "format" && command !== "generate-config") throw cliError("--format is only supported by generate-config.");
    if (key === "output" && !command.startsWith("generate-")) throw cliError("--output is only supported by generated output commands.");
    if (key in options) throw cliError(`Option ${token} may only be provided once.`);
    options[key] = value;
  }
  return options;
}

async function loadApi() {
  try {
    return await import("markdown-flow/ai");
  } catch (publicApiError) {
    const bundledApi = resolve(PACKAGE_ROOT, "dist/ai/index.mjs");
    try {
      await access(bundledApi, constants.R_OK);
      return await import(pathToFileURL(bundledApi).href);
    } catch {
      throw cliError(`Markdown Flow's bundled AI API could not be loaded. Reinstall markdown-flow, or run \`npm run build:package\` before using this checkout. (${publicApiError.message})`);
    }
  }
}

async function loadPackageMetadata() {
  try {
    return JSON.parse(await readFile(resolve(PACKAGE_ROOT, "package.json"), "utf8"));
  } catch (error) {
    throw cliError(`Markdown Flow package metadata could not be read: ${error.message}`);
  }
}

function getPreset(api, requestedPreset) {
  const preset = requestedPreset ?? "chat";
  if (!api.AI_RESPONSE_PRESETS.includes(preset)) {
    throw cliError(`Unknown preset: ${preset}. Supported presets: ${api.AI_RESPONSE_PRESETS.join(", ")}.`);
  }
  return preset;
}

function promptRequirements(api, preset) {
  const policy = api.getAIResponsePresetPolicy(preset);
  return {
    protocol: api.MARKDOWN_FLOW_PROTOCOL,
    allowedBlocks: policy.allowedBlocks ?? [],
  };
}

export function verifyPrompt(prompt, requirements) {
  const failures = [];
  if (!prompt.trim()) failures.push("prompt is empty");
  if (!prompt.includes(`Markdown Flow contract: ${requirements.protocol}.`)) failures.push(`missing protocol declaration (${requirements.protocol})`);
  const allowedLine = `Allowed block types: ${requirements.allowedBlocks.join(", ") || "none"}.`;
  if (!prompt.includes(allowedLine)) failures.push(`missing allowed-block policy (${requirements.allowedBlocks.join(", ") || "none"})`);
  if (!prompt.includes("strict JSON")) failures.push("missing strict JSON requirement");
  if (!prompt.includes("[cite:source-id]")) failures.push("missing citation-token requirement");
  if (!prompt.includes("Never invent sources or data.")) failures.push("missing source and data safety requirement");
  if (!prompt.includes("Never emit an empty or placeholder rich block.")) failures.push("missing non-empty rich-block requirement");
  return failures;
}

async function writeOutput(output, value, io) {
  if (output) {
    const destination = resolve(process.cwd(), output);
    try {
      await writeFile(destination, value, "utf8");
    } catch (error) {
      throw cliError(`Could not write output file ${destination}: ${error.message}`);
    }
    io.stdout.write(`Wrote ${destination}\n`);
  } else {
    io.stdout.write(value);
  }
}

async function readStdin(io) {
  let value = "";
  for await (const chunk of io.stdin) value += chunk;
  return value;
}

export async function runCli(argv, { api = undefined, io = process } = {}) {
  const options = parseArguments(argv);
  if (options.help) {
    io.stdout.write(`${usage}\n`);
    return 0;
  }
  const markdownFlow = api ?? await loadApi();
  const preset = options.command === "doctor" ? undefined : getPreset(markdownFlow, options.preset);

  if (options.command === "generate-prompt") {
    const output = `${markdownFlow.createMarkdownFlowInstructions({ allowedBlocks: promptRequirements(markdownFlow, preset).allowedBlocks })}\n`;
    await writeOutput(options.output, output, io);
    return 0;
  }
  if (options.command === "generate-config") {
    const format = options.format ?? "json";
    if (!SUPPORTED_FORMATS.has(format)) throw cliError(`Unsupported config format: ${format}. Supported formats: json.`);
    const config = {
      protocol: markdownFlow.MARKDOWN_FLOW_PROTOCOL,
      preset,
      renderPolicy: markdownFlow.getAIResponsePresetPolicy(preset),
    };
    await writeOutput(options.output, `${JSON.stringify(config, null, 2)}\n`, io);
    return 0;
  }
  if (options.command === "verify-prompt") {
    let prompt;
    if (options.input) {
      const source = resolve(process.cwd(), options.input);
      try {
        prompt = await readFile(source, "utf8");
      } catch (error) {
        throw cliError(`Could not read prompt file ${source}: ${error.message}`);
      }
    } else {
      prompt = await readStdin(io);
    }
    const failures = verifyPrompt(prompt, promptRequirements(markdownFlow, preset));
    if (failures.length) throw cliError(`Prompt verification failed: ${failures.join("; ")}.`);
    io.stdout.write(`Prompt verified for preset \"${preset}\".\n`);
    return 0;
  }

  const bundledApi = resolve(PACKAGE_ROOT, "dist/ai/index.mjs");
  const packageMetadata = await loadPackageMetadata();
  const checks = [
    ["installed version", typeof packageMetadata.version === "string" && packageMetadata.version.length > 0],
    ["public AI API", typeof markdownFlow.createMarkdownFlowInstructions === "function"],
    ["protocol", typeof markdownFlow.MARKDOWN_FLOW_PROTOCOL === "string"],
    ["presets", Array.isArray(markdownFlow.AI_RESPONSE_PRESETS)],
    ["bundled AI module", await access(bundledApi, constants.R_OK).then(() => true, () => false)],
  ];
  const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
  for (const [name, passed] of checks) io.stdout.write(`${passed ? "✓" : "✗"} ${name}\n`);
  if (failed.length) throw cliError(`Doctor found unavailable components: ${failed.join(", ")}. Run \`npm run build:package\` or reinstall markdown-flow.`);
  return 0;
}

async function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  const [entrypoint, modulePath] = await Promise.all([
    realpath(process.argv[1]),
    realpath(fileURLToPath(import.meta.url)),
  ]);
  return entrypoint === modulePath;
}

if (await isCliEntrypoint()) {
  runCli(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error) => {
      process.stderr.write(`markdown-flow: ${error.message}\n`);
      process.exitCode = error.isCliError ? 2 : 1;
    },
  );
}
