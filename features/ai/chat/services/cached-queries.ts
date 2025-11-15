import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { createClient } from '@/shared/lib/supabase/server';
import {
  getChatById,
  getUser,
  getChatsByUserId,
  getMessagesByChatId,
  getVotesByChatId,
  getDocumentById,
  getDocumentsById,
  getSuggestionsByDocumentId,
} from './queries';

const getSupabase = cache(() => createClient());

export const getCachedSession = async () => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    ['session'],
    {
      tags: [`session`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedUserById = async (id: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    [`user_by_id`, id.slice(2, 12)],
    {
      tags: [`user_by_id_${id.slice(2, 12)}`],

      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedUser = async (email: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getUser(email);
    },
    ['user', email],
    {
      tags: [`user_${email}`],
      revalidate: 3600, // Cache for 1 hour
    }
  )();
};

export const getCachedChatById = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getChatById({ id: chatId });
    },
    ['chat', chatId],
    {
      tags: [`chat_${chatId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedChatsByUserId = async (userId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getChatsByUserId({ id: userId, limit: 50, startingAfter: null, endingBefore: null });
    },
    ['chats', userId],
    {
      tags: [`user_${userId}_chats`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedMessagesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getMessagesByChatId({ id: chatId });
    },
    ['messages', chatId],
    {
      tags: [`chat_${chatId}_messages`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedVotesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getVotesByChatId({ id: chatId });
    },
    ['votes', chatId],
    {
      tags: [`chat_${chatId}_votes`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedDocumentById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getDocumentById({ id: documentId });
    },
    ['document', documentId],
    {
      tags: [`document_${documentId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedDocumentsById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getDocumentsById({ id: documentId });
    },
    ['documents', documentId],
    {
      tags: [`document_${documentId}_versions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getCachedSuggestionsByDocumentId = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return await getSuggestionsByDocumentId({
        documentId: documentId,
      });
    },
    ['suggestions', documentId],
    {
      tags: [`document_${documentId}_suggestions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

