import { NextRequest, NextResponse } from "next/server";
import { executeExtraction } from "@/lib/sglang-client";
import { validateClaimExtraction } from "@/lib/gate";
import {
  ExtractionResponse,
  FIELD_KEYS,
  ModelConfig,
  ValidationResult,
} from "@/types/schemaguard";

const VALID_CONFIGS: ModelConfig[] = [
  "base",
  "base_gate",
  "fine_tuned",
  "fine_tuned_gate",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claim, model_config, model, model_type, apply_gate } = body;

    if (!claim || typeof claim !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'claim' must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedClaim = claim.trim();
    if (trimmedClaim.length < 5) {
      return NextResponse.json(
        { error: "Claim is too short. Please provide at least 5 characters." },
        { status: 400 }
      );
    }

    if (trimmedClaim.length > 5000) {
      return NextResponse.json(
        { error: "Claim exceeds maximum allowed length of 5000 characters." },
        { status: 400 }
      );
    }

    // Resolve model configuration
    let config: ModelConfig = "fine_tuned";
    if (VALID_CONFIGS.includes(model_config)) {
      config = model_config;
    } else {
      const isBase =
        model === "Qwen/Qwen3-1.7B" ||
        model === "base" ||
        model_type === "base";
      const isGate = Boolean(apply_gate);
      if (isBase) {
        config = isGate ? "base_gate" : "base";
      } else {
        config = isGate ? "fine_tuned_gate" : "fine_tuned";
      }
    }

    const {
      rawOutput,
      rawExtraction,
      parseError,
      latencyMs,
      modelId,
      isMock,
    } = await executeExtraction(trimmedClaim, config);

    // Compute deterministic evidence validation if parsed JSON is available
    let validation: ValidationResult | null = null;
    if (rawExtraction) {
      validation = validateClaimExtraction(trimmedClaim, rawExtraction);

      // If configuration is raw (no gate), do not filter final values with gate
      if (config === "base" || config === "fine_tuned") {
        for (const f of FIELD_KEYS) {
          const rawVal = (rawExtraction[`${f}_value`] || "").trim();
          validation.final_values[f] = rawVal;
        }
        validation.overall_status = "BASIC_CHECKS_PASSED";
      }
    }

    const isFineTuned = config.startsWith("fine_tuned");

    const responseData: ExtractionResponse = {
      claim: trimmedClaim,
      model_config: config,
      model_id: modelId,
      model_type: isFineTuned ? "fine_tuned" : "base",
      raw_output: rawOutput,
      raw_extraction: rawExtraction,
      parse_error: parseError,
      validation,
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
      is_mock: isMock,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const rawMsg = error instanceof Error ? error.message : "Internal error";
    const token = process.env.SGLANG_API_TOKEN || "";
    const safeMsg = token ? rawMsg.split(token).join("[REDACTED]") : rawMsg;
    console.error("Extraction error:", safeMsg);
    return NextResponse.json(
      { error: `Extraction processing failed: ${safeMsg}` },
      { status: 500 }
    );
  }
}
