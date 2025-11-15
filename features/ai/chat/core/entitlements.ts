import type { ChatModel } from "./models";

/**
 * User type based on authentication and subscription status
 */
export type UserType = "guest" | "FREE" | "PLUS" | "UNLIMITED";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 5,
    availableChatModelIds: ["chat-model"],
  },

  /*
   * For users with FREE subscription
   */
  FREE: {
    maxMessagesPerDay: 5,
    availableChatModelIds: ["chat-model"],
  },

  /*
   * For users with PLUS subscription
   */
  PLUS: {
    maxMessagesPerDay: 60,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * For users with UNLIMITED subscription
   */
  UNLIMITED: {
    maxMessagesPerDay: 200,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
};
