"use client";

import React, { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

import dynamic from "next/dynamic";
import RichCodeBlock from "./RichCodeBlock";
import RichChart from "./RichChart";

const RichMermaid = dynamic(() => import("./RichMermaid"), { ssr: false });

export interface Citation {
  id: string;
  chunk_id: string;
  document_id: string;
  filename: string;
  contextual_header?: string;
  text_preview: string;
}

function CitationBadge({ citation }: { citation: Citation }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mx-1 inline-flex size-5 translate-y-[-2px] items-center justify-center rounded-full bg-[#161616] text-[10px] font-bold text-white transition duration-200 ease-out hover:-translate-y-1 hover:bg-[#3f6df6]"
        title={`Source: ${citation.filename}`}
      >
        {citation.id.replace(/[\[\]]/g, "")}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-[#161616] p-4 text-left text-white shadow-2xl">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/45">Source {citation.id}</div>
          <div className="mb-1 truncate text-sm font-bold">{citation.filename}</div>
          {citation.contextual_header && (
            <div className="mb-2 truncate text-xs font-semibold text-white/50">{citation.contextual_header}</div>
          )}
          <div className="line-clamp-3 text-xs font-medium leading-5 text-white/70">{citation.text_preview}</div>
          <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 rotate-45 bg-[#161616]" />
        </div>
      )}
    </span>
  );
}

function getCitationMap(citations?: Citation[]) {
  const citationMap = new Map<string, Citation>();

  citations?.forEach((citation) => {
    const cleanId = citation.id.replace(/[\[\]]/g, "");
    citationMap.set(citation.id, citation);
    citationMap.set(cleanId, citation);
    citationMap.set(`[${cleanId}]`, citation);
  });

  return citationMap;
}

function InlineWithCitations({ children, citations }: { children: ReactNode; citations?: Citation[] }) {
  const citationMap = React.useMemo(() => getCitationMap(citations), [citations]);

  const renderNode = (node: ReactNode, keyPrefix: string): ReactNode => {
    if (typeof node === "string") {
      return node
        .split(/(\[\d+\]|\b\d+\b)/g)
        .filter(Boolean)
        .map((part, index) => {
          const citation = citationMap.get(part) ?? citationMap.get(part.replace(/[\[\]]/g, ""));
          if (citation) {
            return <CitationBadge key={`${keyPrefix}-citation-${part}-${index}`} citation={citation} />;
          }

          return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
        });
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
    }

    if (React.isValidElement<{ children?: ReactNode }>(node)) {
      return React.cloneElement(node, {
        children: renderNode(node.props.children, `${keyPrefix}-child`),
      });
    }

    return node;
  };

  return <>{renderNode(children, "inline")}</>;
}

export default function RichMarkdown({
  content,
  citations,
}: {
  content: string;
  citations?: any[];
}) {
  return (
    <div className="chat-markdown text-[15px] font-medium leading-7 text-charcoal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeSanitize, {
            ...defaultSchema,
            attributes: {
              ...defaultSchema.attributes,
              // Allow class names on code, div, and span so Katex and other plugins can find their targets
              code: [...(defaultSchema.attributes?.code || []), 'className'],
              div: [...(defaultSchema.attributes?.div || []), 'className'],
              span: [...(defaultSchema.attributes?.span || []), 'className'],
            }
          }],
          rehypeKatex
        ]}
        components={{
          // Typography
          h1: ({ children }) => (
            <h1 className="mb-5 mt-8 text-2xl font-black leading-tight tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 border-b border-hairline-soft pb-2 text-xl font-extrabold leading-snug tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-lg font-bold leading-snug tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-5 text-base font-bold leading-snug tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-4 text-base leading-[1.75] first:mt-0 last:mb-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-brand-blue/40 pl-5 text-[0.95em] italic leading-relaxed text-slate/90">
              {children}
            </blockquote>
          ),
          
          // Lists
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2.5 pl-6 marker:text-steel">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2.5 pl-6 font-semibold marker:text-steel"><div className="font-medium text-charcoal">{children}</div></ol>,
          li: ({ children }) => (
            <li className="pl-1 leading-relaxed">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </li>
          ),

          // Code blocks
          pre: ({ children }) => <>{children}</>,
          code: ({ children, className }) => {
            const language = /language-(\w+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <RichMermaid chart={code} />;
            }
            if (language === "chart") {
              return <RichChart configStr={code} />;
            }
            if (language) {
              return <RichCodeBlock language={language} code={code} />;
            }
            return (
              <code className="mx-0.5 rounded-md bg-stone/50 px-1.5 py-0.5 text-[0.92em] font-bold tracking-tight text-ink">
                {children}
              </code>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="internal-scroll my-6 max-w-full overflow-x-auto rounded-xl border border-hairline bg-white shadow-sm transition-all duration-300 hover:border-hairline-soft hover:shadow-md">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-stone/30 border-b border-hairline font-bold text-ink">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-hairline-soft bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="transition-colors duration-300 ease-out hover:bg-black/[0.02]">{children}</tr>,
          th: ({ children }) => <th className="px-5 py-4 font-bold">{children}</th>,
          td: ({ children }) => (
            <td className="px-5 py-4 align-top text-charcoal">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </td>
          ),

          // Misc
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-4 transition-all duration-300 hover:text-brand-blue-deep hover:decoration-brand-blue/80"
            >
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </a>
          ),
          hr: () => <hr className="my-8 border-t border-hairline-soft" />,
          img: ({ src, alt, title }) => (
            <img 
              src={src} 
              alt={alt} 
              title={title} 
              className="my-6 max-h-[40rem] rounded-2xl object-contain shadow-sm border border-hairline-soft" 
              loading="lazy" 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
