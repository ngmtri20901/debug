import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { 
  generateSQLQuery, 
  executeSQLQuery, 
  explainQuery, 
  generateChartConfig 
} from '@/app/(app)/ai/chat/actions';
import type { ChatMessage } from '../../types';
import type { ServerUser } from '@/shared/lib/supabase/auth';

type DatabaseQueryProps = {
  session: ServerUser;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

// Input schema for the database query tool
const DatabaseQuerySchema = z.object({
  query: z.string().describe('Natural language question about user learning data'),
  queryContext: z.enum([
    'learning_progress',
    'practice_performance',
    'flashcards',
    'chat_analytics',
    'achievements',
    'overall_stats'
  ]).describe('Category of the query to help understand database schema context'),
  includeVisualization: z.boolean().default(false).describe('Whether to generate a chart visualization'),
});

export const databaseQueryTool = ({ session, dataStream }: DatabaseQueryProps) => 
  tool({
    description: `Query the user's learning database to answer questions about their progress, performance, and statistics. 
    
Use this tool when users ask about:
- Lesson completion, scores, and learning progress
- Practice session results and quiz performance
- Flashcard review statistics and SRS (Spaced Repetition System) data
- Chat conversation history and analytics
- Achievement and quest progress
- Overall learning metrics, time spent, and streaks

The tool automatically filters all data to show only the current user's information for security.

Examples of questions this tool can answer:
- "How many lessons have I completed?"
- "What's my average quiz score?"
- "How many flashcards are due for review today?"
- "Show my practice history for the last week"
- "What achievements have I unlocked?"
- "How much time have I spent studying?"`,
    
    inputSchema: DatabaseQuerySchema,
    
    execute: async ({ query, queryContext, includeVisualization }) => {
      try {
        // Get current user ID from session
        // With stateless token auth, session is guaranteed to be available
        const userId = session?.id;
        
        if (!userId) {
          console.error('[Database Query Tool] No user ID. Session:', session);
          return { error: 'User not authenticated' };
        }

        // 1. Generate SQL query from natural language
        console.log(`[Database Query Tool] Generating SQL for: "${query}"`);
        const { sqlQuery, analysis } = await generateSQLQuery({
          naturalLanguageQuery: query,
          queryContext,
          userId,
        });

        // Stream SQL query to UI
        dataStream.write({
          type: 'data-sqlQuery',
          data: {
            naturalLanguageQuery: query,
            sqlQuery,
            analysis,
            queryContext,
          },
        });

        // 2. Execute SQL query
        console.log(`[Database Query Tool] Executing SQL query...`);
        const { results, error: execError } = await executeSQLQuery({
          sqlQuery,
          userId,
        });

        if (execError) {
          console.error(`[Database Query Tool] Execution error:`, execError);
          return { error: execError, sqlQuery };
        }

        console.log(`[Database Query Tool] Query returned ${results.length} rows`);

        // Stream query results to UI
        dataStream.write({
          type: 'data-queryResults',
          data: {
            results,
            rowCount: results.length,
            executedQuery: sqlQuery,
          },
        });

        // 3. Generate query explanation
        console.log(`[Database Query Tool] Generating explanation...`);
        const explanation = await explainQuery({
          sqlQuery,
          naturalLanguageQuery: query,
          results,
        });

        dataStream.write({
          type: 'data-queryExplanation',
          data: explanation,
        });

        // 4. Optionally generate chart configuration
        if (includeVisualization && results.length > 0) {
          console.log(`[Database Query Tool] Generating chart config...`);
          try {
            const chartConfig = await generateChartConfig({
              results,
              naturalLanguageQuery: query,
              queryContext,
            });

            if (chartConfig) {
              dataStream.write({
                type: 'data-chartConfig',
                data: chartConfig,
              });
            }
          } catch (chartError) {
            console.error(`[Database Query Tool] Chart generation failed:`, chartError);
            // Don't fail the whole tool if chart generation fails
          }
        }

        console.log(`[Database Query Tool] Successfully completed query`);

        return {
          success: true,
          resultCount: results.length,
          hasVisualization: includeVisualization && results.length > 0,
          summary: `Found ${results.length} result${results.length !== 1 ? 's' : ''} for your query.`,
        };

      } catch (error) {
        console.error('[Database Query Tool] Unexpected error:', error);
        
        return {
          error: error instanceof Error ? error.message : 'Failed to query database',
        };
      }
    },
  });