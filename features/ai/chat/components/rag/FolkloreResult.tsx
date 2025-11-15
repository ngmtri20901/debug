'use client';

import { motion } from 'framer-motion';
import { Sparkles, Globe, Search, FileText, Key, Zap } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import type { FolkloreResult } from '@/features/ai/chat/types';

// Helper function to get search method icon and color
function getSearchMethodInfo(method: string) {
  if (method.includes('semantic')) {
    return { icon: Search, color: 'text-blue-500', label: 'Semantic' };
  }
  if (method.includes('fulltext')) {
    return { icon: FileText, color: 'text-green-500', label: 'Full-text' };
  }
  if (method.includes('jsonb')) {
    return { icon: Key, color: 'text-orange-500', label: 'JSONB' };
  }
  return { icon: Zap, color: 'text-amber-500', label: 'Hybrid' };
}

export function FolkloreResult({ result }: { result: FolkloreResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-500 p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Vietnamese Folklore</h3>
            <p className="text-sm text-amber-600">{result.query}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-300 text-amber-700">
          {result.responseTime}ms
        </Badge>
      </div>

      {/* Folklore Items Accordion */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-amber-800">
          Items ({result.items.length})
        </h4>
        <Accordion type="multiple" className="space-y-2">
          {result.items.map((item, index) => (
            <AccordionItem
              key={item.id}
              value={`item-${index}`}
              className="rounded-md border border-amber-200 bg-white"
            >
              <AccordionTrigger className="px-4 hover:bg-amber-50">
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-500">{index + 1}</Badge>
                  <span className="text-sm font-medium">{item.viContent[0]}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {Math.round(item.relevanceScore * 100)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Type & Category */}
                <div className="mb-3 flex items-center gap-4">
                  <Badge variant="secondary">{item.type}</Badge>
                  <span className="text-sm text-gray-600">
                    {item.category.en} • {item.subCategory?.en}
                  </span>
                </div>

                {/* Vietnamese Content */}
                <div className="mb-3 rounded bg-amber-50 p-3">
                  <p className="mb-1 text-xs font-medium text-amber-700">Vietnamese:</p>
                  {item.viContent.map((line, i) => (
                    <p key={i} className="text-sm font-medium text-gray-800">
                      {line}
                    </p>
                  ))}
                </div>

                {/* English Translation */}
                <div className="mb-3 rounded bg-orange-50 p-3">
                  <p className="mb-1 text-xs font-medium text-orange-700">English:</p>
                  {item.enContent.map((line, i) => (
                    <p key={i} className="text-sm text-gray-700 italic">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Definition */}
                <div className="mb-3">
                  <p className="mb-1 text-xs font-medium text-amber-700">Meaning:</p>
                  <p className="text-sm text-gray-700">{item.definition.en}</p>
                  <p className="text-sm text-gray-600 italic">{item.definition.vi}</p>
                </div>

                {/* Search Method - Enhanced with icon */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const methodInfo = getSearchMethodInfo(item.searchMethod);
                    const MethodIcon = methodInfo.icon;
                    return (
                      <>
                        <MethodIcon className={`h-3 w-3 ${methodInfo.color}`} />
                        <p className="text-xs text-gray-500">
                          Retrieved via: <span className="font-medium">{item.searchMethod}</span>
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

      {/* Cultural Context */}
      <div className="mb-3 rounded bg-amber-100 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-amber-600" />
          <p className="text-xs font-medium text-amber-800">Cultural Context</p>
        </div>
        <p className="text-sm text-amber-900">{result.culturalContext}</p>
      </div>

      {/* Usage Examples */}
      {result.usageExamples.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-amber-800">Usage Examples:</p>
          <ul className="list-inside list-disc space-y-1">
            {result.usageExamples.map((ex, i) => (
              <li key={i} className="text-sm text-gray-700">
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
