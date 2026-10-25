%%writefile /kaggle/working/schemaguard.py
"""SchemaGuard core: SGLang-backed extraction plus deterministic validation."""
import json
import re

import requests

URL = "http://127.0.0.1:30000/v1/chat/completions"
MODEL = "Qwen/Qwen3-1.7B"

FIELDS = ["purchase_date", "product", "issue", "serial_number"]
FLAT_KEYS = [f"{field}_{part}" for field in FIELDS for part in ("value", "evidence")]

# Flat schema: eight strings, no model-generated statuses or conflicts.
SCHEMA = {
    "type": "object",
    "properties": {key: {"type": "string"} for key in FLAT_KEYS},
    "required": FLAT_KEYS,
    "additionalProperties": False,
}

SYSTEM_PROMPT = (
    "Extract purchase_date, product, issue, serial_number. "
    "Return exactly the flat JSON fields in the schema. "
    "Copy short supporting evidence verbatim from the claim. "
    "Use empty strings for fields not explicitly stated. "
    "Do not invent information. Preserve date wording. "
    "The issue is a reported defect, not a warranty request. "
    "Do not generate statuses, confidence scores, or conflicts."
)


# --------------------------------------------------------------- extraction
def extract_claim(claim, model=MODEL, system_prompt=SYSTEM_PROMPT, url=URL):
    """Call SGLang with strict JSON-schema decoding; return {field: {value, evidence}}."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Claim:\n{claim}"},
        ],
        "temperature": 0,
        "max_tokens": 300,
        "chat_template_kwargs": {"enable_thinking": False},
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "claim_extraction", "strict": True, "schema": SCHEMA},
        },
    }
    response = requests.post(url, json=payload, timeout=120)
    response.raise_for_status()
    body = response.json()
    choice = body["choices"][0]

    if choice.get("finish_reason") == "length":
        raise RuntimeError(f"Truncated generation; usage={body.get('usage')}")

    flat = json.loads(choice["message"]["content"])
    if set(flat) != set(FLAT_KEYS):
        raise ValueError(f"Unexpected output keys: {list(flat)}")
    if not all(isinstance(v, str) for v in flat.values()):
        raise ValueError("All output fields must be strings")

    return {
        field: {
            "value": flat[f"{field}_value"].strip(),
            "evidence": flat[f"{field}_evidence"].strip(),
        }
        for field in FIELDS
    }


# --------------------------------------------------------------- validation
def norm(text):
    return re.sub(r"[^a-z0-9]+", " ", str(text).casefold()).strip()


def occurs(source, span):
    """True if `span` appears in `source` as a contiguous run of whole tokens."""
    span = norm(span)
    return bool(span) and f" {span} " in f" {norm(source)} "


MONTHS = (
    "January|February|March|April|May|June|July|August|September|"
    "October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|"
    "Oct|Nov|Dec"
)
DATE_RE = re.compile(
    rf"\b(?:\d{{4}}-\d{{2}}-\d{{2}}"
    rf"|\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}}"
    rf"|\d{{1,2}}\s+(?:{MONTHS})\s+\d{{4}}"
    rf"|(?:{MONTHS})\s+\d{{1,2}},?\s+\d{{4}}"
    rf"|(?:{MONTHS})\s+\d{{4}})\b",
    re.IGNORECASE,
)
NUMERIC_DATE_RE = re.compile(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b")

# Small domain vocabulary guard for the `issue` field; not a general defect classifier.
DEFECT_TERMS = [
    "charging", "flicker", "flickers", "flickering",
    "battery drains", "drains quickly", "overheats", "overheating",
    "broken", "cracked", "damaged", "stopped working",
    "not turning on", "wont start",
]


def classify_dates(claim):
    unique = list(dict.fromkeys(norm(m.group(0)) for m in DATE_RE.finditer(claim)))

    for m in NUMERIC_DATE_RE.finditer(claim):
        a, b = int(m.group(1)), int(m.group(2))
        if 1 <= a <= 12 and 1 <= b <= 12 and a != b:
            return "AMBIGUOUS_DATE_REVIEW"
    if len(unique) > 1:
        return "MULTIPLE_DATES_REVIEW"
    return "NO_DATE_REVIEW_TRIGGERED"


def validate_claim(claim, extracted):
    """Accept a field only if its evidence and value are literally present in the claim."""
    date_check = classify_dates(claim)
    claim_norm = norm(claim)
    final_values, statuses, details = {}, {}, {}

    for field in FIELDS:
        value, evidence = extracted[field]["value"].strip(), extracted[field]["evidence"].strip()

        if not value and not evidence:
            status = "MISSING"
        elif not value or not evidence:
            status = "REVIEW"
        elif not occurs(claim, evidence):
            status = "INVALID_EVIDENCE"
        elif not occurs(claim, value):
            status = "VALUE_NOT_LITERAL_REVIEW"
        elif field == "issue" and not any(term in claim_norm for term in DEFECT_TERMS):
            status = "NO_ISSUE_STATED"
        else:
            status = "EVIDENCE_PRESENT"

        accepted = value if status == "EVIDENCE_PRESENT" else ""

        # Date ambiguity or several dates overrides any candidate purchase date.
        if field == "purchase_date" and date_check != "NO_DATE_REVIEW_TRIGGERED":
            status, accepted = date_check, ""

        final_values[field] = accepted
        statuses[field] = status
        details[field] = {
            "value": value,
            "evidence": evidence,
            "status": status,
            "evidence_in_source": occurs(claim, evidence),
            "value_in_source": occurs(claim, value),
        }

    review = any(s != "EVIDENCE_PRESENT" for s in statuses.values())
    return {
        "final_values": final_values,
        "field_statuses": statuses,
        "field_details": details,
        "date_check": date_check,
        "overall_status": "REVIEW_REQUIRED" if review else "BASIC_CHECKS_PASSED",
    }