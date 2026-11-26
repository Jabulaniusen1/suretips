"use client";

import { useRef, useState, type ComponentProps } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PredictionList } from "@/components/predictions/prediction-list";

type Props = Omit<ComponentProps<typeof PredictionList>, "totalCount"> & {
  /** Predictions shown at first and added per "See more" click. */
  pageSize?: number;
  /** Button labels (Admin > Site Content > Market cards & tables). "{count}" in moreCount is the number hidden. */
  labels?: { seeMore: string; seeLess: string; moreCount: string };
};

const DEFAULT_LABELS = { seeMore: "See more", seeLess: "See less", moreCount: "({count} more)" };

/**
 * A PredictionList that starts with the first `pageSize` predictions. "See more"
 * reveals the next batch; "See less" collapses back and returns to the top of
 * the list.
 */
export function ExpandablePredictionList({ predictions, pageSize = 20, labels = DEFAULT_LABELS, ...listProps }: Props) {
  const [visible, setVisible] = useState(pageSize);
  const topRef = useRef<HTMLDivElement>(null);

  const shown = predictions.slice(0, visible);
  const remaining = predictions.length - shown.length;
  const canCollapse = shown.length > pageSize;

  function seeLess() {
    setVisible(pageSize);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <PredictionList {...listProps} predictions={shown} totalCount={predictions.length} />
      {(remaining > 0 || canCollapse) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {remaining > 0 && (
            <Button variant="outline" onClick={() => setVisible((v) => Math.min(v + pageSize, predictions.length))}>
              <ChevronDown aria-hidden className="size-4" />
              {labels.seeMore}
              {labels.moreCount && <span className="text-muted-foreground">{labels.moreCount.replace("{count}", String(remaining))}</span>}
            </Button>
          )}
          {canCollapse && (
            <Button variant="ghost" onClick={seeLess}>
              <ChevronUp aria-hidden className="size-4" />
              {labels.seeLess}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
