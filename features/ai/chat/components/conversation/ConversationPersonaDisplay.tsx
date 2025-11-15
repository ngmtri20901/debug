"use client";

import { motion } from "framer-motion";
import { User2Icon } from "lucide-react";
import type { ConversationPersona } from "@/features/ai/chat/types";

interface ConversationPersonaDisplayProps {
  persona: ConversationPersona;
}

/**
 * ConversationPersonaDisplay
 * 
 * Displays information about the Vietnamese persona the learner is conversing with.
 * Shows the persona's name, role, and personality traits to help set context
 * for the conversation.
 */
export function ConversationPersonaDisplay({
  persona,
}: ConversationPersonaDisplayProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Avatar */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
          <User2Icon className="size-7" />
        </div>

        {/* Persona Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-foreground text-lg">
              {persona.name}
            </h3>
            <span className="text-muted-foreground text-sm">
              ({persona.role})
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 text-xs dark:bg-blue-900/50 dark:text-blue-300">
              Personality
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {persona.personality}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
