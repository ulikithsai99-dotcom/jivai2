export interface EmergencyKnowledge {
  category: string;
  subcategories: string[];
  keywords: string[];
  semanticPatterns: string[];
  urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  immediateActions: string[];
  helplines: { name: string; number: string; when: string }[];
  escalationPath: string[];
}

export const EMERGENCY_KNOWLEDGE_BASE: EmergencyKnowledge[] = [
  {
    category: "Medical Emergency",
    subcategories: [
      "Cardiac Arrest",
      "Severe Bleeding",
      "Unconsciousness",
      "Breathing Difficulty",
      "Seizure",
      "Stroke",
      "Poisoning",
      "Burns",
      "Fracture",
      "Allergic Reaction",
    ],
    keywords: [
      "heart attack", "cardiac", "chest pain", "collapsed", "unconscious",
      "not breathing", "not waking", "bleeding", "blood", "wound", "cut",
      "burn", "broken bone", "fracture", "seizure", "convulsion", "stroke",
      "poison", "overdose", "allergy", "anaphylaxis", "choking", "fainted",
      "gir gaye", "gir gayi", "gir gaya", "gire", "beh gaye", "beh gayi",
      "khoon", "khoon nikal", "nahi utha", "nahi uthi", "saans nahi",
      "hosh nahi", "behosh", "behosh ho gaye", "behosh ho gayi",
      "hosh nahi aa", "uth nahi raha", "uth nahi rahi", "nahi uth raha",
      "dard ho raha", "dard ho rahi", "seene mein dard", "chhati mein dard",
      "chot", "chot lagi", "chot lag", "chot aai", "chot gayi",
      "pair mein chot", "haath mein chot", "sir mein chot", "kamar mein chot",
      "zakhmi", "ghav", "takleef", "bahut dard", "bahut chot",
      "pair toot", "haath toot", "haddi", "sir phut", "khoon aa raha",
      "latpat", "behoshi", "jal gaya", "jal gayi",
    ],
    semanticPatterns: [
      "person has fallen and is not responding",
      "person is bleeding severely",
      "person cannot breathe",
      "person lost consciousness",
      "collapsed and not waking up",
      "someone swallowed something harmful",
      "fell down and not moving",
    ],
    urgencyLevel: "CRITICAL",
    immediateActions: [
      "Call 112 (National Emergency) or 108 (Ambulance) immediately",
      "Do not move the person unless in immediate danger",
      "Check if the person is conscious and breathing",
      "Begin CPR if trained and person has no pulse",
      "Control bleeding with direct pressure using cloth",
      "Keep the person warm and calm",
    ],
    helplines: [
      { name: "National Emergency", number: "112", when: "Any emergency" },
      { name: "Ambulance", number: "108", when: "Medical emergencies" },
      { name: "Disaster Management", number: "1070", when: "Natural disasters" },
    ],
    escalationPath: [
      "Call 112 immediately",
      "Perform first aid while waiting for ambulance",
      "Inform hospital about the condition in advance",
      "Reach nearest government hospital",
    ],
  },
  {
    category: "Cybercrime",
    subcategories: [
      "Online Fraud",
      "Financial Scam",
      "Account Hacked",
      "Identity Theft",
      "Cyberbullying",
      "Phishing",
      "Ransomware",
      "Sextortion",
      "Social Media Hack",
    ],
    keywords: [
      "hack", "hacked", "scam", "fraud", "phishing", "cyber", "online fraud",
      "bank fraud", "UPI fraud", "OTP fraud", "identity theft", "account stolen",
      "password stolen", "ransomware", "sextortion", "threatening online",
      "fake profile", "blackmail online", "social media hacked", "email hacked",
      "phone hack", "data breach", "credit card fraud",
    ],
    semanticPatterns: [
      "someone stole money from bank account",
      "account was accessed without permission",
      "being blackmailed with private content",
      "received threat online",
      "money transferred without consent",
      "OTP was shared and money was deducted",
    ],
    urgencyLevel: "HIGH",
    immediateActions: [
      "Do NOT share any more OTPs, passwords, or personal details",
      "Block all transactions immediately via your bank app",
      "Call your bank's fraud helpline immediately",
      "File complaint on cybercrime.gov.in",
      "Save screenshots of all evidence",
      "Change passwords for all accounts from a safe device",
    ],
    helplines: [
      { name: "Cybercrime Helpline", number: "1930", when: "Any cybercrime or online fraud" },
      { name: "Cybercrime Portal", number: "cybercrime.gov.in", when: "Filing online complaint" },
      { name: "National Emergency", number: "112", when: "If physically threatened" },
    ],
    escalationPath: [
      "Call 1930 (Cybercrime Helpline) immediately",
      "Block transactions at bank",
      "File FIR at nearest cyber police station",
      "File complaint on cybercrime.gov.in",
    ],
  },
  {
    category: "Women Safety",
    subcategories: [
      "Physical Assault",
      "Sexual Harassment",
      "Stalking",
      "Domestic Violence",
      "Trafficking",
      "Eve Teasing",
      "Being Followed",
    ],
    keywords: [
      "harassment", "stalking", "following", "assault", "domestic violence",
      "abuse", "threat", "rape", "molestation", "eve teasing", "unsafe",
      "being followed", "someone chasing", "husband hitting", "violence at home",
      "scared of someone", "peecha kar raha", "maar raha", "unsafe feeling",
      "kidnap attempt",
    ],
    semanticPatterns: [
      "someone is following me",
      "feeling unsafe in current location",
      "being threatened by someone",
      "experiencing violence at home",
      "being harassed by a person",
    ],
    urgencyLevel: "CRITICAL",
    immediateActions: [
      "Call 112 immediately if in immediate danger",
      "Move to a crowded public place",
      "Activate SOS on your phone",
      "Call women helpline 181",
      "Share your live location with a trusted person",
      "Make noise to draw attention if being followed",
    ],
    helplines: [
      { name: "National Emergency", number: "112", when: "Immediate danger" },
      { name: "Women Helpline", number: "181", when: "Any safety concern for women" },
      { name: "Domestic Violence Helpline", number: "7827170170", when: "Violence at home" },
      { name: "Police", number: "100", when: "Crime in progress" },
    ],
    escalationPath: [
      "Call 112 or 100 if immediate danger",
      "Reach nearest police station",
      "Contact women's cell of local police",
      "File FIR and seek restraining order if needed",
    ],
  },
  {
    category: "Mental Health Crisis",
    subcategories: [
      "Suicidal Ideation",
      "Self-harm",
      "Panic Attack",
      "Severe Anxiety",
      "Psychotic Episode",
      "Severe Depression",
    ],
    keywords: [
      "suicide", "want to die", "end my life", "self harm", "cutting",
      "panic attack", "anxiety attack", "mental breakdown", "can't cope",
      "hopeless", "no reason to live", "want to kill myself", "depression",
      "overwhelming thoughts", "losing my mind", "marna chahta", "jina nahi",
      "bahut dard", "koi umeed nahi",
    ],
    semanticPatterns: [
      "feeling like life is not worth living",
      "having thoughts of harming oneself",
      "cannot control anxious thoughts",
      "feeling completely hopeless",
      "hearing voices or seeing things",
    ],
    urgencyLevel: "CRITICAL",
    immediateActions: [
      "You are not alone — help is available right now",
      "Call iCall: 9152987821 (free mental health helpline)",
      "Call Vandrevala Foundation: 1860-2662-345 (24/7)",
      "If in immediate danger, call 112",
      "Stay with the person — do not leave them alone",
      "Remove access to any harmful objects if safe to do so",
    ],
    helplines: [
      { name: "iCall (Mental Health)", number: "9152987821", when: "Mental health crisis, suicidal thoughts" },
      { name: "Vandrevala Foundation", number: "1860-2662-345", when: "24/7 mental health support" },
      { name: "Snehi", number: "044-24640050", when: "Emotional support and counselling" },
      { name: "National Emergency", number: "112", when: "Immediate danger to life" },
    ],
    escalationPath: [
      "Call crisis helpline immediately",
      "Contact a trusted friend or family member",
      "Visit nearest psychiatric emergency",
      "Seek hospitalization if needed",
    ],
  },
  {
    category: "Lost Documents",
    subcategories: [
      "Aadhaar Card Lost",
      "Passport Lost",
      "PAN Card Lost",
      "Driving License Lost",
      "Voter ID Lost",
      "Bank Documents Lost",
    ],
    keywords: [
      "lost document", "lost aadhaar", "lost passport", "lost pan card",
      "documents stolen", "wallet stolen", "id proof missing", "certificate lost",
      "aadhaar kho gaya", "passport kho gaya", "driving license missing",
      "important papers lost", "documents missing",
    ],
    semanticPatterns: [
      "cannot find important identity documents",
      "documents were stolen from bag",
      "wallet with cards was lost",
      "need to replace government ID",
    ],
    urgencyLevel: "MEDIUM",
    immediateActions: [
      "File a police complaint (FIR) for stolen documents",
      "For Aadhaar: Lock biometrics at myaadhaar.uidai.gov.in immediately",
      "For Passport: Report at passportindia.gov.in and nearest Passport Seva Kendra",
      "For PAN: Apply for duplicate at incometaxindia.gov.in",
      "Inform bank to block debit/credit cards if in wallet",
      "Block SIM if phone was also stolen",
    ],
    helplines: [
      { name: "Aadhaar Helpline", number: "1947", when: "Aadhaar issues" },
      { name: "Passport Helpline", number: "1800-258-1800", when: "Passport related issues" },
      { name: "Police", number: "100", when: "Filing complaint for stolen documents" },
    ],
    escalationPath: [
      "File FIR at nearest police station",
      "Apply for replacement documents",
      "Lock digital access to compromised documents",
    ],
  },
  {
    category: "Public Safety",
    subcategories: [
      "Fire",
      "Gas Leak",
      "Building Collapse",
      "Road Accident",
      "Drowning",
      "Explosion",
      "Mob Violence",
    ],
    keywords: [
      "fire", "gas leak", "explosion", "building collapse", "accident",
      "car crash", "drowning", "aag", "gas nikal raha", "dhamaaka",
      "accident ho gaya", "dubne wala", "road accident", "drunk driver",
      "hit and run", "flood", "earthquake",
    ],
    semanticPatterns: [
      "fire has broken out",
      "there is a gas leak",
      "someone is drowning",
      "road accident just happened",
      "building is on fire",
    ],
    urgencyLevel: "CRITICAL",
    immediateActions: [
      "Call 112 immediately",
      "Call Fire Brigade: 101",
      "Move everyone away from the danger zone",
      "Do not use elevator during fire — use stairs",
      "Do not re-enter a burning building",
      "Apply first aid to injured if safe to do so",
    ],
    helplines: [
      { name: "National Emergency", number: "112", when: "Any emergency" },
      { name: "Fire Brigade", number: "101", when: "Fire or gas leak" },
      { name: "Ambulance", number: "108", when: "Medical emergencies at scene" },
      { name: "Disaster Management", number: "1070", when: "Large-scale disasters" },
    ],
    escalationPath: [
      "Call 112 immediately",
      "Evacuate the area",
      "Wait for emergency services",
      "Assist others only if safe to do so",
    ],
  },
  {
    category: "Natural Disaster",
    subcategories: [
      "Earthquake",
      "Flood",
      "Cyclone",
      "Landslide",
      "Lightning Strike",
      "Heatstroke",
    ],
    keywords: [
      "earthquake", "flood", "cyclone", "landslide", "tornado", "tsunami",
      "storm", "lightning", "heatstroke", "bhaookamp", "baadh", "toofan",
      "bhookamp aa gaya", "paani bharh gaya", "bhooswalan",
    ],
    semanticPatterns: [
      "natural disaster is occurring",
      "area is flooded",
      "earthquake just happened",
      "severe storm incoming",
    ],
    urgencyLevel: "CRITICAL",
    immediateActions: [
      "Call Disaster Management: 1070",
      "Move to higher ground if flooding",
      "Stay under a sturdy table during earthquake",
      "Do not venture into flood water",
      "Follow evacuation routes issued by authorities",
      "Listen to official broadcasts and advisories",
    ],
    helplines: [
      { name: "National Disaster Management", number: "1070", when: "Natural disasters" },
      { name: "National Emergency", number: "112", when: "Any emergency" },
      { name: "NDRF", number: "011-24363260", when: "Major disasters" },
    ],
    escalationPath: [
      "Call 1070 immediately",
      "Evacuate following official guidance",
      "Reach designated relief camps",
      "Register with authorities for tracking",
    ],
  },
];

