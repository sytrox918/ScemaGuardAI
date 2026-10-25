import { NextRequest, NextResponse } from "next/server";
import { executeExtraction } from "@/lib/sglang-client";
import { validateClaimExtraction } from "@/lib/gate";
import {
  ComparisonConfigResult,
  FIELD_KEYS,
  FieldComparisonRow,
  FieldKey,
  FlatClaimExtraction,
  FourWayComparisonResponse,
  GateStatus,
  ModelConfig,
} from "@/types/schemaguard";

const FIELD_LABELS: Record<FieldKey, string> = {
  purchase_date: "Purchase Date",
  product: "Product",
  issue: "Issue / Defect",
  serial_number: "Serial Number",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claim } = body;

    if (!claim || typeof claim !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'claim' must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedClaim = claim.trim();
    if (trimmedClaim.length < 5 || trimmedClaim.length > 5000) {
      return NextResponse.json(
        { error: "Claim must be between 5 and 5000 characters." },
        { status: 400 }
      );
    }

    const startTime = performance.now();

    // Run base and fine-tuned models
    const [baseResult, ftResult] = await Promise.all([
      executeExtraction(trimmedClaim, "base"),
      executeExtraction(trimmedClaim, "fine_tuned"),
    ]);

    const emptyExtraction: FlatClaimExtraction = {
      purchase_date_value: "",
      purchase_date_evidence: "",
      product_value: "",
      product_evidence: "",
      issue_value: "",
      issue_evidence: "",
      serial_number_value: "",
      serial_number_evidence: "",
    };

    const baseRaw = baseResult.rawExtraction || emptyExtraction;
    const ftRaw = ftResult.rawExtraction || emptyExtraction;

    // Apply deterministic gate
    const baseGateVal = validateClaimExtraction(trimmedClaim, baseRaw);
    const ftGateVal = validateClaimExtraction(trimmedClaim, ftRaw);

    // Build 4 configuration outputs
    const configs: Record<ModelConfig, ComparisonConfigResult> = {
      base: {
        config: "base",
        label: "Base Model (No Gate)",
        model_id: baseResult.modelId,
        has_gate: false,
        extracted: {
          purchase_date: {
            value: baseRaw.purchase_date_value,
            evidence: baseRaw.purchase_date_evidence,
          },
          product: {
            value: baseRaw.product_value,
            evidence: baseRaw.product_evidence,
          },
          issue: {
            value: baseRaw.issue_value,
            evidence: baseRaw.issue_evidence,
          },
          serial_number: {
            value: baseRaw.serial_number_value,
            evidence: baseRaw.serial_number_evidence,
          },
        },
        final_values: {
          purchase_date: baseRaw.purchase_date_value,
          product: baseRaw.product_value,
          issue: baseRaw.issue_value,
          serial_number: baseRaw.serial_number_value,
        },
        field_statuses: baseGateVal.field_statuses,
        field_details: baseGateVal.field_details,
        latency_ms: baseResult.latencyMs,
        overall_status: "BASIC_CHECKS_PASSED",
        accepted_count: FIELD_KEYS.filter(
          (f) => Boolean(baseRaw[`${f}_value`]?.trim())
        ).length,
        withheld_count: 0,
      },

      base_gate: {
        config: "base_gate",
        label: "Base + Deterministic Gate",
        model_id: baseResult.modelId,
        has_gate: true,
        extracted: {
          purchase_date: {
            value: baseRaw.purchase_date_value,
            evidence: baseRaw.purchase_date_evidence,
          },
          product: {
            value: baseRaw.product_value,
            evidence: baseRaw.product_evidence,
          },
          issue: {
            value: baseRaw.issue_value,
            evidence: baseRaw.issue_evidence,
          },
          serial_number: {
            value: baseRaw.serial_number_value,
            evidence: baseRaw.serial_number_evidence,
          },
        },
        final_values: baseGateVal.final_values,
        field_statuses: baseGateVal.field_statuses,
        field_details: baseGateVal.field_details,
        latency_ms: baseResult.latencyMs,
        overall_status: baseGateVal.overall_status,
        accepted_count: baseGateVal.accepted_count,
        withheld_count: baseGateVal.rejection_count,
      },

      fine_tuned: {
        config: "fine_tuned",
        label: "Fine-Tuned LoRA (No Gate)",
        model_id: ftResult.modelId,
        has_gate: false,
        extracted: {
          purchase_date: {
            value: ftRaw.purchase_date_value,
            evidence: ftRaw.purchase_date_evidence,
          },
          product: {
            value: ftRaw.product_value,
            evidence: ftRaw.product_evidence,
          },
          issue: {
            value: ftRaw.issue_value,
            evidence: ftRaw.issue_evidence,
          },
          serial_number: {
            value: ftRaw.serial_number_value,
            evidence: ftRaw.serial_number_evidence,
          },
        },
        final_values: {
          purchase_date: ftRaw.purchase_date_value,
          product: ftRaw.product_value,
          issue: ftRaw.issue_value,
          serial_number: ftRaw.serial_number_value,
        },
        field_statuses: ftGateVal.field_statuses,
        field_details: ftGateVal.field_details,
        latency_ms: ftResult.latencyMs,
        overall_status: "BASIC_CHECKS_PASSED",
        accepted_count: FIELD_KEYS.filter(
          (f) => Boolean(ftRaw[`${f}_value`]?.trim())
        ).length,
        withheld_count: 0,
      },

      fine_tuned_gate: {
        config: "fine_tuned_gate",
        label: "Fine-Tuned LoRA + Gate",
        model_id: ftResult.modelId,
        has_gate: true,
        extracted: {
          purchase_date: {
            value: ftRaw.purchase_date_value,
            evidence: ftRaw.purchase_date_evidence,
          },
          product: {
            value: ftRaw.product_value,
            evidence: ftRaw.product_evidence,
          },
          issue: {
            value: ftRaw.issue_value,
            evidence: ftRaw.issue_evidence,
          },
          serial_number: {
            value: ftRaw.serial_number_value,
            evidence: ftRaw.serial_number_evidence,
          },
        },
        final_values: ftGateVal.final_values,
        field_statuses: ftGateVal.field_statuses,
        field_details: ftGateVal.field_details,
        latency_ms: ftResult.latencyMs,
        overall_status: ftGateVal.overall_status,
        accepted_count: ftGateVal.accepted_count,
        withheld_count: ftGateVal.rejection_count,
      },
    };

    // Build field summary comparison rows
    const fieldSummary: FieldComparisonRow[] = FIELD_KEYS.map((field) => {
      const baseVal = baseRaw[`${field}_value`] || "";
      const baseEvi = baseRaw[`${field}_evidence`] || "";
      const baseStatus: GateStatus = baseGateVal.field_statuses[field];
      const baseAccepted = baseGateVal.final_values[field];

      const ftVal = ftRaw[`${field}_value`] || "";
      const ftEvi = ftRaw[`${field}_evidence`] || "";
      const ftStatus: GateStatus = ftGateVal.field_statuses[field];
      const ftAccepted = ftGateVal.final_values[field];

      const gateFilteredBase = baseVal !== baseAccepted;
      const gateFilteredFt = ftVal !== ftAccepted;

      const isDifferent =
        baseVal !== ftVal ||
        baseAccepted !== ftAccepted ||
        gateFilteredBase !== gateFilteredFt;

      return {
        field,
        label: FIELD_LABELS[field],
        base: { value: baseVal, evidence: baseEvi, status: baseStatus },
        base_gate: {
          value: baseVal,
          evidence: baseEvi,
          status: baseStatus,
          accepted: baseAccepted,
        },
        fine_tuned: { value: ftVal, evidence: ftEvi, status: ftStatus },
        fine_tuned_gate: {
          value: ftVal,
          evidence: ftEvi,
          status: ftStatus,
          accepted: ftAccepted,
        },
        is_different: isDifferent,
        gate_filtered_base: gateFilteredBase,
        gate_filtered_ft: gateFilteredFt,
      };
    });

    const totalLatencyMs = Math.round(performance.now() - startTime);

    const responseData: FourWayComparisonResponse = {
      claim: trimmedClaim,
      timestamp: new Date().toISOString(),
      configs,
      field_summary: fieldSummary,
      total_latency_ms: totalLatencyMs,
      is_mock: baseResult.isMock || ftResult.isMock,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("Comparison error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: `Comparison processing failed: ${message}` },
      { status: 500 }
    );
  }
}
