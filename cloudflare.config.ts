import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "suretips",
    // Custom entry: serves pages through vinext and runs the cron jobs below.
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-25",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv(),
      // Server-side settings, read by the app through process.env. Only declared
      // names reach the Worker. Values come from .env.local in local dev and from
      // Cloudflare secrets in production -- never from this file.
      // (NEXT_PUBLIC_* values are built into the code at build time instead.)
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      API_FOOTBALL_KEY: bindings.secret(),
      API_FOOTBALL_BASE_URL: bindings.secret(),
      CRON_SECRET: bindings.secret(),
      // Optional -- declare (as bindings.secret()) only once you set them:
      //   the API-Football tuning values API_FOOTBALL_BOOKMAKER_ID and
      //   API_FOOTBALL_MIN_INTERVAL_MS.
    },
    // Replaces the Vercel crons in vercel.json. Keep in sync with CRON_JOBS in worker/index.ts.
    triggers: [
      triggers.scheduled({ schedule: "0 */4 * * *" }), // free-tips sync
      triggers.scheduled({ schedule: "*/15 * * * *" }), // score updates + result approval
      triggers.scheduled({ schedule: "*/10 * * * *" }), // scheduled blog posts
    ],
  }),
});
