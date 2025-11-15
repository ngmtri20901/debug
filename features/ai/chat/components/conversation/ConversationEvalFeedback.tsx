"use client";

import { motion } from "framer-motion";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LightbulbIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { ConversationEvalFeedback } from "@/features/ai/chat/types";

interface ConversationEvalFeedbackProps {
  feedback: ConversationEvalFeedback;
}

/**
 * ConversationEvalFeedback
 * 
 * Displays evaluation feedback on the learner's Vietnamese response, including:
 * - Overall score (1-10)
 * - General feedback
 * - Specific corrections with explanations
 * - Suggestions for improvement
 */
export function ConversationEvalFeedback({
  feedback,
}: ConversationEvalFeedbackProps) {
  // Determine score color based on performance
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8)
      return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    if (score >= 6)
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4 p-4">
        {/* Score Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <CheckCircle2Icon className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">
                Evaluation Results
              </h4>
              <p className="text-muted-foreground text-xs">
                Your Vietnamese response
              </p>
            </div>
          </div>
          <div
            className={`flex size-16 items-center justify-center rounded-lg border-2 font-bold text-2xl ${getScoreBgColor(feedback.score)}`}
          >
            <span className={getScoreColor(feedback.score)}>
              {feedback.score}
              <span className="text-sm">/10</span>
            </span>
          </div>
        </div>

        {/* General Feedback */}
        <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-900/20">
          <p className="text-foreground text-sm leading-relaxed">
            {feedback.feedback}
          </p>
        </div>

        {/* Corrections */}
        {feedback.corrections.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="size-4 text-purple-600 dark:text-purple-400" />
              <h5 className="font-semibold text-foreground text-sm">
                Corrections
              </h5>
            </div>
            <div className="space-y-3">
              {feedback.corrections.map((correction, index) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg border border-purple-200 bg-white/70 p-3 dark:border-purple-800/50 dark:bg-gray-900/30"
                  initial={{ opacity: 0, x: -10 }}
                  key={index}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="mb-2 flex items-start gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-red-100 px-2 py-0.5 font-mono text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
                          Original
                        </span>
                        <span className="font-medium text-sm line-through decoration-red-500">
                          {correction.original}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
                          Corrected
                        </span>
                        <span className="font-medium text-green-700 text-sm dark:text-green-400">
                          {correction.corrected}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <span className="font-semibold">Why:</span>{" "}
                    {correction.explanation}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {feedback.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LightbulbIcon className="size-4 text-amber-600 dark:text-amber-400" />
              <h5 className="font-semibold text-foreground text-sm">
                Tips for Improvement
              </h5>
            </div>
            <ul className="space-y-2">
              {feedback.suggestions.map((suggestion, index) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-muted-foreground text-sm dark:bg-amber-900/10"
                  initial={{ opacity: 0, x: -10 }}
                  key={index}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="leading-relaxed">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
