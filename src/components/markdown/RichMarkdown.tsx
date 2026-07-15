"use client";

import React, { ReactNode } from "react";
import ReactMarkdown, { type Components, type Options } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { DEFAULT_MARKDOWN_FLOW_RENDER_POLICY, type MarkdownFlowRenderPolicy } from "../../ai/protocol";
import { useMarkdownFlowCitations, type MarkdownFlowCitationResolver, type MarkdownFlowDatasetResolver } from "../../ai/data";
import type { MarkdownFlowArtifactRegistry } from "../../ai/artifacts";
import { emitMarkdownFlowTelemetry, type MarkdownFlowTelemetry } from "../../ai/telemetry";
import { extractMarkdownFlowCitationIds, tokenizeMarkdownFlowCitations } from "../../ai/citations";
import type { MarkdownFlowNormalizationMode } from "../../ai/model";
import RichBlockRenderer from "./RichBlockRenderer";

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
  const detailsId = React.useId();

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
        className="mx-1 inline-flex size-[1.2rem] translate-y-[-1px] items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white transition-colors duration-150 hover:bg-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
        title={`Source: ${citation.filename}`}
        aria-label={`Show source: ${citation.filename}`}
        aria-expanded={open}
        aria-controls={detailsId}
      >
        {citation.id.replace(/[\[\]]/g, "")}
      </button>

      {open && (
        <div id={detailsId} role="dialog" aria-label={`Source details: ${citation.filename}`} className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(19rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-hairline bg-white p-3.5 text-left text-xs leading-5 text-charcoal shadow-[0_16px_40px_rgba(23,23,23,0.12)]">
          <div className="mb-1 font-semibold text-ink">{citation.filename}</div>
          {citation.contextual_header && (
            <div className="mb-2 font-semibold text-steel">{citation.contextual_header}</div>
          )}
          <p className="line-clamp-5">{citation.text_preview}</p>
        </div>
      )}
    </span>
  );
}

function getCitationMap(citations?: readonly Citation[]) {
  const map = new Map<string, Citation>();

  citations?.forEach((citation) => {
    map.set(citation.id, citation);
    map.set(citation.id.replace(/[\[\]]/g, ""), citation);
  });

  return map;
}

