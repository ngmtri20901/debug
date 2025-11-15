"use client";

import { motion } from "framer-motion";
import { BookOpenIcon, MapPinIcon, TargetIcon } from "lucide-react";
import type { ConversationSceneIntro } from "@/features/ai/chat/types";

interface ConversationSceneIntroProps {
  scene: ConversationSceneIntro;
}

/**
 * ConversationSceneIntro
 * 
 * Displays the initial scene setup for the conversation, including:
 * - The situation/location
 * - Context about what's happening
 * - Learning objectives for this conversation
 */
export function ConversationSceneIntro({
  scene,
}: ConversationSceneIntroProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="space-y-4 p-4">
        {/* Situation */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <MapPinIcon className="size-4" />
          </div>
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-foreground text-sm">
              Situation
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {scene.situation}
            </p>
          </div>
        </div>

        {/* Context */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
            <BookOpenIcon className="size-4" />
          </div>
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-foreground text-sm">
              Context
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {scene.context}
            </p>
          </div>
        </div>

        {/* Learning Objectives */}
        {scene.learningObjectives.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <TargetIcon className="size-4" />
            </div>
            <div className="flex-1">
              <h4 className="mb-2 font-semibold text-foreground text-sm">
                Learning Objectives
              </h4>
              <ul className="space-y-1.5">
                {scene.learningObjectives.map((objective, index) => (
                  <li
                    className="flex items-start gap-2 text-muted-foreground text-sm"
                    key={index}
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
