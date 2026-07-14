"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Maximize2, Minus, Plus, ScanLine } from "lucide-react";
import mermaid from "mermaid";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function RichMermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(true);
  const [zoom, setZoom] = useState(1);
  const renderHostRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const reactId = React.useId().replace(/:/g, "");
  const generatedId = `markdown-diagram-${reactId}`;

  useEffect(() => {
    let mounted = true;
    // The loading shell must be restored before the asynchronous renderer resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRendering(true);
    setError("");

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        primaryColor: "#f5f6ff",
        primaryTextColor: "#24272b",
        primaryBorderColor: "#aab3e8",
        lineColor: "#6877d5",
        secondaryColor: "#f8f8f7",
        tertiaryColor: "#eef0fa",
        fontFamily: "Geist, Inter, sans-serif",
        fontSize: "14px",
      },
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
    });

    const renderHost = renderHostRef.current;
    const cleanChart = chart.replace(/^`+|`+$/g, "").trim();

    mermaid
      .render(generatedId, cleanChart, renderHost ?? undefined)
      .then(({ svg: renderedSvg }) => {
        if (mounted) {
          setSvg(renderedSvg);
          setIsRendering(false);
        }
      })
      .catch((renderError: unknown) => {
        if (mounted) {
          setError(getErrorMessage(renderError, "Unable to render this diagram."));
          setIsRendering(false);
        }
      });

    return () => {
      mounted = false;
      renderHost?.replaceChildren();
    };
  }, [chart, generatedId]);

  async function openFullscreen() {
    try {
      await containerRef.current?.requestFullscreen();
    } catch {
      // Fullscreen is an enhancement; diagrams remain fully usable inline.
    }
  }

  const controls = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
        className="rich-block-control size-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        aria-label="Zoom out"
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.15).toFixed(2))))}
        className="rich-block-control size-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        aria-label="Zoom in"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={openFullscreen}
        className="rich-block-control size-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        aria-label="Open diagram fullscreen"
      >
        <Maximize2 size={14} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <section ref={containerRef} className="rich-block-frame my-8 w-full min-w-0 max-w-full overflow-hidden">
      <div ref={renderHostRef} className="pointer-events-none absolute -left-[9999px] -top-[9999px] w-[1200px] opacity-0" aria-hidden="true" />
      <header className="flex items-center justify-between gap-3 border-b border-black/[0.06] bg-white/65 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#73777d]">
          <ScanLine size={14} strokeWidth={1.8} aria-hidden="true" />
          Diagram
        </div>
        {controls}
      </header>

      {isRendering && (
        <div className="flex min-h-[18rem] animate-pulse items-center justify-center bg-[#fafafa] p-6" role="status" aria-label="Rendering diagram">
          <div className="w-full max-w-[20rem] space-y-3">
            <div className="h-3 w-24 rounded-full bg-black/[0.06]" />
            <div className="h-16 rounded-xl border border-black/[0.07] bg-white" />
            <div className="mx-auto h-8 w-px bg-black/[0.08]" />
            <div className="ml-auto h-16 w-2/3 rounded-xl border border-black/[0.07] bg-white" />
          </div>
        </div>
      )}

      {error && !isRendering && (
        <div className="p-4 sm:p-5">
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-brand-coral/20 bg-[#fff6f3] p-3.5 text-sm text-charcoal">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-brand-coral" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">This diagram needs a small correction.</p>
              <p className="mt-1 text-xs leading-5 text-slate">{error}</p>
            </div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-steel hover:text-ink">Show diagram source</summary>
            <pre className="internal-scroll mt-2 max-h-48 overflow-auto rounded-lg bg-surface-soft p-3 text-[11px] leading-5 text-charcoal">{chart}</pre>
          </details>
        </div>
      )}

      {svg && !isRendering && !error && (
        <div className="internal-scroll max-h-[62svh] w-full min-w-0 max-w-full overflow-auto bg-[radial-gradient(circle_at_50%_20%,rgba(79,99,217,0.035),transparent_42%)] p-4 sm:max-h-[40rem] sm:p-7">
          <div
            className="flex min-w-max justify-center transition-transform duration-150 ease-out [&_svg]:h-auto [&_svg]:max-w-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: `${100 / zoom}%` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </section>
  );
}
