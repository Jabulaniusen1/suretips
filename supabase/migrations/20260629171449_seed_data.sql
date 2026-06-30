-- Core plans. Slugs are referenced directly throughout the app
-- (lib/constants.ts, the dashboard tile grid, /dashboard/vip/[slug]) so
-- don't rename them without updating those references.
insert into public.plans (name, slug, description, benefits, requires_activation, is_active, max_predictions_per_day, display_order) values
  ('Free Games', 'free-games', 'Play our free daily prediction game and climb the leaderboard.', array['One free daily pick', 'Leaderboard ranking', 'No payment required'], false, true, 1, 0),
  ('Daily 2 Odds Combo', 'daily-2-odds-combo', 'A safe, consistent combo with total odds of 2.00 and above, every day.', array['Combined odds 2.00+', 'Confidence 60-100%', 'Updated daily', 'Previous results history'], false, true, 3, 1),
  ('Daily 5 Odds Combo', 'daily-5-odds-combo', 'Higher-value combo with total odds of 5.00 and above for bigger returns.', array['Combined odds 5.00+', 'Confidence 60-100%', 'Updated daily', 'Previous results history'], false, true, 3, 2),
  ('Daily 50 Odds Combo', 'daily-50-odds-combo', 'Our highest-odds combo package for maximum profit potential.', array['Combined odds 50.00+', 'Confidence 60-100%', 'Updated daily', 'Previous results history'], false, true, 1, 3),
  ('Correct Scores', 'correct-scores', 'Hand-picked exact scoreline predictions with a dual-payment unlock.', array['Admin-curated scorelines', 'High winning consistency', 'Two-step unlock for accuracy guarantee'], true, true, 3, 4)
on conflict (slug) do nothing;

-- Placeholder pricing -- replace with real numbers before launch (see
-- BUILD_PROMPT.md "Open Items"). USD rows act as the fallback for any
-- country without a dedicated row.
insert into public.plan_prices (plan_id, country, duration_days, price, activation_fee, currency)
select p.id, v.country, v.duration_days, v.price, v.activation_fee, v.currency
from public.plans p
join (values
  ('daily-2-odds-combo', 'Nigeria', 7, 3000, null, 'NGN'),
  ('daily-2-odds-combo', 'Nigeria', 30, 10000, null, 'NGN'),
  ('daily-2-odds-combo', 'USD', 7, 5, null, 'USD'),
  ('daily-2-odds-combo', 'USD', 30, 15, null, 'USD'),
  ('daily-5-odds-combo', 'Nigeria', 7, 5000, null, 'NGN'),
  ('daily-5-odds-combo', 'Nigeria', 30, 15000, null, 'NGN'),
  ('daily-5-odds-combo', 'USD', 7, 8, null, 'USD'),
  ('daily-5-odds-combo', 'USD', 30, 22, null, 'USD'),
  ('daily-50-odds-combo', 'Nigeria', 7, 8000, null, 'NGN'),
  ('daily-50-odds-combo', 'Nigeria', 30, 25000, null, 'NGN'),
  ('daily-50-odds-combo', 'USD', 7, 12, null, 'USD'),
  ('daily-50-odds-combo', 'USD', 30, 35, null, 'USD'),
  ('correct-scores', 'Nigeria', 7, 5000, 5000, 'NGN'),
  ('correct-scores', 'Nigeria', 30, 15000, 10000, 'NGN'),
  ('correct-scores', 'USD', 7, 8, 8, 'USD'),
  ('correct-scores', 'USD', 30, 22, 15, 'USD')
) as v(slug, country, duration_days, price, activation_fee, currency) on v.slug = p.slug
on conflict (plan_id, country, duration_days) do nothing;

-- Placeholder payment methods -- replace account/wallet details with real
-- ones before launch.
insert into public.payment_methods (name, type, currency, details, countries, is_active, display_order) values
  ('Bank Transfer (Nigeria)', 'bank_transfer', 'NGN', '{"bank_name": "TODO", "account_name": "Sureodds Predict", "account_number": "TODO"}', '["Nigeria"]', true, 0),
  ('USDT (TRC20)', 'crypto', 'USDT', '{"wallet_address": "TODO", "network": "TRC20"}', '[]', true, 1)
on conflict (name) do nothing;

insert into public.site_config (key, value) values
  ('hero', '{"headline": "Sureodds Predict", "subtext": "Accurate, transparent football predictions backed by proof.", "primary_cta_label": "Subscribe to VIP", "secondary_cta_label": "Join Telegram"}'),
  ('telegram_url', '"https://t.me/TODO"'),
  ('whatsapp_number', '"+234TODO"'),
  ('contact_email', '"support@sureoddspredict.com"'),
  ('social_links', '{"facebook": "", "twitter": "", "instagram": "", "youtube": ""}')
