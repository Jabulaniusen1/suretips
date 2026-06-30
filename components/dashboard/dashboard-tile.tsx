import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function DashboardTile({
  href,
  title,
  description,
  icon: Icon,
  iconClassName,
  external,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", iconClassName)}>
        <Icon className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </>
  );

  const className = "flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
