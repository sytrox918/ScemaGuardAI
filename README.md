# SchemaGuard AI 🛡️
### Structured Output, Evidence Grounding & Deterministic Gate for Warranty Claims

> **Syntax Error 2026 — Local LLM Track**  
> **Problem Statement #5: Structured Output and Extraction**  
> *"Schema-valid is not the same as correct. SchemaGuard combines structured generation, evidence verification, and conservative abstention to eliminate unsupported extractions."*

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [The Core Problem](#-the-core-problem)
3. [System Architecture & Deployment Topology](#-system-architecture--deployment-topology)
4. [2x2 Factorial Matrix & Benchmark Evidence](#-2x2-factorial-matrix--benchmark-evidence)
5. [Repository Structure](#-repository-structure)
6. [Frontend Application Features](#-frontend-application-features)
7. [Step-by-Step Setup & Quickstart](#-step-by-step-setup--quickstart)
8. [Connecting the Kaggle / SGLang Backend](#-connecting-the-kaggle--sglang-backend)
9. [Environment Variables Reference](#-environment-variables-reference)
10. [Verification & Test Suite](#-verification--test-suite)
11. [Vercel Deployment Guide](#-vercel-deployment-guide)

---

## 💡 Executive Summary

Large Language Models frequently hallucinate structured details, map delivery dates to purchase dates when no purchase date exists, fabricate missing serial numbers, or fail under ambiguous numeric formats (e.g., `04/05/2026`). In high-stakes enterprise workflows such as warranty claims and insurance processing, silent extraction errors lead to fraudulent or rejected claims.

**SchemaGuard AI** provides an end-to-end solution:
1. **Grammar-Constrained Decoding (SGLang)**: Guarantees 100% strict JSON schema compliance during token generation.
2. **Dual-Part Extraction Schema**: Extracts 4 fields alongside verbatim supporting text spans (`value` + `evidence`) across 8 flat string keys.
3. **Deterministic Evidence Validation Gate**: Enforces literal substring presence in source text, identifies ambiguous dates, detects multiple conflicting dates, flags order numbers masquerading as serial numbers, and abstains safely.
4. **Human-in-the-Loop Review Queue**: Safely routes risky, ambiguous, or ungrounded candidate fields to human claims adjusters with 1-click override and audit export capabilities.

---

## 🔍 The Core Problem

When evaluating off-the-shelf LLMs on unstructured warranty claims:
- **False-Fill on Missing Fields**: Foundation models attempt to "be helpful" by hallucinating missing values. In our 32-claim challenge benchmark, **Qwen/Qwen3-1.7B Base falsely filled blank/delivery dates 48.0% of the time**.
- **Date Ambiguity**: Numeric strings like `04/05/2026` cannot be resolved without locale context. Models guess silently rather than abstaining.
- **Delivery Date Semantic Mismatches**: When a customer writes *"Package delivered on October 12"*, the model extracts it as `purchase_date`, leading to erroneous warranty expirations.
- **Overconfident JSON Generation**: Constrained JSON libraries guarantee syntactic validity, but cannot verify semantic truthfulness against the source text.

---

## 🏗️ System Architecture & Deployment Topology

SchemaGuard AI uses a hybrid cloud topology that separates browser clients from GPU inference infrastructure, ensuring **zero client-side secret leakage**.

```text
Judge / Public Browser
       │
       ▼  (HTTPS)
Vercel-Deployed Next.js Frontend (Next.js 16 + Turbopack + Tailwind CSS)
       │
       ▼  (Server-Side API Route: /api/extract, /api/compare, /api/health)
Authenticated Cloudflare Quick Tunnel (HTTPS)
       │  [Header: X-SchemaGuard-Token]
       ▼
Kaggle FastAPI Proxy (127.0.0.1:30001)
       │
       ▼  (Local HTTP)
SGLang Inference Server (127.0.0.1:30000)
       ├── Qwen/Qwen3-1.7B (Base Foundation Model)
       └── Qwen/Qwen3-1.7B + schemaguard (Fine-Tuned LoRA Adapter)
```

### Security Architecture
- The secret `SGLANG_API_TOKEN` is **exclusively read server-side** by Next.js API route handlers.
- Tokens are never prefixed with `NEXT_PUBLIC_` and never transmitted to browser JavaScript.
- All server error handlers automatically redact token strings from logs and client responses.
- The FastAPI proxy whitelists only permitted model IDs and routes.

---

## 📊 2x2 Factorial Matrix & Benchmark Evidence

To evaluate whether fine-tuning, deterministic gating, or their combination yields the most reliable extractions, SchemaGuard was audited on a targeted 32-claim challenge test set spanning 8 stress categories:

| Metric | Base (Qwen3-1.7B) | Base + Gate | Fine-Tuned (`schemaguard`) | Fine-Tuned + Gate |
| :--- | :---: | :---: | :---: | :---: |
| **Field Accuracy** | 75.78% | **78.13%** | 74.22% | 75.78% |
| **False-Fill Rate (Expected Blank)** | 48.00% | **0.00%** | 44.00% | **0.00%** |
| **Schema Validity** | 100.0% | 100.0% | 100.0% | 100.0% |
| **Evidence Support Rate** | 68.75% | **100.0%** | 71.88% | **100.0%** |
| **Date Exact Match** | 56.25% | **75.00%** | 62.50% | **75.00%** |
| **Paired Bootstrap 95% CI** | [69.5%, 82.0%] | [71.1%, 84.4%] | [68.0%, 80.5%] | [69.5%, 82.0%] |

### Key Empirical Findings:
1. **The Evidence Gate completely eliminated false fills**: False-fill rate plummeted from **48% to 0%** when gating was applied.
2. **Gating improved Base date accuracy from 56.25% to 75.00%**: By abstaining on conflicting and ambiguous dates, downstream warranty pipelines are protected from corrupt records.
3. **Domain adaptation alone is insufficient**: Fine-tuning alone still exhibited a 44% false-fill rate on delivery dates, proving that **deterministic post-generation verification is essential**.

---

## 📁 Repository Structure

```text
e:/se/
├── README.md                           # Main system documentation (this file)
├── schemaguard_proxy.py                # Authenticated FastAPI proxy for Kaggle/Cloudflare tunneling
├── ml_artifacts/                       # Post-training and offline ML pipeline
│   ├── schemaguard.py                  # Python extraction & validation reference implementation
│   ├── schemaguard_clean.ipynb         # Full Kaggle training & benchmark notebook
│   ├── challenge_32_2x2_report.json    # Genuine 32-claim 2x2 evaluation results & bootstrap CIs
│   └── app.py                          # Streamlit fallback application
└── schemaguard-web/                    # Production Next.js 16 full-stack application
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── extract/route.ts    # Secure SGLang forwarder & gate evaluation
    │   │   │   ├── compare/route.ts    # 4-way comparative extraction runner
    │   │   │   ├── health/route.ts     # Remote proxy connectivity & model diagnostics
    │   │   │   └── benchmark/route.ts  # Benchmark dataset & report server
    │   │   ├── layout.tsx              # Root HTML shell & viewport metadata
    │   │   ├── page.tsx                # Master state controller & tab router
    │   │   └── globals.css             # Tailored dark-mode design system & animations
    │   ├── components/
    │   │   ├── Sidebar.tsx             # Navigation drawer with live backend indicator
    │   │   ├── FieldCard.tsx           # Structured slot visualizer & review triggers
    │   │   ├── ClaimHighlighter.tsx    # Interactive verbatim evidence grounding spans
    │   │   ├── BenchmarkCharts.tsx     # 2x2 accuracy, false-fill & confidence charts
    │   │   ├── JsonViewerModal.tsx     # Raw JSON inspector and copy modal
    │   │   └── views/
    │   │       ├── OverviewView.tsx    # System health, benchmark cards, quick start
    │   │       ├── LiveExtractionView.tsx # Workspace with dual raw/parsed output tabs
    │   │       ├── ModelComparisonView.tsx # 4-way side-by-side claim analyzer
    │   │       ├── EvaluationDashboardView.tsx # AuditKIT 32-claim challenge explorer
    │   │       ├── HumanReviewView.tsx # Triage queue with approve/override controls
    │   │       └── PipelineAboutView.tsx # End-to-end architecture & bifurcation guide
    │   ├── lib/
    │   │   ├── gate.ts                 # Deterministic evidence gate & heuristic rules
    │   │   ├── sglang-client.ts        # Resilient SGLang caller with token redaction
    │   │   └── __tests__/
    │   │       └── gate.test.ts        # 15 Vitest unit tests for gate rules
    │   ├── types/
    │   │   └── schemaguard.ts          # Core TypeScript interfaces & schemas
    │   └── data/
    │       ├── examples.ts             # 8 challenge-set preset claims
    │       └── challenge_32_2x2_report.json # Bundled benchmark results
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    └── vitest.config.mjs
```

---

## 🖥️ Frontend Application Features

The frontend is built with Next.js 16 (App Router), Vanilla CSS tokens, Tailwind CSS, Lucide icons, and modern micro-animations:

### 1. Live Warranty Extraction Workspace
- **Model Selector**: Clean toggle between **Fine-Tuned Model (`schemaguard`)** and **Base Model (`Qwen/Qwen3-1.7B`)**.
- **Evidence Grounding Filter**: Optional toggle enabling/disabling the deterministic post-filter.
- **Preset Challenge Scenarios**: 8 pre-loaded claims (normal claims, missing serial, ambiguous dates like `04/05/2026`, conflicting dates, delivery date substitutions, adversarial prompt injections).
- **Dual Output Inspection**:
  - **Raw Model Output**: Verbatim string received from SGLang with character counter and copy button.
  - **Parsed JSON Output**: Validated 8-string flat JSON format.
  - **Malformed JSON Resilience**: Gracefully isolates parser errors without crashing.
- **Claim Highlighter**: Direct in-text evidence span highlighting mapped to extracted slots.
- **Structured Field Cards**: Real-time status badges (`ACCEPTED`, `UNSUPPORTED_VALUE`, `AMBIGUOUS_DATE`, `DELIVERY_DATE_ONLY`, `MISSING_VALUE`) with direct "Send to Human Review" buttons.

### 2. 4-Way Model Comparison Workspace
- Submits any claim concurrently across **all 4 configurations** (`Base`, `Base + Gate`, `Fine-Tuned`, `Fine-Tuned + Gate`).
- Side-by-side slot breakdown highlighting differences in hallucination, false fills, and evidence retention.

### 3. Evaluation Dashboard (AuditKIT & 2x2 Factorial Matrix)
- Interactive charts rendering exact match accuracy, false-fill rates on expected blank slots, and paired bootstrap 95% confidence intervals.
- Breakdown across the 8 challenge categories.

### 4. Human Review & Triage Queue
- Centralized claims queue for fields flagged by the gate.
- Claims adjusters can **Approve As-Is**, **Reject Candidate**, or **Override & Correct Value**.
- Single-click export of reviewed audit logs.

### 5. System Health & Diagnostics
- Real-time polling of remote FastAPI proxy and SGLang inference status.
- Reports model availability, upstream latency, and tunnel connection diagnostics.
- Graceful offline demonstrator mode if the remote GPU session is paused.

---

## 🚀 Step-by-Step Setup & Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/your-username/schemaguard.git
cd schemaguard/schemaguard-web
npm install
```

### 2. Run Tests & Validation
```bash
# Run 15 unit tests covering deterministic gate rules
npm test

# Run ESLint
npm run lint

# Compile production build with Turbopack
npm run build
```

### 3. Start Local Server
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

---

## ⚡ Connecting the Kaggle / SGLang Backend

When hosting SGLang inside a GPU environment (e.g., Kaggle T4/P100 or a cloud GPU):

### Step 1: Start SGLang
```bash
python -m sglang.launch_server \
  --model-path Qwen/Qwen3-1.7B \
  --lora-paths schemaguard=/path/to/schemaguard_lora \
  --port 30000 \
  --host 127.0.0.1
```

### Step 2: Start the Authenticated FastAPI Proxy
Run `schemaguard_proxy.py` (included in repository root):
```bash
export SCHEMAGUARD_PROXY_TOKEN="your-secret-token"
export SGLANG_LOCAL_URL="http://127.0.0.1:30000"
export PROXY_PORT=30001
python schemaguard_proxy.py
```

### Step 3: Launch Cloudflare Tunnel
In a separate terminal or notebook cell:
```bash
cloudflared tunnel --url http://127.0.0.1:30001
```
Cloudflare will output a public HTTPS tunnel URL:
```text
https://xxxx-xxxx-xxxx.trycloudflare.com
```

### Step 4: Configure Local `.env`
In `schemaguard-web/.env` (or `.env.local`):
```env
SGLANG_BASE_URL=https://xxxx-xxxx-xxxx.trycloudflare.com
SGLANG_API_TOKEN=your-secret-token
BASE_MODEL_ID=Qwen/Qwen3-1.7B
TUNED_MODEL_ID=schemaguard
```

Restart your Next.js server (`npm start` or `npm run dev`). The sidebar and Overview tab will immediately display **Healthy / Live SGLang Upstream**.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `SGLANG_BASE_URL` | Optional | Public HTTPS URL pointing to the FastAPI proxy | `https://your-tunnel.trycloudflare.com` |
| `SGLANG_API_TOKEN` | Required if URL set | Authentication token sent in `X-SchemaGuard-Token` header | `your-secret-token` |
| `BASE_MODEL_ID` | Optional | Identifier for the base foundation model | `Qwen/Qwen3-1.7B` |
| `TUNED_MODEL_ID` | Optional | Identifier for the fine-tuned LoRA model | `schemaguard` |

> **Offline Mode**: If `SGLANG_BASE_URL` is omitted, the frontend automatically activates an intelligent offline simulation modeled on the 32 challenge benchmark behaviors, enabling full UI exploration without an active GPU.

---

## ✅ Verification & Test Suite

The codebase has undergone verification across all layers:

1. **Deterministic Gate Unit Tests (`npm test`)**:
   - `Scenario 1: Standard Claim with 100% Verbatim Evidence` → `BASIC_CHECKS_PASSED`
   - `Scenario 2: Missing Serial Number Slot` → Safely abstains (`MISSING`)
   - `Scenario 3: Fabricated Date Not in Source Claim` → Flags `INVALID_EVIDENCE`
   - `Scenario 4: Ambiguous Numeric Date (04/05/2026)` → Flags `AMBIGUOUS_DATE_FORMAT`
   - `Scenario 5: Multiple Conflicting Dates in Claim` → Flags `MULTIPLE_DATES_DETECTED`
   - `Scenario 6: Delivery Date Stated Without Purchase Date` → Flags `DELIVERY_DATE_ONLY`
   - `Scenario 7: Heuristic Prompt Injection Pattern` → Flags `PROMPT_INJECTION_DETECTED`
   - `Scenario 8: Multiple Electronic Devices in Ticket` → Flags `MULTI_PRODUCT_REVIEW`
   - `Scenario 9: Order Number Formats (ORD-12345)` → Flags `QUESTIONABLE_SERIAL`
   - `15 / 15 tests pass (0 failures)`.

2. **TypeScript & Static Analysis**:
   - Strict TypeScript type-checking passed (`0 errors`).
   - ESLint validation passed (`0 errors`, `0 warnings`).

3. **Live Inference Verification**:
   - Verified live extraction with `schemaguard` returning 200 OK in ~5.7s.
   - Verified live extraction with `Qwen/Qwen3-1.7B` returning 200 OK in ~5.3s.

---

## 🌐 Vercel Deployment Guide

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `schemaguard-web`.
5. Under **Environment Variables**, add:
   - `SGLANG_BASE_URL` = `https://your-tunnel.trycloudflare.com`
   - `SGLANG_API_TOKEN` = `your-proxy-secret`
   - `BASE_MODEL_ID` = `Qwen/Qwen3-1.7B`
   - `TUNED_MODEL_ID` = `schemaguard`
6. Click **Deploy**. Vercel will execute `npm run build` and output a production HTTPS deployment URL.

---

## 🏆 Syntax Error 2026 Hackathon Details

- **Track**: Local LLM Track
- **Problem Statement**: #5 Structured Output and Extraction
- **Base Model**: `Qwen/Qwen3-1.7B`
- **Inference Server**: SGLang (Structured JSON Decoding)
- **Curation Stack**: Lexsi Labs CuratorKIT (`sft_alpaca.jsonl`)
- **Alignment Stack**: TRL / LoRA Supervised Fine-Tuning
- **Evaluation Stack**: AuditKIT 2x2 Factorial Matrix & 32-Claim Challenge Set
