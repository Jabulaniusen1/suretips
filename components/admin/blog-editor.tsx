"use client";

import { useEditor, EditorContent } from "@tiptap/react";
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
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Toggle pressed={active} onPressedChange={onClick} size="sm">
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

  if (!editor) return null;

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/blog/upload-image", { method: "POST", body: formData });
    const json = await res.json();
    if (json.url) editor!.chain().focus().setImage({ src: json.url }).run();
    else toast.error(json.error ?? "Upload failed");
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
          <AlignRight className="size-4" />
        </ToolbarButton>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="size-4" />
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
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
