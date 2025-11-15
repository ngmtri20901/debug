import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/features/ai/chat/services";
import type { Suggestion } from "@/features/ai/chat/types";
import type { ChatMessage } from "@/features/ai/chat/types";
import { generateUUID } from "@/features/ai/chat/utils";
import { ServerUser } from "@/shared/lib/supabase/auth";
import { myProvider } from "@/features/ai/chat/core";

type RequestSuggestionsProps = {
  session: ServerUser;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description: "Request suggestions for a document",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: "Document not found",
        };
      }

      const suggestions: Omit<
        Suggestion,
        "userId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const { elementStream } = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
        prompt: document.content,
        output: "array",
        schema: z.object({
          originalSentence: z.string().describe("The original sentence"),
          suggestedSentence: z.string().describe("The suggested sentence"),
          description: z.string().describe("The description of the suggestion"),
        }),
      });

      for await (const element of elementStream) {
        const suggestion: Suggestion = {
          document_id: documentId,
          document_created_at: document.createdAt || new Date().toISOString(),
          original_text: element.originalSentence,
          suggested_text: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          is_resolved: false,
          created_at: new Date().toISOString(),
          user_id: "",
        };

        dataStream.write({
          type: "data-suggestion",
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      if (session.id) {
        const userId = session.id;

        // Update user_id for each suggestion before saving
        suggestions.forEach((suggestion) => {
          suggestion.user_id = userId;
        });

        await saveSuggestions({
          suggestions: suggestions,
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Suggestions have been added to the document",
      };
    },
  });
