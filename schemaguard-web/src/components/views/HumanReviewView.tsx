"use client";

import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  PlusCircle,
  FileCheck,
  Code2,
} from "lucide-react";
import { HumanReviewItem } from "@/types/schemaguard";
import JsonViewerModal from "../JsonViewerModal";

interface HumanReviewViewProps {
  items: HumanReviewItem[];
  onUpdateDecision: (
    id: string,
    decision: "accepted" | "rejected" | "corrected",
    correctedValue?: string
  ) => void;
  onClearReviewQueue: () => void;
  onLoadSampleReviewItems: () => void;
}

export default function HumanReviewView({
  items,
  onUpdateDecision,
  onClearReviewQueue,
  onLoadSampleReviewItems,
}: HumanReviewViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const pendingCount = items.filter((i) => i.review_decision === "pending").length;
  const acceptedCount = items.filter((i) => i.review_decision === "accepted").length;
  const rejectedCount = items.filter((i) => i.review_decision === "rejected").length;

  const handleStartEdit = (item: HumanReviewItem) => {
    setEditingId(item.id);
    setEditValue(item.candidate_value);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateDecision(id, "corrected", editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2538]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Human-in-the-Loop Review Workspace</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Audit candidate fields that triggered deterministic gate rejection,
            date ambiguity, or questionable evidence flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] text-xs font-medium transition-all"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Reviewed JSON</span>
              </button>

              <button
                onClick={onClearReviewQueue}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Queue</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session State Warning & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[#1e2538] bg-[#0c101a]">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            Pending Human Decisions
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {pendingCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Requires human adjudication
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#1e2538] bg-[#0c101a]">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            Approved Fields
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {acceptedCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Accepted by human operator
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#1e2538] bg-[#0c101a]">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            Rejected Hallucinations
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {rejectedCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Withheld from downstream schema
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="text-[10px] uppercase tracking-wider text-indigo-300">
            Persistence Notice
          </div>
          <div className="text-xs font-semibold text-zinc-200 mt-1">
            Session Memory
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
            Decisions stored in React state for this review session.
          </div>
        </div>
      </div>

      {/* Review Queue Items */}
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#1e2538] bg-[#0c101a]/50">
          <FileCheck className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">
            No Flagged Fields in Review Queue
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            The review queue captures fields flagged with date ambiguities,
            questionable serials, or missing evidence during live extraction.
          </p>
          <button
            onClick={onLoadSampleReviewItems}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Load Sample Review Queue Items</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-all bg-[#0c101a] ${
                  item.review_decision === "accepted"
                    ? "border-emerald-500/40 bg-emerald-950/5"
                    : item.review_decision === "rejected"
                    ? "border-rose-500/40 bg-rose-950/5 opacity-75"
                    : "border-[#1e2538] hover:border-zinc-700"
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2538]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Field: <span className="text-indigo-300 font-mono">{item.field}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {item.gate_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 text-[11px]">Source: {item.model_source}</span>
                    <span>•</span>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        item.review_decision === "accepted"
                          ? "text-emerald-400"
                          : item.review_decision === "rejected"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {item.review_decision.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-3 text-xs">
                  {/* Left: Source Claim Context */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Source Claim Text
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#080b12] border border-[#1e2538] text-zinc-300 leading-relaxed font-sans">
                      &ldquo;{item.claim}&rdquo;
                    </div>

                    <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Gate Flag Reason
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                      {item.rejection_reason}
                    </div>
                  </div>

                  {/* Right: Candidate Value & Controls */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                        Model Candidate Value
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#141a29] border border-indigo-500 text-white font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[#141926] border border-[#212b40]">
                          <span className="font-mono text-white font-medium text-xs">
                            {item.corrected_value || item.candidate_value || "(empty)"}
                          </span>
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-zinc-400 hover:text-indigo-300 text-[11px] flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                        Supporting Evidence Span
                      </div>
                      <div className="p-2 rounded-lg bg-[#080b12] border border-[#1e2538] font-mono text-zinc-300 text-xs">
                        &ldquo;{item.candidate_evidence || "None"}&rdquo;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Review Decision Buttons */}
                <div className="pt-3 border-t border-[#1e2538]/60 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-400">
                    Decision:{" "}
                    {item.review_decision === "accepted" ? (
                      <span className="text-emerald-400 font-medium">Approved into Final Schema</span>
                    ) : item.review_decision === "rejected" ? (
                      <span className="text-rose-400 font-medium">Explicitly Rejected & Withheld</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Awaiting Human Judgment</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateDecision(item.id, "accepted")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        item.review_decision === "accepted"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Candidate</span>
                    </button>

                    <button
                      onClick={() => onUpdateDecision(item.id, "rejected")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        item.review_decision === "rejected"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Candidate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Reviewed Items Modal */}
      {items.length > 0 && (
        <JsonViewerModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Export Human Reviewed Claim Decisions"
          data={{
            reviewed_items: items,
            exported_at: new Date().toISOString(),
            total_items: items.length,
            accepted_count: acceptedCount,
            rejected_count: rejectedCount,
          }}
          filename="schemaguard_human_review_decisions.json"
        />
      )}
    </div>
  );
}
