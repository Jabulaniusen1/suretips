# Disabled: user dashboard (/dashboard, chat, notifications, settings)

User accounts are turned off, so this route is out of routing (Next.js ignores `_`-prefixed folders).
To restore it, rename this folder back to `app/dashboard` and remove the matching entry from `ACCOUNT_REDIRECTS` in next.config.ts.
