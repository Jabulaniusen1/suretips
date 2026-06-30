-- Unified predictions table. Correct Score predictions live here too
-- (plan slug 'correct-scores', prediction_type holds the scoreline string
-- e.g. "2-1") -- there is deliberately no separate correct_score_predictions
-- table.
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  league text,
  league_id int,
  external_fixture_id int,
  prediction_type text not null,
  odds numeric,
  confidence int check (confidence between 0 and 100),
  kickoff_time timestamptz not null,
  status text not null default 'not_started' check (status in ('not_started', 'live', 'finished')),
  result text not null default 'pending' check (result in ('win', 'loss', 'push', 'pending')),
  home_score int,
  away_score int,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index predictions_plan_id_idx on public.predictions(plan_id);
create index predictions_kickoff_time_idx on public.predictions(kickoff_time);

-- Manually curated proof-of-results shown on the homepage and the VIP Zone
-- "Previous Results" panel. Independent from `predictions` so admins can
-- backfill historical proof without needing matching prediction rows.
create table public.vip_winnings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  league text,
  home_team text not null,
  away_team text not null,
  prediction_type text not null,
  home_score int,
  away_score int,
  result text not null check (result in ('win', 'loss', 'push')),
  date date not null,
  created_at timestamptz not null default now()
);

create index vip_winnings_plan_id_date_idx on public.vip_winnings(plan_id, date desc);

alter table public.predictions enable row level security;
alter table public.vip_winnings enable row level security;
