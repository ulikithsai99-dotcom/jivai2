export type Severity = "Low" | "Moderate" | "High" | "Critical";
export type AgeGroup = "Infant" | "Child" | "Adolescent" | "Adult" | "Senior Citizen" | "Unknown";
export type Gender = "Male" | "Female" | "Unknown";

export interface PatientProfile {
  relation: string | null;
  gender: Gender;
  age: number | null;
  ageGroup: AgeGroup;
  ageInferred: boolean;
}

export interface MedicalTriageResult {
  detected_emergency: string;
  category: string;
  severity: Severity;
  patient: PatientProfile;
  recommended_action: string;
  primary_helpline: string;
  backup_helpline: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  clarification_needed: boolean;
  clarification_question?: string;
}

const RELATION_MAP: Record<string, { gender: Gender; ageGroup: AgeGroup }> = {
  grandmother: { gender: "Female", ageGroup: "Senior Citizen" },
  grandma: { gender: "Female", ageGroup: "Senior Citizen" },
  nani: { gender: "Female", ageGroup: "Senior Citizen" },
  dadi: { gender: "Female", ageGroup: "Senior Citizen" },
  grandfather: { gender: "Male", ageGroup: "Senior Citizen" },
  grandpa: { gender: "Male", ageGroup: "Senior Citizen" },
  nana: { gender: "Male", ageGroup: "Senior Citizen" },
  dada: { gender: "Male", ageGroup: "Senior Citizen" },
  mother: { gender: "Female", ageGroup: "Adult" },
  mom: { gender: "Female", ageGroup: "Adult" },
  mum: { gender: "Female", ageGroup: "Adult" },
  mummy: { gender: "Female", ageGroup: "Adult" },
  maa: { gender: "Female", ageGroup: "Adult" },
  amma: { gender: "Female", ageGroup: "Adult" },
  father: { gender: "Male", ageGroup: "Adult" },
  dad: { gender: "Male", ageGroup: "Adult" },
  papa: { gender: "Male", ageGroup: "Adult" },
  pappa: { gender: "Male", ageGroup: "Adult" },
  baap: { gender: "Male", ageGroup: "Adult" },
  wife: { gender: "Female", ageGroup: "Adult" },
  patni: { gender: "Female", ageGroup: "Adult" },
  biwi: { gender: "Female", ageGroup: "Adult" },
  husband: { gender: "Male", ageGroup: "Adult" },
  pati: { gender: "Male", ageGroup: "Adult" },
  sister: { gender: "Female", ageGroup: "Adult" },
  behen: { gender: "Female", ageGroup: "Adult" },
  didi: { gender: "Female", ageGroup: "Adult" },
  brother: { gender: "Male", ageGroup: "Adult" },
  bhai: { gender: "Male", ageGroup: "Adult" },
  bhaiya: { gender: "Male", ageGroup: "Adult" },
  daughter: { gender: "Female", ageGroup: "Child" },
  beti: { gender: "Female", ageGroup: "Child" },
  son: { gender: "Male", ageGroup: "Child" },
  beta: { gender: "Male", ageGroup: "Child" },
  baby: { gender: "Unknown", ageGroup: "Infant" },
  infant: { gender: "Unknown", ageGroup: "Infant" },
  toddler: { gender: "Unknown", ageGroup: "Infant" },
  child: { gender: "Unknown", ageGroup: "Child" },
  kid: { gender: "Unknown", ageGroup: "Child" },
  baccha: { gender: "Unknown", ageGroup: "Child" },
  uncle: { gender: "Male", ageGroup: "Adult" },
  aunt: { gender: "Female", ageGroup: "Adult" },
  chacha: { gender: "Male", ageGroup: "Adult" },
  chachi: { gender: "Female", ageGroup: "Adult" },
  mama: { gender: "Male", ageGroup: "Adult" },
  mami: { gender: "Female", ageGroup: "Adult" },
  nephew: { gender: "Male", ageGroup: "Child" },
  niece: { gender: "Female", ageGroup: "Child" },
};

interface MedicalCategory {
  name: string;
  baseSeverity: Severity;
  keywords: string[];
  hindiKeywords: string[];
  description: string;
}

