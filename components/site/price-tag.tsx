import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  compareAtPrice,
  currency,
  size = "lg",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const hasDiscount = compareAtPrice != null && compareAtPrice > price;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      {hasDiscount && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
          {formatPrice(compareAtPrice, currency)}
        </span>
      )}
      <span
        className={cn("font-extrabold", size === "lg" ? "text-2xl" : "text-lg", hasDiscount && "text-brand")}
      >
        {formatPrice(price, currency)}
      </span>
    </span>
  );
}
