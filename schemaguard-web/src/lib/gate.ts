import {
  FieldKey,
  FIELD_KEYS,
  FlatClaimExtraction,
  FLAT_SCHEMA_KEYS,
  GateStatus,
  ValidationResult,
  FieldDetail,
  DateCheckResult,
} from "../types/schemaguard";

/**
 * Normalize text by replacing punctuation with single spaces and lowercasing.
 */
export function norm(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * True if `span` appears in `source` as a contiguous run of whole tokens.
 */
export function occurs(source: string, span: string): boolean {
  const normSource = norm(source);
  const normSpan = norm(span);
  if (!normSpan) return false;
  return ` ${normSource} `.includes(` ${normSpan} `);
}

/**
 * Case-insensitive substring find to locate exact or approximate char offsets.
 */
export function findSpanOffsets(
  source: string,
  span: string
): { start: number; end: number } | null {
  if (!span.trim() || !source) return null;
  const idx = source.toLowerCase().indexOf(span.toLowerCase().trim());
  if (idx !== -1) {
    return { start: idx, end: idx + span.trim().length };
  }
  return null;
}

const MONTHS =
  "january|february|march|april|may|june|july|august|september|" +
  "october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|" +
  "oct|nov|dec";

const DATE_REGEX = new RegExp(
  "\\b(?:" +
    "\\d{4}-\\d{2}-\\d{2}" +
    "|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}" +
    "|\\d{1,2}\\s+(?:" +
    MONTHS +
    ")\\s+\\d{4}" +
    "|(?:" +
    MONTHS +
    ")\\s+\\d{1,2},?\\s+\\d{4}" +
    "|(?:" +
    MONTHS +
    ")\\s+\\d{4}" +
    ")\\b",
  "gi"
);

const NUMERIC_DATE_REGEX = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g;

const DEFECT_TERMS = [
  "charging",
  "charge",
  "flicker",
  "flickers",
  "flickering",
  "battery drains",
  "drains quickly",
  "drain",
  "overheats",
  "overheating",
  "overheat",
  "broken",
  "cracked",
  "damaged",
  "damage",
  "stopped working",
  "stop working",
  "not turning on",
  "wont start",
  "won't start",
  "dead",
  "failure",
  "fails",
  "defective",
  "glitch",
  "freeze",
  "freezes",
  "crash",
  "crashes",
  "malfunction",
  "malfunctioning",
  "shut down",
  "shuts down",
  "burn",
  "burned",
  "leak",
  "leaking",
  "buzzing",
  "distorted",
  "unresponsive",
];

const DELIVERY_INDICATORS = [
  "delivered on",
  "delivered",
  "delivery date",
  "shipped on",
  "shipped",
  "shipping date",
  "arrived on",
  "received on",
  "dispatch",
  "dispatched",
];

const PURCHASE_INDICATORS = [
  "purchased on",
  "purchased",
  "purchase date",
  "bought on",
  "bought",
  "ordered on",
  "ordered",
  "invoice date",
  "acquired",
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) (instructions|prompts|rules)/i,
  /system prompt/i,
  /disregard previous/i,
  /override the (schema|system|rules)/i,
  /you are now in developer mode/i,
  /you must output/i,
  /new instruction:/i,
  /assistant:/i,
  /json_schema: ?override/i,
];

const KNOWN_ELECTRONICS_PRODUCTS = [
  "laptop",
  "macbook",
  "thinkpad",
  "dell xps",
  "chromebook",
  "phone",
  "iphone",
  "galaxy",
  "pixel",
  "tablet",
  "ipad",
  "monitor",
  "display",
  "keyboard",
  "mouse",
  "headphone",
  "headphones",
  "earbuds",
  "airpods",
  "smartwatch",
  "apple watch",
  "camera",
  "printer",
  "tv",
  "television",
  "speaker",
  "router",
  "console",
  "playstation",
  "xbox",
];

/**
 * Validate that the model output strictly adheres to the 8 required string fields.
 */
