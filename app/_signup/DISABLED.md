# Disabled: public sign-up page (/signup)

User accounts are turned off, so this route is out of routing (Next.js ignores `_`-prefixed folders).
To restore it, rename this folder back to `app/signup` and remove the matching entry from `ACCOUNT_REDIRECTS` in next.config.ts.
