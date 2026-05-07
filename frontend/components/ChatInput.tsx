"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { SendHorizonal, Loader2 } from "lucide-react";
import { VoiceControl } from "./VoiceControl";

interface Props {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  value: string;
  onChange: (val: string) => void;
}

export function ChatInput({ onSubmit, disabled, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    onChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 bg-slate-900 rounded-xl border border-slate-700 focus-within:border-cyan-700 transition-colors p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message RoboChat..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none leading-relaxed disabled:opacity-50"
        style={{ minHeight: "24px", maxHeight: "120px" }}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        <VoiceControl
          onTranscript={(t) => {
            onChange(t);
            setTimeout(handleSubmit, 100);
          }}
          isStreaming={!!disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <SendHorizonal size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
