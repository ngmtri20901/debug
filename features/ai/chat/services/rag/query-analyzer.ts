/**
 * Query Analysis & Routing for Vietnamese RAG Tool
 * 
 * Automatically detects query intent and determines the optimal search strategy:
 * - Grammar-related queries → Search grammar_chunks only
 * - Cultural/proverb queries → Search folklore_chunks only  
 * - Ambiguous queries → Search both databases
 */

export type QueryIntent = {
  searchType: 'grammar' | 'folklore' | 'both';
  confidence: number; // 0-1
  keywords: string[];
  reasoning: string;
};

// Grammar-related keywords and patterns
const GRAMMAR_INDICATORS = {
  keywords: [
    // English grammar terms
    'grammar', 'syntax', 'sentence', 'structure', 'tense', 'verb', 'noun',
    'adjective', 'adverb', 'pronoun', 'particle', 'classifier', 'conjunction',
    'preposition', 'clause', 'phrase', 'subject', 'object', 'predicate',
    'modifier', 'complement', 'aspect', 'mood', 'voice',
    
    // Vietnamese grammar terms (romanized)
    'chu ngu', 'chủ ngữ', 'tuc tu', 'tục từ', 'trang ngu', 'trạng ngữ',
    'bo ngu', 'bổ ngữ', 'dinh ngu', 'định ngữ', 'dai tu', 'đại từ',
    'dong tu', 'động từ', 'tinh tu', 'tính từ', 'danh tu', 'danh từ',
    'pho tu', 'phó từ', 'lien tu', 'liên từ', 'gioi tu', 'giới từ',
    
    // Question patterns
    'how to use', 'how do you', 'when to use', 'what is', 'what are',
    'explain', 'difference between', 'usage of', 'rule', 'rules for',
  ],
  
  patterns: [
    /\b(how|when|what|why)\s+(to\s+)?(use|say|form|make|construct)\b/i,
    /\b(grammar|grammatical|syntax|syntactic)\b/i,
    /\b(sentence\s+structure|word\s+order)\b/i,
    /\b(tense|aspect|mood|voice)\b/i,
    /\bexplain\s+('|"|`|")?\w+('|"|`|")?\s+(in\s+vietnamese)?\b/i,
  ],
};

// Folklore-related keywords and patterns
const FOLKLORE_INDICATORS = {
  keywords: [
    // English folklore terms
    'proverb', 'proverbs', 'saying', 'sayings', 'idiom', 'idioms',
    'folk song', 'folk songs', 'folksong', 'folksongs',
    'expression', 'expressions', 'phrase', 'phrases',
    'wisdom', 'traditional', 'cultural', 'culture',
    'vietnamese culture', 'vietnamese saying', 'vietnamese proverb',
    
    // Vietnamese folklore terms
    'tuc ngu', 'tục ngữ', 'ca dao', 'ca dao', 'thanh ngu', 'thành ngữ',
    'dieu ca', 'điệu ca', 'tho ca', 'thơ ca', 'dan gian', 'dân gian',
    
    // Topic keywords
    'perseverance', 'hard work', 'family', 'filial piety', 'friendship',
    'love', 'nature', 'patience', 'wisdom', 'virtue', 'education',
    'respect', 'gratitude', 'loyalty', 'honesty', 'kindness',
  ],
  
  patterns: [
    /\b(proverb|saying|idiom)\s+(about|on|related to)\b/i,
    /\b(traditional|cultural|folk)\s+(saying|proverb|song|wisdom|expression)\b/i,
    /\b(tell me|show me|find|search for|give me)\s+(a|some)?\s*(vietnamese)?\s*(proverb|saying|idiom)/i,
    /\b(vietnamese\s+)?(culture|cultural|tradition|traditional)\b/i,
    /\b(folk\s*song|ca\s*dao|tục\s*ngữ|thành\s*ngữ)\b/i,
  ],
};

/**
 * Analyze query and determine optimal search strategy
 */
