import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/features/ai/chat/types";
import { ServerUser } from "@/shared/lib/supabase/auth";
import { analyzeQuery, optimizeQueryForSearch, searchGrammarChunks, searchFolkloreChunks } from "@/features/ai/chat/services/rag";

type RAGToolProps = {
  session: ServerUser;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const vietnameseRAG = ({ session, dataStream }: RAGToolProps) =>
  tool({
    description: `Search Vietnamese grammar knowledge base and folklore database for advanced explanations, 
    proverbs, folk songs, idioms, and cultural context. Use this for:
    - Advanced grammar questions (e.g., "Explain 'chủ ngữ' in Vietnamese")
    - Proverbs and folk wisdom (e.g., "What's a proverb about patience?")
    - Cultural expressions and idioms
    - Vietnamese linguistic patterns
    Always cite sources with [1], [2] notation.`,
    
    inputSchema: z.object({
      query: z.string().describe("User's question or search query"),
      searchType: z
        .enum(['grammar', 'folklore', 'both'])
        .default('both')
        .describe("Type of content to search"),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of results per category"),
    }),

    execute: async ({ query, searchType, maxResults }) => {
      const startTime = Date.now();

      try {
        // Phase 3.1: Query Analysis & Routing
        // Automatically detect query intent if searchType is 'both'
        let finalSearchType = searchType;
        let queryIntent;
        
        if (searchType === 'both') {
          queryIntent = analyzeQuery(query);
          finalSearchType = queryIntent.searchType;
          console.log('[RAG] Query analysis:', {
            query,
            intent: queryIntent.searchType,
            confidence: queryIntent.confidence,
            reasoning: queryIntent.reasoning,
          });
        }
        
        // Optimize query for better search results
        const optimizedQuery = optimizeQueryForSearch(query, queryIntent || { searchType: finalSearchType, confidence: 1, keywords: [], reasoning: 'Manual selection' });
        
        // Determine which databases to search
        const searchGrammar = finalSearchType === 'grammar' || finalSearchType === 'both';
        const searchFolklore = finalSearchType === 'folklore' || finalSearchType === 'both';

        // Parallel search (use optimized query for better results)
        const [grammarResults, folkloreResults] = await Promise.all([
          searchGrammar ? searchGrammarChunks(optimizedQuery, maxResults) : null,
          searchFolklore ? searchFolkloreChunks(optimizedQuery, maxResults) : null,
        ]);

        // Stream grammar results if available
        if (grammarResults && grammarResults.results.length > 0) {
          dataStream.write({
            type: "data-grammarExplanation",
            data: {
              query,
              answer: "", // LLM will fill this
              sources: grammarResults.results.map((r: any) => ({
                id: r.id,
                content: r.content,
                contextualizedChunk: r.contextualized_chunk,
                category: {
                  vi: r.category_vi,
                  en: r.category_en,
                },
                grammarPoint: r.metadata?.grammar_point || '',
                examples: r.metadata?.examples || [],
                keywords: r.metadata?.keywords || { vi: [], en: [] },
                headers: r.metadata?.headers || {},
                relevanceScore: r.relevanceScore,
                searchMethod: r.searchMethods?.join(', ') || 'hybrid',
              })),
              relatedTopics: extractRelatedTopics(grammarResults.results),
              responseTime: grammarResults.responseTime,
            },
          });
        }

        // Stream folklore results if available
        if (folkloreResults && folkloreResults.results.length > 0) {
          dataStream.write({
            type: "data-folkloreResult",
            data: {
              query,
              answer: "", // LLM will fill this
              items: folkloreResults.results.map((r: any) => ({
                id: r.id,
                type: r.type,
                viContent: Array.isArray(r.vi_content) ? r.vi_content : [r.vi_content],
                enContent: Array.isArray(r.en_content) ? r.en_content : [r.en_content],
                category: {
                  vi: r.category_vi,
                  en: r.category_en,
                },
                subCategory: r.sub_category_vi
                  ? { vi: r.sub_category_vi, en: r.sub_category_en }
                  : undefined,
                definition: {
                  vi: r.definition_vi,
                  en: r.definition_en,
                },
                detailedExplanations: r.detailed_explanations,
                relevanceScore: r.relevanceScore,
                searchMethod: r.searchMethods?.join(', ') || 'hybrid',
              })),
              culturalContext: extractCulturalContext(folkloreResults.results),
              usageExamples: extractUsageExamples(folkloreResults.results),
              responseTime: folkloreResults.responseTime,
            },
          });
        }

        // Return context for LLM to synthesize
        const context = buildContextForLLM(grammarResults, folkloreResults);
        
        return {
          success: true,
          message: `Found ${
            (grammarResults?.results.length || 0) + (folkloreResults?.results.length || 0)
          } relevant sources`,
          context,
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        console.error('RAG search error:', error);
        return {
          success: false,
          message: 'Failed to search knowledge base',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });

// Helper functions
function extractRelatedTopics(results: any[]): string[] {
  const topics = new Set<string>();
  results.forEach((r) => {
    if (r.metadata?.tags?.en) {
      r.metadata.tags.en.forEach((tag: string) => topics.add(tag));
    }
  });
  return Array.from(topics).slice(0, 5);
}

function extractCulturalContext(results: any[]): string {
  // Extract common themes from folklore items
  const categories = results.map((r) => r.category_en).filter(Boolean);
  return `These items belong to the following cultural themes: ${[...new Set(categories)].join(', ')}`;
}

function extractUsageExamples(results: any[]): string[] {
  // Extract example usages from metadata
  const examples: string[] = [];
  results.forEach((r) => {
    if (r.vi_content && Array.isArray(r.vi_content)) {
      examples.push(...r.vi_content.slice(0, 2));
    }
  });
  return examples.slice(0, 5);
}

function buildContextForLLM(
  grammarResults: any,
  folkloreResults: any
): string {
  let context = 'Retrieved knowledge:\n\n';

  if (grammarResults?.results.length > 0) {
    context += '=== Grammar Sources ===\n';
    grammarResults.results.forEach((r: any, i: number) => {
      context += `[${i + 1}] ${r.category_en}: ${r.contextualized_chunk}\n`;
      if (r.metadata?.examples?.length > 0) {
        context += `Examples: ${r.metadata.examples.join('; ')}\n`;
      }
      context += '\n';
    });
  }

  if (folkloreResults?.results.length > 0) {
    const offset = grammarResults?.results.length || 0;
    context += '=== Folklore & Cultural Sources ===\n';
    folkloreResults.results.forEach((r: any, i: number) => {
      context += `[${offset + i + 1}] ${r.type}: ${r.vi_content?.[0] || ''}\n`;
      context += `English: ${r.en_content?.[0] || ''}\n`;
      context += `Meaning: ${r.definition_en}\n\n`;
    });
  }

  return context;
}
