import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {index > 0 && <ChevronRight aria-hidden className="size-3" />}
                {last ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="hover:text-brand">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  );
}
