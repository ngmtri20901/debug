"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { BookOpen, Sparkles } from "lucide-react";
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
      text: "Explain Vietnamese sentence structure and word order",
      icon: BookOpen,
      color: "purple",
      category: "grammar",
    },
    {
      text: "Find proverbs about perseverance and hard work",
      icon: Sparkles,
      color: "amber",
      category: "folklore",
    },
    {
      text: "What are classifiers in Vietnamese grammar?",
      icon: BookOpen,
      color: "purple",
      category: "grammar",
    },
    {
      text: "Show me folk songs about family and filial piety",
      icon: Sparkles,
      color: "amber",
      category: "folklore",
    },
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
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
