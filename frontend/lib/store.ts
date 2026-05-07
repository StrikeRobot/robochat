import { create } from "zustand";

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "executing";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CommandEvent {
  command: string;
  label: string;
  timestamp: number;
}

interface RoboChatStore {
  conversations: Conversation[];
  currentConversationId: number | null;
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  avatarState: AvatarState;
  lastCommand: CommandEvent | null;
  commandFeed: CommandEvent[];
  voiceEnabled: boolean;

  setConversations: (convs: Conversation[]) => void;
  prependConversation: (conv: Conversation) => void;
  updateConversationTitle: (id: number, title: string) => void;
  removeConversation: (id: number) => void;
  setCurrentConversationId: (id: number | null) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addUserMessage: (msg: ChatMessage) => void;
  appendStreamToken: (token: string) => void;
  finalizeStream: (messageId: number, content: string) => void;
  cancelStream: () => void;
  setAvatarState: (state: AvatarState) => void;
  addCommand: (cmd: CommandEvent) => void;
  setVoiceEnabled: (enabled: boolean) => void;
}

export const useRobotStore = create<RoboChatStore>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  streamingContent: "",
  isStreaming: false,
  avatarState: "idle",
  lastCommand: null,
  commandFeed: [],
  voiceEnabled: false,

  setConversations: (convs) => set({ conversations: convs }),

  prependConversation: (conv) =>
    set((s) => ({
      conversations: [conv, ...s.conversations.filter((c) => c.id !== conv.id)],
    })),

  updateConversationTitle: (id, title) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      currentConversationId:
        s.currentConversationId === id ? null : s.currentConversationId,
      messages: s.currentConversationId === id ? [] : s.messages,
    })),

  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  setMessages: (msgs) => set({ messages: msgs }),

  addUserMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendStreamToken: (token) =>
    set((s) => ({
      streamingContent: s.streamingContent + token,
      isStreaming: true,
    })),

  finalizeStream: (messageId, content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: messageId,
          role: "assistant" as const,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
      ],
      streamingContent: "",
      isStreaming: false,
    })),

  cancelStream: () => set({ streamingContent: "", isStreaming: false }),

  setAvatarState: (state) => set({ avatarState: state }),

  addCommand: (cmd) =>
    set((s) => ({
      lastCommand: cmd,
      commandFeed: [cmd, ...s.commandFeed].slice(0, 20),
    })),

  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
}));
