import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { ChatMessage } from "@/features/ai/chat/types";

type Session = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Args = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const tavilySearch = ({ session, dataStream }: Args) =>
  tool({
    description: `Search the web for current, factual information using Tavily API.
    
Use this tool when:
- User asks about current events or recent information
- User asks about facts, dates, statistics, or historical facts that need verification
- You are uncertain about factual accuracy
- User explicitly requests a web search

Do NOT use this tool for:
- Creative writing or opinions
- Vietnamese language learning (use vietnameseConversation instead)
- Code or document creation (use respective tools)
`,
    inputSchema: z.object({
      query: z.string().describe("The search query to look up"),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of search results to return (1-10)"),
      includeImages: z
        .boolean()
        .default(false)
        .describe("Whether to include related images in results"),
      searchDepth: z
        .enum(["basic", "advanced"])
        .default("basic")
        .describe(
          "Search depth - 'basic' for quick results, 'advanced' for comprehensive search"
        ),
    }),
    execute: async ({ query, maxResults, includeImages, searchDepth }) => {
      const startTime = Date.now();

      try {
        // Initialize Tavily client
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
          throw new Error("TAVILY_API_KEY is not configured");
        }

        const tvly = tavily({ apiKey });

        // Perform the search
        const response = await tvly.search(query, {
          maxResults,
          includeImages,
          searchDepth,
          includeAnswer: true,
        });

        const responseTime = Date.now() - startTime;

        // Transform sources
        const sources = response.results.map((result: any) => ({
          url: result.url,
          title: result.title,
          content: result.content,
          score: result.score,
        }));

        // Build the result object
        const searchResult = {
          query,
          answer: response.answer || "",
          sources,
          images: includeImages && response.images 
            ? response.images.map((img: any) => ({
                url: img.url || img,
                description: img.description
              }))
            : undefined,
          responseTime,
        };

        // Stream the result to the UI
        dataStream.write({
          type: "data-tavilySearchResult",
          data: searchResult,
        });

        // Return a success message
        return `Found ${sources.length} relevant sources for "${query}". Results have been displayed.`;
      } catch (error) {
        console.error("Tavily search error:", error);

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message.includes("TAVILY_API_KEY")) {
            return "Search is currently unavailable - API key not configured.";
          }
          return `Search failed: ${error.message}`;
        }

        return "An unexpected error occurred during the search.";
      }
    },
  });