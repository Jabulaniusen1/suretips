-- Access codes: code-based plan access that doesn't require an account.
-- Admin generates a 5-digit code when they confirm a payment proof.
-- The code is valid for the duration the user paid for.

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(5) not null unique,
  plan_id uuid not null references public.plans(id) on delete cascade,
  plan_slug text not null,
  duration_days int not null default 30,
  expires_at timestamptz not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index access_codes_code_idx on public.access_codes(code);
alter table public.access_codes enable row level security;

create policy "admins manage access codes" on public.access_codes
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- Anyone can read to verify a code (validity checked at app level)
create policy "anyone can read access codes" on public.access_codes
  for select using (true);

-- Allow guest checkout: user_id on transactions is now nullable
alter table public.transactions alter column user_id drop not null;

-- Replace old policy that required an authenticated user
drop policy if exists "users create own pending transaction" on public.transactions;
create policy "users or guests create pending transactions" on public.transactions
  for insert with check (
    status = 'pending'
    and (user_id = auth.uid() or user_id is null)
  );

-- Payment methods visible to everyone (guests need to see them at checkout)
drop policy if exists "authenticated users view active payment methods" on public.payment_methods;
create policy "anyone can view active payment methods" on public.payment_methods
  for select using (
    is_active = true
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );
