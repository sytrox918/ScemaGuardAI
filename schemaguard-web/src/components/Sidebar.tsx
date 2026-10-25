"use client";

import React from "react";
import {
  ShieldAlert,
  Zap,
  Scale,
  BarChart3,
  UserCheck,
  GitBranch,
  Activity,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";
import { HealthResponse } from "@/types/schemaguard";

export type TabId =
  | "overview"
  | "extraction"
  | "comparison"
  | "evaluation"
  | "review"
  | "pipeline";

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  health: HealthResponse | null;
  reviewCount: number;
}

export const NAV_ITEMS = [
  {
    id: "overview" as TabId,
    label: "Overview",
    description: "System health & benchmarks",
    icon: Activity,
  },
  {
    id: "extraction" as TabId,
    label: "Live Extraction",
    description: "Unstructured claim workspace",
    icon: Zap,
  },
  {
    id: "comparison" as TabId,
    label: "Model Comparison",
    description: "4-way side-by-side analysis",
    icon: Scale,
  },
  {
    id: "evaluation" as TabId,
    label: "Evaluation Dashboard",
    description: "AuditKIT & 32-claim challenge",
    icon: BarChart3,
  },
  {
    id: "review" as TabId,
    label: "Human Review",
    description: "Abstained & flagged fields",
    icon: UserCheck,
    badgeKey: "reviewCount",
  },
  {
    id: "pipeline" as TabId,
    label: "Pipeline & About",
    description: "Architecture & SFT training",
    icon: GitBranch,
  },
];

export default function Sidebar({
  currentTab,
  onSelectTab,
  health,
  reviewCount,
}: SidebarProps) {
  const isHealthy = health?.status === "healthy";
  const isDegraded = health?.status === "degraded";

  return (
    <aside className="w-64 shrink-0 border-r border-[#1e2538] bg-[#0a0d14] flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1e2538] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white">
                SchemaGuard AI
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Syntax Error 2026</p>
          </div>
        </div>
      </div>

      {/* Backend Status Banner */}
      <div className="px-3 py-2.5 mx-3 mt-3 rounded-lg border border-[#1e2538] bg-[#0e121d] text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isHealthy
                    ? "bg-emerald-400"
                    : isDegraded
                    ? "bg-amber-400"
                    : "bg-zinc-500"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy
                    ? "bg-emerald-500"
                    : isDegraded
                    ? "bg-amber-500"
                    : "bg-zinc-500"
                }`}
              />
            </span>
            <span className="font-medium text-zinc-300 text-[11px]">
              {isHealthy
                ? "SGLang Connected"
                : isDegraded
                ? "Proxy Degraded"
                : "Offline / Fallback Mode"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {health?.latency_ms ? `${health.latency_ms}ms` : "Local"}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1e2538]/60 flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-zinc-400" /> Qwen3-1.7B
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Sparkles className="w-3 h-3" /> LoRA
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
          Workspace
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const showBadge = item.id === "review" && reviewCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-200 border border-indigo-500/30 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131826] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-400" : "text-zinc-400"
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-zinc-400 truncate hidden lg:block">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {showBadge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {reviewCount}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1e2538] bg-[#080b12] text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 mb-1 text-zinc-400 font-medium">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local LLM Track #5</span>
        </div>
        <p className="text-[10px] leading-tight text-zinc-400">
          Structured output + Deterministic evidence gate.
        </p>
      </div>
    </aside>
  );
}
