"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar, { TabId, NAV_ITEMS } from "@/components/Sidebar";
import OverviewView from "@/components/views/OverviewView";
import LiveExtractionView from "@/components/views/LiveExtractionView";
import ModelComparisonView from "@/components/views/ModelComparisonView";
import EvaluationDashboardView from "@/components/views/EvaluationDashboardView";
import HumanReviewView from "@/components/views/HumanReviewView";
import PipelineAboutView from "@/components/views/PipelineAboutView";
import {
  HealthResponse,
  BenchmarkReport,
  ExtractionResponse,
  HumanReviewItem,
} from "@/types/schemaguard";
import { Menu, X, ShieldAlert } from "lucide-react";

const INITIAL_SAMPLE_REVIEW_ITEMS: HumanReviewItem[] = [
  {
    id: "sample-review-1",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    claim:
      "Purchased on 04/05/2026. My keyboard stopped working completely. Serial number: KB-8832.",
    field: "purchase_date",
    candidate_value: "04/05/2026",
    candidate_evidence: "Purchased on 04/05/2026",
    gate_status: "AMBIGUOUS_DATE_REVIEW",
    rejection_reason:
      'Numeric date "04/05/2026" is ambiguous: month/day (April 5) vs day/month (May 4) cannot be determined deterministically.',
    model_source: "fine_tuned_gate",
    review_decision: "pending",
  },
  {
    id: "sample-review-2",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    claim:
      "The package was delivered on October 12 2025. The speaker is defective and buzzes loudly. Serial: SPK-990.",
    field: "purchase_date",
    candidate_value: "October 12 2025",
    candidate_evidence: "delivered on October 12 2025",
    gate_status: "DELIVERY_DATE_REVIEW",
    rejection_reason:
      'Extracted date appears to be a delivery/shipping date ("delivered on October 12 2025") rather than an explicit purchase date.',
    model_source: "base_gate",
    review_decision: "pending",
  },
  {
    id: "sample-review-3",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    claim:
      "My router overheats frequently. Purchased on 10 January 2026. Order number: ORD-99321.",
    field: "serial_number",
    candidate_value: "ORD-99321",
    candidate_evidence: "Order number: ORD-99321",
    gate_status: "QUESTIONABLE_SERIAL",
    rejection_reason:
      'Candidate serial number "ORD-99321" appears to be an order/invoice number rather than a hardware serial.',
    model_source: "fine_tuned_gate",
    review_decision: "pending",
  },
];

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabId>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkReport | null>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(true);

  const [recentExtractions, setRecentExtractions] = useState<
    ExtractionResponse[]
  >([]);
  const [reviewItems, setReviewItems] = useState<HumanReviewItem[]>(
    INITIAL_SAMPLE_REVIEW_ITEMS
  );

  const fetchHealth = useCallback(async () => {
    try {
      const resp = await fetch("/api/health");
      if (resp.ok) {
        const data: HealthResponse = await resp.json();
        setHealth(data);
      }
    } catch (err) {
      console.warn("Health check error:", err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const [hResp, bResp] = await Promise.allSettled([
          fetch("/api/health"),
          fetch("/api/benchmark"),
        ]);
        if (!ignore) {
          if (hResp.status === "fulfilled" && hResp.value.ok) {
            const hData = await hResp.value.json();
            setHealth(hData);
          }
          if (bResp.status === "fulfilled" && bResp.value.ok) {
            const bJson = await bResp.value.json();
            if (bJson.data) setBenchmark(bJson.data);
          }
          setIsBenchmarkLoading(false);
        }
      } catch (e) {
        console.warn("Initial load error:", e);
        if (!ignore) setIsBenchmarkLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const handleExtractionComplete = (ext: ExtractionResponse) => {
    setRecentExtractions((prev) => [ext, ...prev.slice(0, 9)]);
  };

  const handleAddToReview = (item: HumanReviewItem) => {
    setReviewItems((prev) => {
      // Avoid duplicate review items for identical claim and field
      if (
        prev.some((p) => p.claim === item.claim && p.field === item.field)
      ) {
        return prev;
      }
      return [item, ...prev];
    });
  };

  const handleUpdateReviewDecision = (
    id: string,
    decision: "accepted" | "rejected" | "corrected",
    correctedValue?: string
  ) => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              review_decision: decision,
              corrected_value: correctedValue ?? item.corrected_value,
            }
          : item
      )
    );
  };

  const handleClearReviewQueue = () => {
    setReviewItems([]);
  };

  const handleLoadSampleReviewItems = () => {
    setReviewItems(INITIAL_SAMPLE_REVIEW_ITEMS);
  };

  const pendingReviewCount = reviewItems.filter(
    (i) => i.review_decision === "pending"
  ).length;

  return (
    <div className="flex h-screen bg-[#08090d] text-zinc-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          health={health}
          reviewCount={pendingReviewCount}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1e2538] bg-[#0a0d14] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-white">
              SchemaGuard AI
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-[#141a29]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#1e2538] bg-[#0a0d14] p-3 space-y-1 z-40">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                      : "text-zinc-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === "review" && pendingReviewCount > 0 && (
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      {pendingReviewCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
          {currentTab === "overview" && (
            <OverviewView
              onNavigate={setCurrentTab}
              health={health}
              onRefreshHealth={fetchHealth}
              benchmark={benchmark}
              recentExtractions={recentExtractions}
            />
          )}

          {currentTab === "extraction" && (
            <LiveExtractionView
              onExtractionComplete={handleExtractionComplete}
              onAddToReview={handleAddToReview}
              reviewItems={reviewItems}
            />
          )}

          {currentTab === "comparison" && (
            <ModelComparisonView />
          )}

          {currentTab === "evaluation" && (
            <EvaluationDashboardView
              benchmark={benchmark}
              isLoading={isBenchmarkLoading}
            />
          )}

          {currentTab === "review" && (
            <HumanReviewView
              items={reviewItems}
              onUpdateDecision={handleUpdateReviewDecision}
              onClearReviewQueue={handleClearReviewQueue}
              onLoadSampleReviewItems={handleLoadSampleReviewItems}
            />
          )}

          {currentTab === "pipeline" && <PipelineAboutView />}
        </main>
      </div>
    </div>
  );
}
