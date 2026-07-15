import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/core.tsx", "src/server.ts", "src/ai/index.ts"],
  clean: true,
  dts: {
    compilerOptions: {
      incremental: false,
    },
  },
  format: ["esm", "cjs"],
  sourcemap: true,
  external: ["react", "react-dom", "json5"],
  minify: false,
  target: "es2018",
  treeshake: true,
});
