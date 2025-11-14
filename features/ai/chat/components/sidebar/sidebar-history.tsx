'use client';

import { User } from '@supabase/supabase-js';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

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
import { createClient } from '@/lib/supabase/client';
import { Chat } from '@/lib/db/schema';
import { TABLES } from '@/lib/db/schema';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const fetcher = async (userId: string): Promise<Chat[]> => {
  try {
    console.log('🔍 Fetcher - userId:', userId, 'table:', TABLES.chats);
    const supabase = createClient();
    const { data: chats, error: chatsError } = await supabase
      .from(TABLES.chats)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('chat_type', 'chat')
      .order('created_at', { ascending: false });

    if (chatsError) {
      console.error('❌ Chats fetch error:', chatsError);
      return [];
    }

    console.log('✅ Fetched chats:', chats?.length || 0, 'chats');
    
    // Sort by updated_at (or created_at if updated_at is null) on client side
    const sortedChats = (chats || []).sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    return sortedChats;
  } catch (error) {
    console.error('❌ Fetcher error:', error);
    return [];
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

  const handleDeleteClick = (e: Event) => {
    e.preventDefault();
    if (isConfirmingDelete) {
      // Second click - confirm delete and close dropdown
      onConfirmDelete(chat.id);
      setDropdownOpen(false);
    } else {
      // First click - show confirmation state
      onDelete(chat.id);
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
            onSelect={handleDeleteClick}
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

  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Chat[]>(clientUser ? ['chats', clientUser.id] : null, () => fetcher(clientUser!.id), {
    fallbackData: [],
    refreshInterval: 2000, // Refresh every 2 seconds for quicker updates
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1000, // Allow refetch if more than 1 second has passed
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

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

    const supabase = createClient();
    const { error } = await supabase
      .from(TABLES.chats)
      .update({ 
        title: editedTitle.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', editingId);

    if (error) {
      console.error('❌ Error updating chat title:', error);
      toast.error('Failed to update chat title');
    } else {
      toast.success('Chat title updated');
      mutate(); // Refresh the chat list
    }

    setEditingId(null);
    setEditedTitle('');
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
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from(TABLES.chats)
        .update({ is_active: false })
        .eq('id', chatId);

      if (error) {
        console.error('❌ Error deleting chat:', error);
        toast.error('Failed to delete chat');
      } else {
        toast.success('Chat deleted successfully');
        mutate(); // Refresh the chat list
        
        // If we're deleting the currently active chat, redirect to chat page
        if (chatId === id) {
          router.push('/ai/chat');
        }
      }
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }

    setConfirmingDeleteId(null);
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
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
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
        <SidebarGroupContent>
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
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
