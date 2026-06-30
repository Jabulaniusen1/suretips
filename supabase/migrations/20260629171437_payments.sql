-- Manual, proof-of-payment based checkout. No payment gateway integration --
-- admin reviews uploaded proof images and approves/rejects in /admin/transactions.
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('bank_transfer', 'crypto', 'mobile_money', 'other')),
  currency varchar,
  details jsonb not null default '{}',
  countries jsonb not null default '[]',
  is_active boolean not null default true,
  display_order int not null default 0,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_id uuid references public.user_subscriptions(id) on delete set null,
  plan_id uuid not null references public.plans(id) on delete cascade,
  amount numeric not null,
  currency varchar not null,
  payment_method_name text,
  payment_type text not null check (payment_type in ('subscription', 'activation')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_status_idx on public.transactions(status);

alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;
