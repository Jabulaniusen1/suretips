// Builds the site with vinext and deploys it to Cloudflare Workers.
//
//   pnpm deploy:cloudflare            build + deploy
//   pnpm deploy:cloudflare --dry-run  build + validate, upload nothing
//
// Uploads the Worker's secrets with every deploy, taken from your env files
// (only the names declared in cloudflare.config.ts), via a temporary file that
// is deleted afterwards. Requires Node 22+ and `npx cf auth login` once.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Keep in sync with the bindings.secret() entries in cloudflare.config.ts. */
const SECRET_NAMES = ["SUPABASE_SERVICE_ROLE_KEY", "API_FOOTBALL_KEY", "API_FOOTBALL_BASE_URL", "CRON_SECRET"];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (Number(process.versions.node.split(".")[0]) < 22) {
  fail(`Node 22 or newer is required (you have ${process.versions.node}). Switch with: nvm use 22`);
}

/** Minimal .env reader: KEY=value lines, optional surrounding quotes. */
function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const values = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

// Same precedence Vite uses for a production build; real environment variables win.
const env = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
  ...readEnvFile(".env.production"),
  ...readEnvFile(".env.production.local"),
  ...process.env,
};

// NEXT_PUBLIC_* values are built into the code, so the live address must be set before building.
const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "";
if (!/^https:\/\//.test(siteUrl) || /localhost|127\.0\.0\.1/.test(siteUrl)) {
  fail(
    `NEXT_PUBLIC_SITE_URL is "${siteUrl || "(not set)"}". Canonical links and the sitemap use it, so set it to the\n` +
      `  live https address first, e.g. in .env.production.local:\n` +
      `    NEXT_PUBLIC_SITE_URL=https://your-domain.com   (or https://suretips.<account>.workers.dev)`
  );
}

const missing = SECRET_NAMES.filter((name) => !env[name]);
if (missing.length > 0) fail(`Missing values for: ${missing.join(", ")} (add them to .env.local).`);

const dir = mkdtempSync(join(tmpdir(), "suretips-deploy-"));
const secretsFile = join(dir, "secrets.json");
try {
  writeFileSync(secretsFile, JSON.stringify(Object.fromEntries(SECRET_NAMES.map((name) => [name, env[name]]))), { mode: 0o600 });
  console.log(`Building for ${siteUrl} ...`);
  execFileSync("pnpm", ["exec", "vite", "build"], { stdio: "inherit" });
  execFileSync("pnpm", ["exec", "cf", "deploy", "--prebuilt", "--secrets-file", secretsFile, ...process.argv.slice(2)], { stdio: "inherit" });
} catch {
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
