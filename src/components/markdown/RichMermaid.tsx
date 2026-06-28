"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";

export default function RichMermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const renderHostRef = useRef<HTMLDivElement>(null);
  
  // Use React's useId to ensure deterministic SSR/Client IDs without hydration bugs
  // Remove any colons from the ID to keep Mermaid parser happy
  const reactId = React.useId().replace(/:/g, "");
  const generatedId = `sota-mermaid-${reactId}`;

  useEffect(() => {
    let mounted = true;
    setIsRendering(true);
    setError("");
    setSvg("");

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        primaryColor: "#f0f4ff",
        primaryTextColor: "#161616",
        primaryBorderColor: "#c7d5fc",
        lineColor: "#3f6df6",
        secondaryColor: "#f6f1ea",
        tertiaryColor: "#fff0ef",
        fontFamily: "DM Sans, Inter, sans-serif",
        fontSize: "14px",
      },
      flowchart: { useMaxWidth: true, htmlLabels: true },
    });

    const renderHost = renderHostRef.current;

    try {
      // Clean up the text, removing any backticks LLM might have outputted
      const cleanChart = chart.replace(/^`+|`+$/g, "").trim();

      mermaid
        .render(generatedId, cleanChart, renderHost ?? undefined)
        .then(({ svg: renderedSvg }) => {
          if (mounted) {
            setSvg(renderedSvg);
            setIsRendering(false);
          }
        })
        .catch((err) => {
          if (mounted) {
            setSvg("");
            setError(err?.message ?? "Unable to render diagram");
            setIsRendering(false);
          }
        });
    } catch (err: any) {
      if (mounted) {
        setSvg("");
        setError(err?.message ?? "Fatal syntax error");
        setIsRendering(false);
      }
    }

    return () => {
      mounted = false;
      renderHost?.replaceChildren();
    };
  }, [chart, generatedId]);

  if (isRendering) {
    return (
      <div className="my-6 flex items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface py-8 text-sm font-bold text-steel shadow-sm">
        <div ref={renderHostRef} className="absolute -left-[9999px] -top-[9999px] w-[1200px] opacity-0" aria-hidden="true" />
        <span className="mr-1 animate-pulse">Rendering Diagram</span>
        <span className="animate-bounce">.</span>
        <span className="animate-bounce [animation-delay:150ms]">.</span>
        <span className="animate-bounce [animation-delay:300ms]">.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 overflow-hidden rounded-2xl border border-brand-coral/20 bg-brand-coral/10 p-5 text-sm font-bold text-brand-coral shadow-[0_8px_24px_rgba(255,100,100,0.06)]">
        <div ref={renderHostRef} className="absolute -left-[9999px] -top-[9999px] w-[1200px] opacity-0" aria-hidden="true" />
        <div className="mb-2 font-black uppercase tracking-wider text-brand-coral-deep">⚠ Diagram Syntax Error</div>
        <pre className="internal-scroll max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl bg-white/75 p-4 text-[12px] font-mono font-medium leading-relaxed text-charcoal shadow-inner">
          {error}
        </pre>
        <div className="mt-3 text-xs font-semibold text-brand-coral-deep/80">Source:</div>
        <pre className="internal-scroll mt-1 max-h-[200px] overflow-auto rounded-xl bg-white/50 p-3 text-[11px] font-mono text-charcoal/70">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="internal-scroll my-6 max-h-[40rem] overflow-auto rounded-2xl border border-hairline bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:border-hairline-soft hover:shadow-md [&_svg_path]:transition-all [&_svg_path]:duration-300 hover:[&_svg_.node_rect]:fill-brand-blue/5 hover:[&_svg_.node_rect]:stroke-brand-blue"
    >
      <div ref={renderHostRef} className="absolute -left-[9999px] -top-[9999px] w-[1200px] opacity-0 pointer-events-none" aria-hidden="true" />
      <div
        className="flex w-full justify-center [&_svg]:h-auto [&_svg]:max-h-[36rem] [&_svg]:w-auto [&_svg]:max-w-none"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </motion.div>
  );
}
