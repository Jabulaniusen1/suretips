import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Artwork is 1000x506 (public/logo-on-*.png). These are the largest size we
// display (h-20), so next/image's 1x/2x srcset stays sharp without sending
// the full-size file to the header.
const LOGO_WIDTH = 160;
const LOGO_HEIGHT = 81;

export function Logo({
  className,
  imgClassName = "h-12 w-auto",
  dark,
  href = "/",
}: {
  className?: string;
  imgClassName?: string;
  /** Always use the white wordmark, for surfaces that stay dark in both themes. */
  dark?: boolean;
  /** Where the logo links to. It renders its own link, so never wrap it in another one. */
  href?: string;
}) {
  const logo = (src: string, extraClassName?: string) => (
    <Image
      src={src}
      alt="SureMatchContact"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn(imgClassName, extraClassName)}
      priority
    />
  );

  return (
    <Link href={href} className={cn("flex items-center", className)} aria-label={href === "/" ? "SureMatchContact home" : "SureMatchContact"}>
      {/* Navy wordmark on light backgrounds, white wordmark in dark mode and on dark surfaces. */}
      {dark ? (
        logo("/logo-on-dark.png")
      ) : (
        <>
          {logo("/logo-on-light.png", "dark:hidden")}
          {logo("/logo-on-dark.png", "hidden dark:block")}
        </>
      )}
    </Link>
  );
}
