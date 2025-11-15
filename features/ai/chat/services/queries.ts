import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { ArtifactKind } from "@/features/ai/chat/components/artifact";
type VisibilityType = "private" | "public";
import { ChatSDKError } from "../types/error.types";
import type { AppUsage } from "../types/usage.types";
import { generateUUID } from "../utils";
import { TABLES } from "../types";
import type { Chat, DBMessage, Stream, Suggestion, User, Document } from "../types";

// Supabase Service Role client (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Normalize DB rows (snake_case) to app-facing camelCase fields
function mapChatRow(row: any) {
  if (!row) return row;
  return {
    ...row,
    userId: row.user_id,
    lastContext: row.last_context,
  } as Chat & { userId: string; lastContext?: unknown };
}

function mapMessageRow(row: any) {
  if (!row) return row;
  return {
    ...row,
    chatId: row.session_id,
    createdAt: row.created_at,
  } as DBMessage & { chatId: string; createdAt: string };
}

export async function getUser(email: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.users)
      .select("*")
      .eq("email", email);
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function getUserSubscriptionType(userId: string): Promise<"FREE" | "PLUS" | "UNLIMITED" | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.users)
      .select("subscription_type")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Error fetching user subscription type:", error);
      throw error;
    }
    return data?.subscription_type || "FREE";
  } catch (_error) {
    console.error("getUserSubscriptionType failed:", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user subscription type"
    );
  }
}

