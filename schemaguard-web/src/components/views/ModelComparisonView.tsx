"use client";

import React, { useState } from "react";
import {
  Scale,
  RotateCcw,
  Code2,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  FourWayComparisonResponse,
  FieldKey,
  FIELD_KEYS,
  ModelConfig,
} from "@/types/schemaguard";
import { PRESET_CLAIMS, ExampleClaim } from "@/data/examples";
import JsonViewerModal from "../JsonViewerModal";

interface ModelComparisonViewProps {
  onComparisonComplete?: (res: FourWayComparisonResponse) => void;
}

const CONFIG_ORDER: { key: ModelConfig; label: string; badge: string; border: string; bg: string }[] = [
  {
    key: "base",
    label: "Base Model (Raw)",
    badge: "No Gate",
    border: "border-zinc-700",
    bg: "bg-[#0b0e17]",
  },
  {
    key: "base_gate",
    label: "Base + Gate",
    badge: "Deterministic Gate",
    border: "border-sky-500/40",
    bg: "bg-[#0b121e]",
  },
  {
    key: "fine_tuned",
    label: "Fine-Tuned (Raw)",
    badge: "LoRA Adapted",
    border: "border-purple-500/40",
    bg: "bg-[#100e1c]",
  },
  {
    key: "fine_tuned_gate",
    label: "Fine-Tuned + Gate",
    badge: "LoRA + Gate (Full Stack)",
    border: "border-indigo-500/50",
    bg: "bg-[#0d1020]",
  },
];

const FIELD_LABELS: Record<FieldKey, string> = {
  purchase_date: "Purchase Date",
  product: "Product",
  issue: "Reported Issue",
  serial_number: "Serial Number",
};

