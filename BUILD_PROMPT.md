# Sureodds Predict — Production Build Prompt

Hand this document to a developer or an AI coding agent (e.g. Claude Code) to build the full product. It is self-contained: brand, architecture, schema, page-by-page UI spec, and acceptance criteria are all included. It is modeled on a proven, already-shipped reference implementation (a prior project of mine, "predict-safe" — same business model, same stack) with specific fixes applied where that reference had weak spots.

## 1. Brand

- **Name**: Sureodds Predict
- **Primary color**: `#e5821f` (orange) — CTAs, active states, lock-unlock accents, links
- **Secondary color**: `#000000` (black) — header/footer backgrounds, dark sections, primary text
- **Logo**: placeholder for now (`public/logo.svg` — use a simple wordmark "Sureodds Predict" in the brand orange until the real logo file is supplied; build the header/footer to take a logo image so swapping it later is a one-file change)
- **Tone**: trustworthy, data-driven football prediction service (not a generic "tips blog") — copy should emphasize accuracy, transparency, and proof (previous results), not hype

## 2. Tech Stack

Use the same stack as the reference project, with the fixes noted in §2.1:

- **Next.js 15+ (App Router)**, React 19, TypeScript
- **Supabase**: `@supabase/supabase-js` + `@supabase/ssr`, Postgres + Auth (email/password) + Storage (for payment-proof images and blog images) + RLS for all access control
- **Tailwind CSS v4** + shadcn/ui (Radix primitives) + `lucide-react` icons + `class-variance-authority`/`tailwind-merge`/`clsx`
- **react-hook-form** + `zod` for all forms
- **date-fns** for date math
- **TipTap** for the blog/CMS rich-text editor
- **nodemailer** (SMTP) for transactional email (welcome, payment confirmation, activation confirmation, expiry reminder, rejection notice)
- **API-Sports football API** (`v3.football.api-sports.io`) for fixtures/odds/standings/H2H/team logos — call it only from server routes (`app/api/football/*`), never expose the key client-side
- **Deployment**: Vercel (frontend) + Supabase (DB/Auth/Storage). Add Vercel Cron for the scheduled jobs in §9.
- Do **not** install Stripe/Paystack/Flutterwave SDKs. Payments are 100% manual proof-of-payment + admin approval (see §7) — no gateway integration in v1.

### 2.1 Fixes vs. the reference implementation

The reference project had a few rough edges. Build it right the first time here:

1. **Admin route protection at the middleware/layout level**, not just client-side. `middleware.ts` (or a server component wrapper at `app/admin/layout.tsx`) must check `users.is_admin` server-side and redirect before any admin UI renders — no flash-of-admin-content.
2. **Generate Supabase types via CLI** (`supabase gen types typescript`) and regenerate after every migration, instead of hand-maintaining a `types/database.ts` that drifts from the schema and forces `@ts-expect-error` workarounds.
3. **Plan types driven entirely from the `plans` table**, not a hardcoded enum duplicated across a DB CHECK constraint, a slug-mapping object, and filter logic. Adding a 5th VIP package later should mean "insert a row," not "touch four files."
4. **No legacy/orphaned tables.** Correct Score predictions live in the unified `predictions` table (`plan_type = 'correct_score'`, with `prediction_type` holding the scoreline string like `"2-1"`) — do not create a separate `correct_score_predictions` table.
5. **Country as plain text, not a normalized `countries` table.** Store `users.country` and `plan_prices.country` as VARCHAR; derive currency from country name via a small static map (`lib/utils/currency.ts`: `getCurrencyFromCountry()`, `getCurrencySymbol()`). This was tried as a relational table in the reference project and deliberately simplified — don't reintroduce the complexity.

## 3. Information Architecture

