import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getUserOrNull } from "@/shared/lib/supabase/auth";
import { Chat } from "@/features/ai/chat/components/core/chat";
import { ChatSidebarWrapper } from "@/features/ai/chat/components/sidebar/chat-sidebar-wrapper";
import { DataStreamHandler } from "@/features/ai/chat/components/core/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/features/ai/chat/core/models";
import { getChatById, getMessagesByChatId, ensureUserProfile } from "@/features/ai/chat/services/queries";
import { convertToUIMessages } from "@/features/ai/chat/utils";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const user = await getUserOrNull();

  // Ensure user profile exists in database
  if (user?.id) {
    try {
      await ensureUserProfile(user.id, user.email);
    } catch (error) {
      console.error("Failed to ensure user profile:", error);
    }
  }

  // Check if user has access to this private chat
  if (chat.visibility === "private" && user?.id !== (chat as any).userId) {
    return notFound();
  }

  const messagesFromDb = await getMessagesByChatId({ id });
  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
          initialLastContext={(chat as any).lastContext ?? undefined}
          initialMessages={uiMessages}
          isReadonly={user?.id !== (chat as any).userId}
        />
      </div>
      <ChatSidebarWrapper user={user ?? undefined} defaultOpen={true} />
      <DataStreamHandler />
    </div>
  );
}
