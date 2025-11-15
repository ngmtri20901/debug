/**
 * Keyword Extraction for RAG
 * 
 * Uses OpenRouter with Vietnamese-optimized LLM to extract keywords
 * and contextualize queries for better embedding-based retrieval.
 * 
 * Problem solved: Raw user queries don't match technical terms in chunks
 * Solution: Extract core concepts and create contextualized query
 */

import { generateText } from 'ai';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Use OpenRouter for cost-effective LLM generation
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const llmModel = openrouter.chat("@preset/viovietnamese");

export interface KeywordExtractionResult {
  keywords: string[];
  contextualizedQuery: string;
  explanation: string;
}

/**
 * Extract keywords and contextualize them for better embedding
 * 
 * Example:
 * Input: "Explain Vietnamese grammar: Predicate và Argument trong tiếng Anh tương ứng với gì trong tiếng Việt?"
 * Output: {
 *   keywords: ["predicate", "argument", "vị tố", "vị ngữ", "thành phần câu", "cú pháp"],
 *   contextualizedQuery: "Predicate và Argument trong ngữ pháp tiếng Anh (vị ngữ và vị tố trong tiếng Việt). Thành phần câu trong ngữ pháp học. Quan hệ giữa chủ ngữ và vị ngữ. Cú pháp và cấu trúc câu.",
 *   explanation: "..."
 * }
 */
export async function extractKeywordsForRAG(query: string): Promise<KeywordExtractionResult> {
  try {
    const { text } = await generateText({
      model: llmModel,
      prompt: `Bạn là chuyên gia ngữ pháp tiếng Việt. Phân tích câu hỏi và trích xuất từ khóa chính để tìm kiếm.

Câu hỏi: "${query}"

Nhiệm vụ:
1. Trích xuất 5-10 từ khóa quan trọng (bao gồm cả tiếng Việt và tiếng Anh nếu có)
2. Tạo một đoạn văn ngắn (2-4 câu) mô tả ngữ cảnh của các từ khóa này
3. Giải thích ngắn gọn tại sao các từ khóa này quan trọng

Định dạng đầu ra (JSON):
{
  "keywords": ["từ khóa 1", "từ khóa 2", "keyword 3", "keyword 4", ...],
  "contextualizedQuery": "Đoạn văn ngắn mô tả ngữ cảnh (2-4 câu, kết hợp tiếng Việt và tiếng Anh)",
  "explanation": "Giải thích ngắn gọn về các từ khóa"
}

Ví dụ 1:
Câu hỏi: "What is chủ ngữ in Vietnamese?"
Đầu ra:
{
  "keywords": ["chủ ngữ", "subject", "thành phần câu", "sentence structure", "cú pháp", "syntax"],
  "contextualizedQuery": "Chủ ngữ (subject in English) là thành phần chính của câu trong ngữ pháp tiếng Việt. Nó chỉ người hoặc vật thực hiện hành động. Liên quan đến cấu trúc câu và cú pháp. Quan hệ với vị ngữ trong câu.",
  "explanation": "Các từ khóa bao gồm thuật ngữ tiếng Việt (chủ ngữ), tiếng Anh (subject), và các khái niệm liên quan (thành phần câu, cú pháp)."
}

Ví dụ 2:
Câu hỏi: "Predicate và Argument trong tiếng Anh tương ứng với gì trong tiếng Việt?"
Đầu ra:
{
  "keywords": ["predicate", "argument", "vị ngữ", "vị tố", "thành phần câu", "cú pháp", "syntax", "sentence structure"],
  "contextualizedQuery": "Predicate và Argument trong ngữ pháp tiếng Anh tương ứng với vị ngữ và vị tố trong tiếng Việt. Đây là các thành phần cốt lõi của câu. Quan hệ giữa chủ ngữ, vị ngữ và các vị tố trong cấu trúc câu. Cú pháp và ngữ nghĩa của thành phần câu.",
  "explanation": "Các thuật ngữ tiếng Anh (predicate, argument) và tương đương tiếng Việt (vị ngữ, vị tố) cùng với ngữ cảnh ngữ pháp học."
}

Bây giờ hãy phân tích câu hỏi trên và trả về JSON.`,
      maxTokens: 500,
    });
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Keyword Extractor] No JSON found, using fallback');
      return createFallbackResult(query);
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Validate result
    if (!result.keywords || !Array.isArray(result.keywords) || result.keywords.length === 0) {
      console.warn('[Keyword Extractor] Invalid keywords array, using fallback');
      return createFallbackResult(query);
    }
    
    if (!result.contextualizedQuery || typeof result.contextualizedQuery !== 'string') {
      console.warn('[Keyword Extractor] Invalid contextualized query, using fallback');
      return createFallbackResult(query);
    }
    
    console.log('[Keyword Extractor] Success:', {
      originalQuery: query.slice(0, 80) + (query.length > 80 ? '...' : ''),
      keywordCount: result.keywords.length,
      keywords: result.keywords,
      contextLength: result.contextualizedQuery.length,
    });
    
    return {
      keywords: result.keywords,
      contextualizedQuery: result.contextualizedQuery,
      explanation: result.explanation || 'No explanation provided',
    };
    
  } catch (error) {
    console.error('[Keyword Extractor] Error:', error);
    return createFallbackResult(query);
  }
}

