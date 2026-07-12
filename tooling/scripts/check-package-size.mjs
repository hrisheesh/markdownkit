import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const root = process.cwd();
const budgets = {
  "dist/index.mjs": 90 * 1024,
  "dist/index.js": 110 * 1024,
  "dist/core.mjs": 16 * 1024,
  "dist/core.js": 20 * 1024,
  "dist/ai/index.mjs": 40 * 1024,
  "dist/ai/index.js": 140 * 1024,
  "dist/styles.css": 90 * 1024,
  "dist/math.css": 30 * 1024,
  "dist/core.css": 60 * 1024,
};

for (const [file, budget] of Object.entries(budgets)) {
  const size = (await stat(path.join(root, file))).size;
  assert.ok(size <= budget, `${file} is ${(size / 1024).toFixed(1)} kB; budget is ${(budget / 1024).toFixed(1)} kB`);
  console.log(`${file}: ${(size / 1024).toFixed(1)} kB / ${(budget / 1024).toFixed(1)} kB`);
}

console.log("Package size budgets passed.");

const { stdout } = await promisify(execFile)(process.execPath, ["tooling/scripts/measure-browser-bundles.mjs"], { cwd: root });
process.stdout.write(stdout);
