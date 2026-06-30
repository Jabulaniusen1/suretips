import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>Sureodds Predict uses cookies to keep you signed in and to understand how the site is used.</p>
      <h2>Essential Cookies</h2>
      <p>Required for authentication (Supabase session cookies) and basic site functionality. These cannot be disabled.</p>
      <h2>Analytics Cookies</h2>
      <p>If Google Analytics is enabled, anonymized usage data helps us understand traffic and improve the site.</p>
      <p>You can control or delete cookies through your browser settings at any time.</p>
    </LegalPage>
  );
}
