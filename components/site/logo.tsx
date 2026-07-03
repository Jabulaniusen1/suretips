import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  imgClassName = "h-12 w-auto sm:h-14",
  dark,
}: {
  className?: string;
  imgClassName?: string;
  dark?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="Kingpredicts">
      {/* The logo file bakes in navy wordmark text, so it needs a light
          backing plate to stay legible on dark sections (e.g. the footer). */}
      <span className={cn("flex items-center rounded-md", dark && "bg-white px-2 py-1")}>
        <Image src="/logo-mark.svg" alt="Kingpredicts" width={900} height={220} className={imgClassName} priority />
      </span>
    </Link>
  );
}
