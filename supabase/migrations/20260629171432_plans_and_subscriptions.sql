-- Plans are the single source of truth for "plan type" everywhere in the app.
-- Adding a new VIP package means inserting a row here, not touching a CHECK
-- constraint, a slug-mapping object, and filter logic in three places.
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  benefits text[] not null default '{}',
  requires_activation boolean not null default false,
  is_active boolean not null default true,
  max_predictions_per_day int,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  country varchar not null,
  duration_days int not null check (duration_days in (7, 30)),
  price numeric not null,
  activation_fee numeric,
  currency varchar not null,
  created_at timestamptz not null default now(),
  unique (plan_id, country, duration_days)
);

create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  plan_status text not null default 'inactive' check (plan_status in ('inactive', 'pending', 'pending_activation', 'active', 'expired')),
  subscription_fee_paid boolean not null default false,
  activation_fee_paid boolean not null default false,
  start_date timestamptz,
  expiry_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id)
);

create index user_subscriptions_user_id_idx on public.user_subscriptions(user_id);
create index user_subscriptions_plan_status_idx on public.user_subscriptions(plan_status);

alter table public.plans enable row level security;
alter table public.plan_prices enable row level security;
alter table public.user_subscriptions enable row level security;
