import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Shield,
  Phone,
  AlertTriangle,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  X,
  MapPin,
  Navigation,
  Building2,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useClassifyEmergency } from "@workspace/api-client-react";

type GpsLocation = { lat: number; lng: number; accuracy: number };

type NearbyPlace = {
  name: string;
  amenity: string;
  distKm: number;
  lat: number;
  lng: number;
  phone: string | null;
  address: string | null;
};

function detectLang(text: string): string {
  const t = text.toLowerCase();
  const hindiRoman = ["hai", "hain", "meri", "mere", "mera", "ko", " aur ", "karo", "karo.", " pe ", "gaya", "hua", "nahi", "abhi", "turant", "ghabrao", "dadi", "nana", "bhai", "behen", "khoon", "dard", "chot", "pair"];
  const tamil   = ["amma", "appa", "naan", "vanakkam", "hospital", "vendam", "illai", "irukku", "sollu"];
  const telugu  = ["nenu", "meeru", "undi", "ledu", "cheppandi", "doctor", "ayya", "amma"];
  const bengali = ["ami", "amar", "tumi", "apni", "achhe", "nei", "hoya", "koro"];
  const marathi = ["maza", "mazi", "aahe", "nahi", "kara", "tya", "hya", "sangto"];

  const score = (words: string[]) => words.filter(w => t.includes(w)).length;

  const scores = [
    { lang: "hi-IN", s: score(hindiRoman) },
    { lang: "ta-IN", s: score(tamil) },
    { lang: "te-IN", s: score(telugu) },
    { lang: "bn-IN", s: score(bengali) },
    { lang: "mr-IN", s: score(marathi) },
  ];
  const best = scores.sort((a, b) => b.s - a.s)[0];
  return best.s > 0 ? best.lang : "en-IN";
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/^\s*[\-\*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

type ClassificationResult = {
  category: string;
  subcategory: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: "high" | "medium" | "low";
  clarificationNeeded: boolean;
  question?: string | null;
  helplines?: { name: string; number: string; when: string }[];
  immediateActions?: string[];
  emergencyScore?: number;
  primaryCallNumber?: string;
  severity?: string;
  recommended_action?: string;
  patient?: {
    age: number | null;
    gender: string;
    relation: string | null;
    ageGroup: string;
    ageInferred: boolean;
  };
};

type Turn = { role: "user" | "assistant"; content: string };

const URGENCY_CONFIG = {
  CRITICAL: { label: "CRITICAL", classes: "bg-red-500/20 text-red-400 border-red-500/40", dot: "bg-red-500" },
  HIGH:     { label: "HIGH",     classes: "bg-orange-500/20 text-orange-400 border-orange-500/40", dot: "bg-orange-500" },
  MEDIUM:   { label: "MEDIUM",   classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", dot: "bg-yellow-400" },
  LOW:      { label: "LOW",      classes: "bg-green-500/20 text-green-400 border-green-500/40",  dot: "bg-green-500" },
};

const AUTO_CALL_THRESHOLD    = 85;
const COUNTDOWN_SECONDS      = 5;
const SECONDARY_CONTACT      = "+916361404977";
const SECONDARY_CONTACT_DISPLAY = "+91 6361404977";

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p
        key={i}
        className="text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: bold }}
      />
    );
  });
}

