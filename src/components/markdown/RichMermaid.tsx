"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion, useReducedMotion } from "framer-motion";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function RichMermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const renderHostRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  // Use React's useId to ensure deterministic SSR/Client IDs without hydration bugs
  // Remove any colons from the ID to keep Mermaid parser happy
  const reactId = React.useId().replace(/:/g, "");
  const generatedId = `sota-mermaid-${reactId}`;

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        .catch((err: unknown) => {
          if (mounted) {
            setSvg("");
            setError(getErrorMessage(err, "Unable to render diagram"));
            setIsRendering(false);
          }
        });
    } catch (err: unknown) {
      if (mounted) {
        setSvg("");
        setError(getErrorMessage(err, "Fatal syntax error"));
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
      <div className="my-6 flex items-center justify-center rounded-lg border border-dashed border-hairline bg-surface py-8 text-sm font-bold text-steel shadow-sm">
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
      <div className="my-6 overflow-hidden rounded-lg border border-brand-coral/20 bg-brand-coral/10 p-4 text-sm font-bold text-brand-coral shadow-[0_8px_24px_rgba(255,100,100,0.06)] sm:p-5">
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
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="internal-scroll my-6 max-h-[70svh] overflow-auto rounded-lg border border-hairline bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:border-hairline-soft hover:shadow-md sm:max-h-[40rem] sm:p-6 [&_svg_path]:transition-all [&_svg_path]:duration-300 hover:[&_svg_.node_rect]:fill-brand-blue/5 hover:[&_svg_.node_rect]:stroke-brand-blue"
    >
      <div ref={renderHostRef} className="absolute -left-[9999px] -top-[9999px] w-[1200px] opacity-0 pointer-events-none" aria-hidden="true" />
      <div
        className="flex min-w-max justify-center [&_svg]:h-auto [&_svg]:max-h-[60svh] [&_svg]:w-auto [&_svg]:max-w-none sm:[&_svg]:max-h-[36rem]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </motion.div>
  );
}
