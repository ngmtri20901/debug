'use client';

import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

type RAGQuickActionsProps = {
  onGrammarClick: () => void;
  onFolkloreClick: () => void;
  disabled?: boolean;
};

export function RAGQuickActions({
  onGrammarClick,
  onFolkloreClick,
  disabled = false,
}: RAGQuickActionsProps) {
  return (
    <TooltipProvider>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.1 }}
      >
        {/* Grammar Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex items-center gap-2 rounded-full bg-purple-500 px-4 py-2 text-white shadow-sm transition-all hover:bg-purple-600 hover:shadow-md disabled:opacity-50"
              disabled={disabled}
              onClick={onGrammarClick}
              size="sm"
              variant="ghost"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:inline">Grammar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search Vietnamese grammar knowledge base</p>
          </TooltipContent>
        </Tooltip>

        {/* Folklore Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md disabled:opacity-50"
              disabled={disabled}
              onClick={onFolkloreClick}
              size="sm"
              variant="ghost"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:inline">Folklore</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search proverbs, folk songs, and cultural expressions</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
