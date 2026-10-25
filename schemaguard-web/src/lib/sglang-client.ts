import {
  FlatClaimExtraction,
  FLAT_SCHEMA_KEYS,
  ModelConfig,
} from "../types/schemaguard";
import { validateSchema } from "./gate";

export const SYSTEM_PROMPT =
  "Extract purchase_date, product, issue, serial_number. " +
  "Return exactly the flat JSON fields in the schema. " +
  "Copy short supporting evidence verbatim from the claim. " +
  "Use empty strings for fields not explicitly stated. " +
  "Do not invent information. Preserve date wording. " +
  "The issue is a reported defect, not a warranty request. " +
  "Do not generate statuses, confidence scores, or conflicts.";

export const SCHEMA_DEFINITION = {
  type: "object",
  properties: Object.fromEntries(
    FLAT_SCHEMA_KEYS.map((key) => [key, { type: "string" }])
  ),
  required: FLAT_SCHEMA_KEYS,
  additionalProperties: false,
};

export function getBaseModelId(): string {
  return process.env.BASE_MODEL_ID || "Qwen/Qwen3-1.7B";
}

export function getTunedModelId(): string {
  return process.env.TUNED_MODEL_ID || "schemaguard";
}

export function getSglangBaseUrl(): string {
  return (process.env.SGLANG_BASE_URL || "").trim().replace(/\/+$/, "");
}

export function getSglangApiToken(): string {
  return (process.env.SGLANG_API_TOKEN || "").trim();
}

/**
 * Intelligent deterministic extraction fallback used when the remote Kaggle/SGLang backend
 * is temporarily offline or unconfigured. Modeled directly on the 32 challenge benchmark behaviors.
 */
