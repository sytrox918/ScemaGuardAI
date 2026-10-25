export interface FlatClaimExtraction {
  purchase_date_value: string;
  purchase_date_evidence: string;
  product_value: string;
  product_evidence: string;
  issue_value: string;
  issue_evidence: string;
  serial_number_value: string;
  serial_number_evidence: string;
}

export type FieldKey = "purchase_date" | "product" | "issue" | "serial_number";

export const FIELD_KEYS: FieldKey[] = [
  "purchase_date",
  "product",
  "issue",
  "serial_number",
];

export const FLAT_SCHEMA_KEYS: (keyof FlatClaimExtraction)[] = [
  "purchase_date_value",
  "purchase_date_evidence",
  "product_value",
  "product_evidence",
  "issue_value",
  "issue_evidence",
  "serial_number_value",
  "serial_number_evidence",
];

export type GateStatus =
  | "EVIDENCE_PRESENT"
  | "MISSING"
  | "INVALID_EVIDENCE"
  | "VALUE_NOT_IN_EVIDENCE"
  | "VALUE_NOT_LITERAL_REVIEW"
  | "AMBIGUOUS_DATE_REVIEW"
  | "MULTIPLE_DATES_REVIEW"
  | "DELIVERY_DATE_REVIEW"
  | "NO_ISSUE_STATED"
  | "QUESTIONABLE_SERIAL"
  | "PROMPT_INJECTION_DETECTED"
  | "MULTI_PRODUCT_REVIEW";

export type OverallValidationStatus = "BASIC_CHECKS_PASSED" | "REVIEW_REQUIRED";

export interface FieldDetail {
  value: string;
  evidence: string;
  status: GateStatus;
  evidence_in_source: boolean;
  value_in_source: boolean;
  value_in_evidence: boolean;
  reason: string;
  accepted_value: string;
  span_start?: number;
  span_end?: number;
}

export interface DateCheckResult {
  code: string;
  message: string;
  found_dates: string[];
}

export interface ValidationResult {
  final_values: Record<FieldKey, string>;
  field_statuses: Record<FieldKey, GateStatus>;
  field_details: Record<FieldKey, FieldDetail>;
  date_check: DateCheckResult;
  overall_status: OverallValidationStatus;
  rejection_count: number;
  accepted_count: number;
  injection_detected: boolean;
}

export type ModelConfig =
  | "base"
  | "base_gate"
  | "fine_tuned"
  | "fine_tuned_gate";

export interface ExtractionResponse {
  claim: string;
  model_config: ModelConfig;
  model_id: string;
  model_type: "base" | "fine_tuned";
  raw_output: string;
  raw_extraction: FlatClaimExtraction | null;
  parse_error?: string | null;
  validation?: ValidationResult | null;
  latency_ms: number;
  timestamp: string;
  is_mock?: boolean;
}

export interface ComparisonConfigResult {
  config: ModelConfig;
  label: string;
  model_id: string;
  has_gate: boolean;
  extracted: Record<FieldKey, { value: string; evidence: string }>;
  final_values: Record<FieldKey, string>;
  field_statuses: Record<FieldKey, GateStatus>;
  field_details: Record<FieldKey, FieldDetail>;
  latency_ms: number;
  overall_status: OverallValidationStatus;
  accepted_count: number;
  withheld_count: number;
}

export interface FieldComparisonRow {
  field: FieldKey;
  label: string;
  base: { value: string; evidence: string; status: GateStatus };
  base_gate: { value: string; evidence: string; status: GateStatus; accepted: string };
  fine_tuned: { value: string; evidence: string; status: GateStatus };
  fine_tuned_gate: { value: string; evidence: string; status: GateStatus; accepted: string };
  is_different: boolean;
  gate_filtered_base: boolean;
  gate_filtered_ft: boolean;
}

export interface FourWayComparisonResponse {
  claim: string;
  timestamp: string;
  configs: Record<ModelConfig, ComparisonConfigResult>;
  field_summary: FieldComparisonRow[];
  total_latency_ms: number;
  is_mock?: boolean;
}

export interface BenchmarkMetrics {
  claims: number;
  field_accuracy_vs_policy_reference: number;
  record_exact_match_vs_policy_reference: number;
  schema_valid_rate: number;
  field_coverage_all_slots: number;
  coverage_of_expected_nonempty_fields: number;
  accuracy_among_nonempty_predictions: number;
  false_fill_rate_on_expected_blank_fields: number;
  abstention_precision: number;
  abstention_recall: number;
  evidence_literal_rate: number;
  value_evidence_support_rate: number;
  mean_latency_seconds: number;
  per_category: Record<
    string,
    {
      claims: number;
      field_accuracy: number;
      record_exact_match: number;
    }
  >;
}

export interface BootstrapCI {
  difference: number;
  ci95_low: number;
  ci95_high: number;
  unit: string;
}

export interface AuditKitHeadline {
  field_exact_match: number;
  schema_validity: number;
  evidence_support: number;
}

export type BenchmarkConfigKey =
  | "base"
  | "base_plus_gate"
  | "fine_tuned"
  | "fine_tuned_plus_gate";

export interface BenchmarkReport {
  challenge_set: string;
  claim_count: number;
  caveat: string;
  configs: {
    base: BenchmarkMetrics;
    base_plus_gate: BenchmarkMetrics;
    fine_tuned: BenchmarkMetrics;
    fine_tuned_plus_gate: BenchmarkMetrics;
  };
  paired_bootstrap_95pct_ci: Record<string, BootstrapCI>;
  auditkit: Record<
    string,
    {
      headline: AuditKitHeadline;
      prediction_count: number;
      failed_count: number;
      errors: string[];
    }
  >;
}

export interface HumanReviewItem {
  id: string;
  created_at: string;
  claim: string;
  field: FieldKey;
  candidate_value: string;
  candidate_evidence: string;
  gate_status: GateStatus;
  rejection_reason: string;
  model_source: ModelConfig;
  review_decision: "pending" | "accepted" | "rejected" | "corrected";
  corrected_value?: string;
  notes?: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unavailable";
  proxy_url: string;
  proxy_reachable: boolean;
  sglang_reachable: boolean;
  base_model: {
    id: string;
    available: boolean;
  };
  tuned_model: {
    id: string;
    available: boolean;
    adapter_name: string;
  };
  latency_ms: number;
  environment: {
    base_url_set: boolean;
    token_set: boolean;
    node_env: string;
  };
  diagnostics: string;
  timestamp: string;
}
