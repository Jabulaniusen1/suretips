-- ============================================================================
-- Kingpredicts / Sure Match Tips: complete database schema.
--
-- Squashed baseline. It replaces the 21 incremental migrations from
-- 2026-06-29 to 2026-11-25 and drops everything from the old subscription
-- product (plans, prices, subscriptions, payments, access codes, VIP
-- winnings, free games, the payment-proofs bucket, predictions.plan_id), so
-- it contains only what the free predictions platform uses.
--
-- Run on an empty Supabase project, with `supabase db push` or by pasting it
-- into the SQL Editor. Add later changes as new migration files after this one.
--
-- After your first sign-up, make yourself admin:
--   update public.users set is_admin = true where email = 'you@example.com';
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Shared helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 2. Users
-- ----------------------------------------------------------------------------
-- Public profile table mirroring auth.users.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  country varchar default 'Nigeria',
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Every admin-gated policy calls this. It is SECURITY DEFINER, so it runs as
-- the table owner and bypasses RLS. An inline `exists (select ... from users)`
-- inside a users policy would re-evaluate that same policy and fail with
-- "infinite recursion detected in policy for relation users".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = auth.uid() and is_admin = true);
$$;

-- Auto-create a public.users profile row whenever someone signs up via
-- Supabase Auth. security definer so it can write to public.users despite
-- the inserting "role" being the anon/auth signup flow, not the new user's
-- own session yet.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, country)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'country', 'Nigeria')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- ----------------------------------------------------------------------------
-- 3. Predictions
-- ----------------------------------------------------------------------------
-- Normalised betting market. Keep in sync with
-- lib/predictions/markets.ts#classifyMarket. NULL means "not a recognised
-- market": bespoke picks are still published and graded by hand, they just
-- don't appear on market landing pages. Combined picks ("Home Win & Over
-- 1.5"), part-match picks ("First Half Over 0.5", "HT/FT") and non-goal stats
-- ("Over 9.5 Corners") are deliberately bespoke.
create or replace function public.classify_prediction_market(prediction_type text)
returns text
language plpgsql
immutable
as $$
declare
  t text := lower(btrim(coalesce(prediction_type, '')));
  line text[];
begin
  if t ~ '^\d+\s*[-:]\s*\d+$' then return 'correct_score'; end if;
  if t ~ '&|\+|\yand\y|half|\y(ht|ft|fh|sh|1h|2h)\y|corner|card|booking|shot|foul|offside|throw|penalt|handicap|clean sheet|to nil|team total' then
    return null;
  end if;
  if t in ('home win', 'home', '1') then return 'home_win'; end if;
  if t in ('away win', 'away', '2') then return 'away_win'; end if;
  if t in ('draw', 'x') then return 'draw'; end if;
  if t in ('12', 'no draw') or t like '%double chance 12%' or t like '%home/away%' then return 'double_chance_12'; end if;
  if t in ('1x', 'x2') or t like '%double chance%' then return 'double_chance'; end if;
  if t in ('ng', 'nogg') or (t ~ '(btts|both teams)' and t ~ '\m(no|not)\M') then return 'btts_no'; end if;
  if t in ('gg') or t ~ '(btts|both teams)' then return 'btts'; end if;

  -- Only when the whole pick is a match goal line ("Over 2.5", "Total Under 3.5 Goals").
  line := regexp_match(t, '^(?:(?:total|match)\s+)?(?:goals\s+)?(over|under)\s*(\d+(?:\.\d+)?)(?:\s*goals?)?$');
  if line is not null then
    if line[1] = 'over' then
      return case line[2] when '0.5' then 'over_0_5' when '1.5' then 'over_1_5' when '2.5' then 'over_2_5' when '3.5' then 'over_3_5' else null end;
    end if;
    return case line[2] when '2.5' then 'under_2_5' when '3.5' then 'under_3_5' else null end;
  end if;

  return null;
