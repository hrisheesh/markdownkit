"use client";

import React, { useId, useMemo, useState } from "react";
import JSON5 from "json5";
import { Check, ChevronDown, CircleAlert, CircleCheck, File, Folder, Info, Lightbulb, Quote } from "lucide-react";

type BlockType = "callout" | "metrics" | "timeline" | "steps" | "comparison" | "accordion" | "tabs" | "cards" | "filetree" | "progress" | "checklist" | "status" | "quote";

type StructuredConfig = {
  title?: string;
  tone?: "note" | "insight" | "success" | "warning";
  body?: string;
  metrics?: { label: string; value: string | number; change?: string; detail?: string }[];
  items?: { date?: string; title: string; description?: string; status?: "complete" | "current" | "upcoming" | "blocked"; meta?: string; open?: boolean; content?: string; value?: number; total?: number; checked?: boolean }[];
  columns?: string[];
  rows?: { label: string; values: (string | boolean | number)[] }[];
  tabs?: { label: string; title?: string; content: string }[];
  cards?: { title: string; description?: string; meta?: string; eyebrow?: string }[];
  files?: { name: string; type?: "file" | "folder"; detail?: string; depth?: number }[];
  attribution?: string;
  role?: string;
};

const toneStyles = {
  note: { icon: Info, accent: "text-brand-blue", surface: "border-brand-blue/15 bg-[#f4f6ff]" },
  insight: { icon: Lightbulb, accent: "text-[#af52de]", surface: "border-[#af52de]/15 bg-[#faf5ff]" },
  success: { icon: CircleCheck, accent: "text-[#248a3d]", surface: "border-[#34c759]/18 bg-[#f2fbf3]" },
  warning: { icon: CircleAlert, accent: "text-[#c76a00]", surface: "border-[#ff9f0a]/20 bg-[#fff8ed]" },
};

function InvalidBlock() {
  return <div role="alert" className="rich-block-state my-6 px-4 py-3.5 text-sm leading-6 sm:px-5">This block needs a valid JSON configuration.</div>;
}

function BlockTitle({ title, eyebrow }: { title?: string; eyebrow?: string }) {
  if (!title) return null;
  return <div className="mb-4 px-0.5"><p className="rich-block-eyebrow">{eyebrow}</p><h3 className="rich-block-title mt-1.5 text-balance">{title}</h3></div>;
}

function Callout({ config }: { config: StructuredConfig }) {
  const { title, body, tone = "note" } = config;
  const style = toneStyles[tone];
  const Icon = style.icon;
  return (
    <aside className={`my-7 overflow-hidden rounded-[1.125rem] border px-4 py-4 shadow-[0_10px_28px_-26px_rgba(18,20,22,0.45)] sm:px-5 sm:py-5 ${style.surface}`}>
      <div className="flex gap-3.5"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/75 shadow-[inset_0_0_0_1px_rgba(18,20,22,0.05)]"><Icon className={`size-4 ${style.accent}`} strokeWidth={1.9} aria-hidden="true" /></span>
        <div className="min-w-0 pt-0.5"><p className="text-sm font-semibold tracking-[-0.018em] text-[#1d1d1f]">{title || "Note"}</p>{body && <p className="rich-block-copy mt-1.5">{body}</p>}</div>
      </div>
    </aside>
  );
}

