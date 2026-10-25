"use client";

import React from "react";
import {
  GitBranch,
  Layers,
  Server,
  Cpu,
  ArrowRight,
} from "lucide-react";

export default function PipelineAboutView() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#1e2538]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-400" />
          <span>System Pipeline & Architecture</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Technical architecture, post-training ML pipeline, and deterministic
          verification methodology for Syntax Error 2026.
        </p>
      </div>

      {/* Positioning Quote Card */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-[#0e1320] p-6">
        <blockquote className="text-base font-medium text-white leading-relaxed">
          &ldquo;Schema-valid is not the same as correct. SchemaGuard combines structured generation, evidence verification, and conservative abstention to reduce unsupported extraction.&rdquo;
        </blockquote>
        <div className="mt-3 text-xs text-indigo-300 font-mono">
          — SchemaGuard AI Architecture Principle (Problem Statement #5)
        </div>
      </div>

      {/* Architecture Flow 1: Live Inference & Gate */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>1. Real-Time Inference & Verification Flow</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            How an incoming customer claim is transformed into grounded structured output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
          <div className="p-3.5 rounded-xl bg-[#080b12] border border-[#1e2538]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Step 1</div>
            <div className="text-xs font-semibold text-zinc-200 mt-1">Unstructured Text</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Warranty / Support Claim</div>
          </div>

          <div className="flex justify-center text-zinc-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#080b12] border border-[#1e2538]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">Step 2</div>
            <div className="text-xs font-semibold text-white mt-1">SGLang Decoding</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Strict JSON Schema (Qwen3-1.7B)</div>
          </div>

          <div className="flex justify-center text-zinc-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
            <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">Step 3</div>
            <div className="text-xs font-semibold text-emerald-300 mt-1">Deterministic Gate</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Verbatim Evidence Validation</div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-[#080b12] border border-[#1e2538] font-mono text-xs text-zinc-300 space-y-1">
          <div className="text-indigo-400 font-semibold mb-2">Gate Bifurcation:</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-emerald-300">Accepted Fields:</span>
            <span className="text-zinc-400">Passes literal occurrence, non-ambiguity, and schema constraints.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-amber-300">Human Review:</span>
            <span className="text-zinc-400">Ambiguous dates, conflicting dates, delivery substitutions, questionable serials.</span>
          </div>
        </div>
      </div>

      {/* Architecture Flow 2: Post-Training Pipeline */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>2. Offline Post-Training & Evaluation Pipeline</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            The data curation, alignment, and evaluation stack built during the hackathon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#080b12] border border-[#1e2538] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">CuratorKIT</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Exported
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Curated 42 high-quality electronics claim examples with literal evidence spans and Alpaca format formatting.
            </p>
            <div className="pt-2 text-[10px] font-mono text-zinc-400">
              Export: sft_alpaca.jsonl
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080b12] border border-[#1e2538] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">AlignTune (TRL/LoRA)</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                Fine-Tuned
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Supervised fine-tuning of Qwen3-1.7B with parameter-efficient Low-Rank Adaptation (LoRA) targeting structured extraction.
            </p>
            <div className="pt-2 text-[10px] font-mono text-zinc-400">
              Adapter: schemaguard
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080b12] border border-[#1e2538] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">AuditKIT + 2x2</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Audited
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Targeted 32-claim challenge evaluation measuring exact matches, false-fill rates, and paired bootstrap resampling CIs.
            </p>
            <div className="pt-2 text-[10px] font-mono text-zinc-400">
              Report: challenge_32_2x2_report.json
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Topology */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>3. Production & Hybrid Deployment Topology</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Zero browser secret leakage via server-side Next.js route handlers.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#080b12] border border-[#1e2538] font-mono text-xs text-zinc-300 overflow-x-auto">
          <pre>{`Judge / Public Browser
        |
        v  (HTTPS)
Vercel Deployed Next.js Frontend
        |
        v  (Server-Side API Route Handler: /api/extract)
Authenticated HTTPS Tunnel (Cloudflare Quick Tunnel)
        |  [Header: X-SchemaGuard-Token]
        v
Kaggle FastAPI Proxy (127.0.0.1:30001)
        |
        v  (Local HTTP)
SGLang Inference Server (127.0.0.1:30000)
        |-- Qwen/Qwen3-1.7B (Base Model)
        +-- Qwen/Qwen3-1.7B + schemaguard (LoRA Adapter)`}</pre>
        </div>
      </div>
    </div>
  );
}
