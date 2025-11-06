import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * Vapi Workflow API - Generate Vietnamese Conversation Prompts
 *
 * This endpoint is called by Vapi.ai workflow after gathering user information.
 *
 * Expected request body from Vapi:
 * {
 *   "topic": "Giới thiệu bản thân",        // Vietnamese topic title
 *   "level": "beginner",                   // beginner | intermediate | advanced
 *   "amount": 5,                           // Number of conversation prompts/questions
 *   "userid": "uuid-user-id",              // User ID from Supabase auth
 *   "conversationType": "free_talk"        // Optional: free_talk | scenario_based | vocabulary_practice | pronunciation_drill
 * }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, level, amount, userid, conversationType = "free_talk" } = body;

    // Validate required fields
    if (!topic || !level || !amount || !userid) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: topic, level, amount, userid",
        },
        { status: 400 }
      );
    }

    // Validate level
    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid level. Must be: beginner, intermediate, or advanced",
        },
        { status: 400 }
      );
    }

    console.log("Generating prompts for Vietnamese learning:", {
      topic,
      level,
      amount,
      conversationType,
    });

    // Generate conversation prompts using Gemini
    const { text: promptsText } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: `You are a Vietnamese language teacher creating conversation prompts for foreign students learning Vietnamese.

**Student Level:** ${level}
**Conversation Topic:** ${topic}
**Number of prompts needed:** ${amount}
**Conversation Type:** ${conversationType}

**Instructions:**
1. Generate ${amount} conversation prompts/questions in Vietnamese
2. Adjust difficulty for ${level} level students
3. Questions should be natural and encourage speaking
4. Focus on the topic: "${topic}"
5. Questions should be appropriate for ${conversationType} practice

**IMPORTANT:**
- Return ONLY the questions in Vietnamese
- Do NOT use special characters like /, *, #, @, etc. (they break the voice assistant)
- Format as a JSON array of strings
- Each question should be clear and conversational
- For beginners: Use simple vocabulary and short sentences
- For intermediate: Mix simple and complex structures
- For advanced: Use natural, varied expressions

**Example format:**
["Bạn tên là gì?", "Bạn đến từ đâu?", "Bạn học tiếng Việt bao lâu rồi?"]

Generate the ${amount} questions now:`,
    });

    // Parse the generated prompts
    let prompts: string[];
    try {
      prompts = JSON.parse(promptsText);
    } catch (parseError) {
      // If parsing fails, try to extract array from text
      const arrayMatch = promptsText.match(/\[.*\]/s);
      if (arrayMatch) {
        prompts = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Failed to parse prompts from AI response");
      }
    }

    // Validate prompts
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error("Invalid prompts format from AI");
    }

    console.log("Generated prompts:", prompts);

    // Get Supabase client
    const supabase = await createClient();

    // Get or find topic_id from database
    let topicId: string | null = null;
    const { data: existingTopic } = await supabase
      .from("voice_topics")
      .select("id")
      .eq("title", topic)
      .eq("is_active", true)
      .single();

    if (existingTopic) {
      topicId = existingTopic.id;
    }

    // Create conversation in database
    const { data: conversation, error: conversationError } = await supabase
      .from("voice_conversations")
      .insert({
        user_id: userid,
        topic_id: topicId,
        topic: topic,
        difficulty_level: level,
        conversation_type: conversationType,
        prompts: prompts,
        status: "active",
        is_completed: false,
      })
      .select()
      .single();

    if (conversationError) {
      console.error("Error creating conversation:", conversationError);
      throw new Error("Failed to save conversation to database");
    }

    console.log("Conversation created successfully:", conversation.id);

    // Return success with conversation ID
    return NextResponse.json(
      {
        success: true,
        data: {
          conversationId: conversation.id,
          prompts: prompts,
          topic: topic,
          level: level,
          message: "Vietnamese conversation prompts generated successfully!",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/vapi/generate:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 * Test with: curl http://localhost:3000/api/vapi/generate
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Vietnamese Learning - Vapi Generate API",
      version: "2.0",
      endpoints: {
        POST: {
          description: "Generate Vietnamese conversation prompts",
          required_fields: ["topic", "level", "amount", "userid"],
          optional_fields: ["conversationType"],
          example: {
            topic: "Giới thiệu bản thân",
            level: "beginner",
            amount: 5,
            userid: "user-uuid-here",
            conversationType: "free_talk",
          },
        },
      },
    },
    { status: 200 }
  );
}
