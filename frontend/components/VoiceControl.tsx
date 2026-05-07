"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useRobotStore } from "@/lib/store";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startListening,
  stopListening,
} from "@/lib/speech";

interface Props {
  onTranscript: (text: string) => void;
  isStreaming: boolean;
}

export function VoiceControl({ onTranscript, isStreaming }: Props) {
  const { voiceEnabled, setVoiceEnabled, setAvatarState } = useRobotStore();
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported());
    setTtsSupported(isSpeechSynthesisSupported());
  }, []);

  const handleMicClick = () => {
    if (!sttSupported) return;

    if (isListening) {
      stopListening();
      setIsListening(false);
      setAvatarState("idle");
      return;
    }

    setIsListening(true);
    setAvatarState("listening");

    startListening(
      (transcript) => {
        setIsListening(false);
        setAvatarState("idle");
        onTranscript(transcript);
      },
      (err) => {
        console.warn("STT error:", err);
        setIsListening(false);
        setAvatarState("idle");
      }
    );
  };

  // Stop mic if streaming starts
  useEffect(() => {
    if (isStreaming && isListening) {
      stopListening();
      setIsListening(false);
    }
  }, [isStreaming, isListening]);

  return (
    <div className="flex items-center gap-2">
      {/* Mic button */}
      {sttSupported && (
        <button
          onClick={handleMicClick}
          disabled={isStreaming}
          className={`p-2 rounded-lg transition-all ${
            isListening
              ? "bg-red-600 text-white glow-cyan-sm animate-pulse"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}

      {/* TTS toggle */}
      {ttsSupported && (
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-lg transition-all ${
            voiceEnabled
              ? "bg-cyan-700 text-cyan-200"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
          }`}
          aria-label={voiceEnabled ? "Disable voice output" : "Enable voice output"}
          title={voiceEnabled ? "Disable TTS" : "Enable TTS"}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      )}
    </div>
  );
}