function Metrics({ config }: { config: StructuredConfig }) {
  if (!config.metrics?.length) return <InvalidBlock />;
  return (
    <section className="my-7">
      <BlockTitle title={config.title} eyebrow="Snapshot" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {config.metrics.map((metric, index) => <div key={`metric-${index}`} className="rich-block-card rich-block-card-interactive flex min-h-40 min-w-0 flex-col items-center justify-center px-4 py-6 text-center sm:px-5"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8187]">{metric.label}</p><p className="mt-3 break-words text-[1.9rem] font-semibold leading-none tracking-[-0.05em] text-[#1d1d1f]">{metric.value}</p><div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs"><span className={`font-medium ${metric.change?.startsWith("-") ? "text-[#c93443]" : "text-[#248a3d]"}`}>{metric.change}</span>{metric.detail && <span className="text-[#86868b]">{metric.detail}</span>}</div></div>)}
      </div>
    </section>
  );
}

function Timeline({ config }: { config: StructuredConfig }) {
  if (!config.items?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Timeline" /><ol className="rich-block-frame relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">{config.items.map((item, index) => {
    const state = item.status ?? "upcoming";
    return <li key={`timeline-item-${index}`} className="relative ml-2 border-l border-black/[0.08] pb-7 pl-6 last:border-transparent last:pb-0 sm:pl-7"><span className={`absolute -left-[5px] top-1 size-2.5 rounded-full ring-4 ring-white ${state === "complete" ? "bg-[#34a853]" : state === "current" ? "bg-[#4f63d9]" : "bg-[#c8cbd0]"}`} /><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="text-sm font-semibold tracking-[-0.015em] text-[#1d1d1f]">{item.title}</h3>{item.date && <span className="text-[11px] font-medium text-[#86868b]">{item.date}</span>}</div>{item.description && <p className="rich-block-copy mt-1.5 max-w-2xl">{item.description}</p>}</li>;
  })}</ol></section>;
}