export async function createUser(email: string, name?: string) {
  try {
    const { error } = await supabase.from(TABLES.users).insert({
      email,
      name: name || email.split("@")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true } as unknown as void;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}@guest.local`;
  const name = `Guest ${Date.now()}`;

  try {
    const { data, error } = await supabase
      .from(TABLES.users)
      .insert({
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id,email")
      .single();
    if (error) throw error;
    return data ? [{ id: data.id, email: data.email }] : [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

/**
 * Ensures a user profile exists in the database
 * If not, creates a basic profile for the user
 */
export async function ensureUserProfile(userId: string, email?: string | null) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: selectError } = await supabase
      .from(TABLES.users)
      .select("id")
      .eq("id", userId)
      .single();

    if (!selectError && existingProfile) {
      // Profile exists, we're good
      return { success: true, existed: true };
    }

    // Profile doesn't exist (PGRST116 error), create it
    if (selectError?.code === "PGRST116") {
      console.log("📝 Creating user profile for:", userId);
      const { error: insertError } = await supabase
        .from(TABLES.users)
        .insert({
          id: userId,
          email: email || null,
          name: email?.split("@")[0] || "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subscription_type: "FREE",
        });

      if (insertError) {
        // Check if it's a duplicate key error (race condition - profile was created by another request)
        if (insertError.code === "23505") {
          console.log("✅ Profile already exists (race condition)");
          return { success: true, existed: true };
        }
        console.error("❌ Failed to create user profile:", insertError);
        throw insertError;
      }

      console.log("✅ User profile created successfully");
      return { success: true, existed: false };
    }

    // Some other error occurred
    throw selectError;
  } catch (_error) {
    console.error("❌ ensureUserProfile failed:", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to ensure user profile exists"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    console.log("💾 saveChat: Starting to save chat:", { id, userId, title });
    
    const { data, error } = await supabase.from(TABLES.chats).insert({
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId,
      title,
      visibility,
      is_active: true,
      chat_type: "chat",
    })
    .select()
    .single();
    
    if (error) {
      console.error("❌ saveChat: Insert failed:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    
    console.log("✅ saveChat: Chat saved successfully:", id);
    return mapChatRow(data);
  } catch (_error) {
    console.error("❌ saveChat: Exception occurred:", _error);
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
   try {
     console.log("🗑️ deleteChatById: Starting deletion for chat:", id);

     // Delete related records first
     console.log("🗑️ deleteChatById: Deleting votes for chat:", id);
     await supabase.from(TABLES.votes).delete().eq("chat_id", id);

     console.log("🗑️ deleteChatById: Deleting messages for chat:", id);
     await supabase.from(TABLES.messages).delete().eq("session_id", id);

     console.log("🗑️ deleteChatById: Deleting streams for chat:", id);
     await supabase.from(TABLES.streams).delete().eq("chat_id", id);

     // Finally delete the chat itself
     console.log("🗑️ deleteChatById: Deleting chat record:", id);
     const { data, error } = await supabase
       .from(TABLES.chats)
       .delete()
       .eq("id", id)
       .select("*")
       .single();

     if (error) {
       console.error("❌ deleteChatById: Failed to delete chat:", error);
       throw error;
     }

     console.log("✅ deleteChatById: Chat deleted successfully:", { id, title: data?.title });
     return data;
   } catch (_error) {
     console.error("❌ deleteChatById: Exception occurred:", _error);
     throw new ChatSDKError(
       "bad_request:database",
       "Failed to delete chat by id"
     );
   }
 }

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;
    let query = supabase
      .from(TABLES.chats)
      .select("*")
      .eq("user_id", id)
      .eq("is_active", true)
      .eq("chat_type", "chat")
      .order("created_at", { ascending: false })
        .limit(extendedLimit);

    if (startingAfter) {
      const { data: selectedChat } = await supabase
        .from(TABLES.chats)
        .select("created_at")
        .eq("id", startingAfter)
        .single();
      if (selectedChat?.created_at) {
        // fetch items newer than selected
        query = query.gt("created_at", selectedChat.created_at);
      }
    } else if (endingBefore) {
      const { data: selectedChat } = await supabase
        .from(TABLES.chats)
        .select("created_at")
        .eq("id", endingBefore)
        .single();
      if (selectedChat?.created_at) {
        // fetch items older than selected
        query = query.lt("created_at", selectedChat.created_at);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = (data?.length ?? 0) > limit;
    const raw = hasMore ? (data ?? []).slice(0, limit) : data ?? [];
    
    // Sort by updated_at (or created_at if updated_at is null) on server side
    const sortedRaw = raw.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    const chats = sortedRaw.map(mapChatRow);

    return { chats, hasMore };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
   try {
     console.log("🔍 getChatById: Fetching chat with id:", id);

     const { data, error } = await supabase
       .from(TABLES.chats)
       .select("*")
       .eq("id", id)
       .eq("is_active", true) // FIX 4: Filter out soft-deleted chats
       .single();

     if (error) {
       if (error.code === "PGRST116") {
         console.log("❌ getChatById: Chat not found or deleted (PGRST116):", id);
         return null;
       } else {
         console.error("❌ getChatById: Database error:", error);
         throw error;
       }
     }

     if (data) {
       console.log("✅ getChatById: Chat found:", { id, title: data.title, is_active: data.is_active });
       return mapChatRow(data);
     } else {
       console.log("❌ getChatById: No data returned for chat:", id);
       return null;
     }
   } catch (_error) {
     console.error("❌ getChatById: Exception occurred:", _error);
     throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
   }
 }

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
   try {
     // Validate message data before inserting
     const validatedMessages = messages.map(msg => ({
       id: msg.id,
       session_id: msg.session_id,
       role: msg.role,
       content: msg.content || '',
       parts: msg.parts || [],
       attachments: msg.attachments || [],
       metadata: msg.metadata || {},
       message_order: msg.message_order || 0,
       created_at: msg.created_at || new Date().toISOString(),
     }));

     console.log("💾 saveMessages: Attempting to save messages:", {
       count: validatedMessages.length,
       roles: validatedMessages.map(m => m.role),
       firstMessage: validatedMessages[0] ? {
         id: validatedMessages[0].id,
         role: validatedMessages[0].role,
         contentLength: validatedMessages[0].content?.length,
         partsType: typeof validatedMessages[0].parts,
         partsLength: Array.isArray(validatedMessages[0].parts) ? validatedMessages[0].parts.length : 'not-array'
       } : null
     });

     const { data, error } = await supabase
       .from(TABLES.messages)
       .insert(validatedMessages)
       .select();

     if (error) {
       console.error("❌ Error inserting messages:", {
         error,
         code: error.code,
         message: error.message,
         details: error.details,
         hint: error.hint,
         validatedMessages
       });
       throw error;
     }

     console.log("✅ Messages saved successfully:", {
       count: data?.length,
       ids: data?.map(m => m.id)
     });

     // Update chat's updated_at to move it to the top of the list
     if (validatedMessages.length > 0 && validatedMessages[0].session_id) {
       const { error: updateError } = await supabase
         .from(TABLES.chats)
         .update({ updated_at: new Date().toISOString() })
         .eq('id', validatedMessages[0].session_id);
       
       if (updateError) {
         console.warn("⚠️ Failed to update chat updated_at:", updateError);
       }
     }

     return { success: true } as unknown as void;
   } catch (_error) {
     console.error("❌ saveMessages failed:", _error);
     throw new ChatSDKError("bad_request:database", "Failed to save messages");
   }
 }

export async function getMessagesByChatId({ id }: { id: string }) {
   try {
     const { data, error } = await supabase
       .from(TABLES.messages)
       .select("*")
       .eq("session_id", id)
       .order("message_order", { ascending: true });

     if (error) throw error;

     return (data ?? []).map(mapMessageRow);
   } catch (_error) {
     throw new ChatSDKError(
       "bad_request:database",
       "Failed to get messages by chat id"
     );
   }
 }

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    console.log("voteMessage called with:", { chatId, messageId, type });
    
    const { data: existing, error: selectError } = await supabase
      .from(TABLES.votes)
      .select("*")
      .eq("message_id", messageId)
      .eq("chat_id", chatId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking existing vote:", selectError);
      throw selectError;
    }

    if (existing) {
      console.log("Updating existing vote");
      const { error } = await supabase
        .from(TABLES.votes)
        .update({ is_upvoted: type === "up" })
        .eq("message_id", messageId)
        .eq("chat_id", chatId);
      if (error) {
        console.error("Error updating vote:", error);
        throw error;
      }
      return { success: true } as unknown as void;
    }
    
    console.log("Creating new vote");
    const { error } = await supabase.from(TABLES.votes).insert({
      chat_id: chatId,
      message_id: messageId,
      is_upvoted: type === "up",
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Error inserting vote:", error);
      throw error;
    }
    return { success: true } as unknown as void;
  } catch (_error) {
    console.error("voteMessage failed:", _error);
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(TABLES.votes)
      .select("*")
      .eq("chat_id", id);
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const { data, error } = await supabase
      .from(TABLES.documents)
      .insert({
        id,
        title,
        kind,
        content,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select("*");
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(TABLES.documents)
      .select("*")
      .eq("id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(TABLES.documents)
      .select("*")
      .eq("id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await supabase
      .from(TABLES.suggestions)
      .delete()
      .eq("document_id", id)
      .gt("document_created_at", timestamp.toISOString());

    const { data, error } = await supabase
      .from(TABLES.documents)
      .delete()
      .eq("id", id)
      .gt("created_at", timestamp.toISOString())
      .select("*");
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    const { error } = await supabase
      .from(TABLES.suggestions)
      .insert(suggestions as unknown as Suggestion[]);
    if (error) throw error;
    return { success: true } as unknown as void;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const { data, error } = await supabase
      .from(TABLES.suggestions)
      .select("*")
      .eq("document_id", documentId);
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from(TABLES.messages)
      .select("*")
      .eq("id", id);
    if (error) throw error;
    return data ?? [];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const { data: messages, error: selectError } = await supabase
      .from(TABLES.messages)
      .select("id")
      .eq("session_id", chatId)
      .gte("created_at", timestamp.toISOString());
    if (selectError) throw selectError;

    const messageIds = (messages ?? []).map((m) => m.id);
    if (messageIds.length > 0) {
      await supabase
        .from(TABLES.votes)
        .delete()
        .eq("chat_id", chatId)
        .in("message_id", messageIds);

      const { error } = await supabase
        .from(TABLES.messages)
        .delete()
        .eq("session_id", chatId)
        .in("id", messageIds);
      if (error) throw error;
      return { success: true } as unknown as void;
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    const { error } = await supabase
      .from(TABLES.chats)
      .update({ visibility, updated_at: new Date().toISOString() })
      .eq("id", chatId);
    if (error) throw error;
    return { success: true } as unknown as void;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    const { error } = await supabase
      .from(TABLES.chats)
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", chatId);
    if (error) throw error;
    return { success: true } as unknown as void;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat title by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    const { error } = await supabase
      .from(TABLES.chats)
      .update({
        last_context: context as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId);
    if (error) throw error;
    return { success: true } as unknown as void;
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const since = new Date(Date.now() - differenceInHours * 60 * 60 * 1000)
      .toISOString();

    const { data: chats } = await supabase
      .from(TABLES.chats)
      .select("id")
      .eq("user_id", id);
    const chatIds = (chats ?? []).map((c) => c.id);
    if (chatIds.length === 0) return 0;
    const { count } = await supabase
      .from(TABLES.messages)
      .select("id", { count: "exact", head: true })
      .in("session_id", chatIds)
      .eq("role", "user")
      .gte("created_at", since);
    return count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const { error } = await supabase.from(TABLES.streams).insert({
      id: streamId,
      chat_id: chatId,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const { data, error } = await supabase
      .from(TABLES.streams)
      .select("id")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
