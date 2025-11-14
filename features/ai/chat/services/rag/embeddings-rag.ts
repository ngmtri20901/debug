import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { extractKeywordsForRAG, generateQueryVariations } from './keyword-extractor';

// AI SDK v5 requires textEmbeddingModel() instead of embedding()
const embeddingModel = openai.textEmbeddingModel('text-embedding-3-small');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface QueryEmbeddingResult {
  primaryEmbedding: number[];
  variationEmbeddings: number[][];
  keywords: string[];
}

/**
 * Generate embeddings for user query with keyword extraction
 * 
 * Process:
 * 1. Extract keywords from natural language query
 * 2. Create contextualized query with those keywords
 * 3. Embed the contextualized query (primary)
 * 4. Generate and embed alternative phrasings (variations)
 */
export async function generateQueryEmbedding(
  query: string,
  useKeywordExtraction: boolean = true
): Promise<QueryEmbeddingResult> {
  if (!useKeywordExtraction) {
    // Fallback to direct embedding
    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    });
    return {
      primaryEmbedding: embedding,
      variationEmbeddings: [],
      keywords: [],
    };
  }
  
  // Step 1: Extract keywords and contextualize
  const { keywords, contextualizedQuery } = await extractKeywordsForRAG(query);
  
  console.log('[RAG Embedding] Processing:', {
    original: query.slice(0, 60) + '...',
    keywords: keywords.slice(0, 5),
    contextLength: contextualizedQuery.length,
  });
  
  // Step 2: Embed the contextualized query (primary)
  const { embedding: primaryEmbedding } = await embed({
    model: embeddingModel,
    value: contextualizedQuery,
  });
  
  // Step 3: Generate and embed variations (for broader coverage)
  const variations = await generateQueryVariations(keywords);
  const variationEmbeddings: number[][] = [];
  
  if (variations.length > 0) {
    const embeddings = await Promise.all(
      variations.map(async (variation) => {
        const { embedding } = await embed({
          model: embeddingModel,
          value: variation,
        });
        return embedding;
      })
    );
    variationEmbeddings.push(...embeddings);
  }
  
  console.log('[RAG Embedding] Complete:', {
    primaryDim: primaryEmbedding.length,
    variationCount: variationEmbeddings.length,
    keywordCount: keywords.length,
  });
  
  return {
    primaryEmbedding,
    variationEmbeddings,
    keywords,
  };
}

/**
 * Hybrid search for grammar chunks with keyword-based embedding
 * Combines: semantic (3 vectors) + full-text + keyword search
 */
export async function searchGrammarChunks(query: string, limit: number = 5) {
  const startTime = Date.now();
  
  // Generate embeddings from extracted keywords
  const { primaryEmbedding, variationEmbeddings, keywords } = 
    await generateQueryEmbedding(query, true);

  console.log('[RAG Search] Starting with:', {
    query: query.slice(0, 60) + '...',
    extractedKeywords: keywords.slice(0, 5),
    hasVariations: variationEmbeddings.length > 0,
  });

  // 1. Semantic search with PRIMARY embedding (contextualized keywords)
  const [contentResults, contextResults, keywordResults] = await Promise.all([
    // Search by content vector
    supabase.rpc('match_grammar_content', {
      query_embedding: primaryEmbedding,
      match_threshold: 0.65, // Lower threshold since keywords are more precise
      match_count: limit * 2,
    }),
    
    // Search by contextualized chunk vector
    supabase.rpc('match_grammar_contextualized', {
      query_embedding: primaryEmbedding,
      match_threshold: 0.65,
      match_count: limit * 2,
    }),
    
    // Search by keyword vector
    supabase.rpc('match_grammar_keywords', {
      query_embedding: primaryEmbedding,
      match_threshold: 0.55, // Even lower for keyword vector
      match_count: limit * 2,
    }),
  ]);
  
  // 2. Search with VARIATION embeddings (for broader coverage)
  const variationResults = await Promise.all(
    variationEmbeddings.map((embedding, idx) =>
      supabase.rpc('match_grammar_content', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: limit,
      }).then(result => ({ ...result, variationIndex: idx }))
    )
  );

  // 3. Full-text search (use extracted keywords as query)
  const keywordQuery = keywords.length > 0 ? keywords.join(' OR ') : query;
  const ftsResults = await supabase
    .from('grammar_chunks')
    .select('*')
    .textSearch('contextualized_chunk', keywordQuery, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit * 2);

  // 4. Keyword search (trigram - use top 3 keywords)
  const topKeywords = keywords.length > 0 ? keywords.slice(0, 3).join(' ') : query;
  const keywordSearchResults = await supabase.rpc('grammar_keyword_search', {
    search_term: topKeywords,
    similarity_threshold: 0.25,
    match_count: limit * 2,
  });

  // 5. Reciprocal Rank Fusion (RRF) - combine all results
  const allResults = [
    { results: contentResults.data || [], weight: 1.2, method: 'semantic-content' },
    { results: contextResults.data || [], weight: 1.3, method: 'semantic-context' },
    { results: keywordResults.data || [], weight: 1.0, method: 'semantic-keywords' },
    { results: ftsResults.data || [], weight: 0.9, method: 'fulltext' },
    { results: keywordSearchResults.data || [], weight: 0.8, method: 'keyword-trigram' },
  ];
  
  // Add variation results with decreasing weights
  variationResults.forEach(({ data, variationIndex }) => {
    if (data && data.length > 0) {
      allResults.push({
        results: data,
        weight: 0.7 - (variationIndex * 0.1), // 0.7, 0.6, 0.5
        method: `variation-${variationIndex + 1}`,
      });
    }
  });

  const fusedResults = reciprocalRankFusion(allResults);

  console.log('[RAG Search] Fusion complete:', {
    totalCandidates: fusedResults.length,
    searchMethods: allResults.length,
  });

  // 6. Contextual re-ranking with extracted keywords
  const rerankedResults = await contextualRerank(fusedResults, keywords);

  // 7. Select top K
  const topResults = rerankedResults.slice(0, limit);

  return {
    results: topResults,
    responseTime: Date.now() - startTime,
    totalCandidates: fusedResults.length,
    extractedKeywords: keywords,
  };
}

