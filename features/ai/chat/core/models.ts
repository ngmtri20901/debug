import type { ComponentType } from "react";
import { SparklesIcon } from "@/features/ai/chat/components/core/icons";
import { CpuIcon } from "@/features/ai/chat/components/core/icons";

export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Friendly Tutor",
    description: "A friendly tutor that gives quick, simple, and easy-to-understand explanations.",
    icon: SparklesIcon,
  },
  {
    id: "chat-model-reasoning",
    name: "Insightful Tutor",
    description:
      "An analytical tutor that provides deeper reasoning and detailed grammar insights.",
    icon: CpuIcon,
  },
];
