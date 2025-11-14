import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/features/ai/chat/types";
import { generateUUID } from "@/features/ai/chat/utils";
import type { ServerUser } from "@/shared/lib/supabase/auth";

type ConversationProps = {
  session: ServerUser;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

/**
 * Vietnamese Conversation Role-Play Tool
 * 
 * This tool enables interactive Vietnamese conversation practice where:
 * - LLM generates realistic Vietnamese personas and scenarios
 * - Learner responds in Vietnamese to practice real-world conversations
 * - System provides feedback and corrections on language usage
 * 
 * The tool ONLY streams UI data parts. The LLM generates the actual content
 * as text responses after the tool execution completes.
 */
export const vietnameseConversation = ({ session, dataStream }: ConversationProps) =>
  tool({
    description: `Start or continue a Vietnamese conversation role-play with a local persona. 
    
    This tool creates immersive language learning scenarios for Vietnamese conversation practice.
    
    **Actions:**
    - 'start': Begin a new conversation scenario
      * Generate a Vietnamese persona (name, role, personality)
      * Create a realistic scenario (location, context, learning objectives)
      * Provide a prompt for the learner's first response
      * After tool completes, YOU (the LLM) must respond with the persona's first Vietnamese dialogue
    
    - 'continue': Continue the ongoing conversation
      * Generate the persona's next Vietnamese response based on learner's input
      * Maintain character consistency and scenario context
      * After tool completes, YOU must respond with the persona's Vietnamese dialogue
    
    - 'evaluate': Evaluate the learner's Vietnamese response
      * Provide a score (1-10), feedback, corrections, and suggestions
      * After tool completes, YOU must provide encouraging commentary and explanation
    
    **Important:** This tool streams UI components. The actual Vietnamese dialogue and explanations 
    must come from YOU (the LLM) as text responses after the tool executes.`,
    
    inputSchema: z.object({
      action: z.enum(['start', 'continue', 'evaluate']).describe(
        "Action to perform: 'start' a new conversation, 'continue' the dialogue, or 'evaluate' learner's response"
      ),
      
      // For 'start' action
      personaName: z.string().optional().describe(
        "Vietnamese persona name (e.g., 'Lan', 'Minh'). Required for 'start' action."
      ),
      personaRole: z.string().optional().describe(
        "Persona's role/occupation (e.g., 'café owner', 'taxi driver'). Required for 'start' action."
      ),
      personaPersonality: z.string().optional().describe(
        "Persona's personality traits (e.g., 'friendly and patient'). Required for 'start' action."
      ),
      scenarioSituation: z.string().optional().describe(
        "The conversation situation (e.g., 'You are at a café in Hanoi'). Required for 'start' action."
      ),
      scenarioContext: z.string().optional().describe(
        "Additional context (e.g., 'You want to order coffee'). Required for 'start' action."
      ),
      learningObjectives: z.array(z.string()).optional().describe(
        "Learning objectives for this conversation (e.g., ['Greet in Vietnamese', 'Order food']). Required for 'start' action."
      ),
      
      // For prompts (start and continue)
      promptQuestion: z.string().optional().describe(
        "The prompt question for the learner (e.g., 'How would you greet the café owner?'). Required for 'start' action, optional for 'continue' action."
      ),
      promptExpectedLength: z.string().optional().describe(
        "Expected response length (e.g., '1-2 sentences'). Optional."
      ),
      promptHints: z.array(z.string()).optional().describe(
        "Helpful hints for the learner (e.g., ['Use xin chào for hello']). Optional."
      ),
      
      // For 'evaluate' action
      evaluationScore: z.number().min(1).max(10).optional().describe(
        "Score for the learner's response (1-10). Required for 'evaluate' action."
      ),
      evaluationFeedback: z.string().optional().describe(
        "Overall feedback text. Required for 'evaluate' action."
      ),
      evaluationCorrections: z.array(z.object({
        original: z.string().describe("The learner's original text"),
        corrected: z.string().describe("The corrected version"),
        explanation: z.string().describe("Why this correction is needed"),
      })).optional().describe(
        "List of corrections with explanations. Optional."
      ),
      evaluationSuggestions: z.array(z.string()).optional().describe(
        "Suggestions for improvement. Optional."
      ),
      
      // Metadata
      conversationId: z.string().optional().describe(
        "Unique identifier for the conversation session. Auto-generated if not provided."
      ),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner').describe(
        "Conversation difficulty level."
      ),
    }),
    
    execute: async (input) => {
      const { 
        action,
        difficulty = 'beginner',
        conversationId,
        
        // Start action params
        personaName,
        personaRole,
        personaPersonality,
        scenarioSituation,
        scenarioContext,
        learningObjectives,
        
        // Prompt params
        promptQuestion,
        promptExpectedLength,
        promptHints,
        
        // Evaluate action params
        evaluationScore,
        evaluationFeedback,
        evaluationCorrections,
        evaluationSuggestions,
      } = input;
      
      const convId = conversationId || generateUUID();
      
      try {
        switch (action) {
          case 'start': {
            // Validate required fields for start action
            if (!personaName || !personaRole || !personaPersonality) {
              throw new Error("personaName, personaRole, and personaPersonality are required for 'start' action");
            }
            if (!scenarioSituation || !scenarioContext) {
              throw new Error("scenarioSituation and scenarioContext are required for 'start' action");
            }
            if (!promptQuestion) {
              throw new Error("promptQuestion is required for 'start' action");
            }
            
            // Stream persona data to UI
            dataStream.write({
              type: "data-conversationPersona",
              data: {
                name: personaName,
                role: personaRole,
                personality: personaPersonality,
              },
            });
            
            // Stream scene introduction to UI
            dataStream.write({
              type: "data-conversationSceneIntro",
              data: {
                situation: scenarioSituation,
                context: scenarioContext,
                learningObjectives: learningObjectives || [],
              },
            });
            
            // Stream user input prompt to UI
            dataStream.write({
              type: "data-conversationUserInputPrompt",
              data: {
                prompt: promptQuestion,
                expectedLength: promptExpectedLength || "1-2 sentences",
                hints: promptHints || [],
              },
            });
            
            return {
              success: true,
              conversationId: convId,
              action: 'start',
              message: `Conversation started with ${personaName}. Now respond with the persona's first Vietnamese dialogue.`,
            };
          }
          
          case 'continue': {
            // For continue action, stream a new prompt if provided
            if (promptQuestion) {
              dataStream.write({
                type: "data-conversationUserInputPrompt",
                data: {
                  prompt: promptQuestion,
                  expectedLength: promptExpectedLength || "2-3 sentences",
                  hints: promptHints || [],
                },
              });
            }
            
            return {
              success: true,
              conversationId: convId,
              action: 'continue',
              message: "Conversation continuing. Now respond with the persona's next Vietnamese dialogue.",
            };
          }
          
          case 'evaluate': {
            // Validate required fields for evaluate action
            if (evaluationScore === undefined || !evaluationFeedback) {
              throw new Error("evaluationScore and evaluationFeedback are required for 'evaluate' action");
            }
            
            // Stream evaluation feedback to UI
            dataStream.write({
              type: "data-conversationEvalFeedback",
              data: {
                score: evaluationScore,
                feedback: evaluationFeedback,
                corrections: evaluationCorrections || [],
                suggestions: evaluationSuggestions || [],
              },
            });
            
            return {
              success: true,
              conversationId: convId,
              action: 'evaluate',
              message: "Evaluation complete. Now provide encouraging commentary and explanation.",
            };
          }
          
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error("Vietnamese Conversation Tool Error:", error);
        throw error;
      }
    },
  });