const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    name: "Cardiac",
    baseSeverity: "Critical",
    keywords: [
      "heart attack", "cardiac arrest", "chest pain", "heart pain", "chest tightness",
      "chest pressure", "heart pounding", "palpitations", "heart stopped", "collapsed",
      "sudden collapse", "not waking up", "unconscious", "fell down", "gir gaye",
    ],
    hindiKeywords: [
      "seene mein dard", "dil ka dora", "chhati mein dard", "heart ka dard",
      "gir gaye", "behosh", "hosh nahi",
    ],
    description: "Cardiac emergency — heart or circulation related",
  },
  {
    name: "Respiratory",
    baseSeverity: "Critical",
    keywords: [
      "not breathing", "can't breathe", "cannot breathe", "cant breathe",
      "choking", "suffocating", "breathing difficulty", "difficulty breathing",
      "shortness of breath", "short of breath", "asthma attack", "gasping",
      "airway blocked", "throat blocked", "stopped breathing", "blue lips",
      "turning blue", "breathe properly", "breathing properly", "trouble breathing",
      "hard to breathe", "struggling to breathe",
    ],
    hindiKeywords: [
      "saans nahi aa raha", "saans nahi", "saans band", "dum ghut raha",
      "saans lene mein takleef", "saans nahi le pa",
    ],
    description: "Respiratory emergency — breathing related",
  },
  {
    name: "Neurological",
    baseSeverity: "Critical",
    keywords: [
      "seizure", "convulsion", "stroke", "paralysis", "face drooping", "arm weakness",
      "speech slurred", "sudden headache", "fits", "epilepsy", "fainting", "fainted",
      "lost consciousness", "not conscious", "not responding",
    ],
    hindiKeywords: [
      "mirgi", "dora pada", "laqwa", "muh teda", "ek taraf se kamzor",
      "behosh ho gaye", "hosh nahi aa raha",
    ],
    description: "Neurological emergency — brain or nervous system related",
  },
  {
    name: "Trauma/Injury",
    baseSeverity: "High",
    keywords: [
      "accident", "bleeding", "heavy bleeding", "blood", "wound", "cut", "deep cut",
      "fracture", "broken bone", "fall", "hit by", "crash", "road accident",
      "run over", "stabbed", "gunshot", "burn", "burns", "injury", "injured",
      "hurt", "leg injury", "arm injury", "head injury",
    ],
    hindiKeywords: [
      "chot", "chot lagi", "chot lag", "chot aai", "chot gayi",
      "pair mein chot", "haath mein chot", "sir mein chot", "kamar mein chot",
      "pair me chot", "haath me chot", "sir me chot",
      "khoon", "khoon nikal raha", "khoon nikal", "khoon aa raha",
      "haddi toot", "haddi toot gayi", "accident ho gaya", "accident ho gayi",
      "gir gaye", "gir gayi", "gir gaya",
      "jal gaya", "jal gayi", "zakhmi", "ghav", "takleef",
      "bahut dard", "bahut chot", "pair toot", "haath toot",
      "latpat", "lagi chot", "chot aayi",
    ],
    description: "Trauma or physical injury",
  },
  {
    name: "Poisoning/Overdose",
    baseSeverity: "Critical",
    keywords: [
      "poison", "poisoning", "overdose", "swallowed", "ingested", "ate something",
      "drank something", "pesticide", "medicine overdose", "pills", "sleeping pills",
      "chemical", "acid",
    ],
    hindiKeywords: [
      "zeher", "zeher kha liya", "davai bahut kha li", "kuch nigl gaya",
    ],
    description: "Poisoning or overdose",
  },
  {
    name: "Pediatric Emergency",
    baseSeverity: "High",
    keywords: [
      "child not breathing", "baby not breathing", "infant seizure", "child unconscious",
      "baby unconscious", "child choked", "toddler", "newborn", "neonatal",
    ],
    hindiKeywords: [
      "bacche ko saans nahi", "bacha behosh", "chota baccha", "nanha"
    ],
    description: "Medical emergency involving a child or infant",
  },
  {
    name: "Pregnancy Emergency",
    baseSeverity: "Critical",
    keywords: [
      "pregnant", "pregnancy", "labor", "contractions", "water broke", "miscarriage",
      "bleeding during pregnancy", "pregnancy complication", "delivery",
    ],
    hindiKeywords: [
      "garbhvati", "pregnant hai", "prasav", "delivery", "dard ho raha delivery wala",
    ],
    description: "Pregnancy-related emergency",
  },
  {
    name: "Elderly Emergency",
    baseSeverity: "High",
    keywords: [
      "hip fracture", "elderly fall", "old person fell", "senior citizen",
    ],
    hindiKeywords: [
      "budhe gir gaye", "bujurg", "budhapa mein",
    ],
    description: "Emergency involving elderly patient with age-related complications",
  },
  {
    name: "General Medical",
    baseSeverity: "Moderate",
    keywords: [
      "sick", "unwell", "not feeling well", "vomiting", "diarrhea", "fever",
      "high fever", "allergic reaction", "rash", "swelling", "pain", "diabetic",
      "sugar level", "blood pressure", "bp high", "bp low",
    ],
    hindiKeywords: [
      "tabiyat kharab", "bukhar", "ulti", "dast", "dard", "soojan",
      "sugar hai", "bp hai",
    ],
    description: "General medical condition requiring attention",
  },
];

