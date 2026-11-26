# Sureodds Predict

Football prediction subscription site (Next.js 16 App Router + Supabase). Manual proof-of-payment
checkout, an admin-approved two-step "Correct Scores" activation flow, a VIP Zone with locked/unlocked
result panels, blog/CMS, SEO landing pages, live chat, free daily games, and a full admin panel.

See `BUILD_PROMPT.md` for the original product/feature brief this app was built against.

## 1. Prerequisites

- Node 20+, pnpm
- A [Supabase](https://supabase.com) project (free tier is fine to start)
- An [API-Football / API-Sports](https://www.api-football.com) API key (optional — the app degrades
  gracefully with empty fixtures/standings if unset, but predictions sync and live score updates need it)
- An SMTP account for transactional email (optional — emails are skipped with a console warning if unset)

## 2. Install

```bash
pnpm install
```

## 3. Supabase setup

1. Create a project at supabase.com (or run `supabase start` locally with the Supabase CLI).
2. Link this repo to it: `supabase link --project-ref <your-project-ref>`.
3. Push the schema: `supabase db push`, or paste
   `supabase/migrations/20261125120000_initial_schema.sql` into the dashboard's SQL Editor and run it.
   This single baseline migration creates the tables, RLS policies, Data API grants, triggers,
   storage buckets (`avatars`, `blog-images`), realtime on `messages` (live chat), and seed data for
   competitions and site config. Add future schema changes as new files after it.
4. Regenerate the typed schema once the real project exists (the checked-in `types/database.ts` is
   hand-written to match the migration until you do this):
   ```bash
   supabase gen types typescript --linked > types/database.ts
   ```

### After the first sign-up

- Promote your own account to admin: `update public.users set is_admin = true where email = 'you@example.com';`
- In `/admin/config`, set the contact email, Telegram link, WhatsApp number and social links. They
  start empty, which hides them in the UI.

## 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Used for the sitemap and absolute links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project Settings > API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Project Settings > API. Safe for the browser — RLS enforces access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for cron) | Project Settings > API. **Server-only secret, never expose to the client.** Used solely by the three cron routes below, which run with no user session and so cannot rely on RLS. |
| `API_FOOTBALL_KEY` | No | Powers fixture sync, standings, H2H, and live score updates. App works without it (empty states). |
| `CRON_SECRET` | Yes (for cron) | Shared secret the three cron routes require in `Authorization: Bearer <secret>`. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics. |

## 5. Scheduled jobs

Three routes do the background work. Each requires `Authorization: Bearer ${CRON_SECRET}` and returns
401 without it.

| Route | Schedule | What it does |
|---|---|---|
| `GET /api/predictions/sync-free-tips` | `0 */4 * * *` | Tops up each market to 10 odds-backed picks for today, tomorrow and the day after (API-Sports fixtures and odds). Never edits or deletes existing picks. |
| `GET /api/predictions/update-scores` | `*/15 * * * *` | Updates live/final scores, grades finished picks and approves the graded results for the public record. |
| `GET /api/blog/publish-scheduled` | `*/10 * * * *` | Publishes blog posts whose `scheduled_at` has passed. |

On Cloudflare these run as Cron Triggers declared in `cloudflare.config.ts`; `worker/index.ts` maps
each schedule to its route and calls it with `CRON_SECRET`. (`vercel.json` holds the same schedules
for Vercel.)

## 6. Local development

```bash
pnpm dev
```

## 7. Build / lint

```bash
pnpm build
pnpm lint
```

## 8. Deploy to Cloudflare Workers

The site deploys to Cloudflare Workers with [vinext](https://github.com/cloudflare/vinext), Cloudflare's
implementation of the Next.js API on Vite. The Next.js scripts (`pnpm dev`, `pnpm build`) keep working;
the Cloudflare build uses the `*:vinext` scripts.

**Requirements:** Node 22+ (`nvm use` reads `.nvmrc`) and a Cloudflare account on the **Workers Paid**
plan; the free plan's 10 ms CPU limit per request is too low for server-rendered pages.

**One-time setup**

1. Log in: `npx cf auth login`
2. Set the live address in `.env.production.local`. It is built into canonical links and the sitemap,
   so the deploy refuses to run while it points at localhost:
   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
3. Make sure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`, `API_FOOTBALL_BASE_URL`
   and `CRON_SECRET`.

**Deploy**

```bash
pnpm deploy:cloudflare            # build + deploy
pnpm deploy:cloudflare --dry-run  # build + validate, uploads nothing
```

This builds with Vite and deploys the `suretips` Worker, uploading the four secrets above with each
version (from your env files, through a temporary file that is deleted afterwards). The KV namespace used
for the page and data cache is created on the first deploy. The site is served at
`https://suretips.<account>.workers.dev` until you add a custom domain in the Cloudflare dashboard. Then
update `NEXT_PUBLIC_SITE_URL` and redeploy, and set the same address as the Site URL in Supabase
(Authentication → URL Configuration).

**Local Cloudflare runtime:** `pnpm dev:vinext` serves the app at http://localhost:3002 inside workerd,
with the declared secrets read from `.env.local`.

**Adding a server-side environment variable:** declare it in `cloudflare.config.ts`
(`bindings.secret()`), add it to `SECRET_NAMES` in `scripts/deploy-cloudflare.mjs`, and put its value
in `.env.local`. Only declared names reach the Worker. `NEXT_PUBLIC_*` values are built into the code
instead.

**Contact** is by email only: the contact page shows the address set in Admin > Links & Contact as a
`mailto:` link. There is no contact form, so the site sends no email and needs no SMTP settings.

## Architecture notes

- **Auth & access control**: Supabase Auth + Postgres RLS is the only authorization layer for
  user-facing requests — there's no service-role key used in normal request paths. The service role
  key is reserved for the three cron routes above, which have no user session.
- **Paywall**: `predictions` and `vip_winnings` rows are publicly SELECT-able at the database level;
  the row-count limit for non-subscribers is enforced in the app query layer
  (`lib/data/predictions.ts`), not by hiding rows via RLS.
- **Payments**: manual proof-of-payment only — no payment gateway. Users upload a screenshot/receipt,
  admins approve/reject from `/admin/transactions`.
- **Correct Scores plan**: two-step unlock. Subscription fee confirmation moves a subscription to
  `pending_activation`; the activation fee confirmation is what actually sets `plan_status = active`
  with `start_date`/`expiry_date`. See `lib/plan-access.ts`.
