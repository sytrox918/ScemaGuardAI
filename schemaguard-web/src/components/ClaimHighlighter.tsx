"use client";

import React from "react";
import { FieldDetail, FieldKey, FIELD_KEYS } from "@/types/schemaguard";

interface ClaimHighlighterProps {
  claim: string;
  fieldDetails?: Record<FieldKey, FieldDetail>;
  activeField?: FieldKey | null;
  onSelectField?: (field: FieldKey) => void;
}

interface SpanMatch {
  field: FieldKey;
  start: number;
  end: number;
  text: string;
}

const FIELD_STYLES: Record<
  FieldKey,
  {
    bg: string;
    border: string;
    text: string;
    label: string;
    dot: string;
  }
> = {
  purchase_date: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-200",
    label: "Purchase Date",
    dot: "bg-amber-400",
  },
  product: {
    bg: "bg-sky-500/20",
    border: "border-sky-500/50",
    text: "text-sky-200",
    label: "Product",
    dot: "bg-sky-400",
  },
  issue: {
    bg: "bg-rose-500/20",
    border: "border-rose-500/50",
    text: "text-rose-200",
    label: "Issue",
    dot: "bg-rose-400",
  },
  serial_number: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    text: "text-emerald-200",
    label: "Serial Number",
    dot: "bg-emerald-400",
  },
};

export default function ClaimHighlighter({
  claim,
  fieldDetails,
  activeField,
  onSelectField,
}: ClaimHighlighterProps) {
  if (!claim) return null;

  // Build non-overlapping span matches
  const spans: SpanMatch[] = [];

  if (fieldDetails) {
    for (const field of FIELD_KEYS) {
      const detail = fieldDetails[field];
      if (!detail) continue;

      const evidence = detail.evidence?.trim();
      const value = detail.value?.trim();
      const target = evidence || value;

      if (!target) continue;

      const idx = claim.toLowerCase().indexOf(target.toLowerCase());
      if (idx !== -1) {
        const start = idx;
        const end = idx + target.length;

        // Check for collisions with existing spans
        const collides = spans.some(
          (s) => Math.max(s.start, start) < Math.min(s.end, end)
        );

        if (!collides) {
          spans.push({ field, start, end, text: claim.substring(start, end) });
        }
      }
    }
  }

  // Sort spans in chronological text order
  spans.sort((a, b) => a.start - b.start);

  // Split claim into highlighted fragments
  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  spans.forEach((span, idx) => {
    if (span.start > cursor) {
      fragments.push(
        <span key={`text-${cursor}`}>
          {claim.substring(cursor, span.start)}
        </span>
      );
    }

    const style = FIELD_STYLES[span.field];
    const isFocused = activeField === span.field;

    fragments.push(
      <mark
        key={`span-${idx}-${span.field}`}
        onClick={() => onSelectField?.(span.field)}
        className={`px-1 py-0.5 rounded cursor-pointer transition-all border font-medium ${
          style.bg
        } ${style.border} ${style.text} ${
          isFocused ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0d111a]" : ""
        }`}
        title={`Grounding evidence for: ${style.label}`}
      >
        {claim.substring(span.start, span.end)}
        <span className="ml-1 text-[9px] uppercase tracking-wider opacity-75 font-mono select-none">
          [{span.field.replace("_", " ")}]
        </span>
      </mark>
    );

    cursor = span.end;
  });

  if (cursor < claim.length) {
    fragments.push(<span key={`text-end`}>{claim.substring(cursor)}</span>);
  }

  return (
    <div className="rounded-xl border border-[#1e2538] bg-[#0c101a] p-4 text-zinc-200">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2538]/70 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Source Claim & Grounded Evidence Spans
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {FIELD_KEYS.map((field) => {
            const style = FIELD_STYLES[field];
            const hasMatch = spans.some((s) => s.field === field);
            return (
              <span
                key={field}
                onClick={() => onSelectField?.(field)}
                className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 rounded ${
                  activeField === field
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-300"
                } ${!hasMatch ? "opacity-40" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
        {spans.length > 0 ? fragments : claim}
      </div>
    </div>
  );
}
