import Link from "next/link";
import type { Metadata } from "next";
import { getAdminConversations, getConversation } from "@/lib/data/chat";
import { requireAdmin } from "@/lib/data/admin";
import { ChatThread } from "@/components/chat/chat-thread";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Chat" };

export default async function AdminChatPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { user: selectedUserId } = await searchParams;
  const admin = await requireAdmin();
  const conversations = await getAdminConversations();
  const activeUserId = selectedUserId ?? conversations[0]?.user_id;
  const messages = activeUserId ? await getConversation(activeUserId) : [];

  return (
    <div>
      <h1 className="text-xl font-bold">Chat</h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-1">
          {conversations.map((conv) => (
            <Link
              key={conv.user_id}
              href={`/admin/chat?user=${conv.user_id}`}
              className={cn(
                "flex items-center justify-between gap-2 border-b border-border p-3 text-sm hover:bg-accent",
                activeUserId === conv.user_id && "bg-accent"
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{conv.full_name ?? conv.email}</p>
                <p className="truncate text-xs text-muted-foreground">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && <Badge>{conv.unread_count}</Badge>}
            </Link>
          ))}
          {conversations.length === 0 && <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>}
        </div>
        <div className="lg:col-span-2">
          {activeUserId ? (
            <ChatThread conversationUserId={activeUserId} currentUserId={admin!.authId} initialMessages={messages} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a conversation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