export const CLASSIFICATION_SYSTEM_PROMPT = `You are JivAI — an Emergency Intelligence Engine. NOT a chatbot.

Your role is to understand emergency situations from any phrasing, language, or wording — including Hindi, Hinglish, slang, panic typing, spelling mistakes, regional speech, and elderly speech patterns.

You must perform MULTI-LAYER CLASSIFICATION:

LAYER 1: Emergency vs Non-Emergency
LAYER 2: Category (Medical/Cybercrime/Women Safety/Mental Health/Documents/Public Safety/Natural Disaster)
LAYER 3: Subcategory — for Medical: Cardiac | Respiratory | Neurological | Trauma/Injury | Poisoning/Overdose | Pediatric | Pregnancy | Elderly | General Medical
LAYER 4: Urgency (CRITICAL/HIGH/MEDIUM/LOW)
LAYER 5: Immediate action recommendation

MEDICAL TRIAGE RULES:
- ALWAYS prefer 108 (Ambulance) as primary helpline for any medical emergency. 112 is the backup.
- Chest pain / collapse / heart attack → Cardiac → CRITICAL → "Call 108 ambulance immediately"
- Not breathing / choking / gasping → Respiratory → CRITICAL → "Call 108, keep airway open"
- Seizure / stroke / unconscious → Neurological → CRITICAL → "Call 108, do not restrain"
- Bleeding / fracture / accident → Trauma → HIGH → "Call 108, apply pressure"
- Poison / overdose / swallowed → Poisoning → CRITICAL → "Call 108, do NOT induce vomiting"
- Pregnant / labor / bleeding in pregnancy → Pregnancy → CRITICAL → "Call 108 immediately"
- Any emergency in patient >60 or <5 years: UPGRADE severity by one level

RELATIONSHIP → DEMOGRAPHIC INFERENCE:
- grandmother/dadi/nani → Female, Senior Citizen (60+)
- grandfather/dada/nana → Male, Senior Citizen (60+)
- mother/mom/mummy/maa/amma → Female, Adult
- father/dad/papa/baap → Male, Adult
- wife/patni/biwi → Female, Adult
- husband/pati → Male, Adult
- daughter/beti → Female, Child/Young Adult
- son/beta → Male, Child/Young Adult
- sister/behen/didi → Female
- brother/bhai/bhaiya → Male
- baby/infant/toddler/baccha → Child/Infant
When age is explicitly stated, use that over relationship inference.

SEMANTIC UNDERSTANDING RULES:
- "My father collapsed" = "Papa gir gaye" = "Dad isn't waking up" → Medical → Cardiac/Neurological → CRITICAL
- "blood coming from leg" = "khoon nikal raha" → Medical → Trauma → HIGH
- "phone hack ho gaya" = "OTP fraud" = "money deducted" → Cybercrime → Financial Fraud
- "koi peecha kar raha hai" = "being followed" → Women Safety → Stalking
- "marna chahta hoon" = "want to die" → Mental Health → Suicidal Crisis
- "saans nahi aa raha" = "can't breathe" → Medical → Respiratory → CRITICAL
- "meri dadi gir gayi" = "grandmother fell" → Medical → Cardiac/Neurological → CRITICAL (Senior Citizen risk upgrade)

UNCERTAINTY HANDLING:
- If input is vague (e.g., "He is not okay"), ask ONE specific clarification question
- If multiple categories possible, choose the most urgent and provide guidance for that
- Never say "I don't understand" — always reason toward a category
- If severity is unclear but symptoms sound serious, default to CRITICAL

RESPONSE FORMAT:
Always respond with:
1. **Classification** (brief — 1 line, include medical sub-type if applicable)
2. **Immediate Actions** (numbered, clear steps — action-first, no fluff)
3. **Emergency Helplines** (for medical: list 108 first, then 112)
4. **What to do next**

LANGUAGE & TONE:
- CRITICAL RULE: Detect what language the user is speaking and respond in THAT SAME language.
  * If the input is in Hindi (Devanagari or Roman script) → respond in Hindi (Roman script, e.g. "Ghabrao mat. Abhi 108 pe call karo.")
  * If the input is in Hinglish (mix of Hindi + English) → respond in Hinglish
  * If the input is in English → respond in clear, simple English
  * If the input is in Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or any other Indian language → respond in that language (use Roman script)
  * If the input mixes multiple Indian languages → use the dominant language
- Always use simple, spoken language — exactly how a calm, trusted person would talk in an emergency.
- Medical/technical terms can stay in English across all languages (e.g. "CPR", "ambulance", "cardiac", helpline numbers).
- Never sound robotic. Sound like a person who deeply cares.
- Keep responses under 220 words. Numbered steps only.
- Do NOT use emojis.`;