const SEVERITY_ORDER: Record<Severity, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

function upgradeSeverity(current: Severity): Severity {
  if (current === "Low") return "Moderate";
  if (current === "Moderate") return "High";
  if (current === "High") return "Critical";
  return "Critical";
}

export function inferPatient(input: string): PatientProfile {
  const lower = input.toLowerCase();

  const ageMatch = lower.match(/(\d+)\s*[-\s]*(?:year|yr|saal|varsh|age|aged|years?)/i);
  const explicitAge = ageMatch ? parseInt(ageMatch[1], 10) : null;

  let gender: Gender = "Unknown";
  const genderHints = [
    { words: ["he ", "his ", "him ", "man ", "male ", "boy ", " he,"], gender: "Male" as Gender },
    { words: ["she ", "her ", "woman ", "female ", "girl ", " she,", "woh "], gender: "Female" as Gender },
  ];
  for (const hint of genderHints) {
    if (hint.words.some((w) => lower.includes(w))) {
      gender = hint.gender;
      break;
    }
  }

  const childModifiers = ["little ", "young ", "small ", "baby ", "chota ", "choti ", "chhota ", "chhoti "];
  const hasChildModifier = childModifiers.some((m) => lower.includes(m));

  let relation: string | null = null;
  let inferredGender: Gender = gender;
  let inferredAgeGroup: AgeGroup = "Unknown";
  let ageInferred = false;

  for (const [key, profile] of Object.entries(RELATION_MAP)) {
    if (lower.includes(key)) {
      relation = key;
      if (gender === "Unknown") inferredGender = profile.gender;
      inferredAgeGroup = hasChildModifier && profile.ageGroup === "Adult" ? "Child" : profile.ageGroup;
      ageInferred = true;
      break;
    }
  }

  let finalAgeGroup: AgeGroup = inferredAgeGroup;
  if (explicitAge !== null) {
    ageInferred = false;
    if (explicitAge < 1) finalAgeGroup = "Infant";
    else if (explicitAge < 13) finalAgeGroup = "Child";
    else if (explicitAge < 18) finalAgeGroup = "Adolescent";
    else if (explicitAge < 60) finalAgeGroup = "Adult";
    else finalAgeGroup = "Senior Citizen";
  }

  return {
    relation,
    gender: inferredGender,
    age: explicitAge,
    ageGroup: finalAgeGroup,
    ageInferred,
  };
}

export function classifyMedicalEmergency(input: string): {
  category: MedicalCategory;
  score: number;
} | null {
  const lower = input.toLowerCase();
  let best: { category: MedicalCategory; score: number } | null = null;

  for (const cat of MEDICAL_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) score += 3;
    }
    for (const kw of cat.hindiKeywords) {
      if (lower.includes(kw)) score += 3;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category: cat, score };
    }
  }

  return best;
}

export function calculateSeverity(
  baseSeverity: Severity,
  patient: PatientProfile
): Severity {
  let severity = baseSeverity;

  const effectiveAge = patient.age ?? (
    patient.ageGroup === "Senior Citizen" ? 65 :
    patient.ageGroup === "Infant" ? 0 :
    patient.ageGroup === "Child" ? 7 :
    null
  );

  if (effectiveAge !== null) {
    if (effectiveAge > 60 || effectiveAge < 5) {
      severity = upgradeSeverity(severity);
    }
  }

  return severity;
}

export function selectHelplines(category: string): {
  primary: string;
  backup: string;
} {
  const medicalCategories = [
    "Cardiac", "Respiratory", "Neurological", "Trauma/Injury",
    "Poisoning/Overdose", "Pediatric Emergency", "Pregnancy Emergency",
    "Elderly Emergency", "General Medical",
  ];

  if (medicalCategories.includes(category)) {
    return { primary: "108", backup: "112" };
  }

  return { primary: "112", backup: "100" };
}

