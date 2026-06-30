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
3. Push the schema: `supabase db push` (applies everything in `supabase/migrations/` in order —
   tables, RLS policies, triggers, storage buckets, and seed data for plans/competitions/site config).
4. In the Supabase dashboard, go to **Database > Replication** and confirm the `messages` table is
   added to the `supabase_realtime` publication (the migration adds this, but some hosted projects
   need it confirmed manually the first time). This powers the live chat UI.
5. Regenerate the typed schema once the real project exists (the checked-in `types/database.ts` is
   hand-written to match the migrations until you do this):
   ```bash
   supabase gen types typescript --linked > types/database.ts
   ```

### Seed data you must edit before going live

The seed migration (`20260629171449_seed_data.sql`) inserts placeholder rows so the app boots without
errors. Before launch, use the admin panel (`/admin/plans`, `/admin/payment-methods`, `/admin/config`)
to replace:

- **Plan prices** — real prices per country/duration for each plan.
- **Payment methods** — your real bank transfer / crypto wallet details (shown to users at checkout).
- **Site config** — social links, contact email, Telegram link, homepage trust copy.
- Promote your own account to admin: `update public.users set is_admin = true where email = 'you@example.com';`

## 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Used for the sitemap and absolute links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project Settings > API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Project Settings > API. Safe for the browser — RLS enforces access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for cron) | Project Settings > API. **Server-only secret, never expose to the client.** Used solely by the three cron routes below, which run with no user session and so cannot rely on RLS. |
| `API_FOOTBALL_KEY` | No | Powers fixture sync, standings, H2H, and live score updates. App works without it (empty states). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | No | Transactional email (payment confirmations, expiry reminders). Skipped with a warning if unset. |
| `CRON_SECRET` | Yes (for cron) | Shared secret the three cron routes require in `Authorization: Bearer <secret>`. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics. |

## 5. Cron-triggered routes

Three routes do scheduled background work and must be called periodically by an external scheduler
(Vercel Cron, GitHub Actions, or any HTTP cron service). Each requires
`Authorization: Bearer ${CRON_SECRET}` and returns 401 without it.

| Route | Suggested schedule | What it does |
|---|---|---|
| `GET /api/predictions/sync-free-tips` | every few hours | Idempotently tops up today's Free Tips (`free-games` plan) with one real, odds-backed pick per filter category (Home Win, Away Win, BTTS, Double Chance, Over 1.5, Over 2.5) pulled from live API-Sports fixtures/odds. Skips categories already covered for the day. |
| `GET /api/predictions/update-scores` | every 15 min | Looks up live/finished scores for predictions with an `external_fixture_id`, updates status/score, auto-grades win/loss where the pick is a recognized pattern (match winner, BTTS, over/under, correct score), and scores yesterday/today's Free Games entries. |
| `GET /api/notifications/check-expired` | hourly | Expires subscriptions past `expiry_date` (email + in-app notification), and sends a one-time "expires within 24h" reminder. |
| `GET /api/blog/publish-scheduled` | every 5–15 min | Publishes blog posts whose `scheduled_at` has passed. |

Example `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/predictions/sync-free-tips", "schedule": "0 */4 * * *" },
    { "path": "/api/predictions/update-scores", "schedule": "*/15 * * * *" },
    { "path": "/api/notifications/check-expired", "schedule": "0 * * * *" },
    { "path": "/api/blog/publish-scheduled", "schedule": "*/10 * * * *" }
  ]
}
```

Vercel Cron calls your routes without custom headers, so either front them with a separate trigger
service that can set `Authorization`, or check `request.nextUrl.searchParams.get("secret")` instead —
adjust `lib/cron.ts` if you go that route. If deploying on Vercel and using Vercel Cron directly, the
simplest option is an external scheduler (e.g. cron-job.org, GitHub Actions `schedule` + `curl`) that
can set the bearer header.

## 6. Local development

```bash
pnpm dev
```

## 7. Build / lint

```bash
pnpm build
pnpm lint
```

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
