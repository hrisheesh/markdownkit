import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const entries = ["dist/index.mjs", "dist/ai/index.mjs", "dist/core.mjs"];
const relativeImport = /from\s*["'](\.\.?\/[^"']+)["']/g;
const dynamicImport = /import\s*\(\s*["'](\.\.?\/[^"']+)["']/g;

function resolveImport(from, specifier) {
  return path.resolve(path.dirname(from), specifier);
}

async function imports(file, pattern) {
  const source = await readFile(file, "utf8");
  return [...source.matchAll(pattern)].map((match) => resolveImport(file, match[1]));
}

async function closure(start, seen = new Set()) {
  if (seen.has(start)) return seen;
  seen.add(start);
  for (const dependency of await imports(start, relativeImport)) await closure(dependency, seen);
  return seen;
}

async function size(files) {
  let bytes = 0;
  let gzipBytes = 0;
  for (const file of files) {
    const content = await readFile(file);
    bytes += content.byteLength;
    gzipBytes += gzipSync(content).byteLength;
  }
  return { bytes, gzipBytes };
}

function format(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

const measurements = [];
for (const entry of entries) {
  const entryPath = path.join(root, entry);
  const initial = await closure(entryPath);
  const lazyRoots = [];
  for (const file of initial) lazyRoots.push(...await imports(file, dynamicImport));
  const lazyFiles = new Set();
  for (const lazyRoot of lazyRoots) {
    const files = await closure(lazyRoot);
    for (const file of files) if (!initial.has(file)) lazyFiles.add(file);
  }
  measurements.push({ entry, initial: await size(initial), lazy: await size(lazyFiles), lazyChunks: lazyRoots.length });
}

console.log("| Published ESM entry | Initial graph | Initial gzip | Lazy feature graph | Lazy roots |");
console.log("| --- | ---: | ---: | ---: | ---: |");
for (const measurement of measurements) {
  console.log(`| ${measurement.entry.replace("dist/", "markdown-flow/").replace("index.mjs", "").replace(/\/$/, "") || "markdown-flow"} | ${format(measurement.initial.bytes)} | ${format(measurement.initial.gzipBytes)} | ${format(measurement.lazy.bytes)} | ${measurement.lazyChunks} |`);
}

const rootMeasurement = measurements[0];
const aiMeasurement = measurements[1];
assert.ok(rootMeasurement.initial.bytes <= 95 * 1024, `Root ESM initial graph is ${format(rootMeasurement.initial.bytes)}; budget is 95.0 kB`);
assert.ok(aiMeasurement.initial.bytes <= 100 * 1024, `AI ESM initial graph is ${format(aiMeasurement.initial.bytes)}; budget is 100.0 kB`);
assert.ok(aiMeasurement.lazyChunks >= 4, "AI ESM entry must retain separate lazy rich-feature chunks.");
console.log("Browser ESM import-graph budgets passed.");
