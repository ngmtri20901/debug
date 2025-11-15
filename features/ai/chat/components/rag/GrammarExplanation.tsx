'use client';

import { motion } from 'framer-motion';
import { BookOpen, Tag, Lightbulb, Search, FileText, Key, Zap } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import type { GrammarExplanation } from '@/features/ai/chat/types';

// Helper function to get search method icon and color
function getSearchMethodInfo(method: string) {
  if (method.includes('semantic')) {
    return { icon: Search, color: 'text-blue-500', label: 'Semantic' };
  }
  if (method.includes('fulltext')) {
    return { icon: FileText, color: 'text-green-500', label: 'Full-text' };
  }
  if (method.includes('keyword')) {
    return { icon: Key, color: 'text-orange-500', label: 'Keyword' };
  }
  return { icon: Zap, color: 'text-purple-500', label: 'Hybrid' };
}

export function GrammarExplanation({ result }: { result: GrammarExplanation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-500 p-2">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Grammar Explanation</h3>
            <p className="text-sm text-purple-600">{result.query}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-purple-300 text-purple-700">
          {result.responseTime}ms
        </Badge>
      </div>

      {/* Sources Accordion */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-purple-800">
          Sources ({result.sources.length})
        </h4>
        <Accordion type="multiple" className="space-y-2">
          {result.sources.map((source, index) => (
            <AccordionItem
              key={source.id}
              value={`source-${index}`}
              className="rounded-md border border-purple-200 bg-white"
            >
              <AccordionTrigger className="px-4 hover:bg-purple-50">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-500">{index + 1}</Badge>
                  <span className="text-sm font-medium">{source.grammarPoint}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {Math.round(source.relevanceScore * 100)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Category */}
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    {source.category.en} ({source.category.vi})
                  </span>
                </div>

                {/* Contextualized Chunk */}
                <div className="mb-3 rounded bg-purple-50 p-3">
                  <p className="text-sm text-gray-700">{source.contextualizedChunk}</p>
                </div>

                {/* Examples */}
                {source.examples.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-purple-700">Examples:</p>
                    <ul className="list-inside list-disc space-y-1">
                      {source.examples.map((ex, i) => (
                        <li key={i} className="text-sm text-gray-600">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {source.keywords.en.slice(0, 5).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>

                {/* Search Method - Enhanced with icon */}
                <div className="mt-2 flex items-center gap-2">
                  {(() => {
                    const methodInfo = getSearchMethodInfo(source.searchMethod);
                    const MethodIcon = methodInfo.icon;
                    return (
                      <>
                        <MethodIcon className={`h-3 w-3 ${methodInfo.color}`} />
                        <p className="text-xs text-gray-500">
                          Retrieved via: <span className="font-medium">{source.searchMethod}</span>
                        </p>
                      </>
                    );
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Related Topics */}
      {result.relatedTopics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-medium text-purple-800">Related Topics</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.relatedTopics.map((topic, i) => (
              <Badge key={i} variant="outline" className="border-purple-300 text-purple-700">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
