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
    <section className="rich-block-frame my-8 w-full min-w-0 max-w-full overflow-hidden bg-[#f8f8fa] text-[#1d1d1f]">
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-white/75 px-3 py-2.5 backdrop-blur-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-1.5 shrink-0 rounded-full bg-brand-blue shadow-[0_0_0_3px_rgba(79,99,217,0.08)]" aria-hidden="true" />
          <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#73777d]">
            {language || "text"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrapLines((value) => !value)}
            className={`rich-block-control size-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/55 ${
              wrapLines ? "bg-brand-blue/[0.09] text-brand-blue" : ""
            }`}
            aria-label={wrapLines ? "Disable line wrapping" : "Wrap long lines"}
            title={wrapLines ? "Disable line wrapping" : "Wrap long lines"}
          >
            <WrapText size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rich-block-control gap-1.5 px-2.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/55"
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? <Check size={14} className="text-[#34c759]" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </header>
      <div className="internal-scroll max-h-[56svh] w-full min-w-0 max-w-full overflow-auto sm:max-h-[34rem]">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: "1.125rem 1rem 1.25rem",
            background: "#f8f8fa",
            fontSize: "13px",
            lineHeight: "1.75",
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
