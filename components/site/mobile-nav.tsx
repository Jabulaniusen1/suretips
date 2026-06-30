"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import type { Tables } from "@/types/database";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/previous-results", label: "Previous Results" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ isLoggedIn, adLinks = [] }: { isLoggedIn: boolean; adLinks?: Tables<"ad_links">[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
          {adLinks.length > 0 && (
            <>
              <div className="my-2 h-px bg-border" aria-hidden />
              {adLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-brand hover:bg-accent"
                >
                  {link.title}
                </a>
              ))}
            </>
          )}
        </nav>
        <div className="mt-4 flex flex-col gap-2 px-4">
          {isLoggedIn ? (
            <Button onClick={() => setOpen(false)} render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                Login
              </Button>
              <Button onClick={() => setOpen(false)} render={<Link href="/signup" />}>
                Subscribe to VIP
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
