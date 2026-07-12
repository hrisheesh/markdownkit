"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from "react";
import JSON5 from "json5";
import { ExternalLink, FileText, MapPin, Play } from "lucide-react";

type MediaType = "embed" | "image" | "map";

type MediaConfig = {
  title?: string;
  url?: string;
  kind?: "link" | "video" | "document";
  description?: string;
  publisher?: string;
  layout?: "gallery" | "before-after";
  images?: { src: string; alt?: string; caption?: string; label?: string }[];
  locations?: { name: string; detail?: string; x: number; y: number }[];
};

function InvalidBlock() {
  return <div className="my-8 border-y border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-sm text-[#6e6e73]">This block needs a valid JSON configuration.</div>;
}

function safeUrl(url?: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function Embed({ config }: { config: MediaConfig }) {
  const url = safeUrl(config.url);
  if (!url) return <InvalidBlock />;
  const host = new URL(url).hostname.replace(/^www\./, "");
  const Icon = config.kind === "video" ? Play : config.kind === "document" ? FileText : ExternalLink;
  return <aside className="my-10 rounded-2xl border border-black/[0.08] bg-[#fbfbfd] p-5 sm:p-6"><div className="flex items-start gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#007aff]"><Icon className="size-4" strokeWidth={1.8} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-[#86868b]">{config.publisher || host}</p><h3 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-[#1d1d1f]">{config.title || host}</h3>{config.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#515154]">{config.description}</p>}<a href={url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#007aff] hover:text-[#005ecb]">Open preview <ExternalLink className="size-3.5" strokeWidth={2} /></a></div></div></aside>;
}

function ImageBlock({ config }: { config: MediaConfig }) {
  const images = config.images?.filter((image) => safeUrl(image.src));
  if (!images?.length) return <InvalidBlock />;
  const beforeAfter = config.layout === "before-after" && images.length >= 2;
  return <figure className="my-10"><div className={`grid gap-3 ${beforeAfter || images.length > 1 ? "sm:grid-cols-2" : ""}`}>{images.map((image, index) => <div key={`image-${index}`} className="overflow-hidden rounded-2xl border border-black/[0.08] bg-[#fbfbfd]"><div className="relative"><img src={safeUrl(image.src) || ""} alt={image.alt || ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />{image.label && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] backdrop-blur">{image.label}</span>}</div>{image.caption && <p className="px-4 py-3 text-sm leading-6 text-[#515154]">{image.caption}</p>}</div>)}</div>{config.title && <figcaption className="mt-3 text-sm text-[#6e6e73]">{config.title}</figcaption>}</figure>;
}

function Map({ config }: { config: MediaConfig }) {
  if (!config.locations?.length) return <InvalidBlock />;
  return <section className="my-10"><p className="text-[11px] font-medium text-[#86868b]">Locations</p><h3 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-[#1d1d1f]">{config.title || "Geographic summary"}</h3><div className="relative mt-4 aspect-[16/8] overflow-hidden rounded-2xl border border-black/[0.08] bg-[#f0f7ff]" aria-label={config.title || "Location map"}>{[18, 42, 67, 84].map((top) => <span key={top} className="absolute h-px w-full bg-[#007aff]/[0.08]" style={{ top: `${top}%` }} />)}{[22, 48, 74].map((left) => <span key={left} className="absolute h-full w-px bg-[#007aff]/[0.08]" style={{ left: `${left}%` }} />)}{config.locations.map((location, index) => <div key={`location-pin-${index}`} className="group absolute" style={{ left: `${Math.min(Math.max(location.x, 0), 100)}%`, top: `${Math.min(Math.max(location.y, 0), 100)}%` }}><MapPin className="size-5 -translate-x-1/2 -translate-y-full text-[#007aff] drop-shadow-sm" fill="#eef5ff" strokeWidth={1.8} /><div className="absolute left-3 top-0 hidden w-40 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs shadow-sm group-hover:block"><p className="font-semibold text-[#1d1d1f]">{location.name}</p>{location.detail && <p className="mt-1 text-[#6e6e73]">{location.detail}</p>}</div></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{config.locations.map((location, index) => <div key={`location-detail-${index}`} className="flex gap-2 text-sm text-[#515154]"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#007aff]" /><span><strong className="font-medium text-[#1d1d1f]">{location.name}</strong>{location.detail && ` · ${location.detail}`}</span></div>)}</div></section>;
}

export default function RichMediaBlock({ type, configStr }: { type: MediaType; configStr: string }) {
  const config = useMemo<MediaConfig | null>(() => { try { return JSON5.parse(configStr.trim()); } catch { return null; } }, [configStr]);
  if (!config) return <InvalidBlock />;
  if (type === "embed") return <Embed config={config} />;
  if (type === "image") return <ImageBlock config={config} />;
  return <Map config={config} />;
}