export function buildMedicalTriageResult(input: string): MedicalTriageResult {
  const patient = inferPatient(input);
  const medicalMatch = classifyMedicalEmergency(input);

  if (!medicalMatch) {
    return {
      detected_emergency: "Medical Emergency",
      category: "General Medical",
      severity: "Moderate",
      patient,
      recommended_action:
        "Call ambulance (108) immediately. Keep the patient calm and still. Do not give food or water. Stay on the line with emergency services.",
      primary_helpline: "108",
      backup_helpline: "112",
      reasoning: "No specific medical category detected. Treating as general medical emergency.",
      confidence: "low",
      clarification_needed: true,
      clarification_question: "Can you describe the main symptom? For example: is the person conscious, breathing, and can they speak?",
    };
  }

  const { category } = medicalMatch;
  const severity = calculateSeverity(category.baseSeverity, patient);
  const helplines = selectHelplines(category.name);

  const ageContext = patient.age
    ? `${patient.age}-year-old`
    : patient.ageGroup !== "Unknown"
    ? patient.ageGroup.toLowerCase()
    : "";

  const patientDesc = [patient.gender !== "Unknown" ? patient.gender.toLowerCase() : "", ageContext, patient.relation ?? "patient"]
    .filter(Boolean)
    .join(" ");

  let action = "";
  switch (category.name) {
    case "Cardiac":
      action = `Call 108 ambulance immediately. Lay the ${patientDesc} flat. Loosen tight clothing. If trained, begin CPR. Do not give food or water.`;
      break;
    case "Respiratory":
      action = `Call 108 ambulance immediately. Keep the ${patientDesc} upright or in recovery position. Clear the airway. If choking, perform back blows. Do not leave them alone.`;
      break;
    case "Neurological":
      action = `Call 108 ambulance immediately. Do not restrain the ${patientDesc} during seizure. Clear the area of sharp objects. Place in recovery position after seizure ends. Note the time.`;
      break;
    case "Trauma/Injury":
      action = `Call 108 ambulance immediately. Apply firm pressure to any bleeding wound. Do not remove any embedded objects. Keep the ${patientDesc} still. Note: if spinal injury suspected, do not move.`;
      break;
    case "Poisoning/Overdose":
      action = `Call 108 ambulance immediately. Do NOT induce vomiting unless instructed. Note what substance was taken and the quantity. Keep the ${patientDesc} conscious and on their side.`;
      break;
    case "Pediatric Emergency":
      action = `Call 108 ambulance immediately. Keep the child calm and with a caregiver. Do not give any medication without medical guidance. Provide clear details of symptoms to emergency services.`;
      break;
    case "Pregnancy Emergency":
      action = `Call 108 ambulance immediately. Lay the patient on their left side. Do not allow heavy exertion. Keep them calm. Note: time of contractions if applicable.`;
      break;
    default:
      action = `Call 108 ambulance (primary) or 112 (national emergency) immediately. Keep the patient calm and still. Stay on the line with emergency services.`;
  }

  const severityNum = SEVERITY_ORDER[severity];
  const confidence: "high" | "medium" | "low" =
    medicalMatch.score >= 6 ? "high" : medicalMatch.score >= 3 ? "medium" : "low";

  const reasoning = [
    `Detected ${category.name} emergency (base severity: ${category.baseSeverity}).`,
    patient.ageGroup !== "Unknown"
      ? `Patient is a ${patient.ageGroup}${patient.ageInferred ? " (inferred from relationship)" : ""}.`
      : "",
    (patient.ageGroup === "Senior Citizen" || (patient.age !== null && patient.age < 5))
      ? `Severity upgraded to ${severity} due to age-related risk.`
      : `Final severity: ${severity}.`,
    `Primary helpline: 108 (ambulance).`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    detected_emergency: category.description,
    category: category.name,
    severity,
    patient,
    recommended_action: action,
    primary_helpline: helplines.primary,
    backup_helpline: helplines.backup,
    reasoning,
    confidence,
    clarification_needed: severityNum <= 2 && confidence === "low",
    clarification_question:
      severityNum <= 2 && confidence === "low"
        ? "Is the person conscious and breathing? Can they speak?"
        : undefined,
  };
}
