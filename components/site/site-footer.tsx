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

export async function SiteFooter() {
  const [config, predictionLinks, vipPlans] = await Promise.all([
    getSiteConfig(),
    getFooterCustomPages(),
    getVipPlans(),
  ]);

  return (
    <footer className="border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            Sureodds Predict gives you accurate, transparent football predictions backed by a verifiable
            track record — not hype.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {config.social_links.facebook && (
              <a href={config.social_links.facebook} aria-label="Facebook" className="text-zinc-400 hover:text-brand">
                <FacebookIcon className="size-5" />
              </a>
            )}
            {config.social_links.twitter && (
              <a href={config.social_links.twitter} aria-label="Twitter" className="text-zinc-400 hover:text-brand">
                <XIcon className="size-5" />
              </a>
            )}
            {config.social_links.instagram && (
              <a href={config.social_links.instagram} aria-label="Instagram" className="text-zinc-400 hover:text-brand">
                <InstagramIcon className="size-5" />
              </a>
            )}
            {config.social_links.youtube && (
              <a href={config.social_links.youtube} aria-label="YouTube" className="text-zinc-400 hover:text-brand">
                <YoutubeIcon className="size-5" />
              </a>
            )}
            <a href={config.telegram_url} aria-label="Telegram" className="text-zinc-400 hover:text-brand">
              <Send className="size-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li><Link href="/about" className="hover:text-brand">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Contact Admin</Link></li>
            <li><Link href="/blog" className="hover:text-brand">Blog</Link></li>
            <li><Link href="/faq" className="hover:text-brand">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Predictions</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {predictionLinks.map((page) => (
              <li key={page.id}>
                <Link href={`/tips/${page.slug}`} className="hover:text-brand">
                  {page.footer_label ?? page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">VIP Packages</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {vipPlans.map((plan) => (
              <li key={plan.id}>
                <Link href={`/subscriptions?plan=${plan.slug}`} className="hover:text-brand">
                  {plan.name}
                </Link>
              </li>
            ))}
          </ul>
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
          <ul className="flex flex-wrap gap-4 text-xs text-zinc-400">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Sureodds Predict. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
