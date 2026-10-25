# SchemaGuard AI — Next.js Full-Stack Web Application

> **Syntax Error 2026 — Local LLM Track (Problem Statement #5: Structured Output and Extraction)**

This directory contains the production-ready Next.js 16 web application for **SchemaGuard AI**, featuring live SGLang structured extraction, deterministic evidence verification, dual raw/parsed output tabs, 4-way model comparison, AuditKIT evaluation dashboards, and a human claims review workspace.

---

## ⚡ Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (15 Vitest suites covering all deterministic gate rules)
npm test

# 3. Run ESLint
npm run lint

# 4. Compile production build (Turbopack + Next.js 16)
npm run build

# 5. Start production server
npm start
# -> http://localhost:3000
```

---

## ⚙️ Environment Variables (`.env` or `.env.local`)

Copy `.env.example` to `.env` or `.env.local`:

```env
# Cloudflare Quick Tunnel URL pointing to your Kaggle FastAPI proxy (port 30001)
SGLANG_BASE_URL=https://your-tunnel.trycloudflare.com

# Authentication token matching SCHEMAGUARD_PROXY_TOKEN in Kaggle
SGLANG_API_TOKEN=your-secure-proxy-token

# SGLang Model Identifiers
BASE_MODEL_ID=Qwen/Qwen3-1.7B
TUNED_MODEL_ID=schemaguard
```

> **Security Note**: Never prefix inference secrets with `NEXT_PUBLIC_`. All proxy forwarding and header injection (`X-SchemaGuard-Token`) occurs exclusively on server-side Next.js route handlers (`/api/extract`, `/api/compare`, `/api/health`).

---

## 🛠️ Key Application Features

1. **Live Warranty Extraction Workspace ([`LiveExtractionView.tsx`](file:///src/components/views/LiveExtractionView.tsx))**:
   - Model selection between **Fine-Tuned Model (`schemaguard`)** and **Base Model (`Qwen/Qwen3-1.7B`)**.
   - Transparent **Evidence Grounding Filter** toggle running application-layer substring checks.
   - Dual output tabs: **Raw Model Output** (with verbatim character length & copy button) and **Parsed JSON Output** (strict 8-key schema).
   - Malformed JSON isolation and graceful error display.
   - Interactive in-text evidence span highlighting ([`ClaimHighlighter.tsx`](file:///src/components/ClaimHighlighter.tsx)).
   - 4 field cards ([`FieldCard.tsx`](file:///src/components/FieldCard.tsx)) with one-click routing to the human review queue.

2. **4-Way Model Comparison ([`ModelComparisonView.tsx`](file:///src/components/views/ModelComparisonView.tsx))**:
   - Evaluates any claim concurrently across `Base`, `Base + Gate`, `Fine-Tuned`, and `Fine-Tuned + Gate`.

3. **Evaluation Dashboard ([`EvaluationDashboardView.tsx`](file:///src/components/views/EvaluationDashboardView.tsx))**:
   - Visualizes the 32-claim 2x2 factorial challenge report (`src/data/challenge_32_2x2_report.json`).
   - Exact match accuracy, false-fill rates, and paired bootstrap 95% confidence intervals.

4. **Human Review Queue ([`HumanReviewView.tsx`](file:///src/components/views/HumanReviewView.tsx))**:
   - Triage workspace for claims adjusters to accept, reject, or manually override flagged extraction decisions.
   - Single-click export of reviewed audit logs.

5. **Architecture & Topology Explainer ([`PipelineAboutView.tsx`](file:///src/components/views/PipelineAboutView.tsx))**:
   - Clear visual explanation of data curation (CuratorKIT), supervised fine-tuning (TRL/LoRA), and deterministic evidence validation.

---

## 🧪 Testing & Verification

- **Unit Tests**: `npm test` runs 15 Vitest tests verifying exact substring matching, date ambiguity checks, conflicting date detection, delivery date false-fill prevention, and questionable serial rules.
- **Type Checking**: `npm run build` runs strict TypeScript compilation with zero errors.
- **Live Upstream**: Fully tested and verified against the live SGLang backend through Cloudflare tunnel.
