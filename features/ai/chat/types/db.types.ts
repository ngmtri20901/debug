// TypeScript interfaces for Supabase tables 
// Keep in sync with Supabase public schema

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
  streak_days: number | null;
  coins: number | null;
  xp: number | null;
  level: number | null;
  subscription_type: "FREE" | "PLUS" | "UNLIMITED";
}

export interface Chat {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  updated_at: string | null;
  is_active: boolean | null;
  chat_type: "chat" | "voice";
  chat_subtype: string | null;
  visibility: "public" | "private";
  last_context: Record<string, unknown> | null;
}

export interface DBMessage {
  id: string;
  session_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  parts: unknown[];
  attachments: unknown[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  message_order: number;
}

export interface Vote {
  chat_id: string;
  message_id: string;
  is_upvoted: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  created_at: string;
  title: string;
  content: string | null;
  kind: "text" | "sheet";
  user_id: string;
}

export interface Suggestion {
  id: string;
  document_id: string;
  document_created_at: string;
  original_text: string;
  suggested_text: string;
  description: string | null;
  is_resolved: boolean;
  user_id: string;
  created_at: string;
}

export interface Stream {
  id: string;
  chat_id: string;
  created_at: string;
}

// Table name constants for convenience
export const TABLES = {
  users: "user_profiles",
  chats: "chat_sessions", 
  messages: "chat_messages",
  votes: "message_votes",
  documents: "chat_documents",
  suggestions: "chat_suggestions",
  streams: "chat_streams",
} as const;
