%%writefile /kaggle/working/app.py
import json
import sys
from pathlib import Path

import requests
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schemaguard import MODEL, extract_claim, validate_claim

CURATED_FILE = Path("/kaggle/working/schemaguard_curation/official_run/sft_alpaca.jsonl")
SAMPLE = (
    "My laptop overheats during video calls. "
    "Purchased on 12 February 2026. Serial number: SN10001."
)

st.set_page_config(page_title="SchemaGuard AI", page_icon="🛡️", layout="wide")
st.title("🛡️ SchemaGuard AI")
st.caption("Evidence-backed extraction and validation for electronics warranty claims")

with st.sidebar:
    st.header("System")
    st.write("Inference engine: SGLang")
    st.write(f"Model: `{MODEL}`")
    st.write("Curation: Lexsi Labs CuratorKIT")
    if CURATED_FILE.exists():
        with CURATED_FILE.open(encoding="utf-8") as f:
            st.metric("Curated candidate examples", sum(1 for line in f if line.strip()))
        st.caption("CuratorKIT output; labels are not independently verified.")

claim = st.text_area(
    "Enter a warranty claim", value=SAMPLE, height=150,
    help="Try a claim with missing information or conflicting dates to trigger review.",
)

if st.button("Extract and validate", type="primary"):
    if not claim.strip():
        st.warning("Enter a claim first.")
    else:
        try:
            with st.spinner("Running extraction and validation..."):
                extracted = extract_claim(claim)
                result = validate_claim(claim, extracted)

            if result["overall_status"] == "BASIC_CHECKS_PASSED":
                st.success("Basic validation checks passed.")
            else:
                st.warning("Human review required.")

            left, right = st.columns(2)
            with left:
                st.subheader("Accepted values")
                st.json(result["final_values"])
            with right:
                st.subheader("Validation status")
                st.json({
                    "overall_status": result["overall_status"],
                    "date_check": result["date_check"],
                    "field_statuses": result["field_statuses"],
                })

            st.subheader("Evidence and field checks")
            st.dataframe([
                {
                    "Field": field,
                    "Extracted value": d["value"],
                    "Evidence": d["evidence"],
                    "Status": d["status"],
                    "Evidence in claim": d["evidence_in_source"],
                    "Value in claim": d["value_in_source"],
                }
                for field, d in result["field_details"].items()
            ], hide_index=True)

            with st.expander("Raw extraction"):
                st.json(extracted)

            st.download_button(
                "Download result as JSON",
                data=json.dumps({"claim": claim, "extracted": extracted, "decision": result},
                                indent=2, ensure_ascii=False),
                file_name="schemaguard_result.json",
                mime="application/json",
            )
        except requests.RequestException as exc:
            st.error("Could not reach SGLang on port 30000. Check that the server is running.")
            st.code(str(exc))
        except Exception as exc:
            st.error(f"Extraction or validation failed: {exc}")