### Public routes
- `/` — homepage (see §5)
- `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/disclaimer`, `/refund-policy`, `/cookies` — static/legal pages (this is where "Terms of Use" and "Contact Admin" live — see §6.1 on why they're excluded from the dashboard tile grid)
- `/blog`, `/blog/[slug]` — blog list/detail
- `/competitions`, `/competitions/[slug]` — per-league hub pages (fixtures/standings/predictions for Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, World Cup, etc.)
- `/match/[matchId]` — single match detail (H2H, odds, standings)
- `/previous-results` — full, ungated history of all VIP results (the trust/proof page, public)
- `/login`, `/signup` — auth
- `/subscriptions` — plan comparison/pricing page (select plan + country → see localized price)
- `/checkout` — payment method selection + proof-of-payment upload
- `/sitemap.xml` — dynamic sitemap

### Authenticated user routes (`/dashboard/*`)
- `/dashboard` — tile grid home (see §6)
- `/dashboard/vip/[slug]` — VIP Zone page per package, e.g. `/dashboard/vip/daily-2-odds-combo` (see §6.2 — this is the locked-preview/results page from screenshot 2)
- `/dashboard/free-games` — free games & rewards page (see §6.3)
- `/dashboard/winnings` — user-facing full previous-results history
- `/dashboard/notifications` — notifications inbox
- `/dashboard/settings` — profile, country/currency, password, avatar, notification prefs
- `/dashboard/chat` — user-to-admin support chat

### Admin routes (`/admin/*`, gated server-side per §2.1)
- `/admin` — KPI dashboard
- `/admin/predictions`, `/admin/predictions/add`, `/admin/predictions/add-with-api`, `/admin/predictions/add-correct-score`
- `/admin/plans` — plans + per-country pricing
- `/admin/payment-methods` — bank/crypto/mobile-money/etc. details shown at checkout
- `/admin/transactions` — payment approval queue (the core admin workflow, see §7.3)
- `/admin/users`
- `/admin/blog`, `/admin/blog/write`
- `/admin/vip-wins`, `/admin/vip-wins/add`
- `/admin/chat`
- `/admin/pages` — SEO landing pages (see §9.2)
- `/admin/competitions`
- `/admin/config` — site-wide key-value config (hero copy, WhatsApp/Telegram links, social links, contact email)

### API routes (`app/api/*`)
- `app/api/football/{fixtures,h2h,leagues,odds,standings,teams}/route.ts` — server-only proxies to API-Sports
- `app/api/football/sync-predictions/route.ts` — admin-triggered: pulls fixtures+odds from API-Sports, bulk-inserts into `predictions` filtered by the plan's odds/confidence rules (§8)
- `app/api/predictions/update-scores/route.ts` — cron-callable: updates live scores/results
- `app/api/notifications/check-expired/route.ts` — cron-callable: expires subscriptions, sends reminder/expiry emails
- `app/api/blog/upload-image/route.ts`, `app/api/blog/publish-scheduled/route.ts`
- `app/api/notifications/{create,send-email}/route.ts`

## 4. Database Schema (Supabase/Postgres)

Create as numbered migrations under `supabase/migrations/`. Every table gets RLS enabled; every admin-only write policy uses this exact pattern:

```sql
EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
```

**`users`** (mirrors `auth.users`, auto-populated via `on_auth_user_created` trigger reading `raw_user_meta_data`)
`id uuid PK references auth.users`, `email`, `full_name`, `country varchar default 'Nigeria'`, `avatar_url`, `is_admin boolean default false`, `created_at`, `updated_at`

**`plans`**
`id`, `name`, `slug unique`, `description`, `benefits text[]`, `requires_activation boolean default false`, `is_active boolean default true`, `max_predictions_per_day int`, `display_order int`

Seed rows (slugs are the canonical plan-type identifier everywhere — see §2.1 fix #3):
- `free-games` (free, gamified — see §6.3)
- `daily-2-odds-combo`
- `daily-5-odds-combo`
- `daily-50-odds-combo`
- `correct-scores` (`requires_activation = true`)

**`plan_prices`**
`id`, `plan_id FK`, `country varchar`, `duration_days int check in (7,30)`, `price numeric`, `activation_fee numeric` (used only when `plans.requires_activation`), `currency varchar`. Unique on `(plan_id, country, duration_days)`.

**`user_subscriptions`**
`id`, `user_id FK`, `plan_id FK`, `plan_status text check in ('inactive','pending','pending_activation','active','expired')`, `subscription_fee_paid boolean default false`, `activation_fee_paid boolean default false`, `start_date timestamptz`, `expiry_date timestamptz`. Unique on `(user_id, plan_id)`.

**`predictions`**
`id`, `plan_id FK` (replaces a hardcoded `plan_type` enum — join to `plans.slug` for display), `home_team`, `away_team`, `league`, `league_id int` (API-Sports league id), `prediction_type` (for correct-scores this holds the scoreline string, e.g. `"2-1"`), `odds numeric`, `confidence int check (confidence between 0 and 100)`, `kickoff_time timestamptz`, `status text check in ('not_started','live','finished')`, `result text check in ('win','loss','push','pending')`, `home_score int`, `away_score int`, `admin_notes text`

**`vip_winnings`**
`id`, `plan_id FK`, `league`, `home_team`, `away_team`, `prediction_type`, `result text check in ('win','loss','push')`, `date date`

**`transactions`**
`id`, `user_id FK`, `subscription_id FK`, `plan_id FK`, `amount numeric`, `currency`, `payment_method_name text`, `payment_type text check in ('subscription','activation')`, `status text check in ('pending','completed','failed','refunded')`, `metadata jsonb` (`payment_proof_url`, `duration_days`, `payment_method_id`, `rejection_reason`), `created_at`

**`payment_methods`**
`id`, `name unique`, `type text check in ('bank_transfer','crypto','mobile_money','other')`, `currency`, `details jsonb`, `countries jsonb` (array — empty/null means "show everywhere," used for crypto), `is_active boolean`, `display_order int`, `logo_url`

**`blog_posts`**
`id`, `title`, `slug unique`, `content`, `excerpt`, `featured_image`, `author_id FK`, `published boolean`, `published_at`, `scheduled_at`, `meta_title`, `meta_description`, `tags text[]`, `view_count int default 0`, `competition_id FK nullable`

**`competitions`**
`id`, `slug unique`, `name`, `league_id int`, `featured_image`, `status text check in ('active','inactive')`, `seo_title`, `seo_description`, `heading`, `subheading`, `introduction`, `display_order int`

**`custom_pages`** (programmatic SEO landing pages, e.g. "BTTS/GG Tips," "Over 2.5 Goals Predictions")
`id`, `slug unique`, `title`, `heading`, `subheading`, `description`, `filter_id text`, `is_published boolean`, `show_in_footer boolean`, `footer_section`, `footer_label`, `footer_order`, `meta_title`, `meta_description`

**`site_config`**
`key text unique`, `value jsonb` — hero copy, WhatsApp number(s), Telegram link, social links, contact email

**`notifications`**
`id`, `user_id FK`, `type`, `title`, `message`, `read boolean default false`, `created_at`

**`messages`** (user↔admin chat — enable Supabase Realtime replication on this table)
`id`, `user_id FK`, `sender_id FK`, `content`, `read boolean default false`, `created_at`

**`free_games_entries`** (see §6.3)
`id`, `user_id FK`, `game_date date`, `prediction jsonb`, `points_earned int default 0`, `created_at`

**`ad_links`**
`id`, `title`, `url`, `description`, `display_order int`, `is_active boolean`

## 5. Homepage (`/`)

Order top to bottom:

1. **Hero** — headline + subtext (editable via `site_config`), primary CTA "Subscribe to VIP," secondary CTA "Join Telegram," brand-orange accents on a dark (`#000000`-toned) background image.
2. **Free Predictions** — filter bar (Free Tips, All Tips, Super Single, Double Chance, Home Win, Away Win, 1.5 Goals, 2.5 Goals, BTTS/GG) driven by `custom_pages.filter_id`; below it a date nav (Previous / Today / Tomorrow) and game cards (teams, league, kickoff, prediction type, odds, confidence, status).
3. **CTA row** — "Subscribe to VIP" + "Join Telegram" buttons.
4. **VIP Previous Winnings** — grouped by plan, win/loss badges, Previous-button pagination to load older results. This is the trust section — keep it visually prominent.
5. **VIP Packages** — cards for Daily 2 Odds Combo, Daily 5 Odds Combo, Daily 50 Odds Combo, Correct Scores. Clicking any card: logged-out → `/login`; logged-in → `/dashboard/vip/[slug]`.
6. **Correct Score preview (locked)** — Previous/Today/Tomorrow nav over rows with a full blur overlay (`absolute inset-0 bg-black/70 backdrop-blur-sm` + lock icon + "Premium Content Locked" + Subscribe CTA). Server-side, only return 2-3 rows max to this section regardless of overlay — don't ship the full locked dataset to the client.
7. **Blog** — 3-6 recent posts, thumbnail + title + excerpt + "Read More."
8. **League tables** — Premier League, La Liga, Serie A, Bundesliga, Ligue 1, pulled live from API-Sports.
9. **About Sureodds Predict** — mission/accuracy/transparency copy.
10. **Footer** — columns: About, Quick Links, Predictions, VIP Packages, Contact Us, Social Links, Terms & Conditions, Privacy Policy, Disclaimer, Refund Policy. **This is where Terms of Use and Contact Admin live** — not as dashboard tiles (see §6.1).

## 6. User Dashboard

### 6.1 Dashboard home — tile grid (`/dashboard`)

This is the screen from the first screenshot. Tiles, in this order:

1. **Free Games** — controller icon, "Play free games and win rewards" → `/dashboard/free-games`
2. **Daily 2 Odds Combo** (VIP, crown icon) → `/dashboard/vip/daily-2-odds-combo`
3. **Daily 5 Odds Combo** (VIP, crown icon) → `/dashboard/vip/daily-5-odds-combo`
4. **Daily 50 Odds Combo** (VIP, crown icon) → `/dashboard/vip/daily-50-odds-combo`
5. **Correct Scores** (VIP, target icon) → `/dashboard/vip/correct-scores`
6. **Telegram** — paper-plane icon, "Join our Telegram channel" → opens Telegram link from `site_config`

**Explicitly excluded from this grid**: "Contact Admin" and "Terms of Use." Those remain real features/pages — Contact Admin lives as a persistent support icon in the dashboard header (opens `/dashboard/chat` or a contact modal) and/or in account settings; Terms of Use lives in the footer and account settings, linking to `/terms`. They should not occupy a tile slot here — the grid is reserved for revenue-driving and engagement products only.

Card styling: 2-column grid on mobile, rounded-2xl cards with soft background tint per category (blue for utility tiles, gold/green/purple/red tints for VIP tiles per screenshot — keep that visual differentiation, just swap the palette to brand orange variants for VIP and neutral dark/orange for utility tiles instead of the unrelated rainbow tints), icon in a circular soft-tinted badge, title + 1-line description.

### 6.2 VIP Zone page (`/dashboard/vip/[slug]`)

This is the screen from the second screenshot, and it is the single most important page in the product — it's the conversion page. It has two states depending on the user's subscription status for that plan:

**Locked state** (no active subscription for this plan, or `correct-scores` with `activation_fee_paid = false`):
- Left panel: "VIP ZONE — EXCLUSIVE ACCESS. PREMIUM RESULTS." header. "VIP PACKAGES" card with a lock icon, "THIS SECTION IS LOCKED," "Upgrade to a VIP package to access premium picks and exclusive analysis," "UNLOCK VIP ACCESS" button → `/checkout?plan=[slug]`. Below: three trust badges (100% Secure, Premium Picks, Better Success).
- Right panel: "PREVIOUS RESULTS" table scoped to this plan only, columns Date / Match / Pick / Result / Status (Win/Push/Loss badges, green/amber/red). **Sliding date navigation**: Previous/Next arrows step one day at a time through `vip_winnings` history for this plan (don't paginate by row count — paginate by calendar date, defaulting to the most recent date that has results). Footer stats row: Success Rate %, Total Picks, Win Streak — computed from this plan's `vip_winnings` rows over a trailing window (e.g. last 30 days), not all-time, so the numbers stay current.
- Bottom banner across full width: "Join VIP now and unlock expert picks, combos and exclusive insights!" + "UPGRADE NOW" button.

**Unlocked state** (active subscription, and for `correct-scores` also `activation_fee_paid = true`):
- Left panel swaps to the real predictions list for this plan: Previous/Today/Tomorrow date nav, game cards (teams + logos resolved live from `/api/football/fixtures` fuzzy-matched on team name, prediction type, odds, confidence ring, kickoff time, status), plus admin notes if present. No row-count limit once unlocked.
- Right panel keeps showing the same previous-results history (still useful as ongoing proof even to paying users) with the same date-slider behavior.
- If `correct-scores` and subscribed but not yet activated: left panel shows a "Pending Activation" card instead — "You've subscribed but need to pay the Activation Fee to unlock predictions," "Pay Activation Fee" button opening the activation modal (country-aware price lookup, payment method list, proof upload → creates a `transactions` row with `payment_type = 'activation'`).
- If expired: left panel shows "Your subscription has expired" + "Renew Subscription" button; predictions disappear.

Enforce the row limit and any odds/confidence pre-filtering **server-side** in the query for the locked state, not just visually — the blur is a UX nicety, not the access control.

### 6.3 Free Games (`/dashboard/free-games`)

v1 scope (flagging as an assumption — confirm before building further): a single daily mini-game where the user predicts the outcome (Home/Draw/Away) of one featured free match per day. Correct guesses earn points (`free_games_entries.points_earned`), shown on a simple cumulative points/leaderboard view. Points are cosmetic in v1 (bragging rights / leaderboard rank) — no points-to-cash or points-to-discount redemption unless you want that scoped in; if you do want redemption against VIP pricing, say so and it becomes a `plan_prices` discount-code feature instead of a new system.

### 6.4 Other dashboard pages
- `/dashboard/winnings` — same previous-results UI as §6.2's right panel, but unscoped (all plans, with a plan filter dropdown).
- `/dashboard/notifications`, `/dashboard/settings`, `/dashboard/chat` — as specified in the reference implementation: countdown timers on subscription cards (`Days:Hours:Minutes` recomputed every 60s client-side off `expiry_date`), country/currency change in settings, avatar upload, password change.

## 7. Payment Flow (Manual — no gateway integration)

1. **`/subscriptions`**: user picks plan + duration (7 or 30 days) + country; price resolved from `plan_prices` with fallback: exact country match → USD/"Other" row if no local row exists.
2. **`/checkout`**: `payment_methods` filtered to those visible for the selected country (or globally visible, e.g. crypto); user picks one, sees account/wallet details with copy-to-clipboard, uploads a proof-of-payment image to Supabase Storage bucket `payment-proofs` (path `{user_id}/{timestamp}.{ext}`).
3. On submit: insert `transactions` (`status: 'pending'`, `payment_type: 'subscription'`, `metadata.payment_proof_url` set) and upsert `user_subscriptions` (`plan_status: 'pending'`). Send in-app notification + email to the user and to all `is_admin = true` users.
4. **Admin approval** (`/admin/transactions`, three tabs — Pending Subscriptions / Pending Activations / All Transactions): admin views the proof image, then Confirm (sets transaction `completed`, sets `user_subscriptions.plan_status = 'active'`, `subscription_fee_paid = true`, computes `start_date = now()`, `expiry_date = start_date + duration_days`) or Reject (transaction `failed`, subscription back to `inactive`, optional reason emailed to user).
5. **Correct Scores second step**: once subscription is active but `requires_activation` and `activation_fee_paid = false`, the user submits a second proof via the activation modal (`payment_type: 'activation'`); admin approves the same way, which flips `activation_fee_paid = true` (and finalizes `start_date`/`expiry_date` if this was the user's first activation on this plan).
6. Unlock check everywhere: `plan_status === 'active' AND (NOT requires_activation OR activation_fee_paid)`.

## 8. Predictions Data Sourcing (per plan)

- **Daily 2 / 5 / 50 Odds Combo**: admin triggers `/api/football/sync-predictions` (or adds manually) — combos are built from individual picks; "Daily 2 Odds Combo" = combined odds ≥ 2, "Daily 5 Odds Combo" ≥ 5, "Daily 50 Odds Combo" ≥ 50, confidence 60-100 on each leg, admin controls how many combos/day.
- **Correct Scores**: manual admin entry only — teams, scoreline (`prediction_type`), odds (optional), notes (optional).
- **Free Games**: one featured match per day, manually flagged by admin or auto-picked as the highest-confidence free fixture of the day.

## 9. Admin Panel

Sidebar nav: Dashboard (KPIs: active subscribers by plan, revenue today/7d/30d, pending activations, new signups, recent transactions), Predictions, Plans, Payment Methods, Transactions (badge = pending count), Users, Blog, VIP Wins, Chat (badge = unread count), Ad Links, Pages, Competitions, Config.

### 9.1 Cron jobs (Vercel Cron → API routes)
- `update-scores`: every 15-30 min during match hours — pull live scores, set `predictions.result`.
- `check-expired`: hourly — expire subscriptions past `expiry_date`, send 24h-prior reminder email, send expiry email.
- `publish-scheduled`: hourly — publish blog posts whose `scheduled_at` has passed.

### 9.2 SEO
- `custom_pages` drives `/tips/[slug]`-style landing pages per filter (Safe Free Picks, Over 1.5/2.5 Goals, BTTS/GG, Double Chance, Home/Away Win) for long-tail search traffic.
- `competitions` drives per-league hub pages with their own meta title/description.
- Dynamic `sitemap.xml` covering all published blog posts, competitions, and custom pages.

## 10. Acceptance Criteria

- [ ] All routes in §3 exist and render with real Supabase data, no mock/demo data left in production code.
- [ ] RLS is enabled on every table; a non-admin user cannot read/write another user's `transactions`, `user_subscriptions`, or `notifications` rows (test via the Supabase dashboard policy tester or a quick script).
- [ ] `/admin/*` is unreachable (server redirect, no flash of content) for a non-admin authenticated user and for a logged-out user.
- [ ] VIP Zone locked state never serves more than the configured preview limit of prediction rows in the actual API response (check Network tab, not just the rendered DOM).
- [ ] Full manual payment flow works end to end: checkout → proof upload → admin confirm → subscription active → predictions visible; and the reject path correctly reverts subscription state and emails the user.
- [ ] Correct Scores two-step flow (subscription fee → pending activation → activation fee → active) works end to end including the "Pending Activation" UI state.
- [ ] Countdown timers and expiry correctly lock a plan and show "Renew Subscription" once `expiry_date` passes.
- [ ] Brand colors (`#e5821f` / `#000000`) are applied consistently via Tailwind theme tokens (not one-off hex values scattered through components) so the logo can be dropped in later without a redesign.
- [ ] Lighthouse/Core Web Vitals: homepage and VIP Zone page pass "Good" thresholds on mobile.

## 11. Open Items to Confirm Before/During Build

- Exact list and pricing tiers for the four VIP packages per country (Nigeria/Ghana/Kenya local pricing vs. USD default) — not specified yet, needs real numbers before `/admin/plans` seed data is finalized.
- Final scope of Free Games (see §6.3 — points-only leaderboard vs. redeemable rewards).
- Logo file (placeholder wordmark in use until supplied).
- Telegram channel URL, WhatsApp support number, contact email for `site_config` seed data.