# Disabled: admin side of the user support chat (/admin/chat)

User accounts are turned off, so this route is out of routing (Next.js ignores `_`-prefixed folders).
To restore it, rename this folder back to `app/admin/chat` and uncomment its entry in the admin sidebar (components/admin/admin-sidebar.tsx).
