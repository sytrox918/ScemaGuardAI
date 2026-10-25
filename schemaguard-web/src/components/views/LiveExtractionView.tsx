"use client";

import React, { useState } from "react";
import {
  Zap,
  RotateCcw,
  Code2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Server,
  Cpu,
  Layers,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import {
  ExtractionResponse,
  FieldDetail,
  FieldKey,
  FIELD_KEYS,
  ModelConfig,
  HumanReviewItem,
} from "@/types/schemaguard";
import { PRESET_CLAIMS, ExampleClaim } from "@/data/examples";
import ClaimHighlighter from "../ClaimHighlighter";
import FieldCard from "../FieldCard";
import JsonViewerModal from "../JsonViewerModal";

interface LiveExtractionViewProps {
  onExtractionComplete: (result: ExtractionResponse) => void;
  onAddToReview: (item: HumanReviewItem) => void;
  reviewItems: HumanReviewItem[];
}

export default function LiveExtractionView({
  onExtractionComplete,
  onAddToReview,
  reviewItems,
}: LiveExtractionViewProps) {
  const [claim, setClaim] = useState(PRESET_CLAIMS[0].text);
  const [modelType, setModelType] = useState<"fine_tuned" | "base">("fine_tuned");
  const [applyGate, setApplyGate] = useState(true);
  const [selectedExampleId, setSelectedExampleId] = useState<string>("normal");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResponse | null>(null);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<"raw" | "parsed" | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<"raw" | "parsed">("raw");

  const computedConfig: ModelConfig =
    modelType === "fine_tuned"
      ? applyGate
        ? "fine_tuned_gate"
        : "fine_tuned"
      : applyGate
      ? "base_gate"
      : "base";

  const handleSelectExample = (ex: ExampleClaim) => {
    setSelectedExampleId(ex.id);
    setClaim(ex.text);
    setError(null);
  };

  const handleClear = () => {
    setClaim("");
    setSelectedExampleId("");
    setError(null);
    setResult(null);
  };

  const handleCopyText = (text: string, type: "raw" | "parsed") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleRunExtraction = async () => {
    if (!claim.trim()) {
      setError("Please enter a warranty claim or support ticket text.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claim.trim(),
          model_type: modelType,
          apply_gate: applyGate,
          model_config: computedConfig,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server responded with HTTP ${resp.status}`
        );
      }

      const data: ExtractionResponse = await resp.json();
      setResult(data);
      if (data.raw_extraction) {
        setActiveOutputTab("parsed");
      } else {
        setActiveOutputTab("raw");
      }
      onExtractionComplete(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToReview = (field: FieldKey, detail: FieldDetail) => {
    const newItem: HumanReviewItem = {
      id: `review-${Date.now()}-${field}`,
      created_at: new Date().toISOString(),
      claim: claim.trim(),
      field,
      candidate_value: detail.value,
      candidate_evidence: detail.evidence,
      gate_status: detail.status,
      rejection_reason: detail.reason,
      model_source: computedConfig,
      review_decision: "pending",
    };
    onAddToReview(newItem);
  };

  const isFieldInReview = (field: FieldKey) => {
    return reviewItems.some(
      (item) => item.claim === claim.trim() && item.field === field
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2538]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>Live Warranty Extraction Workspace</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Extract structured warranty fields (purchase_date, product, issue, serial_number) with verbatim evidence grounding.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e1320] border border-[#232d44] text-zinc-300 font-mono text-[11px]">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: SGLang v1/chat/completions</span>
          </span>
        </div>
      </div>

      {/* Extraction Form Configuration */}
      <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 space-y-4">
        {/* Model Selection & Gate Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-[#1e2538]/60">
          {/* Model Selector Card */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Model:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModelType("fine_tuned")}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  modelType === "fine_tuned"
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30"
                    : "bg-[#080b12] border-[#1e2538] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Fine-Tuned Model</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    LoRA
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1 truncate">
                  schemaguard
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Domain-adapted structured extraction
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModelType("base")}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  modelType === "base"
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30"
                    : "bg-[#080b12] border-[#1e2538] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Base Model</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                    Base
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-1 truncate">
                  Qwen/Qwen3-1.7B
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Standard pre-trained foundation weights
                </div>
              </button>
            </div>
          </div>

          {/* Gate Option Card */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evidence Grounding Filter:</span>
            </label>
            <div className="h-[78px] p-2.5 rounded-lg border border-[#1e2538] bg-[#080b12] flex flex-col justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyGate}
                  onChange={(e) => setApplyGate(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-zinc-200">
                  Enable Deterministic Evidence Validation (Application Post-Filter)
                </span>
              </label>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Verifies literal substring occurrence of values and evidence in the source claim.
                <span className="text-zinc-400"> Note: Backend SGLang serves raw inference; validation runs in the application layer.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Preset Claims Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Preset Challenge Scenarios:
            </span>
            <span className="text-[11px] text-zinc-400">
              Click to load test ticket
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {PRESET_CLAIMS.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExample(ex)}
                className={`shrink-0 px-2.5 py-1.2 rounded-lg text-xs transition-all border ${
                  selectedExampleId === ex.id
                    ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/50 font-medium"
                    : "bg-[#080b12] text-zinc-400 hover:text-zinc-200 border-[#1e2538] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{ex.title}</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                    {ex.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Claim Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Warranty / Support Claim Text
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {claim.length} / 5000 chars
            </span>
          </div>

          <textarea
            value={claim}
            onChange={(e) => {
              setClaim(e.target.value);
              setSelectedExampleId("");
            }}
            rows={4}
            placeholder="Paste or type a warranty claim, invoice description, or support ticket..."
            className="w-full text-sm rounded-lg bg-[#080b12] border border-[#1e2538] text-zinc-200 p-3 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400 leading-relaxed"
          />

          {/* Action Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || !claim}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#141a29] transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleRunExtraction}
              disabled={isLoading || !claim.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Forwarding to SGLang ({modelType === "fine_tuned" ? "schemaguard" : "base"})...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Run Live Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-300">Extraction Failed</div>
            <p className="mt-0.5 leading-relaxed">{error}</p>
            <p className="text-[11px] text-rose-400/80 mt-1">
              Ensure that your remote SGLang server and Cloudflare tunnel are active, or check your backend settings.
            </p>
          </div>
        </div>
      )}

      {/* Extraction Results */}
      {result && (
        <div className="space-y-6 pt-1">
          {/* Status Header Bar */}
          <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  result.parse_error
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : result.validation?.overall_status === "BASIC_CHECKS_PASSED"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {result.parse_error ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : result.validation?.overall_status === "BASIC_CHECKS_PASSED" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {result.parse_error
                      ? "Malformed JSON Output"
                      : result.validation?.overall_status === "BASIC_CHECKS_PASSED"
                      ? "Extraction & Validation Passed"
                      : "Flagged for Human Review"}
                  </h3>
                  {result.is_mock ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Offline Simulator
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      Live SGLang
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                    {result.model_type === "fine_tuned" ? "Fine-Tuned" : "Base"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {result.parse_error
                    ? result.parse_error
                    : result.validation?.overall_status === "BASIC_CHECKS_PASSED"
                    ? "All extracted fields have literal supporting evidence in the source claim."
                    : `${result.validation?.rejection_count ?? 0} field(s) failed deterministic gate checks or triggered ambiguity flags.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right text-xs">
                <div className="text-zinc-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Latency:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {result.latency_ms}ms
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Model: {result.model_id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsJsonModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] text-xs font-medium transition-all"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Modal View</span>
              </button>
            </div>
          </div>

          {/* Model Output & Parsed JSON Inspection Tabs */}
          <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1e2538] px-4 py-2.5 bg-[#080b12]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutputTab("raw")}
                  className={`px-3 py-1.2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeOutputTab === "raw"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw Model Output</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 ml-1">
                    {result.raw_output.length} chars
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOutputTab("parsed")}
                  disabled={!result.raw_extraction}
                  className={`px-3 py-1.2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                    activeOutputTab === "parsed"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Parsed JSON Output</span>
                  {result.raw_extraction && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ml-1">
                      Valid Schema
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    activeOutputTab === "raw"
                      ? result.raw_output
                      : JSON.stringify(result.raw_extraction, null, 2),
                    activeOutputTab
                  )
                }
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-300 hover:text-white bg-[#141a29] hover:bg-[#1f283d] border border-[#232d44] transition-all"
              >
                {copiedType === activeOutputTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy {activeOutputTab === "raw" ? "Raw Text" : "JSON"}</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-[#06080e]">
              {activeOutputTab === "raw" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Direct verbatim response string received from backend:</span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      Inference latency: {result.latency_ms}ms
                    </span>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-[#04060a] border border-[#1a2133] text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 scrollbar-thin">
                    {result.raw_output || "(Empty output received from model)"}
                  </pre>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Parsed 8-string flat JSON schema:</span>
                    <span className="font-mono text-[10px] text-emerald-400">
                      Schema Validated
                    </span>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-[#04060a] border border-[#1a2133] text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 scrollbar-thin">
                    {JSON.stringify(result.raw_extraction, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Source Claim Grounding Highlighter (Only if valid validation exists) */}
          {result.validation && (
            <ClaimHighlighter
              claim={result.claim}
              fieldDetails={result.validation.field_details}
              activeField={focusedField}
              onSelectField={(f) =>
                setFocusedField(f === focusedField ? null : f)
              }
            />
          )}

          {/* 4 Structured Field Cards */}
          {result.validation && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Extracted Fields & Verification ({result.validation.accepted_count}/4 accepted)
                </span>
                <span className="text-xs text-zinc-400">
                  Click any field card to focus its evidence span above
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIELD_KEYS.map((field) => (
                  <FieldCard
                    key={field}
                    field={field}
                    detail={result.validation!.field_details[field]}
                    isFocused={focusedField === field}
                    onSelect={() =>
                      setFocusedField(focusedField === field ? null : field)
                    }
                    onSendToReview={handleSendToReview}
                    isReviewed={isFieldInReview(field)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw JSON Modal */}
      {result && (
        <JsonViewerModal
          isOpen={isJsonModalOpen}
          onClose={() => setIsJsonModalOpen(false)}
          title={`SchemaGuard Extraction Output (${result.model_config})`}
          data={result}
          filename="schemaguard_extraction.json"
        />
      )}
    </div>
  );
}