function Steps({ config }: { config: StructuredConfig }) {
  if (!config.items?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Process" /><ol className="space-y-6">{config.items.map((item, index) => <li key={`step-${index}`} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/[0.09] text-xs font-semibold tabular-nums text-brand-blue">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 pt-1"><h3 className="text-sm font-semibold tracking-[-0.018em] text-[#1d1d1f]">{item.title}</h3>{item.description && <p className="rich-block-copy mt-1.5">{item.description}</p>}{item.meta && <p className="mt-2.5 text-[11px] font-medium text-[#86868b]">{item.meta}</p>}</div></li>)}</ol></section>;
}

function Comparison({ config }: { config: StructuredConfig }) {
  const columns = config.columns;
  const rows = config.rows;
  if (!columns?.length || !rows?.length) return <InvalidBlock />;
  return <section className="my-9 w-full min-w-0 max-w-full"><BlockTitle title={config.title} eyebrow="Compare" /><div className="internal-scroll rich-block-frame w-full min-w-0 max-w-full overflow-x-auto"><table className="min-w-full w-max border-collapse text-left"><thead><tr className="border-b border-black/[0.07] bg-[#f7f7f8]/80"><th className="whitespace-nowrap wrap-normal px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7d8187] sm:px-5">Feature</th>{columns.map((column, index) => <th key={`comparison-header-${index}`} className="whitespace-nowrap wrap-normal px-4 py-3.5 text-sm font-semibold tracking-[-0.018em] text-[#1d1d1f] sm:px-5">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`comparison-row-${rowIndex}`} className="border-b border-black/[0.06] transition-colors last:border-0 hover:bg-brand-blue/[0.025]"><th className="whitespace-nowrap wrap-normal px-4 py-3.5 text-sm font-medium text-[#515154] sm:px-5">{row.label}</th>{columns.map((_, columnIndex) => { const value = row.values[columnIndex]; return <td key={`comparison-cell-${rowIndex}-${columnIndex}`} className="max-w-[20rem] whitespace-normal break-normal wrap-normal px-4 py-3.5 text-sm text-[#5f6368] sm:px-5">{value === true ? <span className="flex size-6 items-center justify-center rounded-full bg-[#34a853]/[0.09]"><Check className="size-3.5 text-[#248a3d]" strokeWidth={2.5} aria-label="Included" /></span> : value === false ? <span className="text-[#b0b3b8]">—</span> : value}</td>; })}</tr>)}</tbody></table></div></section>;
}

function Accordion({ config }: { config: StructuredConfig }) {
  const initialOpen = config.items?.findIndex((item) => item.open) ?? -1;
  const [open, setOpen] = useState<number | null>(initialOpen >= 0 ? initialOpen : null);
  const accordionId = useId().replace(/:/g, "");
  if (!config.items?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Details" /><div>{config.items.map((item, index) => { const isOpen = open === index; const panelId = `${accordionId}-panel-${index}`; return <div key={`accordion-item-${index}`} className="border-b border-black/[0.06] last:border-0"><button type="button" onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={panelId} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold tracking-[-0.018em] text-[#1d1d1f] transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"><span>{item.title}</span><span className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-brand-blue/[0.09] text-brand-blue" : "bg-black/[0.035] text-[#86868b]"}`}><ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" /></span></button>{isOpen && <div id={panelId} role="region" aria-label={item.title} className="rich-block-copy pb-5 pr-12">{item.content || item.description}</div>}</div>; })}</div></section>;
}

function Tabs({ config }: { config: StructuredConfig }) {
  const [active, setActive] = useState(0);
  const tabsId = useId().replace(/:/g, "");
  if (!config.tabs?.length) return <InvalidBlock />;
  const selected = config.tabs[Math.min(active, config.tabs.length - 1)];
  return <section className="my-10 w-full min-w-0 max-w-full"><BlockTitle title={config.title} eyebrow="Explore" /><div className="rich-explore-surface"><div className="rich-explore-tabs internal-scroll" role="tablist" aria-label={config.title || "Content tabs"}>{config.tabs.map((tab, index) => <button key={`tab-${index}`} id={`${tabsId}-tab-${index}`} type="button" role="tab" aria-selected={active === index} aria-controls={`${tabsId}-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} className={`rich-explore-tab ${active === index ? "is-active" : ""}`}>{tab.label}</button>)}</div><div id={`${tabsId}-panel-${active}`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${active}`} className="rich-explore-panel"><p className="rich-block-copy rich-explore-copy">{selected.content}</p></div></div></section>;
}

function Cards({ config }: { config: StructuredConfig }) {
  if (!config.cards?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Highlights" /><div className="rich-highlights-grid">{config.cards.map((card, index) => <article key={`card-${index}`} className="rich-highlight-card"><p className="rich-block-eyebrow">{card.eyebrow}</p><h3 className="mt-2 text-[15px] font-semibold tracking-[-0.022em] text-[#1d1d1f]">{card.title}</h3>{card.description && <p className="rich-block-copy mt-2">{card.description}</p>}{card.meta && <p className="mt-auto pt-5 text-[11px] font-medium text-[#86868b]">{card.meta}</p>}</article>)}</div></section>;
}

function FileTree({ config }: { config: StructuredConfig }) {
  if (!config.files?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Files" /><div className="rich-block-frame overflow-hidden bg-[#f8f8f9] py-2.5 font-mono text-[12.5px]">{config.files.map((entry, index) => { const isFolder = entry.type === "folder"; const Icon = isFolder ? Folder : File; return <div key={`file-entry-${index}`} className="group flex min-w-0 items-center gap-2 px-4 py-1.5 text-[#515154] transition-colors hover:bg-white/75" style={{ paddingLeft: `${1 + Math.max(entry.depth || 0, 0) * 1.15}rem` }}><Icon className={`size-3.5 shrink-0 ${isFolder ? "text-brand-blue" : "text-[#92969c]"}`} strokeWidth={1.8} /><span className="truncate">{entry.name}</span>{entry.detail && <span className="ml-auto shrink-0 font-sans text-[11px] text-[#92969c]">{entry.detail}</span>}</div>; })}</div></section>;
}

function Progress({ config }: { config: StructuredConfig }) {
  if (!config.items?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Progress" /><div className="rich-block-frame space-y-5 px-4 py-5 sm:px-5 sm:py-6">{config.items.map((item, index) => { const total = item.total || 100; const value = Math.min(Math.max(item.value || 0, 0), total); const percentage = Math.round((value / total) * 100); return <div key={`progress-item-${index}`}><div className="mb-2.5 flex items-center justify-between gap-4 text-sm"><span className="font-medium tracking-[-0.012em] text-[#1d1d1f]">{item.title}</span><span className="rounded-full bg-black/[0.035] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#7d8187]">{item.meta || `${percentage}%`}</span></div><div role="progressbar" aria-label={item.title} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-[#e9eaec] p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-mid shadow-[0_1px_3px_rgba(79,99,217,0.28)] transition-[width] duration-500" style={{ width: `${percentage}%` }} /></div>{item.description && <p className="rich-block-copy mt-2">{item.description}</p>}</div>; })}</div></section>;
}

function Checklist({ config }: { config: StructuredConfig }) {
  if (!config.items?.length) return <InvalidBlock />;
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Checklist" /><ul>{config.items.map((item, index) => <li key={`checklist-item-${index}`} className="flex gap-3.5 border-b border-black/[0.06] py-4 last:border-0"><span className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${item.checked ? "border-[#34a853] bg-[#34a853] text-white" : "border-[#c8cbd0] bg-white"}`}>{item.checked && <Check className="size-3" strokeWidth={3} />}</span><div className="min-w-0"><p className={`text-sm ${item.checked ? "text-[#8b8f95] line-through decoration-black/20" : "font-medium tracking-[-0.012em] text-[#1d1d1f]"}`}>{item.title}</p>{item.description && <p className="rich-block-copy mt-1">{item.description}</p>}</div></li>)}</ul></section>;
}

function Status({ config }: { config: StructuredConfig }) {
  if (!config.items?.length) return <InvalidBlock />;
  const colors = { complete: "bg-[#32945a]", current: "bg-brand-blue", upcoming: "bg-[#c7c9c5]", blocked: "bg-[#d88b28]" };
  return <section className="my-9"><BlockTitle title={config.title} eyebrow="Status" /><div className="grid gap-3 sm:grid-cols-2">{config.items.map((item, index) => { const state = item.status || "upcoming"; return <article key={`status-item-${index}`} className="rich-block-card rich-block-card-interactive px-4 py-4 sm:px-5"><div className="flex items-center gap-2.5"><span className={`size-2 rounded-full ring-4 ring-black/[0.025] ${colors[state]}`} /><h3 className="text-sm font-semibold tracking-[-0.018em] text-[#1d1d1f]">{item.title}</h3></div>{item.description && <p className="rich-block-copy mt-2">{item.description}</p>}{item.meta && <p className="mt-3 text-[11px] font-medium text-[#86868b]">{item.meta}</p>}</article>; })}</div></section>;
}

function PullQuote({ config }: { config: StructuredConfig }) {
  if (!config.body) return <InvalidBlock />;
  return <figure className="my-9 px-1 py-5 text-center sm:px-4 sm:py-7"><Quote className="mx-auto size-5 text-brand-blue" strokeWidth={1.8} aria-hidden="true" /><blockquote className="mx-auto mt-4 max-w-2xl text-[1.3rem] font-medium leading-[1.45] tracking-[-0.035em] text-[#1d1d1f] text-balance sm:text-[1.6rem]">“{config.body}”</blockquote>{config.attribution && <figcaption className="mt-5 text-xs font-medium text-[#6e6e73]">{config.attribution}{config.role && <span className="font-normal text-[#92969c]"> · {config.role}</span>}</figcaption>}</figure>;
}

export default function RichStructuredBlock({ type, configStr }: { type: BlockType; configStr: string }) {
  const config = useMemo<StructuredConfig | null>(() => { try { return JSON5.parse(configStr.replace(/^`+|`+$/g, "").trim()); } catch { return null; } }, [configStr]);
  if (!config) return <InvalidBlock />;
  if (type === "callout") return <Callout config={config} />;
  if (type === "metrics") return <Metrics config={config} />;
  if (type === "timeline") return <Timeline config={config} />;
  if (type === "steps") return <Steps config={config} />;
  if (type === "comparison") return <Comparison config={config} />;
  if (type === "accordion") return <Accordion config={config} />;
  if (type === "tabs") return <Tabs config={config} />;
  if (type === "cards") return <Cards config={config} />;
  if (type === "filetree") return <FileTree config={config} />;
  if (type === "progress") return <Progress config={config} />;
  if (type === "checklist") return <Checklist config={config} />;
  if (type === "status") return <Status config={config} />;
  return <PullQuote config={config} />;
}
