// Error utilities
export {
  visibilityBySurface,
  getMessageByErrorCode,
  getStatusCodeByType,
} from "./error.utils";

// Utils
export {
  generateUUID,
} from "./chat.utils";

// Chat utilities
export {
  cn,
  fetcher,
  fetchWithErrorHandlers,
  getLocalStorage,
  getMostRecentUserMessage,
  getDocumentTimestampByIndex,
  getTrailingMessageId,
  sanitizeText,
  convertToUIMessages,
  getTextFromMessage,
} from "./chat.utils";