function InlineWithCitations({
  children,
  citations,
}: {
  children: ReactNode;
  citations?: readonly Citation[];
}) {
  const citationMap = React.useMemo(() => getCitationMap(citations), [citations]);

  const renderNode = (node: ReactNode, keyPrefix: string): ReactNode => {
    if (typeof node === "string") {
      return tokenizeMarkdownFlowCitations(node).map((part, index) => {
        if (part.type === "citation") {
          const citation = citationMap.get(part.id);
          if (citation) return <CitationBadge key={`${keyPrefix}-citation-${part.id}-${index}`} citation={citation} />;
        }
        return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part.value}</React.Fragment>;
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

export interface RichMarkdownProps {
  /** Markdown source, including optional rich fenced blocks. */
  content: string;
  /** Source references rendered as accessible inline citation badges. */
  citations?: readonly Citation[];
  /** Explicit renderers for fenced block languages. These receive text-only code after Markdown sanitization. */
  blockRenderers?: RichBlockRenderers;
  /** Enables strict validation and host-controlled limits for Markdown Flow's built-in AI blocks. */
  renderPolicy?: MarkdownFlowRenderPolicy;
  /** Host-owned, versioned business artifacts available to strict AI output. */
  artifactRegistry?: MarkdownFlowArtifactRegistry;
  /** Resolves host-authorized chart data referenced by an AI block. */
  datasetResolver?: MarkdownFlowDatasetResolver;
  /** Resolves source metadata when a narrative references a citation not sent in its envelope. */
  citationResolver?: MarkdownFlowCitationResolver;
  /** Optional privacy-safe production observability hook. Model content is never included. */
  telemetry?: MarkdownFlowTelemetry;
  /** Overrides for standard Markdown HTML elements. Source Markdown remains sanitized before these render. */
  components?: Components;
  /** Enables KaTeX parsing when the content contains math delimiters. Set false to keep math as plain Markdown. */
  enableMath?: boolean;
  /** Recovers predictable LLM aliases by default; strict mode requires canonical blocks. */
  validationMode?: MarkdownFlowNormalizationMode;
}

export interface RichBlockRendererProps {
  /** The fenced block language, for example `alert` from a ` ```alert ` block. */
  language: string;
  /** Text-only fenced block content. */
  code: string;
}

export type RichBlockRenderer = (props: RichBlockRendererProps) => ReactNode;
export type RichBlockRenderers = Readonly<Record<string, RichBlockRenderer | undefined>>;

export interface RichMarkdownContentProps extends Omit<RichMarkdownProps, "enableMath"> {
  mathPlugins?: Pick<Options, "remarkPlugins" | "rehypePlugins">;
}

export function RichMarkdownContent({ content, citations, blockRenderers, renderPolicy, artifactRegistry, datasetResolver, citationResolver, telemetry, components, mathPlugins, validationMode }: RichMarkdownContentProps) {
  const citationIds = React.useMemo(() => extractMarkdownFlowCitationIds(content), [content]);
  const resolvedCitations = useMarkdownFlowCitations(citationIds, citations, citationResolver, telemetry);
  const containsTooManyAiBlocks = (content.match(/^```(?:callout|metrics|timeline|steps|comparison|accordion|tabs|cards|filetree|progress|checklist|status|quote|chart|mermaid|embed|image|map|artifact)\b/gim)?.length ?? 0)
    > (renderPolicy?.maxBlocks ?? DEFAULT_MARKDOWN_FLOW_RENDER_POLICY.maxBlocks);

  React.useEffect(() => {
    const blockCount = content.match(/^```[\w-]+\s*$/gm)?.length ?? 0;
    const startedAt = Date.now();
    const frame = requestAnimationFrame(() => {
      emitMarkdownFlowTelemetry(telemetry, { type: "render", outcome: "complete", durationMs: Date.now() - startedAt, contentLength: content.length, blockCount });
    });
    return () => cancelAnimationFrame(frame);
  }, [content, telemetry]);

  return (
    <div className="markdown-render chat-markdown min-w-0 text-[15px] font-normal leading-7 text-charcoal sm:text-[16px] sm:leading-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, ...(mathPlugins?.remarkPlugins ?? [])]}
        rehypePlugins={[
          [
            rehypeSanitize,
            {
              ...defaultSchema,
              attributes: {
                ...defaultSchema.attributes,
                code: [...(defaultSchema.attributes?.code || []), "className"],
                div: [...(defaultSchema.attributes?.div || []), "className"],
                span: [...(defaultSchema.attributes?.span || []), "className"],
              },
            },
          ],
          ...(mathPlugins?.rehypePlugins ?? []),
        ]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-7 mt-12 max-w-[22ch] text-[2rem] font-semibold leading-[1.12] tracking-[-0.047em] text-ink text-balance first:mt-0 sm:mt-16 sm:text-[2.75rem]">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-11 scroll-mt-8 text-[1.45rem] font-semibold leading-tight tracking-[-0.038em] text-ink text-balance first:mt-0 sm:mt-14 sm:text-[1.85rem]">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-8 scroll-mt-8 text-lg font-semibold leading-snug tracking-[-0.028em] text-ink text-balance first:mt-0 sm:mt-10 sm:text-xl">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-7 scroll-mt-8 text-base font-semibold leading-snug text-ink first:mt-0 sm:mt-8 sm:text-lg">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="mb-2 mt-6 text-base font-semibold leading-snug text-ink first:mt-0">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] leading-snug text-steel first:mt-0">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </h6>
          ),
          p: ({ children }) => (
            <p className="my-5 leading-[1.78] text-charcoal first:mt-0 last:mb-0 sm:leading-[1.82]">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </p>
          ),
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic text-charcoal">{children}</em>,
          del: ({ children }) => <del className="text-steel decoration-steel/70">{children}</del>,
          blockquote: ({ children }) => (
            <blockquote className="relative my-8 rounded-r-2xl border-l-[3px] border-brand-blue/65 bg-gradient-to-r from-brand-blue/[0.055] to-transparent py-2 pl-5 pr-4 text-[0.98em] leading-7 text-slate sm:pl-6 sm:leading-8">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-5 marker:text-brand-blue/85 sm:pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-brand-blue sm:pl-6">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-7 sm:leading-8">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </li>
          ),
          input: ({ checked, type }) => (
            <span className="relative mr-2 inline-flex size-[18px] translate-y-1 items-center justify-center">
              <input checked={checked} readOnly type={type} className="peer size-full appearance-none rounded-full border border-hairline bg-white transition-colors checked:border-brand-blue checked:bg-brand-blue" />
              {checked && <span className="pointer-events-none absolute text-[11px] font-bold leading-none text-white" aria-hidden="true">✓</span>}
            </span>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ children, className }) => {
            const language = /language-([\w-]+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");
            if (language) return <RichBlockRenderer language={language} code={code} blockRenderers={blockRenderers} renderPolicy={renderPolicy} artifactRegistry={artifactRegistry} datasetResolver={datasetResolver} telemetry={telemetry} validationMode={validationMode} containsTooManyAiBlocks={containsTooManyAiBlocks} />;

            return (
              <code className="mx-0.5 break-words rounded-md border border-ink/[0.055] bg-surface-soft/80 px-1.5 py-0.5 font-mono text-[0.86em] font-medium tracking-[-0.015em] text-ink">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="internal-scroll my-8 max-w-full overflow-x-auto rounded-2xl border border-hairline-soft bg-white shadow-[0_12px_32px_-30px_rgba(18,20,22,0.45)]">
              <table className="min-w-full w-max border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface/80 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-hairline-soft/80">{children}</tbody>,
          tr: ({ children }) => <tr className="group transition-colors hover:bg-brand-blue/[0.018]">{children}</tr>,
          th: ({ children }) => (
            <th className="whitespace-nowrap break-normal wrap-normal border-b border-hairline-soft px-4 py-3.5 align-bottom font-semibold sm:px-5">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </th>
          ),
          td: ({ children }) => (
            <td className="max-w-[28rem] whitespace-normal break-normal wrap-normal px-4 py-3.5 align-top leading-6 text-charcoal sm:px-5">
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-blue underline decoration-brand-blue/30 decoration-[0.08em] underline-offset-[0.22em] transition-colors duration-150 hover:text-brand-blue-deep hover:decoration-brand-blue/75 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-blue/35"
            >
              <InlineWithCitations citations={resolvedCitations}>{children}</InlineWithCitations>
            </a>
          ),
          hr: () => <hr className="my-12 border-t border-hairline-soft" />,
          img: ({ src, alt, title }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src || ""}
              alt={alt || ""}
              title={title}
              className="my-8 h-auto max-h-[70svh] w-full rounded-[1.75rem] bg-surface object-contain p-1 shadow-[0_16px_42px_-30px_rgba(18,20,22,0.5)] ring-1 ring-black/[0.045] sm:max-h-[40rem]"
              loading="lazy"
            />
          ),
          ...components,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const MathRichMarkdown = React.lazy(() => import("./MathRichMarkdown"));

function containsMath(content: string) {
  return /(?:^|[^\\])\$(?:[^$\n]|\\\$)+\$|\\\(|\\\[/.test(content);
}

/**
 * Rich Markdown with progressive math loading. Ordinary answers never import
 * KaTeX's Markdown plugins; a response with a math delimiter loads them on demand.
 */
export default function RichMarkdown({ enableMath = true, ...props }: RichMarkdownProps) {
  if (!enableMath || !containsMath(props.content)) return <RichMarkdownContent {...props} />;

  return (
    <React.Suspense fallback={<RichMarkdownContent {...props} />}>
      <MathRichMarkdown {...props} />
    </React.Suspense>
  );
}
