import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data/current-user";
import { getConversation } from "@/lib/data/chat";
import { ChatThread } from "@/components/chat/chat-thread";

export const metadata: Metadata = { title: "Contact Admin" };

export default async function DashboardChatPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const messages = await getConversation(user.authId);

  return (
    <div>
      <h1 className="text-xl font-bold">Contact Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Get support directly from the Sure Match Tips team.</p>
      <div className="mt-4">
        <ChatThread conversationUserId={user.authId} currentUserId={user.authId} initialMessages={messages} />
      </div>
    </div>
  );
}
