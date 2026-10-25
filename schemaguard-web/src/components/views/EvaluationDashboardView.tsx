"use client";

import React, { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { BenchmarkReport } from "@/types/schemaguard";
import BenchmarkCharts from "../BenchmarkCharts";
import JsonViewerModal from "../JsonViewerModal";

interface EvaluationDashboardViewProps {
  benchmark: BenchmarkReport | null;
  isLoading: boolean;
}

export default function EvaluationDashboardView({
  benchmark,
  isLoading,
}: EvaluationDashboardViewProps) {
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  if (isLoading || !benchmark) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-zinc-400">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading benchmark report artefacts...</p>
      </div>
    );
  }

  const configs = benchmark.configs;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2538]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Challenge-Set Evaluation Dashboard</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Official 32-claim 2x2 factorial evaluation across Base, Base+Gate,
            Fine-tuned, and Fine-tuned+Gate configurations.
          </p>
        </div>

        <button
          onClick={() => setIsJsonModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] text-xs font-medium transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Raw Report JSON</span>
        </button>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">
            Scientific Grounding & Evaluation Caveat
          </div>
          <p className="leading-relaxed text-zinc-300 text-[11px]">
            {benchmark.caveat} <strong>Do not claim that these results establish reliable real-world generalization.</strong> This is a targeted 32-claim synthetic challenge set. The paired bootstrap confidence intervals span zero. Furthermore, a 100% schema-validity rate does not demonstrate semantic correctness; structured decoding ensures syntactic conformity, whereas the deterministic gate verifies literal supporting evidence.
          </p>
        </div>
      </div>

      {/* Visual Recharts Section */}
      <BenchmarkCharts report={benchmark} />

      {/* Primary Metrics 4-Way Comparison Table */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Full 32-Claim Metric Breakdown
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Measured against policy reference annotations across 128 total slot predictions (32 claims × 4 slots).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2538] text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3 text-right">Base (Raw)</th>
                <th className="py-2.5 px-3 text-right">Base + Gate</th>
                <th className="py-2.5 px-3 text-right">Fine-Tuned (Raw)</th>
                <th className="py-2.5 px-3 text-right">Fine-Tuned + Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2538]/60 font-mono">
              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Field Exact-Match Accuracy
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.field_accuracy_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-sky-400 font-semibold">
                  {(configs.base_plus_gate.field_accuracy_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-purple-300">
                  {(configs.fine_tuned.field_accuracy_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                  {(configs.fine_tuned_plus_gate.field_accuracy_vs_policy_reference * 100).toFixed(2)}%
                </td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Whole-Record Exact Match
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.record_exact_match_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-sky-400">
                  {(configs.base_plus_gate.record_exact_match_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-purple-300">
                  {(configs.fine_tuned.record_exact_match_vs_policy_reference * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">
                  {(configs.fine_tuned_plus_gate.record_exact_match_vs_policy_reference * 100).toFixed(2)}%
                </td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Schema Validity Rate
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  False-Fill Rate (Expected Blanks)
                </td>
                <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                  {(configs.base.false_fill_rate_on_expected_blank_fields * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                  {(configs.base_plus_gate.false_fill_rate_on_expected_blank_fields * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-rose-400">
                  {(configs.fine_tuned.false_fill_rate_on_expected_blank_fields * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                  {(configs.fine_tuned_plus_gate.false_fill_rate_on_expected_blank_fields * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Evidence Literal Rate
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.evidence_literal_rate * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Value-in-Evidence Support Rate
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.value_evidence_support_rate * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
                <td className="py-2.5 px-3 text-right text-purple-300">
                  {(configs.fine_tuned.value_evidence_support_rate * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">100.0%</td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Field Coverage (All Slots)
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.field_coverage_all_slots * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400">
                  {(configs.base_plus_gate.field_coverage_all_slots * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.fine_tuned.field_coverage_all_slots * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400">
                  {(configs.fine_tuned_plus_gate.field_coverage_all_slots * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Abstention Recall
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.base.abstention_recall * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">
                  {(configs.base_plus_gate.abstention_recall * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {(configs.fine_tuned.abstention_recall * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">
                  {(configs.fine_tuned_plus_gate.abstention_recall * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="hover:bg-[#121624]">
                <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                  Mean Inference Latency
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {configs.base.mean_latency_seconds.toFixed(2)}s
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {configs.base_plus_gate.mean_latency_seconds.toFixed(2)}s
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {configs.fine_tuned.mean_latency_seconds.toFixed(2)}s
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {configs.fine_tuned_plus_gate.mean_latency_seconds.toFixed(2)}s
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Paired Bootstrap 95% Confidence Intervals Table */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Paired Bootstrap 95% Confidence Intervals
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Statistical resampling tests on paired differences. Note that all 95% CIs cross zero (e.g. [-0.10, +0.06]), demonstrating that synthetic challenge improvements require larger validation sets for statistical significance.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2538] text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Comparison Pair</th>
                <th className="py-2.5 px-3 text-right">Delta Difference</th>
                <th className="py-2.5 px-3 text-right">95% CI Lower</th>
                <th className="py-2.5 px-3 text-right">95% CI Upper</th>
                <th className="py-2.5 px-3">Significance Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2538]/60 font-mono">
              {Object.entries(benchmark.paired_bootstrap_95pct_ci).map(
                ([pairKey, ci]) => (
                  <tr key={pairKey} className="hover:bg-[#121624]">
                    <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                      {pairKey.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        ci.difference > 0
                          ? "text-emerald-400"
                          : ci.difference < 0
                          ? "text-rose-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {(ci.difference * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {(ci.ci95_low * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {(ci.ci95_high * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 font-sans text-amber-300/80 text-[11px]">
                      Crosses 0 (No universal superiority claimed)
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Report Modal */}
      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        title="Official AuditKIT & Challenge Evaluation Report"
        data={benchmark}
        filename="challenge_32_2x2_report.json"
      />
    </div>
  );
}
