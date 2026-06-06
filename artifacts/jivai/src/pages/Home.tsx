import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Phone, ChevronDown, Send } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type MicState = "idle" | "listening" | "processing";

export default function Home() {
  const [micState, setMicState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [, setLocation] = useLocation();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const goToResponse = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sessionStorage.setItem("jivai_transcript", trimmed);
    sessionStorage.removeItem("jivai_history");
    setLocation("/response");
  }, [setLocation]);

  const stopAndProcess = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    const text = transcriptRef.current.trim();
    if (text) {
      setMicState("processing");
      setTimeout(() => goToResponse(text), 400);
    } else {
      setMicState("idle");
      setTranscript("");
      setInterimTranscript("");
    }
  }, [goToResponse]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setShowTextFallback(true);
      return;
    }

    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setMicState("listening");

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      transcriptRef.current = final;
      setTranscript(final);
      setInterimTranscript(interim);

      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (transcriptRef.current.trim()) {
          stopAndProcess();
        }
      }, 2200);
    };

    recognition.onerror = () => {
      setMicState("idle");
      clearSilenceTimer();
    };

    recognition.onend = () => {
      if (micState === "listening") {
        setMicState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    silenceTimerRef.current = setTimeout(() => {
      if (!transcriptRef.current.trim()) {
        recognition.stop();
        setMicState("idle");
      }
    }, 15000);
  }, [micState, stopAndProcess]);

  const handleMicClick = useCallback(() => {
    if (micState === "listening") {
      stopAndProcess();
    } else if (micState === "idle") {
      startListening();
    }
  }, [micState, startListening, stopAndProcess]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.stop();
    };
  }, []);

  const handleTextSubmit = () => {
    const text = textInput.trim();
    if (!text) return;
    goToResponse(text);
  };

  const displayText = transcript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">J</span>
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">JivAI</span>
        </div>
        <a
          href="tel:112"
          className="flex items-center gap-1.5 text-primary text-sm font-bold border border-primary/30 bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          112
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">

          {micState === "idle" && !transcript && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Speak your emergency in any language
              </p>
            </div>
          )}

          {micState !== "idle" && (
            <div className="text-center min-h-[3rem] flex items-center">
              {micState === "listening" && !displayText && (
                <p className="text-muted-foreground text-sm animate-pulse">Listening…</p>
              )}
              {displayText && (
                <p className="text-foreground text-base leading-relaxed text-center">
                  {displayText}
                </p>
              )}
              {micState === "processing" && (
                <p className="text-primary text-sm font-medium">Analyzing…</p>
              )}
            </div>
          )}

          <div className="relative flex items-center justify-center">
            {micState === "listening" && (
              <>
                <span className="absolute w-48 h-48 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "1.8s" }} />
                <span className="absolute w-40 h-40 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "1.4s", animationDelay: "0.2s" }} />
                <span className="absolute w-32 h-32 rounded-full bg-primary/10 animate-pulse" />
              </>
            )}
            {micState === "processing" && (
              <span className="absolute w-36 h-36 rounded-full bg-primary/15 animate-pulse" />
            )}

            <button
              onClick={handleMicClick}
              disabled={micState === "processing"}
              aria-label={micState === "listening" ? "Stop recording" : "Start recording"}
              className={`
                relative z-10 w-28 h-28 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-xl active:scale-95
                ${micState === "listening"
                  ? "bg-primary shadow-primary/40"
                  : micState === "processing"
                  ? "bg-primary/70 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 hover:scale-105 cursor-pointer"
                }
              `}
            >
              {micState === "listening" ? (
                <MicOff className="w-11 h-11 text-primary-foreground" />
              ) : (
                <Mic className="w-11 h-11 text-primary-foreground" />
              )}
            </button>
          </div>

          <div className="text-center">
            {micState === "idle" && (
              <p className="text-foreground/70 text-base font-medium">
                Tap to speak
              </p>
            )}
            {micState === "listening" && (
              <p className="text-primary text-sm font-medium animate-pulse">
                Tap to stop
              </p>
            )}
          </div>

          <button
            onClick={() => setShowTextFallback((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            <span>or type instead</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showTextFallback ? "rotate-180" : ""}`} />
          </button>

          {showTextFallback && (
            <div className="w-full flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleTextSubmit(); }}
                placeholder="Describe your emergency…"
                autoFocus
                className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-muted-foreground space-y-1">
        <p>Hindi · English · Hinglish · any language</p>
        <p>Emergency? Call <a href="tel:112" className="text-primary font-semibold">112</a></p>
      </footer>
    </div>
  );
}