end;
$$;

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  -- Club badges from the API-Sports fixture payload; null for manual picks.
  home_team_logo text,
  away_team_logo text,
  league text,
  league_id int,                 -- API-Sports v3 league id
  external_fixture_id int,       -- API-Sports v3 fixture id
  kickoff_time timestamptz not null,
  prediction_type text not null, -- the pick as shown, e.g. "Over 2.5" or "2-1"
  market text,                   -- maintained by the predictions_audit trigger
  odds numeric,
  confidence int check (confidence between 0 and 100),
  analysis text,                 -- public explanation of the pick
  admin_notes text,              -- private; never exposed to anonymous visitors
  status text not null default 'not_started' check (status in ('not_started', 'live', 'finished')),
  result text not null default 'pending' check (result in ('win', 'loss', 'push', 'pending')),
  home_score int,
  away_score int,
  source text not null default 'manual',
  -- Results only count in public statistics once an admin approves them.
  result_approved boolean not null default false,
  result_approved_at timestamptz,
  result_approved_by uuid references public.users(id) on delete set null,
  -- Immutable record of what was published (frozen at kickoff by the trigger).
  original_prediction_type text not null,
  original_odds numeric,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint predictions_market_check check (
    market is null or market in (
      'home_win', 'away_win', 'draw', 'double_chance', 'double_chance_12',
      'btts', 'btts_no', 'over_0_5', 'over_1_5', 'over_2_5', 'over_3_5',
      'under_2_5', 'under_3_5', 'correct_score'
    )
  ),
  constraint predictions_source_check check (source in ('manual', 'api_sync', 'live_fallback')),
  -- An approved result must be a real result.
  constraint predictions_result_approved_check check (not result_approved or result <> 'pending')
);

create index predictions_kickoff_time_idx on public.predictions(kickoff_time);
create index predictions_external_fixture_id_idx on public.predictions(external_fixture_id);
create index predictions_source_idx on public.predictions(source);
create index predictions_result_approved_kickoff_idx on public.predictions(result_approved, kickoff_time desc);
create index predictions_league_kickoff_idx on public.predictions(league_id, kickoff_time);
create index predictions_market_kickoff_idx on public.predictions(market, kickoff_time);
-- One prediction per fixture and market. NULL fixture ids (manual picks
-- without an API fixture) and NULL markets (bespoke picks) never collide.
create unique index predictions_fixture_market_key on public.predictions(external_fixture_id, market);

create or replace function public.predictions_audit()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- The published selection is whatever was inserted -- callers cannot
    -- backdate or pre-fill the audit columns.
    new.original_prediction_type := new.prediction_type;
    new.original_odds := new.odds;
    new.published_at := now();
    if new.market is null then
      new.market := public.classify_prediction_market(new.prediction_type);
    end if;
    if new.result_approved then
      new.result_approved_at := now();
      new.result_approved_by := auth.uid();
    end if;
    return new;
  end if;

  -- UPDATE
  new.published_at := old.published_at;

  -- Pre-kickoff edits are corrections of an unplayed pick, so the published
  -- record follows them. Once the match has started (or kickoff has
  -- passed) the original selection and odds are frozen for good.
  if old.status = 'not_started' and old.kickoff_time > now() then
    new.original_prediction_type := new.prediction_type;
    new.original_odds := new.odds;
  else
    new.original_prediction_type := old.original_prediction_type;
    new.original_odds := old.original_odds;
  end if;

  -- Keep market in sync with the pick unless the caller set it explicitly.
  if new.prediction_type is distinct from old.prediction_type
     and new.market is not distinct from old.market then
    new.market := public.classify_prediction_market(new.prediction_type);
  end if;

  -- Changing a result that was already approved revokes the approval,
  -- unless this same update is (re-)approving it.
  if old.result_approved and new.result_approved
     and new.result is distinct from old.result then
    new.result_approved := false;
  end if;

  if new.result_approved and not old.result_approved then
    new.result_approved_at := now();
    new.result_approved_by := auth.uid();
  elsif not new.result_approved then
    new.result_approved_at := null;
    new.result_approved_by := null;
  else
    new.result_approved_at := old.result_approved_at;
    new.result_approved_by := old.result_approved_by;
  end if;

  return new;
