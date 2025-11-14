"use server";

import { generateText, generateObject, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { z } from "zod";
import { myProvider } from "@/features/ai/chat/core/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/features/ai/chat/services/queries";
import { createClient } from "@/shared/lib/supabase/server";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

// Fallback function to generate title from user message when AI fails
function fallbackTitleFromFirstUserMessage(message: UIMessage): string {
  try {
    // Extract text from message parts
    let text = '';
    if (Array.isArray(message.parts)) {
      text = message.parts
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part.type === 'text') return part.text;
          return '';
        })
        .join(' ');
    }

    // Clean and extract first 6 words
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const titleWords = words.slice(0, 6).join(' ');
    
    // Truncate to 50 characters max
    return titleWords.length > 50 
      ? titleWords.slice(0, 47) + '...' 
      : titleWords || 'New Chat';
  } catch (error) {
    console.error('Fallback title generation failed:', error);
    return 'New Chat';
  }
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    const { text: title } = await generateText({
      model: myProvider.languageModel("title-model"),
      system: `Generate a concise chat title from the user's first message.
    
STRICT RULES:
- MAXIMUM 5 WORDS ONLY - NO MORE!
- MAXIMUM 50 CHARACTERS TOTAL
- No quotes, colons, or punctuation
- Capture the main topic/intent
- Use title case
- If the topic is complex, use the most important keyword

Examples:
"Tell me about Vietnamese grammar" → "Vietnamese Grammar Guide"
"What are proverbs about time?" → "Vietnamese Time Proverbs"
"Help me learn conversation" → "Conversation Practice"
"Show me folk songs about family" → "Family Folk Songs"

RESPOND WITH ONLY THE TITLE - NO EXPLANATIONS!`,
      prompt: JSON.stringify(message),
      maxRetries: 2, // Retry up to 2 times on transient failures
    });

    // Safety fallback: Truncate if still too long
    const safeTitle = title.slice(0, 50).trim();
    return safeTitle || fallbackTitleFromFirstUserMessage(message);
  } catch (error: any) {
    console.warn('Title generation failed, using fallback:', error?.message || error);
    
    // Check if it's a 502 upstream error - common with AI providers
    if (error?.message?.includes('502') || 
        error?.message?.includes('Upstream error') ||
        error?.message?.includes('Invalid JSON response')) {
      console.warn('AI provider experiencing issues (502), using fallback title');
    }
    
    // Always return a valid title using fallback
    return fallbackTitleFromFirstUserMessage(message);
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
}: {
  chatId: string;
}) {
  await updateChatVisiblityById({ chatId, visibility: "private" });
}

// ============================================
// Database Query Tool - Server Actions
// ============================================

// 1. Generate SQL Query from Natural Language
const SQLQuerySchema = z.object({
  sqlQuery: z.string().describe('PostgreSQL SELECT query that answers the user question'),
  analysis: z.object({
    tablesUsed: z.array(z.string()).describe('List of database tables used in the query'),
    filterApplied: z.boolean().describe('Whether user_id filter was applied'),
    aggregationUsed: z.boolean().describe('Whether aggregation functions (COUNT, AVG, etc.) were used'),
    expectedResultType: z.enum(['single_value', 'list', 'aggregated_stats']).describe('Type of result expected'),
  }),
});

export async function generateSQLQuery({
  naturalLanguageQuery,
  queryContext,
  userId,
}: {
  naturalLanguageQuery: string;
  queryContext: string;
  userId: string;
}) {
  const schemaContext = getSchemaForContext(queryContext);
  
  const systemPrompt = `You are a PostgreSQL query generator for a Vietnamese learning app database.

DATABASE SCHEMA (relevant to this query):
${schemaContext}

CRITICAL RULES:
1. ALWAYS include "WHERE user_id = '${userId}'" for tables with user_id column
2. For user_profiles table, use "WHERE id = '${userId}'"
3. ONLY generate SELECT queries - no INSERT, UPDATE, DELETE, or DDL
4. Use explicit column names - avoid SELECT *
5. Use appropriate JOINs when combining tables
6. Apply date filters using PostgreSQL date functions
7. Use aggregate functions (COUNT, AVG, SUM) for statistics
8. Order results logically (usually by date DESC or relevant metric)
9. Limit results to reasonable amounts (LIMIT 100 by default)
10. Handle NULL values appropriately

QUERY CONTEXT: ${queryContext}

Generate a SQL query that answers the user's question while respecting all security constraints.`;

  const result = await generateObject({
    model: myProvider.languageModel("chat-model"),
    schema: SQLQuerySchema,
    system: systemPrompt,
    prompt: `User question: "${naturalLanguageQuery}"
    
Generate a PostgreSQL query that:
1. Answers this specific question
2. Filters by user_id = '${userId}' for security
3. Returns results in a meaningful format
4. Is optimized for performance`,
  });

  return result.object;
}