export function validateSchema(raw: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["Extraction output must be an object"] };
  }

  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(obj);

  for (const requiredKey of FLAT_SCHEMA_KEYS) {
    if (!(requiredKey in obj)) {
      errors.push(`Missing required key: ${requiredKey}`);
    } else if (typeof obj[requiredKey] !== "string") {
      errors.push(`Field ${requiredKey} must be a string`);
    }
  }

  for (const key of keys) {
    if (!FLAT_SCHEMA_KEYS.includes(key as keyof FlatClaimExtraction)) {
      errors.push(`Unexpected extra key: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Classify dates present in the source claim for ambiguity, conflict, or delivery confusion.
 */
export function classifyClaimDates(claim: string): DateCheckResult {
  const foundDates: string[] = [];
  let match: RegExpExecArray | null;

  const dateRegex = new RegExp(DATE_REGEX.source, "gi");
  while ((match = dateRegex.exec(claim)) !== null) {
    const d = match[0].trim();
    if (!foundDates.some((fd) => norm(fd) === norm(d))) {
      foundDates.push(d);
    }
  }

  // Check for ambiguous numeric format like 04/05/2026 (day/month vs month/day)
  const numRegex = new RegExp(NUMERIC_DATE_REGEX.source, "g");
  while ((match = numRegex.exec(claim)) !== null) {
    const a = parseInt(match[1], 10);
    const b = parseInt(match[2], 10);
    if (a >= 1 && a <= 12 && b >= 1 && b <= 12 && a !== b) {
      return {
        code: "AMBIGUOUS_DATE_REVIEW",
        message: `Numeric date "${match[0]}" is ambiguous: month/day vs day/month cannot be determined deterministically.`,
        found_dates: foundDates,
      };
    }
  }

  // Check if multiple distinct dates are mentioned
  if (foundDates.length > 1) {
    return {
      code: "MULTIPLE_DATES_REVIEW",
      message: `Multiple distinct dates found in claim (${foundDates.join(", ")}). Requires human review to confirm purchase date.`,
      found_dates: foundDates,
    };
  }

  return {
    code: "NO_DATE_REVIEW_TRIGGERED",
    message: "No date ambiguity or conflicts detected.",
    found_dates: foundDates,
  };
}

/**
 * Check if the text contains multiple products.
 */
export function detectMultipleProducts(claim: string): boolean {
  const claimNorm = norm(claim);
  let matchedCount = 0;
  for (const prod of KNOWN_ELECTRONICS_PRODUCTS) {
    if (` ${claimNorm} `.includes(` ${prod} `)) {
      matchedCount++;
    }
  }
  return matchedCount >= 2;
}

/**
 * Check if claim has prompt injection cues.
 */
export function detectPromptInjection(claim: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pat) => pat.test(claim));
}

/**
 * Execute the deterministic gate on a claim and its raw extracted fields.
 * Returns field statuses, reasons, and conservatively filtered accepted values.
 */
export function validateClaimExtraction(
  claim: string,
  extracted: FlatClaimExtraction
): ValidationResult {
  const dateCheck = classifyClaimDates(claim);
  const claimNorm = norm(claim);
  const injectionDetected = detectPromptInjection(claim);
  const multiProduct = detectMultipleProducts(claim);

  const finalValues: Record<FieldKey, string> = {
    purchase_date: "",
    product: "",
    issue: "",
    serial_number: "",
  };

  const fieldStatuses: Record<FieldKey, GateStatus> = {
    purchase_date: "MISSING",
    product: "MISSING",
    issue: "MISSING",
    serial_number: "MISSING",
  };

  const fieldDetails: Record<FieldKey, FieldDetail> = {} as Record<
    FieldKey,
    FieldDetail
  >;

  for (const field of FIELD_KEYS) {
    const valKey = `${field}_value` as keyof FlatClaimExtraction;
    const eviKey = `${field}_evidence` as keyof FlatClaimExtraction;

    const rawValue = (extracted[valKey] || "").trim();
    const rawEvidence = (extracted[eviKey] || "").trim();

    const evidenceInSource = occurs(claim, rawEvidence);
    const valueInSource = occurs(claim, rawValue);
    const valueInEvidence = rawValue ? occurs(rawEvidence, rawValue) : false;

    const spanOffsets = findSpanOffsets(claim, rawEvidence || rawValue);

    let status: GateStatus = "EVIDENCE_PRESENT";
    let reason = "Verified: verbatim evidence and value present in source claim.";

    // 1. Both empty
    if (!rawValue && !rawEvidence) {
      status = "MISSING";
      reason = "Field was omitted or stated as empty by the model.";
    }
    // 2. Value present but no evidence
    else if (rawValue && !rawEvidence) {
      status = "INVALID_EVIDENCE";
      reason = "Candidate value extracted without any supporting evidence span.";
    }
    // 3. Evidence provided but no value extracted
    else if (!rawValue && rawEvidence) {
      status = "VALUE_NOT_IN_EVIDENCE";
      reason = "Evidence span was extracted, but no structured value was extracted.";
    }
    // 4. Evidence does not appear in source claim
    else if (!evidenceInSource) {
      status = "INVALID_EVIDENCE";
      reason = `Evidence "${rawEvidence}" does not appear as a verbatim span in the claim.`;
    }
    // 5. Value is not in the evidence span
    else if (!valueInEvidence) {
      status = "VALUE_NOT_IN_EVIDENCE";
      reason = `Extracted value "${rawValue}" does not appear inside the supporting evidence span "${rawEvidence}".`;
    }
    // 6. Value does not appear in source claim
    else if (!valueInSource) {
      status = "VALUE_NOT_LITERAL_REVIEW";
      reason = `Value "${rawValue}" does not match source claim text literally.`;
    }
    // 7. Prompt injection detected
    else if (injectionDetected && (rawValue.toLowerCase().includes("hacked") || rawValue.toLowerCase().includes("ignore") || rawValue.toLowerCase().includes("override"))) {
      status = "PROMPT_INJECTION_DETECTED";
      reason = "Prompt injection attempt detected inside claim text; candidate rejected.";
    }
    // 8. Field-specific validations
    else {
      // Check date field
      if (field === "purchase_date") {
        // Check if date mentions delivery/shipping instead of purchase
        const eviNorm = norm(rawEvidence);
        const hasDelivery = DELIVERY_INDICATORS.some((di) => eviNorm.includes(di));
        const hasPurchase = PURCHASE_INDICATORS.some((pi) => eviNorm.includes(pi) || claimNorm.includes(pi));

        if (hasDelivery && !hasPurchase) {
          status = "DELIVERY_DATE_REVIEW";
          reason = `Extracted date appears to be a delivery/shipping date ("${rawEvidence}") rather than an explicit purchase date.`;
        } else if (dateCheck.code === "AMBIGUOUS_DATE_REVIEW") {
          status = "AMBIGUOUS_DATE_REVIEW";
          reason = dateCheck.message;
        } else if (dateCheck.code === "MULTIPLE_DATES_REVIEW") {
          status = "MULTIPLE_DATES_REVIEW";
          reason = dateCheck.message;
        }
      }

      // Check product field
      else if (field === "product") {
        if (multiProduct) {
          status = "MULTI_PRODUCT_REVIEW";
          reason = "Multiple distinct electronics products mentioned in claim; manual disambiguation required.";
        }
      }

      // Check issue field
      else if (field === "issue") {
        const hasDefectTerm = DEFECT_TERMS.some((term) => claimNorm.includes(term));
        if (!hasDefectTerm) {
          status = "NO_ISSUE_STATED";
          reason = "No confirmed defect or malfunction keyword found in claim text.";
        }
      }

      // Check serial number field
      else if (field === "serial_number") {
        const valNorm = norm(rawValue);
        // If it looks like an order number or phone number
        if (valNorm.startsWith("order") || valNorm.startsWith("ord") || valNorm.startsWith("invoice")) {
          status = "QUESTIONABLE_SERIAL";
          reason = `Candidate serial number "${rawValue}" appears to be an order/invoice number rather than a hardware serial.`;
        } else if (/^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(rawValue.trim())) {
          status = "QUESTIONABLE_SERIAL";
          reason = `Candidate serial number "${rawValue}" matches a telephone number format.`;
        }
      }
    }

    // Conservative abstention: only accept field if gate status is EVIDENCE_PRESENT
    const isAccepted = status === "EVIDENCE_PRESENT";
    const acceptedValue = isAccepted ? rawValue : "";

    finalValues[field] = acceptedValue;
    fieldStatuses[field] = status;

    fieldDetails[field] = {
      value: rawValue,
      evidence: rawEvidence,
      status,
      evidence_in_source: evidenceInSource,
      value_in_source: valueInSource,
      value_in_evidence: valueInEvidence,
      reason,
      accepted_value: acceptedValue,
      span_start: spanOffsets?.start,
      span_end: spanOffsets?.end,
    };
  }

  const rejectedCount = FIELD_KEYS.filter((f) => fieldStatuses[f] !== "EVIDENCE_PRESENT" && fieldStatuses[f] !== "MISSING").length;
  const acceptedCount = FIELD_KEYS.filter((f) => fieldStatuses[f] === "EVIDENCE_PRESENT").length;

  const requiresReview = FIELD_KEYS.some((f) => fieldStatuses[f] !== "EVIDENCE_PRESENT");

  return {
    final_values: finalValues,
    field_statuses: fieldStatuses,
    field_details: fieldDetails,
    date_check: dateCheck,
    overall_status: requiresReview ? "REVIEW_REQUIRED" : "BASIC_CHECKS_PASSED",
    rejection_count: rejectedCount,
    accepted_count: acceptedCount,
    injection_detected: injectionDetected,
  };
}
