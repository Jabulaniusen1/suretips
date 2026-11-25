"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  // CheckCheck, // Results nav item hidden
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link2,
  // ListChecks, // Predictions nav item hidden
  LogOut,
  // MessageCircle, // Chat nav item disabled (user accounts are turned off)
  Newspaper,
  Settings,
  Shield,
  // Users, // Users nav item hidden
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/site/logo";

type BadgeKey = "results" | "chat";

const NAV: Array<{ href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; badgeKey?: BadgeKey }> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  // Hidden: predictions are added by the automatic sync, and results are
  // graded and approved automatically by the score-update cron. The pages
  // still work if you open them directly.
  // { href: "/admin/predictions", label: "Predictions", icon: ListChecks },
  // { href: "/admin/results", label: "Results", icon: CheckCheck, badgeKey: "results" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/pages", label: "SEO Pages", icon: FileText },
  { href: "/admin/competitions", label: "Competitions", icon: Shield },
  { href: "/admin/ad-links", label: "Ad Links", icon: Link2 },
  // Hidden: user accounts are turned off. /admin/users still works directly
  // (e.g. to promote a new admin).
  // { href: "/admin/users", label: "Users", icon: Users },
  // Support chat needs user accounts, which are turned off (see app/admin/_chat).
  // { href: "/admin/chat", label: "Chat", icon: MessageCircle, badgeKey: "chat" },
  { href: "/admin/config", label: "Config", icon: Settings },
];

function isActive(pathname: string, item: (typeof NAV)[number]) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminSidebar({ badges }: { badges: Record<BadgeKey, number> }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrolling nav */}
      <nav aria-label="Admin" className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar px-2 py-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium",
              isActive(pathname, item) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80"
            )}
          >
            {item.label}
            {item.badgeKey && badges[item.badgeKey] > 0 ? ` (${badges[item.badgeKey]})` : ""}
          </Link>
        ))}
      </nav>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-20 items-center gap-2 px-5">
          <Logo dark href="/admin" imgClassName="h-9 w-auto" />
          <span className="text-sm font-bold uppercase tracking-wide text-brand">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1.5 overflow-y-auto px-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon aria-hidden className="size-5" />
                  {item.label}
                </span>
                {badge > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1.5 border-t border-sidebar-border p-3">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <ExternalLink aria-hidden className="size-5" /> View site
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent">
              <LogOut aria-hidden className="size-5" /> Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