end;
$$;

create trigger predictions_audit
  before insert or update on public.predictions
  for each row execute function public.predictions_audit();
create trigger predictions_set_updated_at before update on public.predictions
  for each row execute function public.set_updated_at();

-- Public results aggregates. Counted in the database because PostgREST caps
-- responses (1000 rows by default on Supabase), which would silently truncate
-- client-side counts. SECURITY INVOKER (the default): callers only see rows
-- RLS lets them read. Definitions match lib/predictions/stats.ts and
-- /methodology: settled = approved wins/losses/pushes; pending = everything
-- not approved.
create or replace function public.prediction_result_summary(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_market text default null,
  p_league_id int default null
)
returns table (total bigint, wins bigint, losses bigint, pushes bigint, pending bigint, awaiting_verification bigint)
language sql
stable
as $$
  select
    count(*),
    count(*) filter (where result_approved and result = 'win'),
    count(*) filter (where result_approved and result = 'loss'),
    count(*) filter (where result_approved and result = 'push'),
    count(*) filter (where not result_approved or result = 'pending'),
    count(*) filter (where not result_approved and result <> 'pending')
  from public.predictions
  where (p_from is null or kickoff_time >= p_from)
    and (p_to is null or kickoff_time <= p_to)
    and (p_market is null or market = p_market)
    and (p_league_id is null or league_id = p_league_id);
$$;

