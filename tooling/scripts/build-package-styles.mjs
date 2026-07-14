import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const root = process.cwd();
const require = createRequire(import.meta.url);
const katexRoot = path.dirname(require.resolve("katex/package.json"));

await mkdir(path.join(root, "dist"), { recursive: true });
await cp(path.join(katexRoot, "dist/fonts"), path.join(root, "dist/fonts"), { recursive: true });

for (const [input, output, includeKatexFonts] of [
  ["src/styles/package.css", "dist/styles.css", true],
  ["src/styles/math.css", "dist/math.css", true],
  ["src/styles/core.css", "dist/core.css", false],
]) {
  const source = path.join(root, input);
  const destination = path.join(root, output);
  const css = await readFile(source, "utf8");
  const result = await postcss([tailwindcss({ optimize: true })]).process(css, { from: source, to: destination });
  await writeFile(
    destination,
    includeKatexFonts ? result.css.replaceAll("../../node_modules/katex/dist/fonts/", "./fonts/") : result.css,
  );
}

for (const output of ["dist/core.js", "dist/core.mjs"]) {
  const destination = path.join(root, output);
  const bundle = await readFile(destination, "utf8");
  await writeFile(destination, `"use client";\n${bundle}`);
}
