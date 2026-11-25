"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/lib/actions/client";
import type { Tables } from "@/types/database";

export function ChatThread({
  conversationUserId,
  currentUserId,
  initialMessages,
}: {
  conversationUserId: string;
  currentUserId: string;
  initialMessages: Tables<"messages">[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const addMessage = (message: Tables<"messages">) =>
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));

  useEffect(() => {
    markConversationRead(conversationUserId);
  }, [conversationUserId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${conversationUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${conversationUserId}` },
        (payload) => addMessage(payload.new as Tables<"messages">)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      // Shown straight away; the realtime echo of the same row is de-duplicated.
      addMessage(await sendMessage(conversationUserId, draft.trim()));
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-xs rounded-2xl px-4 py-2 text-sm",
                  isMine ? "bg-brand text-brand-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
        />
        <Button size="icon" onClick={handleSend} disabled={sending}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