// 2. Execute SQL Query
interface ExecuteResult {
  results: any[];
  error?: string;
}

export async function executeSQLQuery({
  sqlQuery,
  userId,
}: {
  sqlQuery: string;
  userId: string;
}): Promise<ExecuteResult> {
  try {
    // Validate SQL query before execution
    const validation = validateSQLQuery(sqlQuery, userId);
    if (!validation.valid) {
      return { results: [], error: validation.error };
    }

    // Create Supabase client
    const supabase = await createClient();

    // Execute query using the execute_readonly_query function
    const { data, error } = await supabase.rpc('execute_readonly_query', {
      query_text: sqlQuery,
      user_id: userId,
    });

    if (error) {
      console.error('[executeSQLQuery] Supabase RPC error:', error);
      return { 
        results: [], 
        error: `Query execution failed: ${error.message}` 
      };
    }

    // Handle JSONB response from the function
    if (data && typeof data === 'object') {
      // Check if it's an error response from the function
      if ('error' in data) {
        return { 
          results: [], 
          error: (data as any).error 
        };
      }
      
      // Parse the JSONB result
      const results = Array.isArray(data) ? data : [data];
      return { results };
    }

    return { results: [] };
  } catch (error) {
    console.error('[executeSQLQuery] Unexpected error:', error);
    return {
      results: [],
      error: error instanceof Error ? error.message : 'Failed to execute query',
    };
  }
}

// 3. Explain Query in Plain English
const QueryExplanationSchema = z.object({
  summary: z.string().describe('One-sentence summary of what the query does'),
  sections: z.array(z.object({
    title: z.string().describe('Section title (e.g., "Data Source", "Filtering", "Aggregation")'),
    explanation: z.string().describe('Plain English explanation of this section'),
  })).describe('Breakdown of query logic into sections'),
  insights: z.array(z.string()).describe('Key insights from the results'),
});

export async function explainQuery({
  sqlQuery,
  naturalLanguageQuery,
  results,
}: {
  sqlQuery: string;
  naturalLanguageQuery: string;
  results: any[];
}) {
  const result = await generateObject({
    model: myProvider.languageModel("chat-model"),
    schema: QueryExplanationSchema,
    system: `You are a database query explainer. Break down SQL queries into plain English that non-technical users can understand.`,
    prompt: `Natural Language Question: "${naturalLanguageQuery}"

SQL Query:
\`\`\`sql
${sqlQuery}
\`\`\`

Query Results: ${results.length} rows returned

Explain this query in plain English, breaking it into logical sections. Then provide 2-3 key insights from the results.`,
  });

  return result.object;
}

// 4. Generate Chart Configuration
const ChartConfigSchema = z.object({
  type: z.enum(['line', 'bar', 'area', 'pie', 'donut']).describe('Chart type based on data structure'),
  xAxisKey: z.string().describe('Key from results to use for X-axis'),
  yAxisKey: z.string().describe('Key from results to use for Y-axis'),
  title: z.string().describe('Chart title'),
  description: z.string().describe('Brief description of what the chart shows'),
  colorScheme: z.enum(['blue', 'green', 'purple', 'orange', 'red']).describe('Color scheme'),
  showLegend: z.boolean().describe('Whether to show legend'),
  showGrid: z.boolean().describe('Whether to show grid lines'),
});

export async function generateChartConfig({
  results,
  naturalLanguageQuery,
  queryContext,
}: {
  results: any[];
  naturalLanguageQuery: string;
  queryContext: string;
}) {
  if (results.length === 0) return null;

  // Get sample data structure
  const sampleData = results.slice(0, 3);
  const keys = Object.keys(results[0]);

  const result = await generateObject({
    model: myProvider.languageModel("chat-model"),
    schema: ChartConfigSchema,
    system: `You are a data visualization expert. Generate chart configurations based on query results.`,
    prompt: `Natural Language Question: "${naturalLanguageQuery}"
Query context: ${queryContext}

Data structure:
${JSON.stringify(sampleData, null, 2)}

Available keys: ${keys.join(', ')}
Total data points: ${results.length}

Generate a chart configuration that best visualizes this data. Consider:
- Time series data → line/area chart
- Categorical comparisons → bar chart
- Part-to-whole → pie/donut chart
- Multiple metrics → line chart with multiple series`,
  });

  return result.object;
}

