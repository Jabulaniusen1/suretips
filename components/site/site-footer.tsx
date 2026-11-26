import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { PlainContent } from "@/components/content/plain-content";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "@/components/site/social-icons";
import { getSiteConfig } from "@/lib/data/site-config";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { getPublishedCustomPages } from "@/lib/data/custom-pages";
import { getMarketPagesWithText, getSiteText } from "@/lib/content/site-text";
import type { StaticContentKey } from "@/lib/content/registry";

const FOOTER_MARKETS = [
  "free",
  "safe-picks",
  "over-2-5",
  "over-1-5",
  "btts",
  "under-2-5",
  "home-win",
  "double-chance",
  // "correct-score", // DISABLED (correct score)
];

// Labels are edited in Admin > Site Content > Footer.
const TRUST_LINKS: Array<{ href: string; label: StaticContentKey }> = [
  { href: "/about", label: "footer.about" },
  { href: "/methodology", label: "footer.methodology" },
  { href: "/editorial-standards", label: "footer.editorial" },
  { href: "/previous-results", label: "footer.results" },
  { href: "/responsible-betting", label: "footer.responsible" },
  { href: "/faq", label: "footer.faq" },
  { href: "/contact", label: "footer.contact" },
];

const LEGAL_LINKS: Array<{ href: string; label: StaticContentKey }> = [
  { href: "/terms", label: "footer.terms" },
  { href: "/privacy", label: "footer.privacy" },
  { href: "/cookies", label: "footer.cookies" },
  { href: "/disclaimer", label: "footer.disclaimerLink" },
];

function SocialButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-brand/40 hover:text-brand"
    >
      {children}
    </a>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">{children}</ul>
    </div>
  );
}

export async function SiteFooter() {
  const [config, competitions, customPages, text, markets] = await Promise.all([
    getSiteConfig(),
    getActiveCompetitions(),
    getPublishedCustomPages(),
    getSiteText(),
    getMarketPagesWithText(),
  ]);
  const tagline = text.t("footer.tagline");
  const smallPrint = text.t("footer.disclaimer");
  const footerPages = customPages.filter((p) => p.show_in_footer);
  const socials = [
    { href: config.social_links.facebook, label: "Facebook", icon: FacebookIcon },
    { href: config.social_links.twitter, label: "X (Twitter)", icon: XIcon },
    { href: config.social_links.instagram, label: "Instagram", icon: InstagramIcon },
    { href: config.social_links.youtube, label: "YouTube", icon: YoutubeIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <Logo dark imgClassName="h-14 w-auto" />
          {tagline && <PlainContent text={tagline} className="mt-4 max-w-sm text-sm text-zinc-400" />}
          {(socials.length > 0 || config.telegram_url) && (
            <div className="mt-5 flex items-center gap-2.5">
              {socials.map(({ href, label, icon: Icon }) => (
                <SocialButton key={label} href={href} label={label}>
                  <Icon className="size-4" />
                </SocialButton>
              ))}
              {config.telegram_url && (
                <SocialButton href={config.telegram_url} label="Telegram">
                  <Send className="size-4" />
                </SocialButton>
              )}
            </div>
          )}
          {smallPrint && <PlainContent text={smallPrint} className="mt-6 max-w-sm text-xs text-zinc-500" />}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          <FooterColumn title={text.t("footer.predictionsTitle")}>
            <li>
              <Link href="/" className="hover:text-brand">{text.t("footer.today")}</Link>
            </li>
            <li>
              <Link href="/predictions" className="hover:text-brand">{text.t("footer.tomorrow")}</Link>
            </li>
            {FOOTER_MARKETS.map((slug) => {
              const page = markets.bySlug(slug);
              return page ? (
                <li key={slug}>
                  <Link href={`/tips/${slug}`} className="hover:text-brand">
                    {page.tabLabel}
                  </Link>
                </li>
              ) : null;
            })}
            {footerPages.map((page) => (
              <li key={page.id}>
                <Link href={`/tips/${page.slug}`} className="hover:text-brand">
                  {page.footer_label || page.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tips" className="font-medium text-zinc-300 hover:text-brand">{text.t("footer.allMarkets")}</Link>
            </li>
          </FooterColumn>

          <FooterColumn title={text.t("footer.competitionsTitle")}>
            {competitions.slice(0, 9).map((comp) => (
              <li key={comp.id}>
                <Link href={`/competitions/${comp.slug}`} className="hover:text-brand">
                  {comp.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/competitions" className="font-medium text-zinc-300 hover:text-brand">{text.t("footer.allCompetitions")}</Link>
            </li>
          </FooterColumn>

          <FooterColumn title={text.t("footer.siteTitle")}>
            {TRUST_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {text.t(link.label)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="hover:text-brand">{text.t("footer.blog")}</Link>
            </li>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {config.contact_email ? (
            <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 hover:text-brand">
              <Mail aria-hidden className="size-4" />
              {config.contact_email}
            </a>
          ) : (
            <span />
          )}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {text.t(link.label)}
                </Link>
              </li>
            ))}
            {/* User accounts are turned off; admins sign in at /login directly.
            <li>
              <Link href="/login" rel="nofollow" className="hover:text-brand">
                Account
              </Link>
            </li>
            */}
          </ul>
          <p className="text-zinc-500">{text.t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
