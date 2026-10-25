"use client";

import React, { useState } from "react";
import { Copy, Check, Download, X, Code2 } from "lucide-react";

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
  filename?: string;
}

export default function JsonViewerModal({
  isOpen,
  onClose,
  title,
  data,
  filename = "schemaguard_output.json",
}: JsonViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-[#20293d] bg-[#0c101a] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2538]">
          <div className="flex items-center gap-2 text-zinc-100">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-[#141a29] hover:bg-[#1b2337] text-zinc-200 border border-[#232d44] transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#141a29] transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#080b12]">
          <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1e2538] bg-[#0c101a] text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Schema: Strict 8-key JSON (SGLang decode)</span>
          <span className="font-mono">
            {jsonString.length.toLocaleString()} characters
          </span>
        </div>
      </div>
    </div>
  );
}
