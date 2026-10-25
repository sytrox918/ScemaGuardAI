"use client";

import React from "react";
import {
  Calendar,
  Laptop,
  AlertCircle,
  Hash,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { FieldDetail, FieldKey, GateStatus } from "@/types/schemaguard";

interface FieldCardProps {
  field: FieldKey;
  detail: FieldDetail;
  isFocused?: boolean;
  onSelect?: () => void;
  onSendToReview?: (field: FieldKey, detail: FieldDetail) => void;
  isReviewed?: boolean;
}

const FIELD_CONFIGS: Record<
  FieldKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }
> = {
  purchase_date: {
    label: "Purchase Date",
    icon: Calendar,
    accentColor: "text-amber-400",
  },
  product: {
    label: "Product",
    icon: Laptop,
    accentColor: "text-sky-400",
  },
  issue: {
    label: "Reported Issue / Defect",
    icon: AlertCircle,
    accentColor: "text-rose-400",
  },
  serial_number: {
    label: "Hardware Serial Number",
    icon: Hash,
    accentColor: "text-emerald-400",
  },
};

const STATUS_BADGES: Record<
  GateStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  EVIDENCE_PRESENT: {
    label: "Grounded & Accepted",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  MISSING: {
    label: "Expected Blank / Missing",
    bg: "bg-zinc-800",
    text: "text-zinc-400",
    border: "border-zinc-700",
    icon: HelpCircle,
  },
  INVALID_EVIDENCE: {
    label: "Evidence Not in Source",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  VALUE_NOT_IN_EVIDENCE: {
    label: "Value Not in Evidence",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  VALUE_NOT_LITERAL_REVIEW: {
    label: "Non-Literal Value",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  AMBIGUOUS_DATE_REVIEW: {
    label: "Ambiguous Date Format",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  MULTIPLE_DATES_REVIEW: {
    label: "Conflicting Dates in Claim",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  DELIVERY_DATE_REVIEW: {
    label: "Delivery Date Substituted",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  NO_ISSUE_STATED: {
    label: "No Defect Keyword Found",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  QUESTIONABLE_SERIAL: {
    label: "Questionable Serial Evidence",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  PROMPT_INJECTION_DETECTED: {
    label: "Adversarial Pattern Flagged",
    bg: "bg-red-500/20",
    text: "text-red-300",
    border: "border-red-500/40",
    icon: XCircle,
  },
  MULTI_PRODUCT_REVIEW: {
    label: "Multiple Products Detected",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
};

export default function FieldCard({
  field,
  detail,
  isFocused,
  onSelect,
  onSendToReview,
  isReviewed,
}: FieldCardProps) {
  const config = FIELD_CONFIGS[field];
  const Icon = config.icon;
  const statusConfig = STATUS_BADGES[detail.status] || STATUS_BADGES.MISSING;
  const StatusIcon = statusConfig.icon;

  const isAccepted = detail.status === "EVIDENCE_PRESENT";
  const canSendToReview = !isAccepted && detail.status !== "MISSING" && !isReviewed;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border transition-all cursor-pointer p-4 bg-[#0e121d] ${
        isFocused
          ? "border-indigo-500/80 shadow-lg shadow-indigo-500/10"
          : "border-[#1e2538] hover:border-zinc-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2538]/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#151b2a] border border-[#20293d]">
            <Icon className={`w-4 h-4 ${config.accentColor}`} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">
              {config.label}
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">
              {field}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          <StatusIcon className="w-3 h-3" />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Body content */}
      <div className="mt-3 space-y-2.5">
        {/* Candidate Extracted Value */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">
            Model Candidate Value
          </div>
          <div className="text-sm font-medium text-white">
            {detail.value ? (
              <span className="font-mono bg-[#161d2d] px-2 py-0.5 rounded border border-[#20293d]">
                {detail.value}
              </span>
            ) : (
              <span className="text-zinc-400 italic text-xs">
                (empty / unextracted)
              </span>
            )}
          </div>
        </div>

        {/* Verbatim Supporting Evidence */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">
            Verbatim Supporting Evidence
          </div>
          <div className="text-xs text-zinc-300 bg-[#090c13] p-2 rounded-lg border border-[#1e2538] font-mono whitespace-pre-wrap">
            {detail.evidence ? (
              <span>&ldquo;{detail.evidence}&rdquo;</span>
            ) : (
              <span className="text-zinc-400 italic">No evidence cited</span>
            )}
          </div>
        </div>

        {/* Deterministic Gate Decision & Rationale */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">
            Deterministic Gate Rationale
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed bg-[#131724] p-2 rounded-lg border border-[#1e2538]/70">
            {detail.reason}
          </p>
        </div>

        {/* Final Gated Output */}
        <div className="pt-2 border-t border-[#1e2538]/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400">Final Schema Output:</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            {isAccepted ? (
              <span className="font-mono text-emerald-300 font-semibold text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                &ldquo;{detail.accepted_value}&rdquo;
              </span>
            ) : (
              <span className="font-mono text-zinc-400 text-xs italic bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/50">
                &ldquo;&rdquo; (Abstained by gate)
              </span>
            )}
          </div>

          {canSendToReview && onSendToReview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendToReview(field, detail);
              }}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all font-medium"
            >
              <UserPlus className="w-3 h-3" />
              <span>Send to Review</span>
            </button>
          )}

          {isReviewed && (
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
              In Review Queue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
