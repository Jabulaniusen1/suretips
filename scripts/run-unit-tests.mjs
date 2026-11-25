// Compiles tests/unit/*.test.ts with the project's TypeScript and runs them
// with Node's built-in test runner -- no extra test dependencies.
// The "@/..." alias is type-checked via a generated tsconfig and resolved at
// runtime by linking <out>/node_modules/@ -> <out>.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, ".test-build");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// The project is "type": "module" (vinext); the compiled tests are CommonJS.
writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

const tests = readdirSync(join(root, "tests/unit"))
  .filter((f) => f.endsWith(".test.ts"))
  .map((f) => join("tests/unit", f));

const tsconfig = join(out, "tsconfig.json");
writeFileSync(
  tsconfig,
  JSON.stringify({
    compilerOptions: {
      outDir: out,
      rootDir: root,
      module: "commonjs",
      moduleResolution: "node",
      target: "es2022",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      baseUrl: root,
      paths: { "@/*": ["./*"] },
      types: ["node"],
    },
    files: tests.map((t) => join(root, t)),
  })
);

execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", tsconfig], { cwd: root, stdio: "inherit" });
mkdirSync(join(out, "node_modules"), { recursive: true });
symlinkSync(out, join(out, "node_modules", "@"), "dir");

try {
  execFileSync(process.execPath, ["--test", ...tests.map((t) => join(out, t.replace(/\.ts$/, ".js")))], { cwd: out, stdio: "inherit" });
} catch {
  process.exitCode = 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
