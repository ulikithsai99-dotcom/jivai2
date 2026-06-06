import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  findRelevantKnowledge,
  buildEnrichedPrompt,
  CLASSIFICATION_SYSTEM_PROMPT,
} from "../lib/knowledge-base";
import { buildMedicalTriageResult, inferPatient } from "../lib/medical-triage";

function calcEmergencyScore(
  urgency: string,
  confidence: string,
  ageGroup?: string
): number {
  const base: Record<string, number> = { CRITICAL: 78, HIGH: 62, MEDIUM: 38, LOW: 15 };
  const conf: Record<string, number> = { high: 12, medium: 0, low: -18 };
  let score = (base[urgency] ?? 38) + (conf[confidence] ?? 0);
  if (ageGroup === "Senior Citizen" || ageGroup === "Infant") score += 5;
  return Math.min(100, Math.max(0, Math.round(score)));
}

const router = Router();

function getAiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey: key });
}

router.post("/emergency/classify", async (req, res) => {
  const { transcript } = req.body as { transcript?: string };
  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    res.status(400).json({ error: "transcript is required" });
    return;
  }

  const relevant = findRelevantKnowledge(transcript);
  const isMedical =
    relevant.length > 0 && relevant[0].category === "Medical Emergency";

  if (isMedical) {
    const triage = buildMedicalTriageResult(transcript);
    const urgencyMap: Record<string, "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"> = {
      Critical: "CRITICAL",
      High: "HIGH",
      Moderate: "MEDIUM",
      Low: "LOW",
    };

    const urgencyStr = urgencyMap[triage.severity] ?? "HIGH";
    const score = calcEmergencyScore(urgencyStr, triage.confidence, triage.patient.ageGroup);
    res.json({
      category: "Medical Emergency",
      subcategory: triage.category,
      urgency: urgencyStr,
      confidence: triage.confidence,
      clarificationNeeded: triage.clarification_needed,
      question: triage.clarification_question ?? null,
      patient: triage.patient,
      detected_emergency: triage.detected_emergency,
      severity: triage.severity,
      recommended_action: triage.recommended_action,
      reasoning: triage.reasoning,
      emergencyScore: score,
      primaryCallNumber: triage.primary_helpline,
      helplines: [
        {
          name: "Ambulance",
          number: triage.primary_helpline,
          when: "Medical emergencies — primary response",
        },
        {
          name: "National Emergency",
          number: triage.backup_helpline,
          when: "Any emergency — backup",
        },
      ],
      immediateActions: triage.recommended_action
        .split(". ")
        .filter(Boolean)
        .map((s) => s.trim()),
    });
    return;
  }

  if (relevant.length === 0) {
    const patient = inferPatient(transcript);
    res.json({
      category: "Unknown",
      subcategory: "Unclassified",
      urgency: "MEDIUM",
      confidence: "low",
      clarificationNeeded: true,
      question: "Can you describe what is happening in more detail?",
      patient,
      emergencyScore: 35,
      primaryCallNumber: "112",
    });
    return;
  }

  const top = relevant[0];
  const nonMedScore = calcEmergencyScore(top.urgencyLevel, "medium");
  const primaryNum = top.helplines[0]?.number ?? "112";
  res.json({
    category: top.category,
    subcategory: top.subcategories[0],
    urgency: top.urgencyLevel,
    confidence: "medium",
    clarificationNeeded: false,
    helplines: top.helplines,
    immediateActions: top.immediateActions,
    emergencyScore: nonMedScore,
    primaryCallNumber: primaryNum,
  });
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryToAmenities(category: string): string[] {
  const c = category.toLowerCase();
  if (c.includes("fire"))                              return ["fire_station"];
  if (c.includes("police") || c.includes("crime") || c.includes("women") || c.includes("theft")) return ["police"];
  if (c.includes("mental") || c.includes("suicide"))  return ["hospital", "clinic"];
  return ["hospital", "clinic"];
}

router.post("/emergency/nearby", async (req, res) => {
  const { lat, lng, category = "Medical Emergency" } = req.body as {
    lat?: number; lng?: number; category?: string;
  };

  if (!lat || !lng) { res.status(400).json({ error: "lat and lng required" }); return; }

  const amenities = categoryToAmenities(category);
  const amenityFilter = amenities.map((a) => `node[amenity=${a}](around:6000,${lat},${lng});`).join("\n  ");

  const query = `[out:json][timeout:8]; ( ${amenityFilter} ); out body 20;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "User-Agent": "JivAI-Emergency/1.0 (emergency-intelligence-system)" },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) throw new Error(`Overpass HTTP ${resp.status}`);

    const data = (await resp.json()) as { elements: { id: number; lat: number; lon: number; tags?: Record<string,string> }[] };

    const places = data.elements
      .filter((e) => e.lat && e.lon && (e.tags?.name || e.tags?.["name:en"]))
      .map((e) => {
        const distKm = haversineKm(lat, lng, e.lat, e.lon);
        return {
          name: e.tags?.["name:en"] || e.tags?.name || "Unnamed",
          amenity: e.tags?.amenity || "facility",
          distKm: parseFloat(distKm.toFixed(2)),
          lat: e.lat,
          lng: e.lon,
          phone: e.tags?.phone || e.tags?.["contact:phone"] || null,
          address: [e.tags?.["addr:street"], e.tags?.["addr:city"]].filter(Boolean).join(", ") || null,
        };
      })
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 4);

    res.json({ places, amenities });
  } catch (err) {
    res.status(502).json({ error: "Could not fetch nearby locations", detail: String(err) });
  }
});

router.post("/emergency/guidance", async (req, res) => {
  const { transcript, history = [], location } = req.body as {
    transcript?: string;
    history?: { role: string; content: string }[];
    location?: { lat: number; lng: number; accuracy?: number };
  };

  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    res.status(400).json({ error: "transcript is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let ai: GoogleGenAI;
  try {
    ai = getAiClient();
  } catch {
    const relevant = findRelevantKnowledge(transcript);
    if (relevant.length > 0) {
      const top = relevant[0];
      const fallback = [
        `**${top.category} Detected — Urgency: ${top.urgencyLevel}**`,
        "",
        "**Immediate Actions:**",
        ...top.immediateActions.map((a, i) => `${i + 1}. ${a}`),
        "",
        "**Emergency Helplines:**",
        ...top.helplines.map((h) => `- ${h.name}: ${h.number}`),
      ].join("\n");

      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } else {
      const fallback =
        "**Emergency Detected**\n\n1. Call 112 immediately (National Emergency)\n2. Stay calm and describe your situation clearly\n3. Follow instructions from emergency services\n\n**Key Numbers:**\n- National Emergency: 112\n- Ambulance: 108\n- Police: 100\n- Fire: 101";
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
    res.end();
    return;
  }

  try {
    const relevant = findRelevantKnowledge(transcript);
    let enrichedInput = buildEnrichedPrompt(transcript, relevant);

    if (location?.lat != null && location?.lng != null) {
      const mapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      const accuracyNote = location.accuracy ? ` (±${Math.round(location.accuracy)}m accuracy)` : "";
      enrichedInput += `\n\nUSER LOCATION DETECTED${accuracyNote}:\nCoordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\nGoogle Maps: ${mapsUrl}\nIMPORTANT: Include the user's coordinates in your response so they can relay their exact location to emergency services.`;
    }

    const contents = [
      ...history.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      })),
      { role: "user", parts: [{ text: enrichedInput }] },
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents,
      config: {
        systemInstruction: CLASSIFICATION_SYSTEM_PROMPT,
        maxOutputTokens: 1024,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Gemini streaming error");

    const relevant = findRelevantKnowledge(transcript);
    if (relevant.length > 0) {
      const top = relevant[0];
      const fallback = [
        `**${top.category} — Urgency: ${top.urgencyLevel}**`,
        "",
        "**Immediate Actions:**",
        ...top.immediateActions.map((a, i) => `${i + 1}. ${a}`),
        "",
        "**Emergency Helplines:**",
        ...top.helplines.map((h) => `- ${h.name}: ${h.number}`),
      ].join("\n");
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    } else {
      res.write(
        `data: ${JSON.stringify({ content: "Call 112 immediately for emergency assistance." })}\n\n`
      );
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

router.post("/emergency/tts", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }
  res.json({ audio: "", format: "none", text });
});

