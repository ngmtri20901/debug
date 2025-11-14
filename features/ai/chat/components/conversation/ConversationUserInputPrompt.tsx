"use client";

import { motion } from "framer-motion";
import { HelpCircleIcon, InfoIcon } from "lucide-react";
import type { ConversationUserInputPrompt } from "@/lib/chat/types";

interface ConversationUserInputPromptProps {
  prompt: ConversationUserInputPrompt;
}

/**
 * ConversationUserInputPrompt
 * 
 * Displays prompts and guidance for the learner's Vietnamese response, including:
 * - Main prompt/question
 * - Expected response length
 * - Helpful hints for crafting the response
 */
export function ConversationUserInputPrompt({
  prompt,
}: ConversationUserInputPromptProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 dark:border-indigo-800 dark:from-indigo-950/30 dark:to-violet-950/30"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="space-y-4 p-4">
        {/* Main Prompt */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            <HelpCircleIcon className="size-4" />
          </div>
          <div className="flex-1">
            <h4 className="mb-2 font-semibold text-foreground text-sm">
              Your Turn
            </h4>
            <p className="text-foreground text-sm leading-relaxed">
              {prompt.prompt}
            </p>
          </div>
        </div>

        {/* Expected Length */}
        {prompt.expectedLength && (
          <div className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2 dark:bg-gray-900/20">
            <InfoIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-muted-foreground text-xs">
              Expected length: <span className="font-medium">{prompt.expectedLength}</span>
            </span>
          </div>
        )}

        {/* Hints */}
        {prompt.hints.length > 0 && (
          <div className="space-y-2">
            <h5 className="flex items-center gap-2 font-semibold text-foreground text-xs uppercase tracking-wide">
              💡 Helpful Hints
            </h5>
            <ul className="space-y-1.5">
              {prompt.hints.map((hint, index) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-muted-foreground text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  key={index}
                  transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span className="leading-relaxed">{hint}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Response Prompt */}
        <div className="mt-4 rounded-lg border border-indigo-300 bg-indigo-100/50 p-3 dark:border-indigo-700/50 dark:bg-indigo-900/20">
          <p className="text-center text-indigo-700 text-sm dark:text-indigo-300">
            Type your Vietnamese response in the chat below 👇
          </p>
        </div>
      </div>
    </motion.div>
  );
}