create or replace function public.prediction_result_summary_by_market(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (market text, total bigint, wins bigint, losses bigint, pushes bigint, pending bigint)
language sql
stable
as $$
  select
    market,
    count(*),
    count(*) filter (where result_approved and result = 'win'),
    count(*) filter (where result_approved and result = 'loss'),
    count(*) filter (where result_approved and result = 'push'),
    count(*) filter (where not result_approved or result = 'pending')
  from public.predictions
  where market is not null
    and (p_from is null or kickoff_time >= p_from)
    and (p_to is null or kickoff_time <= p_to)
  group by market;
$$;

-- Competitions that have at least one approved result (results filter).
create or replace function public.prediction_result_leagues()
returns table (league_id int, league text, settled bigint)
language sql
stable
as $$
  select league_id, max(league), count(*)
  from public.predictions
  where result_approved and league_id is not null
  group by league_id
  order by count(*) desc;
$$;

-- One row per fixture that has predictions, for the XML sitemap.
create or replace function public.sitemap_match_pages(p_since timestamptz, p_until timestamptz)
returns table (external_fixture_id int, last_modified timestamptz)
language sql
stable
as $$
  select external_fixture_id, max(updated_at)
  from public.predictions
  where external_fixture_id is not null
    and kickoff_time >= p_since
    and kickoff_time <= p_until
  group by external_fixture_id
  order by max(kickoff_time) desc
  limit 45000;
$$;


-- ----------------------------------------------------------------------------
-- 4. Content: competitions, blog, landing pages, site config, ad links
-- ----------------------------------------------------------------------------
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  league_id int,                 -- API-Sports v3 league id
  status text not null default 'active' check (status in ('active', 'inactive')),
  heading text,
  subheading text,
  introduction text,
  main_content text,
  country text,
  competition_type text,
  current_season int,
  featured_image text,
  og_image text,
  seo_title text,
  seo_description text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index competitions_league_id_idx on public.competitions(league_id);
create trigger competitions_set_updated_at before update on public.competitions
  for each row execute function public.set_updated_at();

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  featured_image text,
  featured_image_alt text,
  category text,
  author_id uuid references public.users(id) on delete set null,
  author_name text,
  competition_id uuid references public.competitions(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,      -- published by the publish-scheduled cron
  meta_title text,
  meta_description text,
  tags text[] not null default '{}',
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts(published, published_at desc);
create index blog_posts_updated_at_idx on public.blog_posts(updated_at desc);
create index blog_posts_category_idx on public.blog_posts(category);
create index blog_posts_competition_id_idx on public.blog_posts(competition_id);
create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- Lets the blog post page count views without granting UPDATE on blog_posts.
create or replace function public.increment_blog_post_views(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts set view_count = view_count + 1 where id = post_id;
$$;

-- Admin-managed SEO landing pages.
create table public.custom_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  heading text,
  subheading text,
  description text,
  introduction text,
  main_content text,
  faq jsonb not null default '[]',
  related_links jsonb not null default '[]',
  filter_id text,
  is_published boolean not null default true,
  show_in_footer boolean not null default false,
  footer_section text,
  footer_label text,
  footer_order int default 0,
  meta_title text,
  meta_description text,
  noindex boolean not null default false,
  canonical_url text,
  og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_pages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint custom_pages_faq_is_array check (jsonb_typeof(faq) = 'array'),
  constraint custom_pages_related_links_is_array check (jsonb_typeof(related_links) = 'array')
);

create index custom_pages_noindex_idx on public.custom_pages(noindex) where noindex = true;
create trigger custom_pages_set_updated_at before update on public.custom_pages
  for each row execute function public.set_updated_at();

-- Key/value settings edited in /admin/config.
create table public.site_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.ad_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 5. Notifications and support chat
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, read);

-- User <-> admin support chat. user_id is the user whose thread it is;
-- sender_id is whoever wrote the message (the user or an admin).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_user_id_idx on public.messages(user_id, created_at);

-- Live chat updates (components/chat/chat-thread.tsx).
alter publication supabase_realtime add table public.messages;


-- ----------------------------------------------------------------------------
-- 6. Row level security
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.predictions enable row level security;
alter table public.competitions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.custom_pages enable row level security;
alter table public.site_config enable row level security;
alter table public.ad_links enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

-- users: no INSERT policy (handle_new_auth_user creates rows); users can't
-- grant themselves admin.
create policy "users can view own profile" on public.users
  for select using (auth.uid() = id or public.is_admin());
create policy "users can update own profile" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id and is_admin = false);
create policy "admins can update any profile" on public.users
  for update using (public.is_admin());

create policy "anyone can view predictions" on public.predictions
  for select using (true);
create policy "admins manage predictions" on public.predictions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can view active competitions" on public.competitions
  for select using (status = 'active' or public.is_admin());
create policy "admins manage competitions" on public.competitions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can view published blog posts" on public.blog_posts
  for select using ((published = true and published_at <= now()) or public.is_admin());
create policy "admins manage blog posts" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can view published custom pages" on public.custom_pages
  for select using (is_published = true or public.is_admin());
create policy "admins manage custom pages" on public.custom_pages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can view site config" on public.site_config
  for select using (true);
create policy "admins manage site config" on public.site_config
  for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone can view active ad links" on public.ad_links
  for select using (is_active = true or public.is_admin());
create policy "admins manage ad links" on public.ad_links
  for all using (public.is_admin()) with check (public.is_admin());

create policy "users view own notifications" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy "users mark own notifications read" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins create notifications" on public.notifications
  for insert with check (public.is_admin());

create policy "users view own conversation" on public.messages
  for select using (user_id = auth.uid() or sender_id = auth.uid() or public.is_admin());
create policy "users send in own thread, admins anywhere" on public.messages
  for insert with check (sender_id = auth.uid() and (user_id = auth.uid() or public.is_admin()));
create policy "users mark own messages read" on public.messages
  for update using (user_id = auth.uid() or public.is_admin());


