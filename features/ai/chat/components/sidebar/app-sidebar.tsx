'use client';

import { useRouter } from 'next/navigation';
import type { ServerUser } from '@/shared/lib/supabase/auth';

import { PlusIcon } from '@/features/ai/chat/components/core/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/shared/components/ui/tooltip';

export function AppSidebar({ user }: { user: ServerUser | null }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div
              onClick={() => {
                setOpenMobile(false);
                router.push('/ai/chat');
                router.refresh();
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Chatbot
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/ai/chat');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
      </SidebarContent>

    </Sidebar>
  );
}
