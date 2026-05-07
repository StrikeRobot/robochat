"use client";

import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/lib/store";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar icon */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 ${
          isUser ? "bg-indigo-600" : "bg-cyan-800"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-cyan-200" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed chat-prose ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700"
        } ${isStreaming ? "streaming-cursor" : ""}`}
      >
        {message.content.trim() || (isStreaming ? " " : <span className="text-slate-500 italic">...</span>)}
      </div>
    </div>
  );
}
