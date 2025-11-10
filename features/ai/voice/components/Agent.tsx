"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/features/ai/voice/vapi.sdk";
import { vietnameseTutorAssistant } from "@/shared/constants/vietnamese-voice";
import { createFeedback } from "@/features/ai/voice/actions/voice.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  conversationId,
  feedbackId,
  type,
  topicTitle,
  prompts,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("Generating feedback for conversation:", conversationId);

      const { success, data } = await createFeedback({
        conversationId: conversationId!,
        transcript: messages,
        feedbackId,
      });

      if (success && data) {
        router.push(`/ai/voice-chat/speak/${conversationId}/feedback`);
      } else {
        console.error("Error generating feedback");
        router.push("/ai/voice-chat");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "practice") {
        // Practice mode - just go back to topics
        router.push("/ai/voice-chat");
      } else {
        // Conversation mode - generate feedback
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, conversationId, router, type]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "practice") {
      // Practice mode - use workflow for quick practice
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
          topic: topicTitle || "Vietnamese conversation",
        },
      });
    } else {
      // Conversation mode - use assistant config with prompts
      let formattedPrompts = "";
      if (prompts && prompts.length > 0) {
        formattedPrompts = prompts.map((p) => `- ${p}`).join("\n");
      }

      // Create assistant config with Vietnamese tutor system message
      const assistantConfig = {
        ...vietnameseTutorAssistant,
        firstMessage:
          topicTitle
            ? `Xin chào ${userName}! Today we will talk about "${topicTitle}". Are you ready? (Bạn đã sẵn sàng chưa?)`
            : `Xin chào ${userName}! I'm your AI tutor. Let's practice Vietnamese together! (Chúng ta cùng luyện tiếng Việt nhé!)`,
      };

      // If we have prompts, add them to system message
      if (formattedPrompts) {
        assistantConfig.model.messages[0].content += `\n\n**Gợi ý câu hỏi để hỏi người học:**\n${formattedPrompts}`;
      }

      await vapi.start(assistantConfig);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* Vietnamese AI Tutor Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="Vietnamese AI Tutor"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Tutor</h3>
          {topicTitle && (
            <p className="text-sm text-gray-500 mt-1">{topicTitle}</p>
          )}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Start Call"
                : "Connecting..."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End Call
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
