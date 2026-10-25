"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { BenchmarkReport, BenchmarkConfigKey } from "@/types/schemaguard";

interface BenchmarkChartsProps {
  report: BenchmarkReport;
}

const CONFIG_DISPLAY_NAMES: Record<BenchmarkConfigKey, string> = {
  base: "Base (Raw)",
  base_plus_gate: "Base + Gate",
  fine_tuned: "Fine-Tuned (Raw)",
  fine_tuned_plus_gate: "Fine-Tuned + Gate",
};

export default function BenchmarkCharts({ report }: BenchmarkChartsProps) {
  const configs = report.configs;

  // Prepare data for the Headline Comparison Chart
  const comparisonData = (
    [
      "base",
      "base_plus_gate",
      "fine_tuned",
      "fine_tuned_plus_gate",
    ] as BenchmarkConfigKey[]
  ).map((cfgKey) => {
    const c = configs[cfgKey];
    return {
      name: CONFIG_DISPLAY_NAMES[cfgKey],
      accuracy: Math.round(c.field_accuracy_vs_policy_reference * 1000) / 10,
      falseFill:
        Math.round(c.false_fill_rate_on_expected_blank_fields * 1000) / 10,
      evidenceSupport:
        Math.round(c.value_evidence_support_rate * 1000) / 10,
      recordExactMatch:
        Math.round(c.record_exact_match_vs_policy_reference * 1000) / 10,
      coverage: Math.round(c.field_coverage_all_slots * 1000) / 10,
    };
  });

  // Prepare category-level data
  const categories = [
    { key: "normal", label: "Normal Claims" },
    { key: "missing_serial", label: "Missing Serial" },
    { key: "missing_fields", label: "Missing Fields" },
    { key: "ambiguous_date", label: "Ambiguous Date" },
    { key: "conflicting_dates", label: "Conflicting Dates" },
    { key: "unrelated_date", label: "Delivery/Unrelated Date" },
    { key: "prompt_injection", label: "Prompt Injection" },
    { key: "multi_product", label: "Multi Product" },
  ];

  const categoryChartData = categories.map((cat) => {
    return {
      category: cat.label,
      base:
        Math.round(
          (configs.base.per_category[cat.key]?.field_accuracy || 0) * 1000
        ) / 10,
      base_gate:
        Math.round(
          (configs.base_plus_gate.per_category[cat.key]?.field_accuracy || 0) *
            1000
        ) / 10,
      fine_tuned:
        Math.round(
          (configs.fine_tuned.per_category[cat.key]?.field_accuracy || 0) * 1000
        ) / 10,
      fine_tuned_gate:
        Math.round(
          (configs.fine_tuned_plus_gate.per_category[cat.key]?.field_accuracy ||
            0) * 1000
        ) / 10,
    };
  });

  return (
    <div className="space-y-6">
      {/* Chart 1: Accuracy vs False-Fill Rate */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Field Accuracy vs False-Fill Rate on Expected-Blank Fields
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Demonstrates how the deterministic gate slashes unsupported fills (from 48% down to 0% on Base, and 44% down to 4% on LoRA).
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0e131f",
                  borderColor: "#20293d",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="accuracy"
                name="Field Accuracy"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="falseFill"
                name="False-Fill Rate (Lower is Better)"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="evidenceSupport"
                name="Evidence Literal Grounding"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Breakdown */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Per-Category Accuracy Across 8 Challenge Scenarios
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evaluates targeted robustness on adversarial prompts, ambiguous dates, and omitted fields (4 claims per category, 32 total).
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryChartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0e131f",
                  borderColor: "#20293d",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />
              <Bar dataKey="base" name="Base" fill="#64748b" radius={[3, 3, 0, 0]} />
              <Bar
                dataKey="base_gate"
                name="Base + Gate"
                fill="#38bdf8"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="fine_tuned"
                name="Fine-Tuned"
                fill="#a855f7"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="fine_tuned_gate"
                name="Fine-Tuned + Gate"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
