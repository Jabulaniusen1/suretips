-- Optional meta keywords for SEO pages (Admin > SEO Pages > Search appearance),
-- stored as a normalised comma-separated list and rendered as <meta name="keywords">.
alter table public.custom_pages add column if not exists meta_keywords text;
