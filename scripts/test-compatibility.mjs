import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "markdown-render-compat-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, cwd) => execFileSync(npm, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

try {
  const packOutput = run(["pack", root, "--json"], tempRoot);
  const jsonStart = packOutput.lastIndexOf("\n[") + 1;
  const packResult = JSON.parse(packOutput.slice(jsonStart));
  const tarball = path.join(tempRoot, packResult[0].filename);

  for (const reactVersion of ["18.3.1", "19.2.4"]) {
    const consumer = path.join(tempRoot, `react-${reactVersion}`);
    await mkdir(consumer, { recursive: true });
    await writeFile(path.join(consumer, "package.json"), JSON.stringify({ private: true, type: "commonjs" }));
    run(["install", "--no-audit", "--no-fund", "--ignore-scripts", "--package-lock=false", tarball, `react@${reactVersion}`, `react-dom@${reactVersion}`], consumer);
    const testFile = path.join(consumer, "consumer.cjs");
    await writeFile(testFile, `
      const assert = require("node:assert/strict");
      const React = require("react");
      const { renderToStaticMarkup } = require("react-dom/server");
      const { RichMarkdown } = require("@hrisheesh/markdown-render");
      const { StaticMarkdown } = require("@hrisheesh/markdown-render/server");
      assert.match(renderToStaticMarkup(React.createElement(RichMarkdown, { content: "# Compatible" })), /Compatible/);
      assert.match(renderToStaticMarkup(React.createElement(StaticMarkdown, { content: "# Server compatible" })), /Server compatible/);
    `);
    execFileSync(process.execPath, [testFile], { cwd: consumer, stdio: "pipe" });
    console.log(`React ${reactVersion}: compatible`);
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

console.log("React compatibility checks passed.");
