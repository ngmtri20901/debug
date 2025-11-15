'use client';

import { User } from '@supabase/supabase-js';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWRInfinite from 'swr/infinite';

// Exported types and helpers referenced by other chat modules
export type ChatHistory = {
  chats: Array<{
    id: string;
    visibility: 'private';
  }>;
};

// SWR Infinite pagination key generator for chat history
// Used with unstable_serialize(getChatHistoryPaginationKey)
export function getChatHistoryPaginationKey(pageIndex: number, previousPageData: any) {
  // If there is no more data to load, return null to stop fetching
  if (previousPageData && (previousPageData.nextCursor === null || previousPageData.hasMore === false)) {
    return null;
  }
  const cursor = previousPageData?.nextCursor ?? null;
  return ['/api/history', cursor, pageIndex];
}

import { MoreHorizontalIcon, TrashIcon } from '@/features/ai/chat/components/core/icons';
import { PencilLine, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { createClient } from '@/shared/lib/supabase/client';
import { Chat } from '@/features/ai/chat/types/db.types';
import { TABLES } from '@/features/ai/chat/types';
import { updateChatTitle, deleteChatSession } from '@/app/(app)/ai/chat/actions';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

type HistoryResponse = {
  success: boolean;
  data: Chat[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
};

const fetcher = async (url: string): Promise<HistoryResponse> => {
  try {
    console.log('🔍 [Sidebar Fetcher] Fetching chat history:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Sidebar Fetcher] API error:', response.status, errorData);

      if (response.status === 401) {
        console.warn('⚠️ [Sidebar Fetcher] Unauthorized - user may need to log in');
      }

      return {
        success: false,
        data: [],
        count: 0,
        hasMore: false,
        nextCursor: null,
      };
    }

    const result = await response.json();
    console.log('✅ [Sidebar Fetcher] Successfully fetched', result.data?.length || 0, 'chats');

    return result;
  } catch (error) {
    console.error('❌ [Sidebar Fetcher] Fetch error:', error);
    return {
      success: false,
      data: [],
      count: 0,
      hasMore: false,
      nextCursor: null,
    };
  }
};

const ChatItem = ({
  chat,
  isActive,
  onDelete,
  onRename,
  setOpenMobile,
  isEditing,
  editedTitle,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  isConfirmingDelete,
  onConfirmDelete,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  isEditing: boolean;
  editedTitle: string;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  isConfirmingDelete: boolean;
  onConfirmDelete: (chatId: string) => void;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDeleteClick = () => {
    if (isConfirmingDelete) {
      // Second click - confirm delete and close dropdown
      onConfirmDelete(chat.id);
      setDropdownOpen(false);
    } else {
      // First click - show confirmation state
      onDelete(chat.id);
      // Keep dropdown open so user can see "Confirm Delete" option
    }
  };

  return (
  <SidebarMenuItem>
    <SidebarMenuButton asChild={!isEditing} isActive={isActive}>
      {isEditing ? (
        <div className="flex items-center w-full px-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEditSubmit();
              } else if (e.key === 'Escape') {
                onEditCancel();
              }
            }}
            onBlur={onEditCancel}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm"
          />
        </div>
      ) : (
        <Link href={`/ai/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title || 'New Chat'}</span>
        </Link>
      )}
    </SidebarMenuButton>
    {!isEditing && (
      <DropdownMenu modal={true} open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onRename(chat.id)}
          >
            <PencilLine className="w-4 h-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={(e) => {
              // Prevent dropdown from closing on first click
              if (!isConfirmingDelete) {
                e.preventDefault();
              }
              handleDeleteClick();
            }}
          >
            {isConfirmingDelete ? (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Delete</span>
              </>
            ) : (
              <>
                <TrashIcon />
                <span>Delete</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </SidebarMenuItem>
  );
};

export function SidebarHistory({ user }: { user?: { id: string; email?: string | null } }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  // Initialize with passed user prop if available, converting to Supabase User format
  const [clientUser, setClientUser] = useState<User | null>(
    user ? ({ id: user.id, email: user.email } as User) : null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch user if not already provided from server
    if (!user) {
      const getUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 SidebarHistory - Client user:', user);
        setClientUser(user);
      };
      getUser();
    }
  }, [user]);

  const sidebarContentRef = useRef<HTMLDivElement>(null);

  const getKey = (pageIndex: number, previousPageData: HistoryResponse | null) => {
    if (!clientUser) return null;
    if (previousPageData && (!previousPageData.hasMore || !previousPageData.nextCursor)) {
      return null; // No more pages
    }
    if (pageIndex === 0) {
      return `/api/history?chat_type=chat&limit=15`;
    }
    // URL encode the cursor to handle special characters
    const cursor = previousPageData?.nextCursor ? encodeURIComponent(previousPageData.nextCursor) : '';
    return `/api/history?chat_type=chat&limit=15&cursor=${cursor}`;
  };

  const {
    data: pages,
    error,
    isLoading,
    size,
    setSize,
    mutate,
  } = useSWRInfinite<HistoryResponse>(getKey, fetcher, {
    revalidateFirstPage: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    onError: (err) => {
      console.error('❌ [SWR Infinite Error] Failed to fetch chat history:', err);
    },
  });

  // Flatten all pages into a single array
  const history = pages?.flatMap((page) => page.data || []) || [];
  const isLoadingMore = isLoading || (size > 0 && pages && typeof pages[size - 1] === 'undefined');
  const isEmpty = pages?.[0]?.data?.length === 0;
  const isReachingEnd = pages && (pages[pages.length - 1]?.hasMore === false || !pages[pages.length - 1]?.nextCursor);

  // Scroll detection for infinite scroll
  useEffect(() => {
    const sidebarContent = sidebarContentRef.current;
    if (!sidebarContent || isLoadingMore || isReachingEnd) return;

    // Find the scrollable parent (SidebarContent)
    let scrollContainer = sidebarContent.parentElement;
    while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto') && !scrollContainer.classList.contains('overflow-auto')) {
      scrollContainer = scrollContainer.parentElement;
    }
    
    // Fallback to sidebarContent itself if no scrollable parent found
    const targetElement = scrollContainer || sidebarContent;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = targetElement;
      // Load more when user scrolls to within 200px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        setSize((prevSize) => prevSize + 1);
      }
    };

    targetElement.addEventListener('scroll', handleScroll);
    return () => targetElement.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, isReachingEnd, setSize]);

  useEffect(() => {
    // Revalidate when pathname changes
    mutate();
  }, [pathname, mutate]);

  // Realtime subscription for new chats and title updates
  useEffect(() => {
    if (!clientUser?.id) return;

    const supabase = createClient();

    console.log('🔴 [Realtime] Setting up subscription for chat_sessions');

    const channel = supabase
      .channel('chat_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.chats,
          filter: `user_id=eq.${clientUser.id}`,
        },
        (payload) => {
          console.log('✅ [Realtime] New chat created:', payload.new);
          // Revalidate to fetch the new chat
          mutate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.chats,
          filter: `user_id=eq.${clientUser.id}`,
        },
        (payload) => {
          console.log('✅ [Realtime] Chat updated:', payload.new);
          // Optimistically update the local data
          mutate(
            (currentPages) => {
              if (!currentPages) return currentPages;

              return currentPages.map((page) => ({
                ...page,
                data: page.data.map((chat) =>
                chat.id === (payload.new as any).id
                  ? { ...chat, ...(payload.new as Chat) }
                  : chat
                ),
              }));
            },
            { revalidate: false }
          );
        }
      )
      .subscribe((status) => {
        console.log('🔴 [Realtime] Subscription status:', status);
      });

    return () => {
      console.log('🔴 [Realtime] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [clientUser?.id, mutate]);

  const router = useRouter();

  const handleRename = (chatId: string) => {
    const chat = history?.find((h) => h.id === chatId);
    if (chat) {
      setEditingId(chatId);
      setEditedTitle(chat.title || 'New Chat');
    }
  };

  const handleEditSubmit = async () => {
    if (!editingId || !editedTitle.trim()) {
      setEditingId(null);
      return;
    }

    const newTitle = editedTitle.trim();
    const chatId = editingId;

    // Optimistic update - immediately update UI before server response
    mutate(
      async (currentPages) => {
        if (!currentPages) return currentPages;

        // Update the title optimistically in the local data
        return currentPages.map((page) => ({
          ...page,
          data: page.data.map((chat) =>
          chat.id === chatId
            ? { ...chat, title: newTitle, updated_at: new Date().toISOString() }
            : chat
          ),
        }));
      },
      {
        // Don't revalidate immediately to show optimistic update
        revalidate: false,
      }
    );

    // Clear editing state immediately for better UX
    setEditingId(null);
    setEditedTitle('');

    try {
      // Call server action to persist the change
      await updateChatTitle({ chatId, title: newTitle });

      toast.success('Chat title updated');

      // Revalidate after successful update
      mutate();
    } catch (error) {
      console.error('❌ Error updating chat title:', error);
      toast.error('Failed to update chat title');

      // Revert optimistic update on error
      mutate();
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditedTitle('');
  };

  const handleDelete = (chatId: string) => {
    // First click - show confirmation state
    setConfirmingDeleteId(chatId);
    // Reset confirmation state after 5 seconds
    setTimeout(() => {
      setConfirmingDeleteId(null);
    }, 5000);
  };

  const handleConfirmDelete = async (chatId: string) => {
    console.log('🗑️ [Delete] Starting delete for chat:', chatId);

    // Optimistic update - immediately remove from UI
    mutate(
      async (currentPages) => {
        if (!currentPages) return currentPages;

        // Filter out the deleted chat from all pages
        return currentPages.map((page) => ({
          ...page,
          data: page.data.filter((chat) => chat.id !== chatId),
        }));
      },
      {
        // Don't revalidate immediately to show optimistic update
        revalidate: false,
      }
    );

    // Clear confirmation state immediately
    setConfirmingDeleteId(null);

    try {
      // Call server action to persist the change
      await deleteChatSession({ chatId });

      console.log('✅ [Delete] Chat deleted successfully:', chatId);
      toast.success('Chat deleted successfully');

      // If we're deleting the currently active chat, redirect to chat page
      if (chatId === id) {
        router.push('/ai/chat');
      }

      // Revalidate after successful delete
      mutate();
    } catch (error) {
      console.error('❌ [Delete] Error deleting chat:', error);
      toast.error('Failed to delete chat');

      // Revert optimistic update on error
      mutate();
    }
  };

  if (!clientUser) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>Login to save and revisit previous chats!</div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10 animate-pulse"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <div className="text-destructive text-sm font-medium">
              Failed to load chat history
            </div>
            <div className="text-xs text-muted-foreground">
              {error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => mutate()}
              className="mt-2 px-3 py-1.5 text-xs rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
            >
              Try Again
            </button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (history?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>
              Your conversations will appear here once you start chatting!
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        // Use updated_at if available, fallback to created_at
        const chatDate = new Date(chat.updated_at || chat.created_at);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent ref={sidebarContentRef} className="overflow-y-auto">
          <SidebarMenu>
            {history &&
              (() => {
                const groupedChats = groupChatsByDate(history);

                return (
                  <>
                    {groupedChats.today.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            setOpenMobile={setOpenMobile}
                            isEditing={editingId === chat.id}
                            editedTitle={editedTitle}
                            onEditChange={setEditedTitle}
                            onEditSubmit={handleEditSubmit}
                            onEditCancel={handleEditCancel}
                            isConfirmingDelete={confirmingDeleteId === chat.id}
                            onConfirmDelete={handleConfirmDelete}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            setOpenMobile={setOpenMobile}
                            isEditing={editingId === chat.id}
                            editedTitle={editedTitle}
                            onEditChange={setEditedTitle}
                            onEditSubmit={handleEditSubmit}
                            onEditCancel={handleEditCancel}
                            isConfirmingDelete={confirmingDeleteId === chat.id}
                            onConfirmDelete={handleConfirmDelete}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            setOpenMobile={setOpenMobile}
                            isEditing={editingId === chat.id}
                            editedTitle={editedTitle}
                            onEditChange={setEditedTitle}
                            onEditSubmit={handleEditSubmit}
                            onEditCancel={handleEditCancel}
                            isConfirmingDelete={confirmingDeleteId === chat.id}
                            onConfirmDelete={handleConfirmDelete}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            setOpenMobile={setOpenMobile}
                            isEditing={editingId === chat.id}
                            editedTitle={editedTitle}
                            onEditChange={setEditedTitle}
                            onEditSubmit={handleEditSubmit}
                            onEditCancel={handleEditCancel}
                            isConfirmingDelete={confirmingDeleteId === chat.id}
                            onConfirmDelete={handleConfirmDelete}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Older
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            setOpenMobile={setOpenMobile}
                            isEditing={editingId === chat.id}
                            editedTitle={editedTitle}
                            onEditChange={setEditedTitle}
                            onEditSubmit={handleEditSubmit}
                            onEditCancel={handleEditCancel}
                            isConfirmingDelete={confirmingDeleteId === chat.id}
                            onConfirmDelete={handleConfirmDelete}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            {isLoadingMore && (
              <div className="px-2 py-2">
                <div className="text-xs text-muted-foreground text-center">Loading more...</div>
              </div>
            )}
            {isReachingEnd && history.length > 0 && (
              <div className="px-2 py-2">
                <div className="text-xs text-muted-foreground text-center">No more chats</div>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
