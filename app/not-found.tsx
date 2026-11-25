import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: "/", label: "Today's predictions" },
  { href: "/tips", label: "Tips by market" },
  { href: "/competitions", label: "Competitions" },
  { href: "/previous-results", label: "Previous results" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <Logo imgClassName="h-20 w-auto" />
      <h1 className="mt-8 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This page doesn&apos;t exist or is no longer available. Fixtures and predictions move on quickly — try one of these instead.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
