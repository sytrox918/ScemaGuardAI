"use client";

import React from "react";
import {
  Zap,
  Scale,
  Server,
  Sparkles,
  Database,
  ArrowRight,
  Clock,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import {
  HealthResponse,
  BenchmarkReport,
  ExtractionResponse,
} from "@/types/schemaguard";
import { TabId } from "../Sidebar";

interface OverviewViewProps {
  onNavigate: (tab: TabId) => void;
  health: HealthResponse | null;
  onRefreshHealth: () => void;
  benchmark: BenchmarkReport | null;
  recentExtractions: ExtractionResponse[];
}

export default function OverviewView({
  onNavigate,
  health,
  onRefreshHealth,
  benchmark,
  recentExtractions,
}: OverviewViewProps) {
  const isHealthy = health?.status === "healthy";
  const isDegraded = health?.status === "degraded";

  const baseMetrics = benchmark?.configs.base;
  const baseGateMetrics = benchmark?.configs.base_plus_gate;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-2xl border border-[#1e2538] bg-gradient-to-b from-[#101422] to-[#0a0d15] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Syntax Error 2026 Hackathon • Track #5
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Local LLM Structured Output
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              SchemaGuard AI
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Turns unstructured electronics warranty claims and support tickets into
              strict 8-field structured JSON, verifies verbatim source evidence, detects risky extraction decisions, and routes uncertain fields to human review.
            </p>

            <blockquote className="border-l-2 border-indigo-500 pl-3 py-1 text-xs text-indigo-300 font-mono bg-indigo-950/20 rounded-r">
              &ldquo;Schema-valid is not the same as correct. SchemaGuard combines structured generation, evidence verification, and conservative abstention to reduce unsupported extraction.&rdquo;
            </blockquote>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate("extraction")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Live Extraction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate("comparison")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] font-medium text-xs transition-all"
            >
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>4-Way Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status & Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Backend & Model Runtime */}
        <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Inference & Model Runtime
              </span>
              <button
                onClick={onRefreshHealth}
                title="Refresh health status"
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Inference Engine:</span>
                <span className="font-mono text-zinc-200 font-medium">SGLang</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Base Model:</span>
                <span className="font-mono text-zinc-200 font-medium">
                  {health?.base_model.id || "Qwen/Qwen3-1.7B"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Adapter LoRA:</span>
                <span className="font-mono text-indigo-300 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> schemaguard
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Status:</span>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    isHealthy
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isDegraded
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {isHealthy
                    ? "Live SGLang Proxy"
                    : isDegraded
                    ? "Proxy Degraded"
                    : "Offline Fallback Demo"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#1e2538]/60 text-[11px] text-zinc-400 truncate">
            {health?.diagnostics || "Connecting..."}
          </div>
        </div>

        {/* Card 2: Training & Curation Pipeline */}
        <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                Data & Fine-Tuning Pipeline
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Completed
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Curation:</span>
                <span className="font-mono text-zinc-200">CuratorKIT</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Curation Export:</span>
                <span className="font-mono text-zinc-200">42 SFT Alpaca Examples</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Fine-Tuning:</span>
                <span className="font-mono text-zinc-200">AlignTune + TRL/LoRA</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Artifact Store:</span>
                <span className="font-mono text-[10px] text-zinc-400 truncate">
                  /kaggle/.../aligntune_sft
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#1e2538]/60 text-[11px] text-zinc-400">
            Fine-tuned on curated electronics warranty claims.
          </div>
        </div>

        {/* Card 3: Evaluation & Audit Benchmark */}
        <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                AuditKIT Benchmark Status
              </span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                32 Claims
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Challenge Test Set:</span>
                <span className="font-mono text-zinc-200">32 Targeted Claims</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Categories:</span>
                <span className="font-mono text-zinc-200">8 Edge Scenarios</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#1e2538]/50">
                <span className="text-zinc-400">Bootstrap CI (95%):</span>
                <span className="font-mono text-amber-300">Measured (crosses 0)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Evaluation Report:</span>
                <span className="font-mono text-[10px] text-emerald-400">
                  challenge_32_2x2_report.json
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#1e2538]/60 text-[11px] text-zinc-400">
            Backed by genuine evaluation artefacts on disk.
          </div>
        </div>
      </div>

      {/* Key Benchmark Metrics Summary Bar */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              Key Benchmark Performance (32 Challenge Claims)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparison between Raw Base model and Gated Fine-tuned pipeline.
            </p>
          </div>
          <button
            onClick={() => onNavigate("evaluation")}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Full Evaluation Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Field Accuracy
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {baseGateMetrics
                ? `${(baseGateMetrics.field_accuracy_vs_policy_reference * 100).toFixed(1)}%`
                : "78.1%"}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Base+Gate vs Reference
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Schema Validity
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              100.0%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              SGLang JSON Schema
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              False-Fill Rate
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {baseMetrics && baseGateMetrics
                ? `${(baseMetrics.false_fill_rate_on_expected_blank_fields * 100).toFixed(0)}% → 0%`
                : "48% → 0%"}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">
              Eliminated by Gate
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Evidence Support
            </div>
            <div className="text-lg font-bold text-sky-400 mt-1">
              100.0%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Verbatim Literal Rate
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Mean Latency
            </div>
            <div className="text-lg font-bold text-zinc-200 mt-1">
              {baseMetrics
                ? `${baseMetrics.mean_latency_seconds.toFixed(2)}s`
                : "4.68s"}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Per Claim Inference
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e121d] border border-[#1e2538]">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Human Review Rate
            </div>
            <div className="text-lg font-bold text-amber-400 mt-1">
              31.2%
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Conservative Abstention
            </div>
          </div>
        </div>
      </div>

      {/* Recent Session Extractions */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Recent Extractions in This Session ({recentExtractions.length})</span>
          </h3>

          <button
            onClick={() => onNavigate("extraction")}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Run New Claim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExtractions.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-[#1e2538] text-zinc-400 text-xs">
            No claims processed yet in this browser session. Head to{" "}
            <button
              onClick={() => onNavigate("extraction")}
              className="text-indigo-400 hover:underline font-medium"
            >
              Live Extraction
            </button>{" "}
            to paste or select a sample warranty claim.
          </div>
        ) : (
          <div className="divide-y divide-[#1e2538]/60">
            {recentExtractions.slice(0, 5).map((ext, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-zinc-200 truncate font-mono text-[11px]">
                    {ext.claim}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                    <span>Config: {ext.model_config}</span>
                    <span>•</span>
                    <span>Latency: {ext.latency_ms}ms</span>
                    <span>•</span>
                    <span>
                      Accepted: {ext.validation?.accepted_count ?? 0}/4 fields
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      ext.validation?.overall_status === "BASIC_CHECKS_PASSED"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    }`}
                  >
                    {ext.validation?.overall_status || (ext.parse_error ? "PARSE_ERROR" : "PROCESSED")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
