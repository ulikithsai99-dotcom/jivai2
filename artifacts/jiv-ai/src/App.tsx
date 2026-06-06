import { useState, useRef, useEffect } from "react";
import { MicState, MicButton } from "./components/MicButton";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { ResponsePanel } from "./components/ResponsePanel";
import { ActionButtons } from "./components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

type Turn = { role: 'user' | 'assistant'; content: string };

function App() {
  const [micState, setMicState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support voice input.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      if (currentText) {
        setTranscript(prev => prev + " " + currentText);
        
        // Reset silence timeout
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          stopListeningAndProcess();
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== 'no-speech') {
        setMicState("idle");
      }
    };

    recognition.onend = () => {
      if (micState === "listening" && !isProcessingRef.current) {
        // Automatically restart if it stopped but we didn't initiate processing
        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleMic = () => {
    if (micState === "listening") {
      stopListeningAndProcess();
    } else if (micState === "idle") {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      setTranscript("");
      setResponse("");
      setMicState("listening");
      isProcessingRef.current = false;
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListeningAndProcess = async () => {
    if (!recognitionRef.current || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setMicState("thinking");
    recognitionRef.current.stop();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setMicState("idle");
      isProcessingRef.current = false;
      return;
    }

    try {
      const res = await fetch('/api/emergency/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript, history })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) {
                fullResponse += json.content;
                setResponse(prev => prev + json.content);
              }
              if (json.done) {
                break;
              }
            } catch (e) {
              // Ignore malformed JSON chunks
            }
          }
        }
      }

      setHistory(prev => [
        ...prev, 
        { role: 'user', content: finalTranscript },
        { role: 'assistant', content: fullResponse }
      ]);
      setMicState("idle");
    } catch (err) {
      console.error(err);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the emergency assistant.",
        variant: "destructive"
      });
      setMicState("idle");
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleReset = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setMicState("idle");
    setTranscript("");
    setResponse("");
    setHistory([]);
    isProcessingRef.current = false;
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden">
      <header className="flex-none p-6 flex items-start justify-between z-50">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            <h1 className="font-bold tracking-widest uppercase text-sm">JIV AI</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Emergency Assistant</p>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground rounded-full"
          onClick={handleReset}
          title="Safe Exit"
        >
          <X className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto pb-8 relative z-10">
        <ResponsePanel text={response} isThinking={micState === "thinking"} />
        <TranscriptPanel text={transcript} isListening={micState === "listening"} />
        
        <div className="flex-none pt-4 pb-12 w-full flex justify-center">
          <MicButton 
            state={micState} 
            onClick={toggleMic} 
            disabled={micState === "thinking"}
          />
        </div>

        <ActionButtons 
          show={micState === "idle" && response.length > 0} 
          onToggleGuide={() => {}} 
        />
      </main>
      <Toaster />
    </div>
  );
}

export default App;
