export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "DeepSeek V3.1",
    description: "DeepSeek's advanced model with fast processing",
  },
  {
    id: "chat-model-reasoning",
    name: "DeepSeek-r1t2-chimera",
    description:
      "DeepSeek's advanced reasoning model with enhanced chain-of-thought capabilities",
  },
];
