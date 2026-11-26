import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSiteText } from "@/lib/content/site-text";
import { InlineContent } from "@/components/content/plain-content";

// Text is edited in Admin > Site Content > Responsible betting notice.
export async function ResponsibleNotice({ className }: { className?: string }) {
  const text = await getSiteText();
  return (
    <aside className={cn("flex gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground", className)}>
      <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
      <p>
        <InlineContent text={text.t("notice.text")} />
      </p>
    </aside>
  );
}
