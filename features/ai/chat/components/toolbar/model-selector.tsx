"use client";

import { startTransition, useMemo, useOptimistic, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(app)/ai/chat/actions";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { entitlementsByUserType, type UserType } from "@/features/ai/chat/core/entitlements";
import { chatModels } from "@/features/ai/chat/core/models";
import { cn } from "@/features/ai/chat/utils";
import { ChevronDownIcon } from "../core/icons";
import { useUserProfile } from "@/shared/hooks/use-user-profile";

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // Get user information from Supabase via react-query hook
  const { user, profile, isAuthenticated } = useUserProfile();
  
  // Determine user type based on authentication status and subscription
  const userType = useMemo((): UserType => {
    if (!isAuthenticated || !user) {
      return "guest";
    }
    
    // Use the subscription type from the profile or default to FREE
    const subscriptionType = profile?.subscription_type;
    return (subscriptionType as UserType) || "FREE";
  }, [isAuthenticated, user, profile?.subscription_type]);

  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id)
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId
      ),
    [optimisticModelId, availableChatModels]
  );

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[280px] max-w-[90vw] sm:min-w-[300px]"
      >
        {availableChatModels.map((chatModel) => {
          const { id, icon: ModelIcon } = chatModel;

          return (
            <DropdownMenuItem
              asChild
              data-active={id === optimisticModelId}
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(id);
                  saveChatModelAsCookie(id);
                });
              }}
            >
              <button
                className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4"
                type="button"
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="text-sm sm:text-base">{chatModel.name}</div>
                  <div className="line-clamp-2 text-muted-foreground text-xs">
                    {chatModel.description}
                  </div>
                </div>

                <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                  <ModelIcon size={16} />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
