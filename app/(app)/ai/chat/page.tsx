import { cookies } from "next/headers";
import { Chat } from "@/features/ai/chat/components/core/chat";
import { ChatSidebarWrapper } from "@/features/ai/chat/components/sidebar/chat-sidebar-wrapper";
import { DataStreamHandler } from "@/features/ai/chat/components/core/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/features/ai/chat/core/models";
import { generateUUID } from "@/features/ai/chat/utils";
import { getUserOrNull } from "@/shared/lib/supabase/auth";

export default async function Page() {
  const user = await getUserOrNull();
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          isReadonly={false}
          key={id}
        />
      </div>
      <ChatSidebarWrapper user={user ?? undefined} defaultOpen={true} />
      <DataStreamHandler />
    </div>
  );
}