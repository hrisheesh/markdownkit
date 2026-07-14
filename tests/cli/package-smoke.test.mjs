import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const execFileAsync = (command, args, options) => new Promise((resolvePromise, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => {
    if (error) {
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
      return;
    }
    resolvePromise({ stdout, stderr });
  });
});

test("packed package ships a runnable CLI that loads only the bundled API", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "markdown-flow-package-"));
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const { stdout } = await execFileAsync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporaryDirectory], {
    cwd: packageRoot,
  });
  const [{ filename, files }] = JSON.parse(stdout);
  assert.ok(files.some((file) => file.path === "tooling/cli/markdown-flow.mjs"));
  assert.ok(files.some((file) => file.path === "dist/ai/index.mjs"));
  assert.equal(files.some((file) => file.path.startsWith("src/")), false);

  const installRoot = join(temporaryDirectory, "install");
  const nodeModules = join(installRoot, "node_modules");
  const installedPackage = join(nodeModules, "markdown-flow");
  await mkdir(nodeModules, { recursive: true });
  await execFileAsync("tar", ["-xzf", join(temporaryDirectory, filename), "-C", nodeModules]);
  await execFileAsync("mv", [join(nodeModules, "package"), installedPackage]);

  const manifest = JSON.parse(await readFile(join(installedPackage, "package.json"), "utf8"));
  assert.equal(manifest.bin["markdown-flow"], "./tooling/cli/markdown-flow.mjs");
  for (const dependency of [...Object.keys(manifest.dependencies), "react", "react-dom"]) {
    await symlink(join(packageRoot, "node_modules", dependency), join(nodeModules, dependency));
  }

  const cli = join(installedPackage, manifest.bin["markdown-flow"]);
  const result = await execFileAsync(process.execPath, [cli, "generate-prompt", "--preset", "rag"], { cwd: installRoot });
  assert.match(result.stdout, /Markdown Flow contract:/);
  assert.match(result.stdout, /Allowed block types:/);

  const config = await execFileAsync(process.execPath, [cli, "generate-config", "--preset", "rag", "--format", "json"], { cwd: installRoot });
  assert.equal(JSON.parse(config.stdout).preset, "rag");

  const promptPath = "markdown-flow-prompt.txt";
  await execFileAsync(process.execPath, [cli, "generate-prompt", "--preset", "rag", "--output", promptPath], { cwd: installRoot });
  const verification = await execFileAsync(process.execPath, [cli, "verify-prompt", "--preset", "rag", "--input", promptPath], { cwd: installRoot });
  assert.match(verification.stdout, /Prompt verified for preset "rag"/);

  const doctor = await execFileAsync(process.execPath, [cli, "doctor"], { cwd: installRoot });
  assert.match(doctor.stdout, /✓ public AI API/);
});
