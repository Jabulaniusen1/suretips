import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "@/components/site/social-icons";
import { getSiteConfig } from "@/lib/data/site-config";
import { getFooterCustomPages } from "@/lib/data/custom-pages";
import { getVipPlans } from "@/lib/data/plans";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/refund-policy", label: "Refund Policy" },
];

function SocialButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-brand/40 hover:bg-brand/15 hover:text-brand"
    >
      {children}
    </a>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden />
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">{children}</ul>
    </div>
  );
}

export async function SiteFooter() {
  const [config, predictionLinks, vipPlans] = await Promise.all([
    getSiteConfig(),
    getFooterCustomPages(),
    getVipPlans(),
  ]);

  return (
    <footer className="relative border-t border-border bg-ink text-ink-foreground">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-gold to-brand" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <span className="inline-flex items-center rounded-xl bg-white px-2 py-1 shadow-sm">
            <Logo dark imgClassName="h-9 w-auto" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            No hype, just a record you can check. Kingpredicts publishes every prediction and every
            result, win or lose.
          </p>
          <div className="mt-6 flex items-center gap-2.5">
            {config.social_links.facebook && (
              <SocialButton href={config.social_links.facebook} label="Facebook">
                <FacebookIcon className="size-4" />
              </SocialButton>
            )}
            {config.social_links.twitter && (
              <SocialButton href={config.social_links.twitter} label="Twitter">
                <XIcon className="size-4" />
              </SocialButton>
            )}
            {config.social_links.instagram && (
              <SocialButton href={config.social_links.instagram} label="Instagram">
                <InstagramIcon className="size-4" />
              </SocialButton>
            )}
            {config.social_links.youtube && (
              <SocialButton href={config.social_links.youtube} label="YouTube">
                <YoutubeIcon className="size-4" />
              </SocialButton>
            )}
            <SocialButton href={config.telegram_url} label="Telegram">
              <Send className="size-4" />
            </SocialButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          <FooterColumn title="Quick Links">
            <li><Link href="/about" className="transition-colors hover:text-brand">About Us</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-brand">Contact Admin</Link></li>
            <li><Link href="/blog" className="transition-colors hover:text-brand">Blog</Link></li>
            <li><Link href="/faq" className="transition-colors hover:text-brand">FAQ</Link></li>
          </FooterColumn>

          <FooterColumn title="Predictions">
            {predictionLinks.map((page) => (
              <li key={page.id}>
                <Link href={`/tips/${page.slug}`} className="transition-colors hover:text-brand">
                  {page.footer_label ?? page.title}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="VIP Packages">
            {vipPlans.map((plan) => (
              <li key={plan.id}>
                <Link href={`/pricing?plan=${plan.slug}`} className="transition-colors hover:text-brand">
                  {plan.name}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Mail className="size-4" />
            <a href={`mailto:${config.contact_email}`} className="hover:text-brand">
              {config.contact_email}
            </a>
          </div>
          <ul className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-zinc-400">
            {LEGAL_LINKS.map((link, i) => (
              <li key={link.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-600" aria-hidden>·</span>}
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Kingpredicts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
