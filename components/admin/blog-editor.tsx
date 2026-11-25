"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Bold, Italic, Heading2, List, ListOrdered, LinkIcon, ImageIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  /** Icon-only button: the label is its accessible name and tooltip. */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      pressed={active}
      onPressedChange={onClick}
      // Keep focus (and the visible selection) in the editor while clicking.
      onMouseDown={(e) => e.preventDefault()}
      size="sm"
      aria-label={label}
      title={label}
    >
      {children}
    </Toggle>
  );
}

export function BlogEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false }), TextAlign.configure({ types: ["heading", "paragraph"] }), TextStyle],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none min-h-[300px] focus:outline-none p-4" },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Tiptap v3 doesn't re-render on selection changes, so without this the
  // toolbar kept showing the formatting of wherever the last edit happened
  // (e.g. H2 still "on" after moving to a normal paragraph, so clicking it
  // to "turn it off" turned that paragraph into a heading).
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      heading: editor?.isActive("heading", { level: 2 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      alignLeft: editor?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: editor?.isActive({ textAlign: "center" }) ?? false,
      alignRight: editor?.isActive({ textAlign: "right" }) ?? false,
    }),
  });

  if (!editor) return null;

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/blog/upload-image", { method: "POST", body: formData });
      const json = await res.json().catch(() => ({ error: res.status === 413 ? "Image is too large (max 4 MB)." : `Upload failed (${res.status})` }));
      if (json.url) editor!.chain().focus().setImage({ src: json.url }).run();
      else toast.error(json.error ?? "Upload failed");
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    }
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={active?.bold}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={active?.italic}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={active?.heading}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={active?.bulletList}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={active?.orderedList}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={active?.alignLeft}>
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Align centre" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={active?.alignCenter}>
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={active?.alignRight}>
          <AlignRight className="size-4" />
        </ToolbarButton>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Add link"
          title="Add link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="size-4" />
        </Button>
        <label className="cursor-pointer" title="Upload image">
          <input
            type="file"
            accept="image/*"
            aria-label="Upload image"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <span className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent">
            <ImageIcon className="size-4" />
          </span>
        </label>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
