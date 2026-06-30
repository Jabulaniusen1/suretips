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

-- User <-> admin support chat. Enable Supabase Realtime replication on this
-- table after migrating (Database > Replication in the dashboard, or via the
-- supabase_realtime publication if managing it as code).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_user_id_idx on public.messages(user_id, created_at);

-- Free Games: one daily Home/Draw/Away pick per user on a featured free
-- match. Points are cosmetic (leaderboard rank) in v1 -- see BUILD_PROMPT.md
-- section 6.3 for the open question on reward redemption.
create table public.free_games_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_date date not null,
  prediction jsonb not null default '{}',
  points_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, game_date)
);

alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.free_games_entries enable row level security;

-- Required for the chat UI's live updates (components/chat/chat-thread.tsx
-- subscribes via supabase-js Realtime).
alter publication supabase_realtime add table public.messages;
