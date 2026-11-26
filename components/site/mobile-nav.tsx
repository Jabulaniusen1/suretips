"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import type { Tables } from "@/types/database";

export function MobileNav({
  links,
  contactLabel,
  sponsoredLabel,
  adLinks = [],
}: {
  links: Array<{ href: string; label: string }>;
  contactLabel: string;
  sponsoredLabel: string;
  adLinks?: Tables<"ad_links">[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <ThemeToggle />
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {[...links, { href: "/contact", label: contactLabel }].map((link) => (
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
              <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground">{sponsoredLabel}</p>
              {adLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  {link.title}
                </a>
              ))}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