export default function ModelComparisonView({
  onComparisonComplete,
}: ModelComparisonViewProps) {
  const [claim, setClaim] = useState(
    PRESET_CLAIMS.find((c) => c.id === "delivery_date")?.text ||
      PRESET_CLAIMS[0].text
  );
  const [selectedExampleId, setSelectedExampleId] =
    useState<string>("delivery_date");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FourWayComparisonResponse | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleSelectExample = (ex: ExampleClaim) => {
    setSelectedExampleId(ex.id);
    setClaim(ex.text);
    setError(null);
  };

  const handleRunComparison = async () => {
    if (!claim.trim()) {
      setError("Please enter a warranty claim to compare.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server responded with HTTP ${resp.status}`
        );
      }

      const data: FourWayComparisonResponse = await resp.json();
      setResult(data);
      onComparisonComplete?.(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2538]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>Four-Way Model & Gate Comparison</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Compare Base vs Base+Gate vs Fine-Tuned LoRA vs Fine-Tuned+Gate on
            identical claims to examine coverage vs precision trade-offs.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] text-xs font-medium transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Comparison JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Preset Claims Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Recommended Edge Cases for 4-Way Analysis:
          </span>
          <span className="text-[11px] text-zinc-400">
            Compare how gates withhold false fills
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {PRESET_CLAIMS.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleSelectExample(ex)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                selectedExampleId === ex.id
                  ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/50 font-medium"
                  : "bg-[#0e121d] text-zinc-400 hover:text-zinc-200 border-[#1e2538]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{ex.title}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {ex.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Claim Input Box */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Input Claim Text to Compare
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            {claim.length} chars
          </span>
        </div>

        <textarea
          value={claim}
          onChange={(e) => {
            setClaim(e.target.value);
            setSelectedExampleId("");
          }}
          rows={3}
          placeholder="Enter claim to run across all 4 configurations..."
          className="w-full text-sm rounded-lg bg-[#080b12] border border-[#1e2538] text-zinc-200 p-3 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              setClaim("");
              setResult(null);
              setError(null);
            }}
            disabled={isLoading || !claim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#141a29] transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleRunComparison}
            disabled={isLoading || !claim.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running 4 Model Configurations...</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5" />
                <span>Run 4-Way Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-300">Comparison Failed</div>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Critical Evaluation Caveat Notice */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">
                Evaluation Insight: Coverage vs False-Fill Trade-off
              </span>
              <p className="mt-0.5 text-zinc-300 leading-relaxed text-[11px]">
                A model is not superior simply because it produces more filled
                fields or valid JSON. Raw Base models achieve higher coverage
                (88.3%) but suffer a 48% false-fill rate on expected-blank slots.
                The deterministic gate intentionally abstains on ambiguous or
                unsupported fields to safeguard downstream integrity.
              </p>
            </div>
          </div>

          {/* 4 Configuration Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONFIG_ORDER.map(({ key, label, badge, border, bg }) => {
              const cfg = result.configs[key];
              return (
                <div
                  key={key}
                  className={`rounded-xl border ${border} ${bg} p-4 flex flex-col justify-between`}
                >
                  <div>
                    {/* Header */}
                    <div className="pb-3 border-b border-[#1e2538] mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          {badge}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {cfg.latency_ms}ms
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">
                        {label}
                      </h4>
                    </div>

                    {/* Extracted Fields */}
                    <div className="space-y-3">
                      {FIELD_KEYS.map((field) => {
                        const val = cfg.extracted[field].value;
                        const finalVal = cfg.final_values[field];
                        const isFiltered = cfg.has_gate && val && !finalVal;

                        return (
                          <div
                            key={field}
                            className="p-2.5 rounded-lg bg-[#080b12] border border-[#1e2538]"
                          >
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                              <span className="font-medium text-zinc-300">
                                {FIELD_LABELS[field]}
                              </span>
                              {isFiltered ? (
                                <span className="font-mono text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                                  Withheld by Gate
                                </span>
                              ) : finalVal ? (
                                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                  Accepted
                                </span>
                              ) : (
                                <span className="font-mono text-zinc-400">
                                  Blank
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-mono text-white truncate">
                              {cfg.has_gate ? (
                                finalVal ? (
                                  finalVal
                                ) : (
                                  <span className="text-zinc-400 italic">
                                    &ldquo;&rdquo; (Abstained)
                                  </span>
                                )
                              ) : val ? (
                                val
                              ) : (
                                <span className="text-zinc-400 italic">
                                  &ldquo;&rdquo;
                                </span>
                              )}
                            </div>

                            {/* Small evidence or reason snippet */}
                            <div className="text-[10px] text-zinc-400 mt-1 truncate">
                              {isFiltered
                                ? cfg.field_details[field]?.reason
                                : cfg.extracted[field].evidence || "No evidence"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer status summary */}
                  <div className="mt-4 pt-3 border-t border-[#1e2538] flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Accepted Fields:</span>
                    <span className="font-mono font-semibold text-white">
                      {cfg.accepted_count} / 4
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Field-by-Field Summary Table */}
          <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              Field-by-Field Decision Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1e2538] text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Base (Raw)</th>
                    <th className="py-2.5 px-3">Base + Gate</th>
                    <th className="py-2.5 px-3">Fine-Tuned (Raw)</th>
                    <th className="py-2.5 px-3">Fine-Tuned + Gate</th>
                    <th className="py-2.5 px-3">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2538]/60 font-mono">
                  {result.field_summary.map((row) => {
                    return (
                      <tr
                        key={row.field}
                        className={`hover:bg-[#121624] ${
                          row.is_different ? "bg-indigo-950/10" : ""
                        }`}
                      >
                        <td className="py-3 px-3 font-sans font-medium text-zinc-200">
                          {row.label}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {row.base.value || <span className="text-zinc-400">—</span>}
                        </td>
                        <td className="py-3 px-3 text-sky-300">
                          {row.base_gate.accepted || (
                            <span className="text-zinc-400 italic">[abstained]</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-purple-300">
                          {row.fine_tuned.value || (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-emerald-300 font-semibold">
                          {row.fine_tuned_gate.accepted || (
                            <span className="text-zinc-400 italic">[abstained]</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {row.gate_filtered_base || row.gate_filtered_ft ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              Filtered Unsupported Value
                            </span>
                          ) : row.base_gate.accepted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              Retained & Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                              Consistently Omitted
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Raw Comparison JSON Modal */}
      {result && (
        <JsonViewerModal
          isOpen={isJsonModalOpen}
          onClose={() => setIsJsonModalOpen(false)}
          title="Four-Way Model Comparison Output"
          data={result}
          filename="schemaguard_four_way_comparison.json"
        />
      )}
    </div>
  );
}
