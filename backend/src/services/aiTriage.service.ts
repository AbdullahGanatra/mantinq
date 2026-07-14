import { env } from "../config/env";
import { logger } from "../config/logger";

export interface TriageAssetContext {
  name?: string;
  category?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  condition?: string;
  recentIssueTitles?: string[];
}

export interface TriageResult {
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  possibleCauses: string[];
  initialChecks: string[];
  recurringWarning: string | null;
  source: "ai" | "fallback";
}

const SYSTEM_PROMPT = `You are the AI Issue Triage engine inside MaintainIQ, a maintenance-management platform.
A user reports a problem with a physical asset (in plain English or Roman Urdu). Convert the complaint into
structured, professional issue data.

Rules:
- Output ONLY valid JSON, no markdown fences, no commentary.
- JSON shape: {"title": string, "category": string, "priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "possibleCauses": string[] (2-4 short items), "initialChecks": string[] (2-4 short, SAFE items),
  "recurringWarning": string|null}
- "title" must be a short, professional issue title (max ~8 words).
- "category" should be a short label such as "Electrical", "Leakage / Performance", "Mechanical", "HVAC",
  "Networking", "Structural", "Safety", "Software", "Other".
- priority must be CRITICAL for anything involving fire, smoke, sparks, exposed wiring, gas leaks, structural
  collapse risk, or immediate danger to people. Use HIGH for functionality-breaking faults, MEDIUM for
  degraded performance, LOW for cosmetic/minor issues.
- initialChecks must never include unsafe instructions for electrical, mechanical, fire, medical, or industrial
  hazards. If the issue sounds dangerous, the first check must tell the user to stop using the asset and keep
  people away, and to contact a qualified technician — do not tell them how to open panels, touch wiring, etc.
- recurringWarning should be null unless the provided asset history suggests a repeated failure pattern, in
  which case give one short sentence noting the recurring pattern.`;

function buildUserPrompt(complaint: string, asset?: TriageAssetContext) {
  const context = asset
    ? `Asset context:
- Name: ${asset.name || "unknown"}
- Category: ${asset.category || "unknown"}
- Model/Manufacturer: ${asset.model || "unknown"} / ${asset.manufacturer || "unknown"}
- Location: ${asset.location || "unknown"}
- Current condition/status: ${asset.condition || "unknown"}
- Recent past issues: ${asset.recentIssueTitles?.length ? asset.recentIssueTitles.join("; ") : "none on record"}
`
    : "Asset context: not provided.";

  return `${context}\nUser complaint: "${complaint}"\n\nReturn the JSON object described in the system prompt.`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error("AI_TIMEOUT"));
    }, ms);
  });
  return Promise.race([promise, timeout]);
}

async function callAnthropic(complaint: string, asset?: TriageAssetContext): Promise<any> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(complaint, asset) }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`AI_HTTP_${response.status}: ${errText}`);
  }

  const data: any = await response.json();
  const textBlock = data.content?.find((block: any) => block.type === "text");
  if (!textBlock?.text) throw new Error("AI_EMPTY_RESPONSE");

  const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
  return JSON.parse(cleaned);
}

/** Very small keyword-based fallback so the product still works end-to-end
 * when no API key is configured or the AI service is unavailable/times out. */
function ruleBasedFallback(complaint: string): TriageResult {
  const text = complaint.toLowerCase();

  const dangerWords = ["fire", "smoke", "spark", "shock", "gas", "burning", "jal", "aag", "dhuan"];
  const isDangerous = dangerWords.some((w) => text.includes(w));

  let category = "General";
  if (/(ac|air condition|cooling|hvac|thanda)/.test(text)) category = "HVAC";
  else if (/(electric|wiring|socket|switch|bijli)/.test(text)) category = "Electrical";
  else if (/(leak|water|pani)/.test(text)) category = "Leakage / Performance";
  else if (/(noise|sound|awaz)/.test(text)) category = "Mechanical";
  else if (/(wifi|network|internet|projector|hdmi|display)/.test(text)) category = "Electronics";

  const priority: TriageResult["priority"] = isDangerous
    ? "CRITICAL"
    : /(not working|band|kharab|broken|stopped)/.test(text)
    ? "HIGH"
    : "MEDIUM";

  return {
    title: complaint.length > 60 ? `${complaint.slice(0, 57)}...` : complaint,
    category,
    priority,
    possibleCauses: ["Cause could not be auto-diagnosed — needs technician inspection."],
    initialChecks: isDangerous
      ? ["Stop using the asset immediately and keep people away.", "Contact a qualified technician right away."]
      : ["Visually inspect the asset for obvious damage.", "Confirm the issue is reproducible before assigning."],
    recurringWarning: null,
    source: "fallback",
  };
}

export async function triageComplaint(
  complaint: string,
  asset?: TriageAssetContext
): Promise<TriageResult> {
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn("AI Issue Triage: ANTHROPIC_API_KEY not set, using rule-based fallback");
    return ruleBasedFallback(complaint);
  }

  const attempt = async () => callAnthropic(complaint, asset);

  try {
    const raw = await withTimeout(attempt(), env.AI_TIMEOUT_MS);
    return { ...raw, source: "ai" } as TriageResult;
  } catch (firstError) {
    logger.warn(`AI Issue Triage first attempt failed: ${(firstError as Error).message}. Retrying once.`);
    try {
      const raw = await withTimeout(attempt(), env.AI_TIMEOUT_MS);
      return { ...raw, source: "ai" } as TriageResult;
    } catch (secondError) {
      logger.error(`AI Issue Triage failed after retry: ${(secondError as Error).message}. Using fallback.`);
      return ruleBasedFallback(complaint);
    }
  }
}
