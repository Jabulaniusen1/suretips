// Cloudflare Worker entry.
//
// vinext serves every HTTP request. Cron Triggers (declared in
// cloudflare.config.ts, replacing the Vercel crons in vercel.json) run the
// three scheduled jobs by calling their existing API routes with the
// CRON_SECRET, exactly like Vercel Cron did.
import handler from "vinext/server/fetch-handler";

/** Cron expression -> job route. Keep in sync with `triggers` in cloudflare.config.ts. */
export const CRON_JOBS: Record<string, string> = {
  "0 */4 * * *": "/api/predictions/sync-free-tips",
  "*/15 * * * *": "/api/predictions/update-scores",
  "*/10 * * * *": "/api/blog/publish-scheduled",
};

type WorkerEnv = Record<string, unknown> & { CRON_SECRET?: string };
type ScheduledEvent = { cron: string };
type WorkerContext = { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void };

const worker = {
  ...handler,
  async scheduled(event: ScheduledEvent, env: WorkerEnv, ctx: WorkerContext) {
    const path = CRON_JOBS[event.cron];
    if (!path) {
      console.error(`[cron] no job configured for schedule "${event.cron}"`);
      return;
    }
    if (!env.CRON_SECRET) {
      console.error(`[cron] CRON_SECRET is not set; skipping ${path}`);
      return;
    }

    // The host is irrelevant: the request never leaves this Worker.
    const request = new Request(`https://cron.internal${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const response = await handler.fetch(request, env, ctx);
    const body = (await response.text()).slice(0, 1000);
    if (response.ok) console.log(`[cron] ${path}: ${body}`);
    else console.error(`[cron] ${path} failed with HTTP ${response.status}: ${body}`);
  },
};

export default worker;
