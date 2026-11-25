"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t load this page — usually because a data provider is briefly unavailable. Please try again in a moment.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Today&apos;s predictions
        </Button>
      </div>
    </div>
  );
}
