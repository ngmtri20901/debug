import { getUserOrNull } from "@/shared/lib/supabase/auth";
import { getSuggestionsByDocumentId } from "@/features/ai/chat/services";
import { ChatSDKError } from "@/features/ai/chat/types/error.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter documentId is required."
    ).toResponse();
  }

  const user = await getUserOrNull();
  if (!user) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.user_id !== user.id) {
    return new ChatSDKError("forbidden:api").toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
