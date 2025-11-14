// Core exports for AI chat functionality
export { myProvider } from './providers';

export {
  DEFAULT_CHAT_MODEL,
  type ChatModel,
  chatModels,
} from './models';

export {
  type UserType,
  entitlementsByUserType,
} from './entitlements';

export {
  nowInVN,
  artifactsPrompt,
  regularPrompt,
  type RequestHints,
  getRequestPromptFromHints,
  systemPrompt,
  vietnameseConversationPrompt,
  vietnameseRAGPrompt,
  updateDocumentPrompt,
} from './prompts';
