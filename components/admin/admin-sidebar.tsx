"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Crown,
  Wallet,
  Receipt,
  Users,
  Newspaper,
  Trophy,
  MessageCircle,
  Link2,
  FileText,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/predictions", label: "Predictions", icon: ListChecks },
  { href: "/admin/plans", label: "Plans", icon: Crown },
  { href: "/admin/payment-methods", label: "Payment Methods", icon: Wallet },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt, badgeKey: "transactions" as const },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/vip-wins", label: "VIP Wins", icon: Trophy },
  { href: "/admin/chat", label: "Chat", icon: MessageCircle, badgeKey: "chat" as const },
  { href: "/admin/ad-links", label: "Ad Links", icon: Link2 },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/competitions", label: "Competitions", icon: Shield },
  { href: "/admin/config", label: "Config", icon: Settings },
];

export function AdminSidebar({ badges }: { badges: { transactions: number; chat: number } }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-5 text-lg font-bold">
        Sureodds <span className="text-brand">Admin</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.label}
              </span>
              {badge > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} className="border-t border-sidebar-border p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> Logout
        </button>
      </form>
    </aside>
  );
}
