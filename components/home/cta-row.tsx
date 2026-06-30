import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/data/site-config";

export async function CtaRow() {
  const config = await getSiteConfig();

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row">
        <Button size="lg" className="w-full sm:w-auto" render={<Link href="/subscriptions" />}>
          Subscribe to VIP
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
          render={<a href={config.telegram_url} target="_blank" rel="noreferrer" />}
        >
          Join Telegram
        </Button>
      </div>
    </section>
  );
}