on conflict (key) do nothing;

-- Programmatic SEO landing pages mirroring the homepage filter bar.
insert into public.custom_pages (slug, title, heading, subheading, filter_id, is_published, show_in_footer, footer_section, footer_label, footer_order, meta_title, meta_description) values
  ('safe-free-picks', 'Safe Free Picks', 'Safe Free Football Picks', 'Low-risk free predictions updated daily', 'free', true, true, 'predictions', 'Free Picks', 0, 'Safe Free Football Picks | Sureodds Predict', 'Daily safe free football predictions with high confidence.'),
  ('all-tips', 'All Tips', 'All Football Tips', 'Every prediction we publish, in one place', 'all', true, true, 'predictions', 'All Tips', 1, 'All Football Tips | Sureodds Predict', 'Browse every free football prediction we publish.'),
  ('super-single', 'Super Single', 'Super Single Tips', 'One high-confidence pick per day', 'super_single', true, true, 'predictions', 'Super Single', 2, 'Super Single Football Tips | Sureodds Predict', 'Our single highest-confidence football pick of the day.'),
  ('double-chance', 'Double Chance', 'Double Chance Predictions', 'Lower-risk double chance picks', 'double_chance', true, true, 'predictions', 'Double Chance', 3, 'Double Chance Football Predictions | Sureodds Predict', 'Daily double chance football betting tips.'),
  ('home-win', 'Home Win', 'Home Win Predictions', 'Home team to win picks', 'home_win', true, true, 'predictions', 'Home Win', 4, 'Home Win Predictions | Sureodds Predict', 'Daily home win football betting tips.'),
  ('away-win', 'Away Win', 'Away Win Predictions', 'Away team to win picks', 'away_win', true, true, 'predictions', 'Away Win', 5, 'Away Win Predictions | Sureodds Predict', 'Daily away win football betting tips.'),
  ('over-1-5-goals', 'Over 1.5 Goals', 'Over 1.5 Goals Predictions', 'Matches likely to have 2+ goals', 'over_1_5', true, true, 'predictions', 'Over 1.5 Goals', 6, 'Over 1.5 Goals Predictions | Sureodds Predict', 'Daily over 1.5 goals football betting tips.'),
  ('over-2-5-goals', 'Over 2.5 Goals', 'Over 2.5 Goals Predictions', 'Matches likely to have 3+ goals', 'over_2_5', true, true, 'predictions', 'Over 2.5 Goals', 7, 'Over 2.5 Goals Predictions | Sureodds Predict', 'Daily over 2.5 goals football betting tips.'),
  ('btts-gg', 'BTTS/GG', 'Both Teams To Score Predictions', 'Matches where both teams are likely to score', 'btts', true, true, 'predictions', 'BTTS/GG', 8, 'BTTS/GG Predictions | Sureodds Predict', 'Daily both-teams-to-score football betting tips.')
on conflict (slug) do nothing;

-- Competition hub pages -- league_id values are API-Sports v3 league IDs.
insert into public.competitions (slug, name, league_id, status, heading, subheading, country, competition_type, display_order) values
  ('premier-league', 'Premier League', 39, 'active', 'Premier League Predictions', 'Fixtures, standings and predictions', 'England', 'league', 0),
  ('la-liga', 'La Liga', 140, 'active', 'La Liga Predictions', 'Fixtures, standings and predictions', 'Spain', 'league', 1),
  ('serie-a', 'Serie A', 135, 'active', 'Serie A Predictions', 'Fixtures, standings and predictions', 'Italy', 'league', 2),
  ('bundesliga', 'Bundesliga', 78, 'active', 'Bundesliga Predictions', 'Fixtures, standings and predictions', 'Germany', 'league', 3),
  ('ligue-1', 'Ligue 1', 61, 'active', 'Ligue 1 Predictions', 'Fixtures, standings and predictions', 'France', 'league', 4),
  ('champions-league', 'Champions League', 2, 'active', 'Champions League Predictions', 'Fixtures, standings and predictions', 'Europe', 'cup', 5),
  ('europa-league', 'Europa League', 3, 'active', 'Europa League Predictions', 'Fixtures, standings and predictions', 'Europe', 'cup', 6),
  ('world-cup', 'World Cup', 1, 'active', 'World Cup Predictions', 'Fixtures, standings and predictions', 'World', 'cup', 7)
on conflict (slug) do nothing;

-- To promote your own account to admin after signing up once, run in the
-- Supabase SQL editor:
--   update public.users set is_admin = true where email = 'you@example.com';
