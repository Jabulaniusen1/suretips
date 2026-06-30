-- Public profile table mirroring auth.users.
-- Country is stored as plain text (not a normalized countries table) and
-- currency is derived from it in application code (lib/utils/currency.ts).
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

alter table public.users enable row level security;
