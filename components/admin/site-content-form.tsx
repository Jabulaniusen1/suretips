"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSiteContent } from "@/lib/actions/client";

export interface SiteContentFieldProps {
  key: string;
  label: string;
  kind: "line" | "text";
  help: string | null;
  vars: string[];
  optional: boolean;
  defaultValue: string;
  /** Current text (the edit, or the default). */
  value: string;
}

function rowsFor(value: string) {
  const lines = value.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 95)), 0);
  return Math.min(28, Math.max(3, lines + 1));
}

export function SiteContentForm({ groupId, fields }: { groupId: string; fields: SiteContentFieldProps[] }) {
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, f.value])), [fields]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  const dirty = fields.some((f) => values[f.key] !== initial[f.key]);
  const hasTextFields = fields.some((f) => f.kind === "text");
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const { changed } = await saveSiteContent(groupId, values);
      toast.success(changed > 0 ? "Saved — the site is updated." : "No changes to save.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Formatting:</strong> **bold** and [link text](/page) work in every field
        {hasTextFields && <>; in larger boxes, start a line with &quot;## &quot; for a heading or &quot;- &quot; for a bullet point, and leave a blank line between paragraphs</>}.
        Words in {"{curly brackets}"} are filled in automatically — keep them as they are.
      </div>

      {fields.map((field) => {
        const value = values[field.key] ?? "";
        const edited = value.trim() !== field.defaultValue.trim();
        const id = `sc-${field.key.replace(/[^a-z0-9]+/gi, "-")}`;
        return (
          <div key={field.key} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={id} className="flex items-center gap-2">
                {field.label}
                {edited && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">Edited</span>}
                {field.optional && value.trim() === "" && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Hidden</span>
                )}
              </Label>
              {edited && (
                <button
                  type="button"
                  onClick={() => set(field.key, field.defaultValue)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw aria-hidden className="size-3" /> Reset to default
                </button>
              )}
            </div>
            {field.kind === "text" ? (
              <Textarea id={id} className="mt-2 font-[inherit] text-sm leading-relaxed" rows={rowsFor(value)} value={value} onChange={(e) => set(field.key, e.target.value)} />
            ) : (
              <Input id={id} className="mt-2" value={value} onChange={(e) => set(field.key, e.target.value)} />
            )}
            {(field.help || field.vars.length > 0 || field.optional) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {field.help}
                {field.vars.length > 0 && <> Fills in: {field.vars.map((v) => `{${v}}`).join(", ")}.</>}
                {field.optional && <> Leave empty to hide it.</>}
              </p>
            )}
          </div>
        );
      })}

      <div className="sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {dirty ? <span className="text-sm text-muted-foreground">Unsaved changes</span> : <span className="text-sm text-muted-foreground">All changes saved</span>}
      </div>
    </div>
  );
}