export function analyzeQuery(query: string): QueryIntent {
  const queryLower = query.toLowerCase().trim();
  
  // Count matches for each category
  let grammarScore = 0;
  let folkloreScore = 0;
  const foundKeywords: string[] = [];
  
  // Check grammar keywords
  GRAMMAR_INDICATORS.keywords.forEach((keyword) => {
    if (queryLower.includes(keyword.toLowerCase())) {
      grammarScore += 1;
      foundKeywords.push(keyword);
    }
  });
  
  // Check grammar patterns (weighted higher)
  GRAMMAR_INDICATORS.patterns.forEach((pattern) => {
    if (pattern.test(query)) {
      grammarScore += 2;
    }
  });
  
  // Check folklore keywords
  FOLKLORE_INDICATORS.keywords.forEach((keyword) => {
    if (queryLower.includes(keyword.toLowerCase())) {
      folkloreScore += 1;
      foundKeywords.push(keyword);
    }
  });
  
  // Check folklore patterns (weighted higher)
  FOLKLORE_INDICATORS.patterns.forEach((pattern) => {
    if (pattern.test(query)) {
      folkloreScore += 2;
    }
  });
  
  // Determine search type based on scores
  const totalScore = grammarScore + folkloreScore;
  
  if (totalScore === 0) {
    // No clear indicators - search both
    return {
      searchType: 'both',
      confidence: 0.3,
      keywords: [],
      reasoning: 'No clear indicators - searching both databases',
    };
  }
  
  // Calculate confidence and determine type
  const grammarConfidence = totalScore > 0 ? grammarScore / totalScore : 0;
  const folkloreConfidence = totalScore > 0 ? folkloreScore / totalScore : 0;
  
  // Threshold for single-database search
  const CONFIDENCE_THRESHOLD = 0.65;
  
  if (grammarConfidence >= CONFIDENCE_THRESHOLD) {
    return {
      searchType: 'grammar',
      confidence: grammarConfidence,
      keywords: foundKeywords.filter((kw) => 
        GRAMMAR_INDICATORS.keywords.includes(kw)
      ),
      reasoning: `Strong grammar indicators (${grammarScore} matches)`,
    };
  }
  
  if (folkloreConfidence >= CONFIDENCE_THRESHOLD) {
    return {
      searchType: 'folklore',
      confidence: folkloreConfidence,
      keywords: foundKeywords.filter((kw) => 
        FOLKLORE_INDICATORS.keywords.includes(kw)
      ),
      reasoning: `Strong folklore indicators (${folkloreScore} matches)`,
    };
  }
  
  // Mixed signals - search both
  return {
    searchType: 'both',
    confidence: Math.max(grammarConfidence, folkloreConfidence),
    keywords: foundKeywords,
    reasoning: `Mixed indicators (grammar: ${grammarScore}, folklore: ${folkloreScore})`,
  };
}

/**
 * Extract key concepts from query for enhanced search
 */
export function extractKeywords(query: string): string[] {
  const keywords: string[] = [];
  
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'about', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'what', 'when', 'where', 'how', 'why',
  ]);
  
  // Extract words
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  
  return [...new Set(words)];
}

/**
 * Suggest query refinements for better results
 */
export function suggestRefinements(query: string, intent: QueryIntent): string[] {
  const suggestions: string[] = [];
  
  if (intent.confidence < 0.5) {
    suggestions.push(
      'Try being more specific: "Explain Vietnamese grammar rule for..." or "Find a proverb about..."'
    );
  }
  
  if (intent.searchType === 'grammar' && !query.toLowerCase().includes('vietnamese')) {
    suggestions.push('Add "Vietnamese" to specify the language context');
  }
  
  if (intent.searchType === 'folklore' && intent.confidence < 0.7) {
    suggestions.push(
      'Use keywords like "proverb", "saying", "folk song", or "idiom" for better results'
    );
  }
  
  return suggestions;
}

/**
 * Format query for better search results
 */
export function optimizeQueryForSearch(query: string, intent: QueryIntent): string {
  let optimizedQuery = query.trim();
  
  // Expand common abbreviations
  optimizedQuery = optimizedQuery
    .replace(/\bvn\b/gi, 'Vietnamese')
    .replace(/\bvi\b/gi, 'Vietnamese');
  
  // Add context keywords if confidence is low
  if (intent.confidence < 0.5) {
    if (intent.searchType === 'grammar' || intent.searchType === 'both') {
      optimizedQuery = `Vietnamese grammar ${optimizedQuery}`;
    }
  }
  
  return optimizedQuery;
}