-- ----------------------------------------------------------------------------
-- 7. Storage
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('blog-images', 'blog-images', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "anyone can view blog images" on storage.objects
  for select using (bucket_id = 'blog-images');
create policy "admins manage blog images" on storage.objects
  for all using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());

-- Avatars live at avatars/<user id>/<file>.
create policy "anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "users manage own avatar" on storage.objects
  for all using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ----------------------------------------------------------------------------
-- 8. Data API privileges
-- ----------------------------------------------------------------------------
-- Supabase projects created from 2026 no longer grant the API roles access to
-- public tables automatically. RLS (above) decides which rows each role can
-- see or change; these grants only open the tables to the API.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Same baseline for objects created by later migrations. New tables must
-- still enable RLS.
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- Anonymous visitors read public prediction columns only (never admin_notes
-- or result_approved_by). The app's public queries select explicit columns
-- (lib/data/predictions.ts, lib/data/results.ts); admins and cron jobs are
-- unaffected.
revoke select on public.predictions from anon;
grant select (
  id, home_team, away_team, league, league_id, external_fixture_id,
  home_team_logo, away_team_logo, prediction_type, market, odds, confidence,
  kickoff_time, status, result, home_score, away_score, source, analysis,
  result_approved, result_approved_at, original_prediction_type, original_odds,
  published_at, created_at, updated_at
) on public.predictions to anon;

-- Marking as read is the only update users make to messages and notifications.
revoke update on public.messages from anon, authenticated;
grant update (read) on public.messages to authenticated;
revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;


-- ----------------------------------------------------------------------------
-- 9. Seed data
-- ----------------------------------------------------------------------------
-- Empty strings hide the matching links in the UI until an admin sets real
-- values in /admin/config.
insert into public.site_config (key, value) values
  ('hero', '{"headline": "Sure Match Tips", "subtext": "Free football predictions, daily betting tips, match previews, and transparent historical results.", "primary_cta_label": "View Today''s Tips", "secondary_cta_label": "Join Telegram"}'),
  ('telegram_url', '""'),
  ('whatsapp_number', '""'),
  ('contact_email', '""'),
  ('social_links', '{"facebook": "", "twitter": "", "instagram": "", "youtube": ""}')
on conflict (key) do nothing;

