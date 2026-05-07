"use client";

// Web Speech API wrappers for STT and TTS.
// Falls back gracefully when the browser doesn't support these APIs.
// Type declarations are in /types/speech.d.ts

type RecognitionCallback = (transcript: string) => void;
type RecognitionErrorCallback = (err: string) => void;

let activeRecognition: SpeechRecognition | null = null;

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (typeof SpeechRecognition !== "undefined" ? SpeechRecognition : null) ??
    (typeof webkitSpeechRecognition !== "undefined"
      ? webkitSpeechRecognition
      : null)
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function startListening(
  onResult: RecognitionCallback,
  onError: RecognitionErrorCallback
): void {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onError("Speech recognition is not supported in this browser.");
    return;
  }

  if (activeRecognition) {
    activeRecognition.abort();
  }

  const rec = new Ctor();
  activeRecognition = rec;
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = "en-US";

  rec.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0]?.[0]?.transcript ?? "";
    if (transcript) onResult(transcript.trim());
  };

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (e.error !== "no-speech" && e.error !== "aborted") {
      onError(`Recognition error: ${e.error}`);
    }
  };

  rec.start();
}

export function stopListening(): void {
  if (activeRecognition) {
    activeRecognition.stop();
    activeRecognition = null;
  }
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.85; // Slightly lower pitch for a robotic feel
  utterance.volume = 1;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
