import { getCachedSession } from '@/features/ai/chat/services/cached-queries';
import { createClient } from '@/shared/lib/supabase/server';
import { TABLES } from '@/features/ai/chat/types';

export async function GET(request: Request) {
  try {
    console.log('[History API] Starting history fetch request');

    const supabase = await createClient();
    const user = await getCachedSession();

    if (!user) {
      console.warn('[History API] Unauthorized - no user session found');
      return Response.json(
        { success: false, error: 'Unauthorized', data: [], count: 0 },
        { status: 401 }
      );
    }

    console.log('[History API] User authenticated:', user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chat_type');
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const cursorRaw = searchParams.get('cursor'); // For cursor-based pagination (timestamp)

    // Validate and normalize cursor timestamp
    let cursor: string | null = null;
    if (cursorRaw) {
      try {
        // Decode URL-encoded cursor
        const decodedCursor = decodeURIComponent(cursorRaw);
        // Parse and validate the timestamp
        const date = new Date(decodedCursor);
        if (!isNaN(date.getTime())) {
          // Convert to ISO string format (PostgreSQL compatible)
          cursor = date.toISOString();
        } else {
          console.warn('[History API] Invalid cursor format:', decodedCursor);
        }
      } catch (error) {
        console.warn('[History API] Error parsing cursor:', cursorRaw, error);
      }
    }

    console.log('[History API] Query params:', { chatType, includeInactive, limit, offset, cursor });

    // Build query with base filters
    // Note: Using 'any' type due to TypeScript's complex type inference with Supabase query builder
    // when conditionally chaining filters. This is a known limitation.
    // @ts-expect-error - Type instantiation is excessively deep (TypeScript limitation with Supabase generics)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from(TABLES.chats)
      .select()
      .eq('user_id', user.id!);

    // Apply chat_type filter if provided
    if (chatType) {
      query = query.eq('chat_type', chatType);
    }

    // Filter active chats unless include_inactive is true
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      // Cursor is a timestamp (ISO string), fetch chats older than this timestamp
      query = query.lt('updated_at', cursor);
    }

    // Apply ordering
    query = query
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Apply limit and offset
    query = query.range(offset, offset + limit - 1);

    const { data: chats, error } = await query;

    if (error) {
      console.error('[History API] Database error:', error);
      return Response.json(
        {
          success: false,
          error: error.message,
          data: [],
          count: 0,
          hasMore: false,
        },
        { status: 500 }
      );
    }

    const chatsArray = chats || [];
    const hasMore = chatsArray.length === limit; // If we got exactly the limit, there might be more
    
    // Get next cursor from the last chat, ensuring it's a valid ISO timestamp
    let nextCursor: string | null = null;
    if (chatsArray.length > 0) {
      const lastChat = chatsArray[chatsArray.length - 1];
      const timestamp = lastChat.updated_at || lastChat.created_at;
      if (timestamp) {
        try {
          // Ensure the timestamp is in ISO format
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            nextCursor = date.toISOString();
          }
        } catch (error) {
          console.warn('[History API] Error formatting nextCursor:', timestamp, error);
        }
      }
    }

    console.log(`[History API] Successfully fetched ${chatsArray.length} chats (hasMore: ${hasMore})`);

    return Response.json({
      success: true,
      data: chatsArray,
      count: chatsArray.length,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('[History API] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}