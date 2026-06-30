"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2">
          <Input autoFocus placeholder={searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">No results found.</p>
          )}
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                value === option && "bg-accent"
              )}
            >
              <Check className={cn("size-4 shrink-0", value === option ? "opacity-100" : "opacity-0")} />
              {option}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
