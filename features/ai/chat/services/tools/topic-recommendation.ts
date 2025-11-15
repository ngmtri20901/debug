import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { createClient } from '@/shared/lib/supabase/server';
import type { ChatMessage } from '@/features/ai/chat/types';

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

// Hard-coded topic theme mappings based on actual database content
// These are used by the LLM to understand user intent and select appropriate themes
export const TOPIC_THEMES = {
  // Basic Communication & Greetings
  'greetings': {
    name: 'Greetings & Introductions',
    description: 'Basic greetings, introductions, saying hello and goodbye',
    topic_ids: [17], // Ways of greetings
    keywords: ['hello', 'hi', 'greeting', 'introduce', 'introduction', 'meet', 'name']
  },
  
  // Identity & Background
  'identity': {
    name: 'Identity & Background',
    description: 'Nationality, occupation, personal information',
    topic_ids: [18, 19], // Talking about Nationality, Talking about Occupations
    keywords: ['nationality', 'country', 'where from', 'job', 'occupation', 'work', 'profession', 'career']
  },
  
  // Daily Life & Communication
  'daily_life': {
    name: 'Daily Life & Communication',
    description: 'Everyday conversations, living situations, basic communication',
    topic_ids: [20, 22], // Living & Speaking, Asking and Giving Information
    keywords: ['daily', 'everyday', 'address', 'live', 'speak', 'communicate', 'ask', 'information']
  },
  
  // Time & Scheduling
  'time': {
    name: 'Time & Scheduling',
    description: 'Telling time, dates, schedules, frequency',
    topic_ids: [21, 23], // Telling the Time, Days, Dates & Time Expressions
    keywords: ['time', 'clock', 'date', 'day', 'month', 'year', 'schedule', 'when', 'frequency', 'often']
  },
  
  // Location & Navigation
  'location': {
    name: 'Location & Navigation',
    description: 'Directions, locations, places, getting around',
    topic_ids: [24], // Locations & Directions
    keywords: ['direction', 'where', 'location', 'place', 'navigate', 'find', 'map', 'way']
  },
  
  // Travel & Transportation
  'travel': {
    name: 'Travel & Transportation',
    description: 'Transportation, traveling, sightseeing, hotels',
    topic_ids: [25, 32, 33, 49], // Transportation & Travel Choices, Traveling and Sightseeing, Renting a Hotel Room, Vacation
    keywords: ['travel', 'trip', 'journey', 'transport', 'bus', 'train', 'taxi', 'airplane', 'hotel', 'accommodation', 'sightseeing', 'vacation', 'holiday', 'tour']
  },
  
  // Family & Relationships
  'family': {
    name: 'Family & Relationships',
    description: 'Family members, relationships, family life',
    topic_ids: [26, 48], // Talking About Family, Family Matters
    keywords: ['family', 'relative', 'parent', 'mother', 'father', 'sibling', 'brother', 'sister', 'child', 'relationship']
  },
  
  // Food & Dining
  'food': {
    name: 'Food & Dining',
    description: 'Ordering food, restaurants, eating, drinking',
    topic_ids: [27], // Ordering Food and Drinks
    keywords: ['food', 'eat', 'drink', 'restaurant', 'order', 'menu', 'meal', 'breakfast', 'lunch', 'dinner', 'cuisine']
  },
  
  // Shopping & Money
  'shopping': {
    name: 'Shopping & Money',
    description: 'Shopping, buying things, money, prices',
    topic_ids: [29, 44], // Shopping Conversations, Money Matters
    keywords: ['shop', 'shopping', 'buy', 'purchase', 'price', 'cost', 'money', 'pay', 'expensive', 'cheap', 'store']
  },
  
  // Health & Wellness
  'health': {
    name: 'Health & Wellness',
    description: 'Health, medical, feeling sick, wellness',
    topic_ids: [30, 42], // Talking About Health, Health
    keywords: ['health', 'medical', 'doctor', 'sick', 'illness', 'medicine', 'hospital', 'feel', 'pain', 'wellness']
  },
  
  // Communication & Phone
  'phone': {
    name: 'Phone & Communication',
    description: 'Phone calls, calling, communication',
    topic_ids: [31], // Talking on the Phone
    keywords: ['phone', 'call', 'telephone', 'ring', 'dial', 'contact']
  },
  
  // Work & Career
  'work': {
    name: 'Work & Career',
    description: 'Jobs, career, workplace, professional life',
    topic_ids: [34, 38], // Occupations and Work, Jobs and Work Changes
    keywords: ['work', 'job', 'career', 'office', 'company', 'business', 'employment', 'workplace', 'professional']
  },
  
  // Housing & Home
  'housing': {
    name: 'Housing & Home',
    description: 'Houses, apartments, living spaces, home',
    topic_ids: [35, 47], // Talking About Houses, Housing
    keywords: ['house', 'home', 'apartment', 'room', 'rent', 'live', 'housing', 'residence']
  },
  
  // Hobbies & Interests
  'hobbies': {
    name: 'Hobbies & Interests',
    description: 'Free time, habits, likes, dislikes, hobbies',
    topic_ids: [36, 37], // Free Time & Habits, Likes, dislikes, and exceptions
    keywords: ['hobby', 'interest', 'free time', 'leisure', 'like', 'enjoy', 'dislike', 'hate', 'habit', 'routine']
  },
  
  // People & Appearance
  'people': {
    name: 'People & Appearance',
    description: 'Describing people, personality, appearance',
    topic_ids: [39, 41], // Person Description, Describing People
    keywords: ['people', 'person', 'describe', 'appearance', 'look', 'personality', 'character', 'trait']
  },
  
  // Education & Learning
  'education': {
    name: 'Education & Learning',
    description: 'Study, school, learning, education',
    topic_ids: [43], // Study
    keywords: ['study', 'learn', 'school', 'education', 'student', 'teacher', 'class', 'course', 'lesson']
  },
  
  // Fashion & Clothing
  'fashion': {
    name: 'Fashion & Clothing',
    description: 'Clothes, fashion, style, wearing',
    topic_ids: [46], // Clothing and Fashion
    keywords: ['clothes', 'clothing', 'fashion', 'wear', 'dress', 'shirt', 'pants', 'style', 'outfit']
  },
};

