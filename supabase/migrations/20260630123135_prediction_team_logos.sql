-- Lets the UI render club badges next to each prediction without an extra
-- API-Sports call per render. Populated at insert time by the sync flows
-- (admin sync-predictions, auto-sync-free-tips) from the fixture payload's
-- teams.home.logo / teams.away.logo; null for manually-entered predictions.
alter table public.predictions add column home_team_logo text;
alter table public.predictions add column away_team_logo text;
