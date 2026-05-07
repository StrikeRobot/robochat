const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations/`);
  if (!res.ok) throw new Error(`Failed to load conversations: ${res.status}`);
  return res.json();
}

export async function getMessages(convId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/conversations/${convId}/messages`);
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
  return res.json();
}

export async function deleteConversation(convId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${convId}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204)
    throw new Error(`Failed to delete: ${res.status}`);
}

export async function renameConversation(
  convId: number,
  title: string
): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${convId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to rename: ${res.status}`);
  return res.json();
}

interface StreamCallbacks {
  onMeta: (data: { conversation_id: number; title: string }) => void;
  onToken: (token: string) => void;
  onCommand: (data: { command: string; label: string }) => void;
  onDone: (data: { message_id: number; content: string }) => void;
  onError: (msg: string) => void;
}

export async function streamChat(
  payload: { conversation_id?: number; content: string },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err: unknown) {
    if ((err as Error).name !== "AbortError") {
      callbacks.onError(String(err));
    }
    return;
  }

  if (!res.ok || !res.body) {
    callbacks.onError(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";

      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
            switch (data.type) {
              case "meta":
                callbacks.onMeta(
                  data as { conversation_id: number; title: string }
                );
                break;
              case "token": {
                const tok = data.content as string;
                accumulated += tok;
                callbacks.onToken(tok);
                break;
              }
              case "command":
                callbacks.onCommand(
                  data as { command: string; label: string }
                );
                break;
              case "done":
                callbacks.onDone({
                  message_id: data.message_id as number,
                  content: accumulated,
                });
                break;
              case "error":
                callbacks.onError(data.message as string);
                break;
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    }
  } catch (err: unknown) {
    if ((err as Error).name !== "AbortError") {
      callbacks.onError(String(err));
    }
  }
}
