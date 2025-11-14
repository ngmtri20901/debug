import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "@tokenlens/core";
import { fetchModels } from "@tokenlens/fetch";
import { getUsage } from "@tokenlens/helpers";
import { getUserOrNull } from "@/shared/lib/supabase/auth";
import { entitlementsByUserType, type UserType } from "@/features/ai/chat/core";
import type { ChatModel } from "@/features/ai/chat/core/models";
import { type RequestHints, systemPrompt } from "@/features/ai/chat/core/prompts";
import { myProvider } from "@/features/ai/chat/core";
import { createDocument, getWeather, requestSuggestions, updateDocument, vietnameseRAG, vietnameseConversation, tavilySearch, databaseQueryTool, topicRecommendationTool } from "@/features/ai/chat/services/tools";
import { isProductionEnvironment } from "@/features/ai/chat/utils/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getUserSubscriptionType,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/chat/errors";
import type { ChatMessage } from "@/lib/chat/types";
import type { AppUsage } from "@/lib/chat/usage";
import { convertToUIMessages, generateUUID } from "@/lib/chat/utils";
import { generateTitleFromUserMessage } from "@/app/(dashboard)/ai/chat/actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
    } = requestBody;

    const user = await getUserOrNull();
    
    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Get user's subscription type from database
    const subscriptionType = await getUserSubscriptionType(user.id);
    const userType: UserType = subscriptionType || "FREE";

    // Check if user has permission to use the selected model
    const entitlements = entitlementsByUserType[userType];
    if (!entitlements.availableChatModelIds.includes(selectedChatModel)) {
      return new ChatSDKError("forbidden:auth").toResponse();
    }

    const messageCount = await getMessageCountByUserId({
      id: user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await getChatById({ id });

    if (chat) {
      if ((chat as any).userId !== user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    } else {
      // Generate title with fallback - never throws
      const title = await generateTitleFromUserMessage({
        message,
      });

      // Save and return the chat record in one operation (no race condition)
      await saveChat({
        id,
        userId: user.id,
        title,
        visibility: "private",
      });
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb as any), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Get current message count to calculate proper message_order
    const existingMessages = await getMessagesByChatId({ id });
    const nextMessageOrder = existingMessages.length;

    await saveMessages({
      messages: [
        {
          id: message.id,
          session_id: id,
          role: "user",
          content: message.parts.map((part: any) => part.text).join(' '),
          parts: message.parts,
          attachments: [],
          metadata: {},
          message_order: nextMessageOrder, // Use current count as order for new message
          created_at: new Date().toISOString(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }: any) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === "chat-model-reasoning"
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "requestSuggestions",
                  "vietnameseRAG",
                  "vietnameseConversation",
                  "tavilySearch",
                  "databaseQuery",
                  "topicRecommendation",
                ],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            getWeather,
            createDocument: createDocument({ session: user, dataStream }),
            updateDocument: updateDocument({ session: user, dataStream }),
            requestSuggestions: requestSuggestions({
              session: user,
              dataStream,
            }),
            vietnameseRAG: vietnameseRAG({ session: user, dataStream }),
            vietnameseConversation: vietnameseConversation({ session: user, dataStream }),
            tavilySearch: tavilySearch({ session: user, dataStream }),
            databaseQuery: databaseQueryTool({ session: user, dataStream }),
            topicRecommendation: topicRecommendationTool({ session: user, dataStream }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        console.log("🚀 onFinish CALLED - Chat ID:", id);
        console.log("📦 Messages received in onFinish:", JSON.stringify({
          messageCount: messages.length,
          messageRoles: messages.map(m => m.role),
          messageIds: messages.map(m => m.id),
        }, null, 2));
        
        try {
          console.log("📝 onFinish callback - Processing messages:", {
            messageCount: messages.length,
            messageRoles: messages.map(m => m.role),
            firstMessage: messages[0] ? {
              id: messages[0].id,
              role: messages[0].role,
              partsCount: messages[0].parts?.length,
              partsSample: messages[0].parts?.[0]
            } : null,
            lastMessage: messages[messages.length - 1] ? {
              id: messages[messages.length - 1].id,
              role: messages[messages.length - 1].role,
              partsCount: messages[messages.length - 1].parts?.length
            } : null
          });

          // Filter out user messages as they're already saved before streaming (line 164-178)
          // Only save assistant messages here to avoid duplicate key errors
          const assistantMessages = messages.filter(m => m.role === 'assistant');
          
          console.log("🔍 Filtering messages:", {
            totalMessages: messages.length,
            assistantMessages: assistantMessages.length,
            roles: messages.map(m => m.role)
          });

          if (assistantMessages.length === 0) {
            console.warn("⚠️ No assistant messages to save in onFinish");
            return;
          }

          // Get current message count to calculate proper message_order for assistant messages
          const allExistingMessages = await getMessagesByChatId({ id });
          const baseMessageOrder = allExistingMessages.length;

          const messagesToSave = assistantMessages.map((currentMessage, index) => {
            const contentFromParts = currentMessage.parts?.map((part: any) => {
              if (typeof part === 'string') return part;
              if (part.type === 'text') return part.text;
              return '';
            }).join(' ') || '';

            const messageData = {
              id: currentMessage.id,
              role: currentMessage.role,
              content: contentFromParts,
              parts: currentMessage.parts || [],
              created_at: new Date().toISOString(),
              attachments: [],
              session_id: id,
              message_order: baseMessageOrder + index, // Continue from current message count
              metadata: {},
            };

            console.log("🔄 Mapping message:", {
              id: messageData.id,
              role: messageData.role,
              contentLength: messageData.content.length,
              partsType: typeof messageData.parts,
              partsLength: Array.isArray(messageData.parts) ? messageData.parts.length : 'not-array'
            });

            return messageData;
          });

          console.log("💾 About to save messages:", {
            count: messagesToSave.length,
            sessionId: id
          });

          await saveMessages({
            messages: messagesToSave,
          });

          console.log("✅ Messages saved successfully in onFinish");
        } catch (error) {
          console.error("❌ Error in onFinish callback:", error);
          // Don't throw to prevent stream from failing
        }

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // Temporarily disable resumable streams for testing
    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");
    console.error("Chat API error:", error, { vercelId });

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const user = await getUserOrNull();

  if (!user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
