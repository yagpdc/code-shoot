import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  // Bundle the workspace packages (they ship raw TS) into the output.
  noExternal: [/@code-shoot\//],
  clean: true,
  sourcemap: true,
});
