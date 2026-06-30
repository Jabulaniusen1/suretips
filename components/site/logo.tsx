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
    <Link href="/" className={cn("flex items-center", className)} aria-label="Sureodds Predict">
      {/* The logo file bakes in black wordmark text, so it needs a light
          backing plate to stay legible on dark sections (e.g. the footer). */}
      <span className={cn("flex items-center rounded-md", dark && "bg-white px-2 py-1")}>
        <Image src="/logo-mark.png" alt="Sureodds Predict" width={677} height={365} className={imgClassName} priority />
      </span>
    </Link>
  );
}