function safe(text: string | undefined | null, maxLen = 200): string {
  if (!text) return "";
  return text.replace(/[<>&"']/g, " ").replace(/\s+/g, " ").trim().substring(0, maxLen);
}

function buildFallbackScript(params: {
  transcript?: string;
  category?: string;
  subcategory?: string;
  severity?: string;
  urgency?: string;
  patientAge?: string | number | null;
  patientGender?: string;
  patientRelation?: string | null;
  recommendedAction?: string;
}): string {
  const { transcript, category, subcategory, severity, urgency, patientAge, patientGender, patientRelation, recommendedAction } = params;

  const cat = safe(category || "Emergency");
  const sub = safe(subcategory || "");
  const sev = safe(severity || urgency || "High");
  const tx  = safe(transcript, 160);

  let patientDesc = "someone";
  const parts: string[] = [];
  if (patientRelation && patientRelation !== "null") parts.push(`their ${patientRelation}`);
  else if (patientGender && patientGender !== "Unknown") parts.push(patientGender === "Male" ? "a male patient" : "a female patient");
  if (patientAge) parts.push(`${patientAge} years old`);
  if (parts.length) patientDesc = parts.join(", ");

  const actionLines = recommendedAction
    ? recommendedAction.split(".").map(s => s.trim()).filter(s => s.length > 5).slice(0, 3)
    : [];

  const lines: string[] = [
    `Hello. This is JivAI, an AI emergency response system.`,
    `I am calling because an emergency has been detected and your number is listed as an emergency contact.`,
    `<break time="1s"/>`,
    `Emergency type: ${cat}${sub && sub !== cat ? `, specifically ${sub}` : ""}.`,
    `Severity level: ${sev}.`,
    `Patient: ${patientDesc}.`,
  ];

  if (tx) {
    lines.push(`<break time="0.5s"/>`, `Here is what was reported: ${tx}.`);
  }
  if (actionLines.length) {
    lines.push(`<break time="0.5s"/>`, `Recommended immediate actions: ${actionLines.join(". ")}.`);
  }

  lines.push(
    `<break time="1s"/>`,
    `Please respond to this emergency immediately. Call back or go to the person right away.`,
    `This message will now repeat.`,
    `<break time="2s"/>`,
    `Emergency type: ${cat}${sub && sub !== cat ? `, ${sub}` : ""}. Severity: ${sev}. Patient: ${patientDesc}.`,
    tx ? `Reported: ${tx}.` : "",
    `Please respond immediately. This was an automated alert from JivAI.`,
  );

  return lines.filter(Boolean).join(" ");
}

async function buildJivAIScript(params: {
  transcript?: string;
  category?: string;
  subcategory?: string;
  severity?: string;
  urgency?: string;
  patientAge?: string | number | null;
  patientGender?: string;
  patientRelation?: string | null;
  recommendedAction?: string;
}): Promise<string> {
  const { transcript, category, subcategory, severity, urgency, patientAge, patientGender, patientRelation, recommendedAction } = params;

  let spokenMessage: string;

  try {
    const ai = getAiClient();

    let patientDesc = "the patient";
    const parts: string[] = [];
    if (patientRelation && patientRelation !== "null") parts.push(`their ${patientRelation}`);
    else if (patientGender && patientGender !== "Unknown") parts.push(patientGender === "Male" ? "a male" : "a female");
    if (patientAge) parts.push(`${patientAge} years old`);
    if (parts.length) patientDesc = parts.join(", ");

    const prompt = `You are JivAI, an AI emergency response system. You are about to deliver a voice call to an emergency contact about a real emergency situation.

Write a clear, natural, spoken emergency briefing — as if you are a calm but urgent emergency dispatcher talking to a friend or family member on the phone. Do NOT use bullet points, markdown, headers, or lists. Write in plain spoken sentences only.

Emergency details:
- What happened (user's own words): "${safe(transcript, 300)}"
- Emergency type: ${safe(category || "Emergency")}${subcategory ? ` — ${safe(subcategory)}` : ""}
- Severity: ${safe(severity || urgency || "High")}
- About: ${patientDesc}
- Recommended action: ${safe(recommendedAction, 200) || "seek immediate medical help"}

Your briefing must:
1. Start with: "Hello, this is JivAI, an emergency alert system."
2. Explain the situation naturally in 3 to 5 sentences — what happened, who it involves, and how serious it is
3. Tell them what they should do right now
4. End with: "Please respond immediately. This message will repeat." then repeat the key facts once more briefly.

Keep total length under 60 seconds when spoken aloud. Use simple, clear English. No special characters except commas and periods.`;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 400 },
    });

    const raw = result.text ?? "";
    spokenMessage = raw
      .replace(/[*_#`~]/g, "")
      .replace(/[<>]/g, " ")
      .replace(/&/g, "and")
      .replace(/"/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!spokenMessage || spokenMessage.length < 40) {
      throw new Error("AI response too short");
    }
  } catch {
    spokenMessage = buildFallbackScript(params);
  }

  return `<Response><Say voice="alice" language="en-IN">${spokenMessage}</Say></Response>`;
}

router.post("/emergency/call", async (req, res) => {
  const {
    transcript, category, subcategory, severity, urgency,
    patientAge, patientGender, patientRelation, recommendedAction, to,
  } = req.body as {
    transcript?: string;
    category?: string;
    subcategory?: string;
    severity?: string;
    urgency?: string;
    patientAge?: string | number | null;
    patientGender?: string;
    patientRelation?: string | null;
    recommendedAction?: string;
    to?: string;
  };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber   = to || process.env.TWILIO_EMERGENCY_CONTACT;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    res.status(503).json({ error: "Twilio not configured" });
    return;
  }

  const twiml = await buildJivAIScript({
    transcript, category, subcategory, severity, urgency,
    patientAge, patientGender, patientRelation, recommendedAction,
  });

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    const call = await client.calls.create({ twiml, to: toNumber, from: fromNumber });
    res.json({ success: true, callSid: call.sid, to: toNumber });
  } catch (err) {
    req.log.error({ err }, "Twilio call error");
    res.status(500).json({ error: "Failed to place call", detail: String(err) });
  }
});

export default router;