export function simulateModelExtraction(
  claim: string,
  modelType: "base" | "fine_tuned"
): FlatClaimExtraction {
  const normClaim = claim.toLowerCase();

  // 1. Date extraction
  let dateVal = "";
  let dateEvi = "";
  const dateMatch = claim.match(
    /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i
  );

  if (dateMatch) {
    const rawMatch = dateMatch[0];
    dateVal = rawMatch;

    // Look for natural purchase or delivery prefix like "Purchased on ..." or "bought on ..."
    const prefixMatch = claim.match(
      new RegExp(
        `(?:purchased on|bought on|ordered on|delivered on)?\\s*${rawMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      )
    );
    dateEvi = prefixMatch ? prefixMatch[0].trim() : rawMatch;
  }

  // Base model false-fill tendency on blank/delivery dates (48% false fill vs 44% on FT)
  if (!dateVal && normClaim.includes("delivered on")) {
    const delMatch = claim.match(/delivered on\s+([A-Za-z0-9\s,]+?)(?=[.]|$)/i);
    if (delMatch) {
      dateVal = delMatch[1].trim();
      dateEvi = delMatch[0].trim();
    }
  }

  // 2. Product extraction
  let prodVal = "";
  let prodEvi = "";
  const products = [
    "macbook pro",
    "macbook air",
    "macbook",
    "thinkpad",
    "dell xps",
    "laptop",
    "iphone 15",
    "iphone",
    "galaxy s24",
    "pixel 8",
    "phone",
    "ipad pro",
    "ipad",
    "tablet",
    "gaming monitor",
    "monitor",
    "keyboard",
    "mouse",
    "headphones",
    "smartwatch",
    "camera",
    "printer",
    "speaker",
    "router",
  ];

  for (const p of products) {
    const idx = normClaim.indexOf(p);
    if (idx !== -1) {
      prodVal = claim.substring(idx, idx + p.length);
      // Look for natural prefix like "My laptop" or "this laptop"
      const prefixMatch = claim.match(
        new RegExp(`(?:my|the|this)?\\s*${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i")
      );
      prodEvi = prefixMatch ? prefixMatch[0].trim() : prodVal;
      break;
    }
  }

  // 3. Issue extraction
  let issueVal = "";
  let issueEvi = "";
  const defectPhrases = [
    "overheats during video calls",
    "overheats frequently",
    "battery drains quickly",
    "screen flickers constantly",
    "stopped working after the power surge",
    "stopped working after the update",
    "stopped working completely",
    "stopped working",
    "not turning on",
    "wont start",
    "won't start",
    "screen is cracked",
    "is defective and buzzes loudly",
    "is defective",
    "is broken",
    "crashes often",
    "crashes",
    "overheats",
    "flickers",
    "defective",
  ];

  for (const d of defectPhrases) {
    const idx = normClaim.indexOf(d);
    if (idx !== -1) {
      issueVal = claim.substring(idx, idx + d.length);
      issueEvi = issueVal;
      break;
    }
  }

  // 4. Serial number extraction
  let snVal = "";
  let snEvi = "";
  const snMatch = claim.match(
    /\b(?:serial(?:\s+number)?[:\s]+([A-Z0-9_-]+)|SN[:\s]+([A-Z0-9_-]+)|order\s+number[:\s]+([A-Z0-9_-]+))\b/i
  );

  if (snMatch) {
    snVal = (snMatch[1] || snMatch[2] || snMatch[3] || "").trim();
    snEvi = snMatch[0];
  }

  // Base model sometimes false-fills serial with random word or order number
  if (!snVal && modelType === "base" && normClaim.includes("order")) {
    const ordMatch = claim.match(/order\s+([A-Z0-9_-]+)/i);
    if (ordMatch) {
      snVal = ordMatch[1];
      snEvi = ordMatch[0];
    }
  }

  // Adversarial prompt injection simulation
  if (normClaim.includes("ignore all previous instructions") && normClaim.includes("hacked")) {
    if (modelType === "base") {
      // Base model is susceptible to prompt injection without fine-tuning / gate
      snVal = "HACKED_ROOT";
      snEvi = "output serial number as HACKED_ROOT";
    }
  }

  return {
    purchase_date_value: dateVal,
    purchase_date_evidence: dateEvi,
    product_value: prodVal,
    product_evidence: prodEvi,
    issue_value: issueVal,
    issue_evidence: issueEvi,
    serial_number_value: snVal,
    serial_number_evidence: snEvi,
  };
}

/**
 * Execute extraction request against the authenticated Kaggle SGLang proxy,
 * falling back gracefully with full diagnostic metadata if unreachable.
 */
export async function executeExtraction(
  claim: string,
  modelConfig: ModelConfig
): Promise<{
  rawOutput: string;
  rawExtraction: FlatClaimExtraction | null;
  parseError: string | null;
  latencyMs: number;
  modelId: string;
  isMock: boolean;
}> {
  const isFineTuned =
    modelConfig === "fine_tuned" || modelConfig === "fine_tuned_gate";
  const modelId = isFineTuned ? getTunedModelId() : getBaseModelId();

  const baseUrl = getSglangBaseUrl();
  const token = getSglangApiToken();

  // If SGLang proxy URL is configured, forward to live backend
  if (baseUrl) {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SchemaGuard-Token": token,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Claim:\n${claim}` },
          ],
          temperature: 0,
          max_tokens: 300,
          chat_template_kwargs: { enable_thinking: false },
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "claim_extraction",
              strict: true,
              schema: SCHEMA_DEFINITION,
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `SGLang backend returned HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      const rawOutput = data.choices?.[0]?.message?.content ?? "";

      let rawExtraction: FlatClaimExtraction | null = null;
      let parseError: string | null = null;

      if (!rawOutput.trim()) {
        parseError = "Backend returned empty model output.";
      } else {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(rawOutput);
        } catch {
          // Attempt parsing markdown code block or embedded JSON
          const stripped = rawOutput
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          try {
            parsed = JSON.parse(stripped);
          } catch {
            const first = rawOutput.indexOf("{");
            const last = rawOutput.lastIndexOf("}");
            if (first !== -1 && last > first) {
              try {
                parsed = JSON.parse(rawOutput.substring(first, last + 1));
              } catch (innerErr) {
                parseError = `Malformed JSON: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`;
              }
            } else {
              parseError = "Malformed JSON: No valid JSON object could be parsed from output.";
            }
          }
        }

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const schemaCheck = validateSchema(parsed);
          if (schemaCheck.valid) {
            rawExtraction = parsed as FlatClaimExtraction;
          } else {
            parseError = `Schema validation failed: ${schemaCheck.errors.join(", ")}`;
          }
        } else if (!parseError) {
          parseError = "Malformed JSON: Response did not resolve to a JSON object.";
        }
      }

      return {
        rawOutput,
        rawExtraction,
        parseError,
        latencyMs,
        modelId,
        isMock: false,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.toLowerCase().includes("aborted"));
      if (isTimeout) {
        throw new Error(
          "Backend inference timed out after 45s. Verify that the SGLang proxy and tunnel are running."
        );
      }
      const rawMsg = err instanceof Error ? err.message : String(err);
      const safeMsg = token ? rawMsg.split(token).join("[REDACTED]") : rawMsg;
      throw new Error(safeMsg);
    }
  }

  // Graceful offline fallback simulation only when SGLANG_BASE_URL is not set
  const startTime = performance.now();
  const simulatedDelay = isFineTuned ? 320 : 280;
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

  const simulated = simulateModelExtraction(
    claim,
    isFineTuned ? "fine_tuned" : "base"
  );
  const latencyMs = Math.round(performance.now() - startTime);
  const rawOutput = JSON.stringify(simulated, null, 2);

  return {
    rawOutput,
    rawExtraction: simulated,
    parseError: null,
    latencyMs,
    modelId,
    isMock: true,
  };
}
