import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { InlineContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import type { StaticContentKey } from "@/lib/content/registry";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// Text is edited in Admin > Site Content > Page not found; link labels reuse the menu/footer labels.
const LINKS: Array<{ href: string; label: StaticContentKey }> = [
  { href: "/", label: "footer.today" },
  { href: "/tips", label: "tips.breadcrumb" },
  { href: "/competitions", label: "nav.competitions" },
  { href: "/previous-results", label: "footer.results" },
];

export default async function NotFound() {
  const text = await getSiteText();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <Logo imgClassName="h-20 w-auto" />
      <h1 className="mt-8 text-3xl font-extrabold">
        <InlineContent text={text.t("notFound.h1")} />
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        <InlineContent text={text.t("notFound.text")} />
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
              {text.t(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
