import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "../components/artifact/artifact";
import type {
  createDocument,
  getWeather,
  requestSuggestions,
  updateDocument,
  vietnameseRAG,
  vietnameseConversation,
  tavilySearch,
  databaseQueryTool,
  topicRecommendationTool
} from "../services/tools";
import type { AppUsage } from "./usage.types";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type vietnameseRAGTool = InferUITool<ReturnType<typeof vietnameseRAG>>;
type vietnameseConversationTool = InferUITool<ReturnType<typeof vietnameseConversation>>;
type tavilySearchTool = InferUITool<ReturnType<typeof tavilySearch>>;
type databaseQueryToolType = InferUITool<ReturnType<typeof databaseQueryTool>>;
type topicRecommendationToolType = InferUITool<ReturnType<typeof topicRecommendationTool>>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  vietnameseRAG: vietnameseRAGTool;
  vietnameseConversation: vietnameseConversationTool;
  tavilySearch: tavilySearchTool;
  databaseQuery: databaseQueryToolType;
  topicRecommendation: topicRecommendationToolType;
};

// RAG Source types
export type RAGSource = {
  id: string;
  content: string;
  relevanceScore: number;
  searchMethod: 'semantic' | 'fulltext' | 'keyword' | 'hybrid';
  metadata?: Record<string, any>;
};

// Tavily Search types
export type TavilySearchSource = {
  url: string;
  title: string;
  content: string;
  score: number;
};

export type TavilySearchResult = {
  query: string;
  answer: string;
  sources: TavilySearchSource[];
  followUpQuestions?: string[];
  images?: Array<{ url: string; description?: string }>;
  responseTime: number;
};

// Vietnamese Conversation types
export type ConversationPersona = {
  name: string;
  role: string;
  personality: string;
};

export type ConversationSceneIntro = {
  situation: string;
  context: string;
  learningObjectives: string[];
};

export type ConversationEvalFeedback = {
  score: number; // 1-10
  feedback: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  suggestions: string[];
};

export type ConversationUserInputPrompt = {
  prompt: string;
  expectedLength: string;
  hints: string[];
};

// Grammar-specific result
export type GrammarExplanation = {
  query: string;
  answer: string;
  sources: Array<{
    id: string;
    content: string;
    contextualizedChunk: string;
    category: { vi: string; en: string };
    grammarPoint: string;
    examples: string[];
    keywords: { vi: string[]; en: string[] };
    headers: Record<string, string>;
    relevanceScore: number;
    searchMethod: string;
  }>;
  relatedTopics: string[];
  responseTime: number;
};

// Folklore-specific result
export type FolkloreResult = {
  query: string;
  answer: string;
  items: Array<{
    id: string;
    type: string; // proverb, folk_song, idiom
    viContent: string[];
    enContent: string[];
    category: { vi: string; en: string };
    subCategory?: { vi: string; en: string };
    definition: { vi: string; en: string };
    detailedExplanations?: any;
    relevanceScore: number;
    searchMethod: string;
  }>;
  culturalContext: string;
  usageExamples: string[];
  responseTime: number;
};

// Unified RAG result (for multi-source queries)
export type RAGResult = {
  query: string;
  answer: string;
  grammarSources?: GrammarExplanation['sources'];
  folkloreSources?: FolkloreResult['items'];
  synthesizedExplanation: string;
  citations: Array<{ index: number; sourceId: string; sourceType: 'grammar' | 'folklore' }>;
  responseTime: number;
};

// Database Query Tool types
export type SQLQuery = {
  naturalLanguageQuery: string;
  sqlQuery: string;
  analysis: {
    tablesUsed: string[];
    filterApplied: boolean;
    aggregationUsed: boolean;
    expectedResultType: 'single_value' | 'list' | 'aggregated_stats';
  };
  queryContext: string;
};

export type QueryResults = {
  results: Array<Record<string, any>>;
  rowCount: number;
  executedQuery: string;
};

export type QueryExplanation = {
  summary: string;
  sections: Array<{
    title: string;
    explanation: string;
  }>;
  insights: string[];
};

export type ChartConfig = {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  xAxisKey: string;
  yAxisKey: string;
  title: string;
  description: string;
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  showLegend: boolean;
  showGrid: boolean;
};

// Topic & Lesson Search Result types
export type TopicResult = {
  topic_id: number;
  vietnamese_title: string;
  english_title: string;
  topic_description: string;
  slug: string;
  zone_name: string;
  zone_level: number;
  lesson_count: number;
  sort_order: number;
};

export type TopicResults = {
  query: string;
  topicIds?: number[];  // For client-side fetching
  themes?: string[];    // Theme names for display
  topics?: TopicResult[]; // Actual topic data (when available)
  totalResults?: number;
  responseTime: number;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
  // RAG types
  grammarExplanation: GrammarExplanation;
  folkloreResult: FolkloreResult;
  ragResult: RAGResult;
  // Tavily Search types
  tavilySearchResult: TavilySearchResult;
  // Vietnamese Conversation types
  conversationPersona: ConversationPersona;
  conversationSceneIntro: ConversationSceneIntro;
  conversationEvalFeedback: ConversationEvalFeedback;
  conversationUserInputPrompt: ConversationUserInputPrompt;
  // Database Query types
  sqlQuery: SQLQuery;
  queryResults: QueryResults;
  queryExplanation: QueryExplanation;
  chartConfig: ChartConfig;
  // Topic Search types
  topicResults: TopicResults;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
