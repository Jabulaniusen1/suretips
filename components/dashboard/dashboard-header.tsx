import Link from "next/link";
import { Bell, Headset, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/actions/auth";
import { getCurrentUser, getUnreadCounts } from "@/lib/data/current-user";

export async function DashboardHeader() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { notifications, messages } = await getUnreadCounts(user.authId);
  const initials = (user.profile.full_name ?? user.email).slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Welcome, {user.profile.full_name ?? "there"} · {user.profile.country}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Contact admin"
            render={<Link href="/dashboard/chat" />}
          >
            <Headset className="size-5" />
            {messages > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                {messages}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            render={<Link href="/dashboard/notifications" />}
          >
            <Bell className="size-5" />
            {notifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                {notifications}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />
              }
            >
              <Avatar className="size-8">
                <AvatarImage src={user.profile.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                <Settings className="size-4" /> Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/terms" />}>Terms of Use</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut className="size-4" /> Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
