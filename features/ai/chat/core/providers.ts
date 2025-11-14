import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

// Create OpenRouter instance
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": openrouter.chat("@preset/viovietnamese"),
    "chat-model-reasoning": wrapLanguageModel({
      model: openrouter.chat("tngtech/deepseek-r1t2-chimera:free"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openrouter.chat("@preset/viovietnamese"),
    "artifact-model": openrouter.chat("@preset/viovietnamese"),
  },
});
