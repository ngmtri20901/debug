"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useGeolocation } from "@/shared/hooks/use-geolocation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useArtifactSelector } from "@/features/ai/chat/hooks/use-artifact";
import { useAutoResume } from "@/features/ai/chat/hooks/use-auto-resume";
import type { Vote } from "@/features/ai/chat/types/db.types";
import { ChatSDKError } from "@/features/ai/chat/types/error.types";
import type { ChatMessage, AppUsage } from "@/features/ai/chat/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/features/ai/chat/utils";
import { Artifact } from "../artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "../toolbar/multimodal-input";
import { getChatHistoryPaginationKey } from "../sidebar/sidebar-history";
import { toast } from "sonner";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  // Default visibility is always private
  const visibilityType = "private" as const;

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  
  // Get browser geolocation for accurate weather queries
  const { location: browserLocation, requestLocation } = useGeolocation();
  const hasRequestedLocation = useRef(false);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Auto-request location when user sends a message that might need weather
  useEffect(() => {
    if (input && !browserLocation && !hasRequestedLocation.current) {
      const lowerInput = input.toLowerCase();
      const weatherKeywords = ['weather', 'temperature', 'hot', 'cold', 'rain', 'sunny', 'cloudy', 'forecast'];
      if (weatherKeywords.some(keyword => lowerInput.includes(keyword))) {
        console.log('[Chat] Weather-related query detected, requesting location...');
        requestLocation();
        hasRequestedLocation.current = true;
      }
    }
  }, [input, browserLocation, requestLocation]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        // Check if message is about weather and request location if not already available
        const lastMessage = request.messages.at(-1);
        if (lastMessage && !browserLocation) {
          const messageText = lastMessage.parts
            ?.filter((part) => part.type === 'text')
            .map((part) => 'text' in part ? part.text : '')
            .join(' ')
            .toLowerCase() || '';
          const weatherKeywords = ['weather', 'temperature', 'hot', 'cold', 'rain', 'sunny', 'cloudy', 'forecast'];
          if (weatherKeywords.some(keyword => messageText.includes(keyword))) {
            console.log('[Chat] Weather query detected in message, requesting location...');
            requestLocation();
          }
        }

        return {
          body: {
            id: request.id,
            message: lastMessage,
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            // Include browser geolocation if available (more accurate than IP-based)
            ...(browserLocation && {
              browserGeolocation: {
                latitude: browserLocation.latitude,
                longitude: browserLocation.longitude,
                accuracy: browserLocation.accuracy,
              },
            }),
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast.error(error.message);
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/ai/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background relative">
        <div className="flex-1 overflow-y-auto">
        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
        />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex w-full flex-col gap-4 px-2 pb-3 md:px-4 md:pb-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          {!isReadonly && (
            <div className="pointer-events-auto mx-auto w-full max-w-4xl">
            <MultimodalInput
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              sendMessage={sendMessage}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
            </div>
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        sendMessage={sendMessage}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
