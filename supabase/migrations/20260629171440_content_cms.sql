create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  league_id int,
  featured_image text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  seo_title text,
  seo_description text,
  heading text,
  subheading text,
  introduction text,
  country text,
  competition_type text,
  current_season int,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  featured_image text,
  author_id uuid references public.users(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  meta_title text,
  meta_description text,
  tags text[] not null default '{}',
  view_count int not null default 0,
  competition_id uuid references public.competitions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts(published, published_at desc);

-- Programmatic SEO landing pages, e.g. "BTTS/GG Tips", "Over 2.5 Goals
-- Predictions" -- filter_id maps to a prediction filter interpreted by the
-- free-predictions query, so new SEO pages don't require a code change.
create table public.custom_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  heading text,
  subheading text,
  description text,
  filter_id text,
  is_published boolean not null default true,
  show_in_footer boolean not null default false,
  footer_section text,
  footer_label text,
  footer_order int default 0,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now()
);

-- Site-wide key/value config: hero copy, WhatsApp/Telegram links, social
-- links, contact email. Avoids schema churn for marketing copy.
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

alter table public.competitions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.custom_pages enable row level security;
alter table public.site_config enable row level security;
alter table public.ad_links enable row level security;
