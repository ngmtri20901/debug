"use client";

import React from "react";
import { motion } from "framer-motion";
import { ExternalLinkIcon, SearchIcon, SparklesIcon, ClockIcon, ChevronDownIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import type { TavilySearchResult } from "@/features/ai/chat/types";

interface TavilySearchResultProps {
  result: TavilySearchResult;
}

/**
 * TavilySearchResult
 * 
 * Displays search results from the Tavily API, including:
 * - AI-synthesized answer
 * - Numbered sources with relevance scores
 * - Follow-up questions (if available)
 * - Related images (if included)
 */
export function TavilySearchResult({ result }: TavilySearchResultProps) {
  const [allOpen, setAllOpen] = React.useState(false);
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const [sourcesOpen, setSourcesOpen] = React.useState(false); // master accordion for whole Sources section

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 dark:border-cyan-800 dark:from-cyan-950/30 dark:to-blue-950/30"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-200 bg-cyan-100/50 px-4 py-3 dark:border-cyan-800 dark:bg-cyan-900/30">
        <div className="flex items-center gap-2">
          <SearchIcon className="size-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-medium text-foreground text-sm">Search Results</h3>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <ClockIcon className="size-3" />
          <span>{result.responseTime}ms</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Query Display */}
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 font-medium text-cyan-800 text-xs dark:bg-cyan-900/50 dark:text-cyan-300">
            Query
          </span>
          <p className="text-muted-foreground text-sm italic">
            "{result.query}"
          </p>
        </div>

        {/* AI-Synthesized Answer */}
        {result.answer && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="font-semibold text-foreground text-sm">Answer</h4>
            </div>
            <p className="rounded-md bg-white/60 p-3 text-foreground text-sm leading-relaxed dark:bg-black/20">
              {result.answer}
            </p>
          </div>
        )}

        {/* Sources - with master accordion toggle to the right of the label */}
        {result.sources && result.sources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground text-sm">Sources ({result.sources.length})</h4>
                <button
                  type="button"
                  aria-expanded={sourcesOpen}
                  aria-controls="sources-section"
                  onClick={() => setSourcesOpen((prev) => !prev)}
                  className="inline-flex items-center rounded-md border border-cyan-200 bg-white/60 px-2 py-1 text-xs text-cyan-700 transition-colors hover:bg-cyan-50 dark:border-cyan-800 dark:bg-black/20 dark:text-cyan-300 dark:hover:bg-cyan-900/20"
                  title={sourcesOpen ? "Collapse Sources" : "Expand Sources"}
                >
                  <ChevronDownIcon className={`size-4 transition-transform ${sourcesOpen ? "rotate-180" : "rotate-0"}`} />
                </button>
              </div>

              {/* Bulk open/close for individual source accordions (only show when master is open) */}
              {sourcesOpen && (
                <button
                  type="button"
                  className="text-sm px-2 py-1 rounded border border-input bg-background hover:bg-accent"
                  onClick={() => {
                    const willOpen = !allOpen;
                    setAllOpen(willOpen);
                    if (willOpen) {
                      setOpenItems(result.sources.map((_, i) => `source-${i}`));
                    } else {
                      setOpenItems([]);
                    }
                  }}
                >
            
                </button>
              )}
            </div>

            {/* Master accordion content: when open, full per-source accordions; when closed, show nothing */}
            {sourcesOpen && (
              <div id="sources-section" className="space-y-3">

                {/* Detailed per-source accordions */}
                <Accordion
                  type="multiple"
                  className="space-y-2"
                  value={openItems}
                  onValueChange={(vals) => setOpenItems(Array.isArray(vals) ? vals : [])}
                >
                  {result.sources.map((source, index) => (
                    <AccordionItem key={source.url} value={`source-${index}`} className="border border-cyan-200/60 bg-white/60 rounded-md dark:border-cyan-800/60 dark:bg-black/20">
                      <AccordionTrigger className="flex items-center gap-3 px-3 py-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-700 text-xs dark:bg-cyan-900/50 dark:text-cyan-300">
                          {index + 1}
                        </div>
                        <span className="flex-1 text-left font-medium text-foreground text-sm truncate">
                          {source.title}
                        </span>
                        <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-0">
                        <a
                          className="block font-medium text-cyan-700 text-xs mb-1 truncate hover:underline dark:text-cyan-300"
                          href={source.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {source.url}
                        </a>
                        <p className="text-muted-foreground text-xs leading-relaxed mb-1">
                          {source.content}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span className="truncate">
                            {new URL(source.url).hostname}
                          </span>
                          {source.score && (
                            <>
                              <span>•</span>
                              <span className="font-medium">
                                {Math.round(source.score * 100)}% relevant
                              </span>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        )}

        {/* Follow-up Questions */}
        {result.followUpQuestions && result.followUpQuestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-base">Sources</span>
                <button
                  type="button"
                  className="text-sm px-2 py-1 rounded border border-input bg-background hover:bg-accent"
                  onClick={() => setAllOpen((prev) => !prev)}
                >
                  {allOpen ? "Hide all sources" : "Show all sources"}
                </button>
              </div>
              Related Questions
            </h4>
            <div className="space-y-1.5">
              {result.followUpQuestions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-md bg-white/60 px-3 py-2 text-sm dark:bg-black/20"
                >
                  <span className="text-cyan-600 dark:text-cyan-400">•</span>
                  <span className="text-muted-foreground">{question}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {result.images && result.images.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">
              Related Images
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {result.images.map((imageUrl, index) => (
                <a
                  key={index}
                  className="overflow-hidden rounded-md border border-cyan-200/60 transition-all hover:border-cyan-300 hover:shadow-sm dark:border-cyan-800/60 dark:hover:border-cyan-700"
                  href={imageUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img
                    alt={`Search result ${index + 1}`}
                    className="size-full object-cover"
                    loading="lazy"
                    src={imageUrl}
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
