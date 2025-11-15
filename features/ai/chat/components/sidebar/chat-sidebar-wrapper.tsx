"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ServerUser } from "@/shared/lib/supabase/auth";
import { PlusIcon } from "@/features/ai/chat/components/core/icons";
import { SidebarHistory } from "@/features/ai/chat/components/sidebar/sidebar-history";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/components/ui/tooltip";

export function ChatSidebarWrapper({
  user,
  defaultOpen = true,
}: {
  user: ServerUser | undefined;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    // Save state to cookie
    document.cookie = `chat_sidebar_state=${!isOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
  };

  return (
    <div
      className={cn(
        "relative flex flex-col border-l bg-background transition-all duration-300",
        isOpen ? "w-80" : "w-0"
      )}
      style={{ height: "100vh" }}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-4 top-4 z-10 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent"
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar Content */}
      <div
        className={cn(
          "flex h-full flex-col transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b p-4">
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2"
              href="/ai/chat"
            >
              <span className="cursor-pointer rounded-md px-2 text-lg font-semibold hover:bg-muted">
                Chat History
              </span>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      router.push("/ai/chat");
                      router.refresh();
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">
                  New Chat
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Scrollable History Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <SidebarHistory user={user} />
        </div>
      </div>
    </div>
  );
}