/**
 * Hybrid search for folklore chunks with keyword-based embedding
 */
export async function searchFolkloreChunks(query: string, limit: number = 5) {
  const startTime = Date.now();
  
  // Generate embeddings from extracted keywords
  const { primaryEmbedding, keywords } = await generateQueryEmbedding(query, true);

  console.log('[RAG Folklore] Searching with:', {
    query: query.slice(0, 60) + '...',
    extractedKeywords: keywords.slice(0, 5),
  });

  // 1. Semantic search
  const semanticResults = await supabase.rpc('match_folklore', {
    query_embedding: primaryEmbedding,
    match_threshold: 0.65, // Lower threshold with keyword extraction
    match_count: limit * 2,
  });

  // 2. Full-text search (Vietnamese + English definitions)
  const keywordQuery = keywords.length > 0 ? keywords.join(' OR ') : query;
  const [ftsViResults, ftsEnResults] = await Promise.all([
    supabase
      .from('folklore_chunks')
      .select('*')
      .textSearch('definition_vi', keywordQuery, {
        type: 'websearch',
        config: 'simple',
      })
      .limit(limit * 2),
    
    supabase
      .from('folklore_chunks')
      .select('*')
      .textSearch('definition_en', keywordQuery, {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit * 2),
  ]);

  // 3. JSONB search (vi_content, en_content arrays)
  const topKeywords = keywords.length > 0 ? keywords.slice(0, 3).join(' ') : query;
  const jsonbResults = await supabase.rpc('folklore_jsonb_search', {
    search_term: topKeywords,
    match_count: limit * 2,
  });

  // 4. Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion([
    { results: semanticResults.data || [], weight: 1.0, method: 'semantic' },
    { results: ftsViResults.data || [], weight: 0.9, method: 'fulltext-vi' },
    { results: ftsEnResults.data || [], weight: 0.8, method: 'fulltext-en' },
    { results: jsonbResults.data || [], weight: 0.7, method: 'jsonb' },
  ]);

  // 5. Contextual re-ranking with keywords
  const rerankedResults = await contextualRerank(fusedResults, keywords);

  // 6. Select top K
  const topResults = rerankedResults.slice(0, limit);

  return {
    results: topResults,
    responseTime: Date.now() - startTime,
    totalCandidates: fusedResults.length,
    extractedKeywords: keywords,
  };
}

/**
 * Reciprocal Rank Fusion (RRF)
 * Combines multiple ranked lists with different weights
 */
function reciprocalRankFusion(
  rankedLists: Array<{ results: any[]; weight: number; method: string }>,
  k: number = 60
): any[] {
  const scoreMap = new Map<string, { item: any; score: number; methods: string[] }>();

  rankedLists.forEach(({ results, weight, method }) => {
    results.forEach((item, rank) => {
      const id = item.id;
      const rrfScore = weight / (k + rank + 1);

      if (scoreMap.has(id)) {
        const existing = scoreMap.get(id)!;
        existing.score += rrfScore;
        existing.methods.push(method);
      } else {
        scoreMap.set(id, {
          item,
          score: rrfScore,
          methods: [method],
        });
      }
    });
  });

  // Sort by RRF score descending
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score, methods }) => ({
      ...item,
      relevanceScore: score,
      searchMethods: methods,
    }));
}

/**
 * Contextual re-ranking using extracted keywords
 * Re-ranks results based on keyword matches and search method coverage
 */
async function contextualRerank(results: any[], keywords: string[]): Promise<any[]> {
  // For MVP: Keyword-aware heuristic re-ranking (no LLM - cost-effective)
  
  return results.map((result) => {
    let boostScore = 0;
    
    // Check for keyword matches in content
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      
      // Boost for content matches
      if (result.content?.toLowerCase().includes(keywordLower)) {
        boostScore += 0.15;
      }
      
      // Higher boost for contextualized chunk matches
      if (result.contextualized_chunk?.toLowerCase().includes(keywordLower)) {
        boostScore += 0.2;
      }
    });
    
    // Check metadata keywords (strong signal)
    const metaKeywordsVi = result.metadata?.keywords?.vi || [];
    const metaKeywordsEn = result.metadata?.keywords?.en || [];
    const allMetaKeywords = [...metaKeywordsVi, ...metaKeywordsEn]
      .map(k => k.toLowerCase());
    
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      if (allMetaKeywords.some(mk => mk.includes(keywordLower) || keywordLower.includes(mk))) {
        boostScore += 0.25; // High boost for metadata matches
      }
    });
    
    // Boost by number of search methods that found this result
    // If found by multiple methods, likely more relevant
    const methodCount = result.searchMethods?.length || 1;
    if (methodCount >= 3) {
      boostScore += 0.15; // Found by 3+ methods = strong signal
    } else if (methodCount >= 2) {
      boostScore += 0.08; // Found by 2 methods = good signal
    }
    
    // Check if grammar point matches any keyword
    const grammarPoint = result.metadata?.grammar_point || '';
    if (grammarPoint) {
      keywords.forEach((keyword) => {
        if (grammarPoint.toLowerCase().includes(keyword.toLowerCase())) {
          boostScore += 0.3; // Very high boost for grammar point match
        }
      });
    }
    
    return {
      ...result,
      relevanceScore: result.relevanceScore + boostScore,
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}
