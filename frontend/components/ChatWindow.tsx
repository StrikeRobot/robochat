"use client";

import { useEffect, useRef, useState } from "react";
import { useRobotStore } from "@/lib/store";
import { streamChat } from "@/lib/api";
import { speak, cancelSpeech } from "@/lib/speech";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Bot } from "lucide-react";

export function ChatWindow() {
  const {
    messages,
    streamingContent,
    isStreaming,
    currentConversationId,
    voiceEnabled,
    setAvatarState,
    appendStreamToken,
    finalizeStream,
    cancelStream,
    addUserMessage,
    prependConversation,
    updateConversationTitle,
  } = useRobotStore();

  const addCommand = useRobotStore((s) => s.addCommand);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (content: string) => {
    if (isStreaming) return;

    // Abort any lingering stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Optimistic user message
    addUserMessage({
      id: Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    });

    setAvatarState("thinking");
    cancelSpeech();

    let firstToken = true;
    let convId = currentConversationId;

    await streamChat(
      { conversation_id: convId ?? undefined, content },
      {
        onMeta: (meta) => {
          if (!convId) {
            convId = meta.conversation_id;
            useRobotStore.getState().setCurrentConversationId(meta.conversation_id);
          }
          prependConversation({
            id: meta.conversation_id,
            title: meta.title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          updateConversationTitle(meta.conversation_id, meta.title);
        },
        onToken: (token) => {
          if (firstToken) {
            setAvatarState("speaking");
            firstToken = false;
          }
          appendStreamToken(token);
        },
        onCommand: (cmd) => {
          addCommand({ ...cmd, timestamp: Date.now() });
          setAvatarState("executing");
          setTimeout(() => setAvatarState("speaking"), 900);
        },
        onDone: (done) => {
          finalizeStream(done.message_id, done.content);
          setAvatarState("idle");
          if (voiceEnabled && done.content.trim()) {
            speak(done.content);
          }
        },
        onError: (err) => {
          console.error("Stream error:", err);
          cancelStream();
          setAvatarState("idle");
        },
      },
      abortRef.current.signal
    );
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-sm font-medium text-slate-300">
          {currentConversationId ? "Conversation in progress" : "New conversation"}
        </span>
        {isStreaming && (
          <span className="ml-auto text-xs text-cyan-400 animate-pulse">
            RoboChat is responding...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-900/40 border border-cyan-800 flex items-center justify-center">
              <Bot size={28} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">
                Hello, I&apos;m RoboChat
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                An AI assistant living inside a robot. Ask me anything, or tell
                me to wave, dance, or explore my environment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Wave hello and introduce yourself",
                "Scan the room and report what you see",
                "Tell me a robot joke and dance",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSubmit(prompt)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-cyan-700 hover:text-cyan-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streamingContent && (
          <MessageBubble
            message={{
              id: -1,
              role: "assistant",
              content: streamingContent,
              created_at: "",
            }}
            isStreaming
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isStreaming}
          value={inputValue}
          onChange={setInputValue}
        />
        <p className="text-center text-xs text-slate-700 mt-2">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