-- Competition hub pages. league_id values are API-Sports v3 league ids.
insert into public.competitions (slug, name, league_id, heading, subheading, country, competition_type, display_order, seo_title, seo_description, introduction) values
  ('premier-league', 'Premier League', 39, 'Premier League Predictions', 'Fixtures, standings and predictions', 'England', 'league', 0,
   'Premier League Predictions Today – Free EPL Tips',
   'Free Premier League predictions with fixtures, the current table, form, head-to-head records and transparent results for every published EPL tip.',
   'The Premier League is the top division of English football. Twenty clubs play each other home and away over a 38-match season, earning three points for a win and one for a draw, with the bottom three relegated to the Championship. Its competitive balance and high tempo make goals and both-teams-to-score markets popular, but results between the leading clubs and the rest can still swing on injuries, fixture congestion from European competition, and home advantage.'),
  ('la-liga', 'La Liga', 140, 'La Liga Predictions', 'Fixtures, standings and predictions', 'Spain', 'league', 1,
   'La Liga Predictions Today – Free Spanish Football Tips',
   'Free La Liga predictions with upcoming fixtures, standings, team form and head-to-head data, plus a transparent record of every published tip.',
   'La Liga is the top division of Spanish football, contested by 20 clubs over 38 rounds with three clubs relegated each season. Matches are often tactically controlled and possession-heavy, which tends to make under-goals and double chance markets worth considering alongside the match result, particularly in games outside the top of the table.'),
  ('serie-a', 'Serie A', 135, 'Serie A Predictions', 'Fixtures, standings and predictions', 'Italy', 'league', 2,
   'Serie A Predictions Today – Free Italian Football Tips',
   'Free Serie A predictions with fixtures, the league table, recent form and head-to-head records, and a transparent history of every published tip.',
   'Serie A is the top tier of Italian football: 20 clubs, 38 matchdays, and three relegation places. Italian football has a reputation for organised defending, so goal-line markets reward close attention to each side''s recent scoring and conceding record rather than reputation alone.'),
  ('bundesliga', 'Bundesliga', 78, 'Bundesliga Predictions', 'Fixtures, standings and predictions', 'Germany', 'league', 3,
   'Bundesliga Predictions Today – Free German Football Tips',
   'Free Bundesliga predictions with upcoming fixtures, standings, team form and head-to-head data, plus a transparent record of every published tip.',
   'The Bundesliga is Germany''s top division. It has 18 clubs playing 34 matchdays; the bottom two are relegated and the 16th-placed club enters a two-leg play-off. Its matches have historically produced a relatively high number of goals, which is why over-goals and both-teams-to-score selections are common, but form and squad rotation still matter week to week.'),
  ('ligue-1', 'Ligue 1', 61, 'Ligue 1 Predictions', 'Fixtures, standings and predictions', 'France', 'league', 4,
   'Ligue 1 Predictions Today – Free French Football Tips',
   'Free Ligue 1 predictions with fixtures, the current table, form and head-to-head records, and a transparent history of every published tip.',
   'Ligue 1 is the top division of French football, with 18 clubs playing a 34-match season since its 2023 reduction from 20 teams. The gap between the strongest squads and the rest of the league can be large, so match-result and handicap-style markets depend heavily on team news and the scheduling of European fixtures.'),
  ('champions-league', 'Champions League', 2, 'Champions League Predictions', 'Fixtures, standings and predictions', 'Europe', 'cup', 5,
   'Champions League Predictions Today – Free UCL Tips',
   'Free Champions League predictions with fixtures, league-phase standings, team form and head-to-head data, plus a transparent record of every published tip.',
   'The UEFA Champions League is Europe''s premier club competition. Since 2024–25 it opens with a single 36-team league phase, in which each club plays eight different opponents, followed by knockout play-offs and two-legged ties through to a one-off final. Two-legged knockout matches change how teams approach each game, so the aggregate situation is as important as form when assessing a fixture.'),
  ('europa-league', 'Europa League', 3, 'Europa League Predictions', 'Fixtures, standings and predictions', 'Europe', 'cup', 6,
   'Europa League Predictions Today – Free UEL Tips',
   'Free Europa League predictions with fixtures, standings, team form and head-to-head records, and a transparent history of every published tip.',
   'The UEFA Europa League is UEFA''s second-tier club competition. Like the Champions League it uses a 36-team league phase, with each side playing eight matches before the knockout rounds. Squad rotation is common because many clubs prioritise domestic league games, which can make team news decisive.'),
  ('world-cup', 'World Cup', 1, 'World Cup Predictions', 'Fixtures, standings and predictions', 'World', 'cup', 7,
   'World Cup Predictions – Free International Football Tips',
   'Free World Cup predictions with fixtures, group standings, head-to-head records and a transparent history of every published tip.',
   'The FIFA World Cup is the international tournament for men''s national teams, held every four years. The 2026 edition, hosted across Canada, Mexico and the United States, was the first to feature 48 teams. Tournament football differs from league football: group-stage permutations, rest days and travel all influence how teams set up.'),
  ('conference-league', 'Conference League', 848, 'Conference League Predictions', 'Fixtures, standings and predictions', 'Europe', 'cup', 8,
   'Conference League Predictions Today – Free UECL Tips',
   'Free Conference League predictions with fixtures, standings, team form and head-to-head data, plus a transparent record of every published tip.',
   'The UEFA Conference League is UEFA''s third club competition, launched in 2021. Since 2024–25 it uses a 36-team league phase in which each club plays six matches before the knockout rounds. It features clubs from a wide range of European leagues, so differences in league strength and travel are useful context when comparing teams.')
on conflict (slug) do nothing;
