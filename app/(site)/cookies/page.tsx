import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy",
  description: "Which cookies and similar technologies Sure Match Tips uses and how to control them.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" path="/cookies" updated="2026-11-25">
      <h2>Essential cookies</h2>
      <p>
        Visitors don&apos;t need an account, so browsing the site sets no sign-in cookies. Supabase authentication cookies are only
        used to keep site administrators signed in to the admin area.
      </p>
      <h2>Preferences</h2>
      <p>Your light or dark theme choice is stored in your browser&apos;s local storage, not in a cookie, and never leaves your device.</p>
      <h2>Analytics</h2>
      <p>
        If Google Analytics is enabled, it sets cookies (such as <code>_ga</code>) to count visits and understand how pages are
        used. IP anonymisation is switched on.
      </p>
      <h2>Your choices</h2>
      <p>You can block or delete cookies in your browser settings. The site works without them.</p>
    </LegalPage>
  );
}