// Input schema - LLM selects relevant theme categories
const TopicRecommendationSchema = z.object({
  query: z.string().describe('The user\'s original query'),
  selectedThemes: z.array(z.string()).describe('Array of theme keys that match the user query. Choose from: ' + Object.keys(TOPIC_THEMES).join(', ')),
});

export const topicRecommendationTool = ({ session, dataStream }: Args) => 
  tool({
    description: `Recommend Vietnamese learning topics based on semantic theme matching.

Available themes:
${Object.entries(TOPIC_THEMES).map(([key, theme]) => 
  `- ${key}: ${theme.name} (${theme.description})`
).join('\n')}

This tool works by:
1. Analyzing the user's query to understand their learning interests
2. Selecting relevant theme categories from the predefined list
3. Fetching actual topic data from the database
4. Returning formatted topic information to display

Use this when users ask about:
- Learning specific topics (e.g., "teach me about shopping", "health topics")
- Finding content by category (e.g., "travel lessons", "work-related topics")
- Exploring subject areas (e.g., "food and dining", "family conversations")
- Discovering courses (e.g., "what can I learn about fashion?")

Examples:
- "Find topics about traveling" → select 'travel' theme
- "I want to learn about health" → select 'health' theme
- "Show me shopping and food topics" → select 'shopping' and 'food' themes
- "Teach me greetings and introductions" → select 'greetings' theme`,
    
    inputSchema: TopicRecommendationSchema,
    
    execute: async ({ query, selectedThemes }) => {
      const startTime = Date.now();
      
      try {
        console.log(`[Topic Recommendation] User query: "${query}"`);
        console.log(`[Topic Recommendation] Selected themes:`, selectedThemes);
        
        // Collect all topic IDs from selected themes
        const topicIds: number[] = [];
        const matchedThemes: string[] = [];
        
        for (const themeKey of selectedThemes) {
          const theme = TOPIC_THEMES[themeKey as keyof typeof TOPIC_THEMES];
          if (theme) {
            topicIds.push(...theme.topic_ids);
            matchedThemes.push(theme.name);
          }
        }
        
        if (topicIds.length === 0) {
          return {
            error: `I couldn't find topics matching "${query}". Try asking about: greetings, travel, food, shopping, health, work, family, or hobbies.`
          };
        }
        
        console.log(`[Topic Recommendation] Topic IDs to query:`, topicIds);
        
        // Fetch actual topic data from Supabase using RPC function
        const supabase = await createClient();
        
        console.log('[Topic Recommendation] Calling RPC with params:', {
          function: 'get_topics_by_ids',
          topic_ids: topicIds,
          count: topicIds.length
        });
        
        const { data: rpcData, error: topicsError } = await supabase
          .rpc('get_topics_by_ids', {
            topic_ids: topicIds
          });

        console.log('[Topic Recommendation] RPC response:', {
          hasData: !!rpcData,
          dataType: typeof rpcData,
          dataIsArray: Array.isArray(rpcData),
          dataLength: Array.isArray(rpcData) ? rpcData.length : 'n/a',
          hasError: !!topicsError,
          error: topicsError,
          rawData: rpcData
        });

        if (topicsError) {
          console.error('[Topic Recommendation] Database error:', topicsError);
          return {
            error: `Database error: ${topicsError.message}`
          };
        }

        // The RPC now returns JSONB directly - it's already an array
        const topicsData = rpcData as any;

        if (!topicsData || (Array.isArray(topicsData) && topicsData.length === 0)) {
          console.warn('[Topic Recommendation] No topics found');
          return {
            error: 'No topics found for the selected themes.'
          };
        }

        // Data is already formatted from RPC function - normalize a few display fields
        const topics = (topicsData as any[]).map((topic) => ({
          ...topic,
          zone_name: typeof topic.zone_name === 'string' ? topic.zone_name.trim() : topic.zone_name,
        }));

        const responseTime = Date.now() - startTime;

        const summaryDetails = topics
          .map((topic) => {
            const levelLabel = topic.zone_name ? `${topic.zone_name}` : `Level ${topic.zone_level}`;
            const lessonLabel = typeof topic.lesson_count === 'number'
              ? `${topic.lesson_count} lesson${topic.lesson_count === 1 ? '' : 's'}`
              : 'lessons available';
            const description = topic.topic_description || 'No description provided.';
            return `• ${topic.english_title} (${levelLabel} – ${lessonLabel}) – ${description}`;
          })
          .join('\n');
        
        console.log(`[Topic Recommendation] Found ${topics.length} topics in ${responseTime}ms`);
        
        // Stream the complete topic data to the UI (like Tavily does)
        dataStream.write({
          type: 'data-topicResults',
          data: {
            query,
            topics, // Send actual topic data, not just IDs
            themes: matchedThemes,
            responseTime,
          },
        });
        
        // Return summary message for LLM to read
        const themesList = matchedThemes.join(', ');
        const introLine = `Found ${topics.length} Vietnamese learning topics in the following categories: ${themesList}. Here are the key lessons you can review:`;

        return {
          message: `${introLine}\n${summaryDetails}`
        };
      } catch (error) {
        console.error('[Topic Recommendation] Error:', error);
        return {
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
      }
    },
  });