export default function Response() {
  const [, setLocation] = useLocation();
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [response, setResponse]   = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone]           = useState(false);
  const [history, setHistory]     = useState<Turn[]>([]);
  const [followUp, setFollowUp]   = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [countdown, setCountdown]         = useState<number | null>(null);
  const [callCancelled, setCallCancelled] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [secondaryCountdown, setSecondaryCountdown]   = useState<number | null>(null);
  const [secondaryDismissed, setSecondaryDismissed]   = useState(false);
  const secondaryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gps, setGps]           = useState<GpsLocation | null>(null);
  const [gpsState, setGpsState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const gpsRef = useRef<GpsLocation | null>(null);

  const [nearbyPlaces, setNearbyPlaces]   = useState<NearbyPlace[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking]     = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const transcript = sessionStorage.getItem("jivai_transcript") || "";
  const classifyMutation = useClassifyEmergency();

  const getBase = () => {
    const base = import.meta.env.BASE_URL || "/";
    return base.endsWith("/") ? base : base + "/";
  };

  const fireBackendCall = useCallback(async (transcript: string, category: string) => {
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      const cl = classification;
      await fetch(`${base}/api/emergency/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          category:          cl?.category        ?? category,
          subcategory:       cl?.subcategory      ?? "",
          severity:          cl?.severity         ?? "",
          urgency:           cl?.urgency          ?? "",
          patientAge:        cl?.patient?.age     ?? null,
          patientGender:     cl?.patient?.gender  ?? "Unknown",
          patientRelation:   cl?.patient?.relation ?? null,
          recommendedAction: cl?.recommended_action ?? "",
          to: SECONDARY_CONTACT,
        }),
      });
    } catch { /* silent — Twilio call placed server-side */ }
  }, [classification]);

  const triggerSecondaryPrompt = useCallback((txScript: string, cat: string) => {
    if (secondaryDismissed) return;
    let secs = COUNTDOWN_SECONDS;
    setSecondaryCountdown(secs);
    secondaryRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(secondaryRef.current!);
        setSecondaryCountdown(null);
        setSecondaryDismissed(true);
        fireBackendCall(txScript, cat);
      } else {
        setSecondaryCountdown(secs);
      }
    }, 1000);
  }, [secondaryDismissed, fireBackendCall]);

  const dismissSecondary = () => {
    if (secondaryRef.current) clearInterval(secondaryRef.current);
    setSecondaryCountdown(null);
    setSecondaryDismissed(true);
  };

  const cancelAutoCall = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    setCallCancelled(true);
  };

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) { setGpsState("denied"); return; }
    setGpsState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: GpsLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        gpsRef.current = loc;
        setGps(loc);
        setGpsState("granted");
      },
      () => setGpsState("denied"),
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speakText = useCallback((text: string, lang: string) => {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    const clean = stripMarkdown(text);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart  = () => setSpeaking(true);
    utt.onend    = () => setSpeaking(false);
    utt.onerror  = () => setSpeaking(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [stopSpeaking]);

  const fetchNearby = useCallback(async (loc: GpsLocation, category: string) => {
    setNearbyLoading(true);
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      const res = await fetch(`${base}/api/emergency/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: loc.lat, lng: loc.lng, category }),
      });
      if (res.ok) {
        const data = await res.json() as { places: NearbyPlace[] };
        setNearbyPlaces(data.places);
      }
    } catch { /* silently fail */ }
    finally { setNearbyLoading(false); }
  }, []);

  const initiateCall = useCallback((number: string, andThenSecondary = false, txScript = "", cat = "") => {
    window.location.href = `tel:${number}`;
    if (andThenSecondary) {
      setTimeout(() => triggerSecondaryPrompt(txScript, cat), 1500);
    }
  }, [triggerSecondaryPrompt]);

  useEffect(() => {
    if (!classification || callCancelled) return;
    const score = classification.emergencyScore ?? 0;
    if (score <= AUTO_CALL_THRESHOLD) return;

    const number = classification.primaryCallNumber ?? "112";
    let secs = COUNTDOWN_SECONDS;
    setCountdown(secs);

    countdownRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        setCountdown(null);
        initiateCall(number, true, transcript, classification.category ?? "");
      } else {
        setCountdown(secs);
      }
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [classification, callCancelled, initiateCall]);

  const streamGuidance = useCallback(async (text: string, hist: Turn[]) => {
    setStreaming(true);
    setResponse("");
    setDone(false);

    try {
      const body: Record<string, unknown> = { transcript: text, history: hist };
      if (gpsRef.current) body.location = gpsRef.current;

      const res = await fetch(`${getBase()}api/emergency/guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Guidance request failed");

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) { full += data.content; setResponse(full); }
            if (data.done) {
              setDone(true);
              setStreaming(false);
              setHistory(prev => [...prev,
                { role: "user",      content: text },
                { role: "assistant", content: full },
              ]);
            }
            if (data.error) { setError("AI error. Showing knowledge-based guidance."); setStreaming(false); }
          } catch { /* ignore partial chunks */ }
        }
      }
    } catch {
      setError("Could not connect to AI service. Call 112 immediately if life-threatening.");
      setStreaming(false);
    }
  }, []);

  useEffect(() => {
    if (!transcript) { setLocation("/"); return; }

    requestGps();

    classifyMutation.mutate(
      { data: { transcript } },
      {
        onSuccess: (result) => setClassification(result as ClassificationResult),
        onError: () => setClassification({
          category: "Emergency", subcategory: "Unclassified",
          urgency: "HIGH", confidence: "low", clarificationNeeded: false,
          emergencyScore: 72, primaryCallNumber: "112",
        }),
      }
    );

    streamGuidance(transcript, []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gps && classification && !nearbyPlaces && !nearbyLoading) {
      fetchNearby(gps, classification.category);
    }
  }, [gps, classification]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done && response && ttsEnabled) {
      const lang = detectLang(transcript);
      speakText(response, lang);
    }
    if (!ttsEnabled) stopSpeaking();
  }, [done, ttsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [response, history]);

  const handleFollowUp = async () => {
    const text = followUp.trim();
    if (!text || followUpLoading) return;
    setFollowUp("");
    setFollowUpLoading(true);
    await streamGuidance(text, history);
    setFollowUpLoading(false);
  };

  const urgencyCfg = classification
    ? URGENCY_CONFIG[classification.urgency] ?? URGENCY_CONFIG.HIGH
    : null;

  const score        = classification?.emergencyScore ?? 0;
  const callNumber   = classification?.primaryCallNumber ?? "112";
  const showCountdown = countdown !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Auto-call countdown banner */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-primary/10 px-5 py-4 border-b border-primary/30">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-bold text-foreground">Auto-Calling Emergency</span>
              </div>
            </div>
            <div className="px-5 py-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">
                Emergency score <span className="font-bold text-primary">{score}/100</span> — calling
              </p>
              <p className="text-5xl font-black text-primary mb-1">{callNumber}</p>
              <p className="text-muted-foreground text-sm mb-6">in {countdown} second{countdown !== 1 ? "s" : ""}…</p>
              <div className="flex gap-3">
                <a
                  href={`tel:${callNumber}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:opacity-90"
                  onClick={() => {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setCountdown(null);
                    setTimeout(() => triggerSecondaryPrompt(transcript, classification?.category ?? ""), 1500);
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
                <button
                  onClick={cancelAutoCall}
                  className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3 rounded-xl text-sm hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary contact auto-call */}
      {secondaryCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-card border-2 border-orange-500/60 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-orange-500/10 px-5 py-4 border-b border-orange-500/30">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-400 animate-pulse" />
                <span className="font-bold text-foreground">Calling Emergency Contact</span>
              </div>
            </div>
            <div className="px-5 py-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Dialing via network in</p>
              <p className="text-5xl font-black text-orange-400 mb-1">{secondaryCountdown}</p>
              <p className="text-muted-foreground text-xs mb-1">second{secondaryCountdown !== 1 ? "s" : ""}…</p>
              <p className="text-base font-bold text-foreground mb-1">{SECONDARY_CONTACT_DISPLAY}</p>
              <p className="text-xs text-muted-foreground mb-6">They will receive a voice call with emergency details</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (secondaryRef.current) clearInterval(secondaryRef.current);
                    setSecondaryCountdown(null);
                    setSecondaryDismissed(true);
                    fireBackendCall(transcript, classification?.category ?? "");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </button>
                <button
                  onClick={dismissSecondary}
                  className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3 rounded-xl text-sm hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          New Emergency
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">JivAI</span>
        </div>
        <a
          href="tel:112"
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          112
        </a>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* User transcript */}
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Your emergency</p>
          <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
        </div>

        {/* Classification + Score */}
        {classification ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-bold ${urgencyCfg?.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg?.dot} ${classification.urgency === "CRITICAL" ? "animate-pulse" : ""}`} />
              {urgencyCfg?.label}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-foreground">
              {classification.category}
            </span>
            {classification.subcategory && classification.subcategory !== classification.category && (
              <span className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
                {classification.subcategory}
              </span>
            )}
            {score > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                score > 80 ? "bg-red-500/15 text-red-400 border-red-500/30"
                : score > 50 ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                : "bg-muted text-muted-foreground border-border"
              }`}>
                Score {score}/100
              </span>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded-full" />
          </div>
        )}

        {/* Location banner */}
        {gpsState === "requesting" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-xl px-4 py-2.5">
            <Navigation className="w-3.5 h-3.5 animate-pulse text-primary" />
            <span>Detecting your location…</span>
          </div>
        )}
        {gpsState === "granted" && gps && (
          <a
            href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 hover:bg-blue-500/15 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-300 mb-0.5">Your location detected — relay this to responders</p>
                <p className="text-xs font-mono text-blue-400/80">
                  {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                  {gps.accuracy < 100 && <span className="text-blue-500/60 ml-1">(±{Math.round(gps.accuracy)}m)</span>}
                </p>
              </div>
            </div>
            <span className="text-xs text-blue-400 group-hover:text-blue-300 font-medium shrink-0 ml-2">Open Maps →</span>
          </a>
        )}
        {gpsState === "denied" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 border border-border rounded-xl px-4 py-2.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Location unavailable — tell responders your address verbally</span>
          </div>
        )}

        {/* CRITICAL call banner (score > 50, call was cancelled or not yet triggered) */}
        {classification?.urgency === "CRITICAL" && (
          <a
            href={`tel:${callNumber}`}
            className="pulse-critical flex items-center justify-between bg-primary/10 border-2 border-primary/50 rounded-xl px-4 py-3 group hover:bg-primary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-primary">Call {callNumber} Now</p>
                <p className="text-xs text-muted-foreground">
                  {classification.category === "Medical Emergency" ? "Ambulance — fastest medical response" : "National Emergency"}
                </p>
              </div>
            </div>
            <Phone className="w-5 h-5 text-primary" />
          </a>
        )}

        {/* AI Guidance */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Emergency Guidance</span>
            <div className="ml-auto flex items-center gap-2">
              {speaking && (
                <span className="text-xs text-primary animate-pulse font-medium">Speaking…</span>
              )}
              {streaming && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
              {done && !streaming && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              {(done || streaming) && (
                <button
                  onClick={() => {
                    if (speaking) { stopSpeaking(); setTtsEnabled(false); }
                    else { setTtsEnabled(v => !v); if (!ttsEnabled && response) speakText(response, detectLang(transcript)); }
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${ttsEnabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  title={ttsEnabled ? "Mute voice" : "Enable voice"}
                >
                  {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className={`px-4 py-4 min-h-[120px] ${streaming && !response ? "flex items-center justify-center" : ""}`}>
            {streaming && !response && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-xs">Analyzing emergency…</p>
              </div>
            )}
            {response && (
              <div className={`space-y-1 ${streaming ? "cursor-stream" : ""}`}>
                {renderMarkdown(response)}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* Helplines */}
        {classification?.helplines && classification.helplines.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Emergency Helplines</p>
            <div className="grid gap-2">
              {classification.helplines.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:bg-card/80 transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.when}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{h.number}</span>
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Nearby emergency locations */}
        {(nearbyLoading || (nearbyPlaces && nearbyPlaces.length > 0)) && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Nearby Emergency Facilities
            </p>
            {nearbyLoading && !nearbyPlaces && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finding nearest locations…</span>
              </div>
            )}
            <div className="grid gap-2">
              {nearbyPlaces?.map((place, i) => {
                const icon = place.amenity === "fire_station" ? "🚒"
                           : place.amenity === "police"       ? "🚔"
                           : "🏥";
                const distLabel = place.distKm < 1
                  ? `${Math.round(place.distKm * 1000)} m away`
                  : `${place.distKm} km away`;
                return (
                  <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-base mt-0.5 shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{place.name}</p>
                        {place.address && (
                          <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                        )}
                        <p className="text-xs text-primary font-medium mt-0.5">{distLabel}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {place.phone && (
                        <a
                          href={`tel:${place.phone.replace(/[^0-9+]/g, "")}`}
                          className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-1 hover:bg-primary/20 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                      <a
                        href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Maps
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up history */}
        {history.length > 2 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Follow-up</p>
            <div className="space-y-3">
              {history.slice(2).map((turn, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    turn.role === "user"
                      ? "bg-primary/10 border border-primary/20 text-foreground ml-4"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                    {turn.role === "user" ? "You" : "JivAI"}
                  </p>
                  {turn.role === "assistant"
                    ? <div className="space-y-1">{renderMarkdown(turn.content)}</div>
                    : <p>{turn.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Follow-up input */}
      {done && (
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowUp(); } }}
              placeholder="Ask a follow-up question…"
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleFollowUp}
              disabled={!followUp.trim() || followUpLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {followUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
