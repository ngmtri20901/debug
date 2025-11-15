"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { MessageSquare, BookCheck, Compass, Search } from "lucide-react";
import type { ChatMessage } from "@/features/ai/chat/types";
import { Suggestion } from "@/features/ai/chat/components/elements/suggestion";
import { cn } from "@/shared/utils/cn";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      text: "Start a role-play conversation about ordering food",
      icon: MessageSquare,
      color: "blue",
      category: "roleplay",
    },
    {
      text: "Check my Vietnamese grammar for mistakes",
      icon: BookCheck,
      color: "purple",
      category: "grammar_check",
    },
    {
      text: "Recommend Vietnamese learning topics related to travel",
      icon: Compass,
      color: "emerald",
      category: "topic_recommendation",
    },
    {
      text: "Search for recent events happening in Ho Chi Minh City",
      icon: Search,
      color: "rose",
      category: "local_events",
    },
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
      suppressHydrationWarning
    >
      {suggestedActions.map((action, index) => {
        const Icon = action.icon;
        const iconColor = action.color === "purple" 
          ? "text-purple-500" 
          : "text-amber-500";
        const borderColor = action.color === "purple"
          ? "border-purple-200 hover:border-purple-300"
          : "border-amber-200 hover:border-amber-300";
        const bgColor = action.color === "purple"
          ? "hover:bg-purple-50"
          : "hover:bg-amber-50";
          
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={action.text}
            transition={{ delay: 0.05 * index }}
          >
            <Suggestion
              className={cn(
                "h-auto w-full whitespace-normal border p-3 text-left transition-colors",
                borderColor,
                bgColor
              )}
              onClick={(suggestion) => {
                window.history.replaceState({}, "", `/ai/chat/${chatId}`);
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              suggestion={action.text}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", iconColor)} />
                <span className="text-sm">{action.text}</span>
              </div>
            </Suggestion>
          </motion.div>
        );
      })}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }

    return true;
  }
);
