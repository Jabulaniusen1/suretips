-- Tracks whether the 24h-before-expiry reminder has already gone out for a
-- subscription, so the check-expired cron (which may run hourly) doesn't
-- email the same user repeatedly while they're inside the reminder window.
alter table public.user_subscriptions add column expiry_reminder_sent_at timestamptz;
