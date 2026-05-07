"use client";

import { useEffect } from "react";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import {
  useRobotStore,
} from "@/lib/store";
import {
  getConversations,
  getMessages,
  deleteConversation,
} from "@/lib/api";

export function ConversationList() {
  const {
    conversations,
    currentConversationId,
    setConversations,
    setCurrentConversationId,
    setMessages,
    removeConversation,
    cancelStream,
  } = useRobotStore();

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(console.error);
  }, [setConversations]);

  const handleSelect = async (id: number) => {
    if (id === currentConversationId) return;
    cancelStream();
    setCurrentConversationId(id);
    setMessages([]);
    try {
      const msgs = await getMessages(id);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          created_at: m.created_at,
        }))
      );
    } catch {
      // Leave messages empty on error
    }
  };

  const handleNewChat = () => {
    cancelStream();
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      removeConversation(id);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <span className="font-semibold text-slate-200 text-sm">RoboChat</span>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-slate-600 text-center mt-6 px-2">
            No conversations yet.
            <br />
            Start a new chat!
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => handleSelect(conv.id)}
                  className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare
                    size={13}
                    className="shrink-0 text-slate-500"
                  />
                  <span className="flex-1 truncate text-xs">{conv.title}</span>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:text-red-400 transition-all"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">
          Powered by Venice AI
        </p>
      </div>
    </div>
  );
}