// 5. Generate Topic/Lesson Recommendations
const RecommendationSchema = z.object({
  topics: z.array(z.object({
    topic_id: z.number(),
    vietnamese_title: z.string(),
    english_title: z.string(),
    topic_description: z.string(),
    zone_name: z.string(),
    zone_level: z.number(),
    lesson_count: z.number(),
    reasons: z.array(z.string()).describe('2-3 specific reasons why this topic matches the user query'),
  })),
  lessons: z.array(z.object({
    lesson_id: z.number(),
    lesson_name: z.string(),
    summary: z.string(),
    topic_name: z.string(),
    duration_minutes: z.number(),
    coins_reward: z.number(),
    match_reason: z.string().describe('Why this lesson matches the query'),
  })),
  recommendationType: z.enum(['topics', 'lessons', 'mixed']).describe('What type of recommendations to show'),
});

export async function generateTopicRecommendations({
  naturalLanguageQuery,
  userId,
}: {
  naturalLanguageQuery: string;
  userId: string;
}) {
  try {
    // First, get topics and lessons data
    const supabase = await createClient();
    
    // Get published topics with lesson counts
    const { data: topics, error: topicsError } = await supabase
      .rpc('execute_readonly_query', {
        query_text: `
          SELECT 
            t.topic_id,
            t.vietnamese_title,
            t.english_title,
            t.topic_description,
            z.name as zone_name,
            z.level as zone_level,
            COUNT(l.id) as lesson_count
          FROM topics t
          LEFT JOIN zones z ON t.zone_id = z.id
          LEFT JOIN lessons l ON l.topic_id = t.topic_id AND l.status = 'published'
          WHERE t.status = 'published'
          GROUP BY t.topic_id, t.vietnamese_title, t.english_title, t.topic_description, z.name, z.level
          ORDER BY z.level, t.sort_order
        `,
        user_id: userId,
      });

    if (topicsError) {
      console.error('[generateTopicRecommendations] Topics query error:', topicsError);
      return {
        topics: [],
        lessons: [],
        totalResults: 0,
        recommendationType: 'topics' as const,
        query: naturalLanguageQuery,
      };
    }

    // Get user's completed topics
    const { data: completedTopics, error: progressError } = await supabase
      .rpc('execute_readonly_query', {
        query_text: `
          SELECT DISTINCT topic_id
          FROM user_lesson_progress
          WHERE user_id = '${userId}' AND status = 'completed'
        `,
        user_id: userId,
      });

    const completedTopicIds = new Set(
      Array.isArray(completedTopics) 
        ? completedTopics.map((t: any) => t.topic_id)
        : []
    );

    // Filter out completed topics
    const availableTopics = Array.isArray(topics)
      ? topics.filter((t: any) => !completedTopicIds.has(t.topic_id))
      : [];

    // Use AI to analyze query and recommend topics
    const result = await generateObject({
      model: myProvider.languageModel("chat-model"),
      schema: RecommendationSchema,
      system: `You are a Vietnamese learning course advisor. Analyze the user's query and recommend relevant topics/lessons.

AVAILABLE TOPICS:
${JSON.stringify(availableTopics, null, 2)}

RECOMMENDATION RULES:
1. Match keywords in the query to topic descriptions (e.g., "traveling" → "Du lịch và tham quan")
2. Consider difficulty level - recommend appropriate level for the user
3. Recommend 3-5 most relevant topics
4. For each topic, provide 2-3 specific reasons why it matches the query
5. If query is specific (e.g., "shopping lessons"), recommend individual lessons within that topic
6. If query is general (e.g., "beginner topics"), recommend topics
7. Order by relevance to query

QUERY CONTEXT: topic_recommendations`,
      prompt: `User query: "${naturalLanguageQuery}"

Analyze this query and recommend the most relevant Vietnamese learning topics/lessons. Consider:
1. Keywords match (traveling, shopping, health, greetings, etc.)
2. Difficulty level implied in the query
3. Specific vs. general request
4. User's learning goals

Provide recommendations with clear reasoning.`,
    });

    return {
      ...result.object,
      query: naturalLanguageQuery,
      totalResults: result.object.topics.length + result.object.lessons.length,
    };
  } catch (error) {
    console.error('[generateTopicRecommendations] Error:', error);
    return {
      topics: [],
      lessons: [],
      totalResults: 0,
      recommendationType: 'topics' as const,
      query: naturalLanguageQuery,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function getSchemaForContext(queryContext: string): string {
  const schemas: Record<string, string> = {
    learning_progress: `
-- user_lesson_progress
user_id (uuid, FK to user_profiles) - MUST filter by this
lesson_id (bigint, FK to lessons)
topic_id (bigint, FK to topics)
best_score_percent (numeric)
total_attempts (integer)
status (varchar: 'not_started', 'in_progress', 'completed')
first_attempted_at, last_attempted_at, passed_at (timestamps)

-- lessons
id (bigint, PK)
lesson_name (varchar)
summary (text)
duration_minutes (smallint)
topic_id (bigint, FK to topics)
status (enum: 'draft', 'published', 'archived')

-- topics
topic_id (bigint, PK)
vietnamese_title (text)
english_title (varchar)
topic_description (text)
zone_id (smallint, FK to zones)
status (enum: 'draft', 'published', 'archived')

-- zones
id (bigint, PK)
name (varchar) - Level name (e.g., 'Beginner', 'Elementary', 'Intermediate')
    `,
    
    practice_performance: `
-- practice_results
user_id (uuid, FK to user_profiles) - MUST filter by this
practice_set_id (uuid, FK to practice_sets)
score_percent (real)
total_correct, total_incorrect, total_skipped (integer)
time_spent_seconds (integer)
coins_earned, xp_earned (integer)
practice_date (date)
    `,
    
    flashcards: `
-- flashcard_statistics
user_id (uuid, FK to user_profiles) - MUST filter by this
date (date)
flashcards_reviewed (integer)
correct_answers, total_questions (integer)
accuracy_rate (numeric)
time_spent_minutes (integer)
learning_streak (integer)

-- flashcard_srs_records
user_id (uuid, FK to user_profiles) - MUST filter by this
flashcard_id (varchar)
due_date (date)
total_reviews, correct_reviews (integer)
    `,
    
    topic_recommendations: `
-- topics (for recommendations)
topic_id (bigint, PK)
vietnamese_title (text)
english_title (varchar)
topic_description (text)
zone_id (smallint, FK to zones)
status (enum: 'draft', 'published', 'archived') - ONLY show 'published'
sort_order (smallint)

-- lessons (for topic content)
id (bigint, PK)
lesson_name (varchar)
summary (text)
topic_id (bigint, FK to topics)
duration_minutes (smallint)
coins_reward (smallint)
status (enum: 'draft', 'published', 'archived') - ONLY show 'published'

-- zones (learning levels)
id (bigint, PK)
name (varchar) - e.g., 'Beginner', 'Elementary', 'Intermediate', 'Advanced'
level (smallint) - Numeric level 1-5

-- user_lesson_progress (to check what user completed)
user_id (uuid, FK to user_profiles) - MUST filter by this
topic_id (bigint, FK to topics)
status (varchar: 'not_started', 'in_progress', 'completed')

RECOMMENDATION RULES:
1. ONLY recommend topics where status = 'published'
2. Filter out topics user already completed (check user_lesson_progress)
3. Recommend based on user's current level or slightly higher
4. Match keywords like 'traveling', 'health', 'shopping', 'greetings' to topic descriptions
5. Include zone_name and lesson_count in results
6. Order by zone level and sort_order
    `,
    
    achievements: `
-- user_achievements
user_id (uuid, FK to user_profiles) - MUST filter by this
achievement_id (uuid, FK to achievement_definitions)
current_progress (integer)
is_completed (boolean)
completed_at, claimed_at (timestamps)

-- achievement_definitions
id (uuid, PK)
name (varchar)
description (text)
target_value (integer)
    `,
    
    overall_stats: `
-- user_progress_summary
user_id (uuid, FK to user_profiles) - MUST filter by this
total_flashcards_reviewed, total_flashcards_created (integer)
total_exercises_completed (integer)
total_study_time_minutes (integer)
current_streak_days, max_streak_days (integer)
best_accuracy_rate (numeric)
total_achievements_unlocked (integer)
    `,
  };

  return schemas[queryContext] || schemas.overall_stats;
}

function validateSQLQuery(sqlQuery: string, userId: string): { valid: boolean; error?: string } {
  const query = sqlQuery.toLowerCase().trim();
  
  // 1. Must start with SELECT
  if (!query.startsWith('select')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }
  
  // 2. Check for forbidden keywords
  const forbiddenKeywords = [
    'insert', 'update', 'delete', 'drop', 'truncate', 
    'alter', 'create', 'grant', 'revoke'
  ];
  
  for (const keyword of forbiddenKeywords) {
    if (query.includes(keyword)) {
      return { valid: false, error: `Forbidden keyword detected: ${keyword}` };
    }
  }
  
  // 3. Check for multiple statements (SQL injection prevention)
  const semicolonCount = (query.match(/;/g) || []).length;
  if (semicolonCount > 1 || (semicolonCount === 1 && !query.endsWith(';'))) {
    return { valid: false, error: 'Multiple SQL statements are not allowed' };
  }
  
  // 4. Verify user_id filter is present (basic check)
  if (!query.includes(userId.toLowerCase())) {
    console.warn('[validateSQLQuery] Warning: user_id may not be included in query');
    // Don't fail, as the database function will handle this
  }
  
  return { valid: true };
}