export function findRelevantKnowledge(input: string): EmergencyKnowledge[] {
  const lowerInput = input.toLowerCase();
  const scored: { knowledge: EmergencyKnowledge; score: number }[] = [];

  for (const knowledge of EMERGENCY_KNOWLEDGE_BASE) {
    let score = 0;

    for (const keyword of knowledge.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    for (const pattern of knowledge.semanticPatterns) {
      const patternWords = pattern.toLowerCase().split(" ");
      const matchCount = patternWords.filter((w) => lowerInput.includes(w)).length;
      score += matchCount * 0.5;
    }

    if (score > 0) {
      scored.push({ knowledge, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.knowledge);
}

export function buildEnrichedPrompt(
  transcript: string,
  relevantKnowledge: EmergencyKnowledge[]
): string {
  let contextBlock = "";

  if (relevantKnowledge.length > 0) {
    contextBlock = "\n\nRELEVANT EMERGENCY KNOWLEDGE:\n";
    for (const k of relevantKnowledge) {
      contextBlock += `\nCategory: ${k.category}\n`;
      contextBlock += `Urgency: ${k.urgencyLevel}\n`;
      contextBlock += `Immediate Actions:\n${k.immediateActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n`;
      contextBlock += `Helplines:\n${k.helplines.map((h) => `- ${h.name}: ${h.number} (${h.when})`).join("\n")}\n`;
    }
  }

  return `${contextBlock}\n\nUser Emergency Input: "${transcript}"`;
}
