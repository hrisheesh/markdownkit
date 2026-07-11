"use client";

import React, { useState } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function RichCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-black/[0.08] bg-[#f7f7f9] text-[#1d1d1f]">
      <header className="flex items-center justify-between gap-3 border-b border-black/[0.07] bg-white/70 px-3 py-2.5 backdrop-blur-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#6e6e73]">
            {language || "text"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrapLines((value) => !value)}
            className={`inline-flex size-8 items-center justify-center rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70 ${
              wrapLines ? "bg-[#e8f2ff] text-[#007aff]" : "text-[#6e6e73] hover:bg-black/[0.05] hover:text-[#1d1d1f]"
            }`}
            aria-label={wrapLines ? "Disable line wrapping" : "Wrap long lines"}
            title={wrapLines ? "Disable line wrapping" : "Wrap long lines"}
          >
            <WrapText size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#6e6e73] transition-colors duration-150 hover:bg-black/[0.05] hover:text-[#1d1d1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70"
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? <Check size={14} className="text-[#34c759]" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </header>
      <div className="internal-scroll max-h-[60svh] overflow-auto sm:max-h-[34rem]">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: "1.25rem 1rem",
            background: "#f7f7f9",
            fontSize: "13px",
            lineHeight: "1.7",
            overflow: "visible",
          }}
          wrapLongLines={wrapLines}
          wrapLines={wrapLines}
          showLineNumbers
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "1.5em",
            color: "#aeaeb2",
            textAlign: "right",
            userSelect: "none",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </section>
  );
}
