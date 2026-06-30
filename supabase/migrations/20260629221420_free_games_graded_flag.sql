-- Distinguishes "not yet scored" from "scored as a loss" (both would
-- otherwise read as points_earned = 0), so the update-scores cron can skip
-- entries it has already graded instead of re-checking them every run.
alter table public.free_games_entries add column graded boolean not null default false;