/**
 * Generate alternative phrasings for better coverage
 * Creates 2-3 variations of the query using the extracted keywords
 */
export async function generateQueryVariations(keywords: string[]): Promise<string[]> {
  if (keywords.length === 0) {
    return [];
  }
  
  try {
    const { text } = await generateText({
      model: llmModel,
      prompt: `Từ danh sách từ khóa sau, tạo 2-3 cách diễn đạt khác nhau để tìm kiếm trong tài liệu ngữ pháp.

Từ khóa: ${keywords.join(', ')}

Yêu cầu:
- Mỗi cách diễn đạt là câu hoàn chỉnh (15-30 từ)
- Kết hợp từ khóa một cách tự nhiên
- Sử dụng ngữ cảnh ngữ pháp học
- Bao gồm cả thuật ngữ tiếng Việt và tiếng Anh

Định dạng: Trả về 2-3 câu, mỗi câu một dòng, không đánh số.

Ví dụ:
Từ khóa: predicate, argument, vị tố, vị ngữ

Đầu ra:
Predicate và argument trong ngữ pháp tiếng Anh, tương ứng với vị ngữ và vị tố trong tiếng Việt, là các thành phần cốt lõi của câu.
Vị ngữ (predicate) và vị tố (argument) là các khái niệm quan trọng trong phân tích cú pháp câu tiếng Việt.

Bây giờ tạo 2-3 cách diễn đạt cho các từ khóa trên:`,
      maxTokens: 300,
    });
    
    // Extract sentences (filter out empty lines and numbers)
    const variations = text
      .split('\n')
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim()) // Remove numbering
      .filter(line => line.length > 20 && line.length < 200) // Reasonable length
      .slice(0, 3); // Max 3 variations
    
    console.log('[Query Variations] Generated:', {
      keywordCount: keywords.length,
      variationCount: variations.length,
    });
    
    return variations;
    
  } catch (error) {
    console.error('[Query Variations] Error:', error);
    return [];
  }
}

/**
 * Create fallback result when LLM extraction fails
 * Extracts keywords using simple text processing
 */
function createFallbackResult(query: string): KeywordExtractionResult {
  // Remove common stop words
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'how', 'why', 'when', 'where',
    'explain', 'vietnamese', 'grammar', 'trong', 'là', 'gì', 'như', 'với',
  ]);
  
  // Extract words longer than 3 characters
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Take unique words, limit to 8
  const keywords = [...new Set(words)].slice(0, 8);
  
  console.log('[Keyword Extractor] Fallback mode:', {
    originalQuery: query.slice(0, 80),
    keywords: keywords,
  });
  
  return {
    keywords,
    contextualizedQuery: query, // Use original query as fallback
    explanation: 'Fallback to simple keyword extraction due to LLM error',
  };
}
