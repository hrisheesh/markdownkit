/* eslint-disable @next/next/no-img-element */

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export interface RichMarkdownCoreProps {
  /** Markdown source rendered with GitHub-flavored Markdown support. */
  content: string;
  /** Overrides for standard Markdown HTML elements. Source Markdown remains sanitized before these render. */
  components?: Components;
}

/**
 * A lightweight Markdown Flow entry point for products that do not need
 * charts, diagrams, mathematical notation, or interactive rich blocks.
 * Import `markdown-flow/core.css` once in the consuming application.
 */
export function RichMarkdownCore({ content, components }: RichMarkdownCoreProps) {
  return (
    <div className="markdown-render markdown-render-core min-w-0 text-[15px] font-normal leading-7 text-charcoal sm:text-[16px] sm:leading-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className="mb-7 mt-12 text-[2rem] font-semibold tracking-[-0.045em] leading-[1.08] text-ink first:mt-0 sm:mt-16 sm:text-[3.25rem]">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-4 mt-11 border-b border-hairline-soft pb-3 text-[1.5rem] font-semibold tracking-[-0.035em] leading-tight text-ink first:mt-0 sm:mt-14 sm:text-[2rem]">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-8 text-lg font-semibold tracking-[-0.025em] leading-snug text-ink first:mt-0 sm:mt-10 sm:text-xl">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-7 text-base font-semibold leading-snug text-ink first:mt-0 sm:mt-8 sm:text-lg">{children}</h4>,
          h5: ({ children }) => <h5 className="mb-2 mt-6 text-base font-semibold leading-snug text-ink first:mt-0">{children}</h5>,
          h6: ({ children }) => <h6 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] leading-snug text-steel first:mt-0">{children}</h6>,
          p: ({ children }) => <p className="my-5 leading-7 text-charcoal first:mt-0 last:mb-0 sm:leading-8">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic text-charcoal">{children}</em>,
          del: ({ children }) => <del className="text-steel decoration-steel/70">{children}</del>,
          blockquote: ({ children }) => <blockquote className="my-7 border-l-2 border-brand-blue/70 pl-5 text-[0.98em] leading-7 text-slate sm:pl-6 sm:leading-8">{children}</blockquote>,
          ul: ({ children }) => <ul className="my-5 list-disc space-y-2.5 pl-5 marker:text-brand-blue sm:pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-5 list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-brand-blue sm:pl-6">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-7 sm:leading-8">{children}</li>,
          input: ({ checked, type }) => <input checked={checked} readOnly type={type} className="mr-2 size-4 translate-y-0.5 rounded border-hairline accent-brand-blue" />,
          code: ({ children, className }) => {
            const language = /language-([\w-]+)/.exec(className || "")?.[1];
            if (language) return <code className="block overflow-x-auto bg-surface-soft px-4 py-3 font-mono text-[0.87em] text-ink">{children}</code>;
            return <code className="mx-0.5 break-words rounded-md bg-surface-soft px-1.5 py-0.5 font-mono text-[0.87em] font-medium text-ink">{children}</code>;
          },
          pre: ({ children }) => <pre className="internal-scroll my-8 overflow-x-auto rounded-xl border border-hairline bg-surface-soft">{children}</pre>,
          table: ({ children }) => <div className="internal-scroll my-8 max-w-full overflow-x-auto rounded-xl border border-hairline bg-white"><table className="w-full min-w-[34rem] border-collapse text-left text-sm sm:min-w-[40rem]">{children}</table></div>,
          thead: ({ children }) => <thead className="border-b border-hairline bg-surface-soft text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-hairline-soft bg-white">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="whitespace-nowrap px-3 py-3 align-bottom font-bold sm:px-4">{children}</th>,
          td: ({ children }) => <td className="px-3 py-3 align-top text-charcoal sm:px-4">{children}</td>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-brand-blue underline decoration-brand-blue/35 underline-offset-4 transition-colors duration-150 hover:text-brand-blue-deep hover:decoration-brand-blue/80 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-blue/35">{children}</a>,
          hr: () => <hr className="my-10 border-t border-hairline-soft" />,
          img: ({ src, alt, title }) => <img src={src || ""} alt={alt || ""} title={title} className="my-8 h-auto max-h-[70svh] w-full rounded-xl border border-hairline-soft object-contain sm:max-h-[40rem]" loading="lazy" />,
          ...components,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
