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
  return <div role="alert" className="rich-block-state my-6 px-4 py-3.5 text-sm leading-6 sm:px-5">This block needs a valid JSON configuration.</div>;
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
  return <aside className="rich-block-frame rich-media-embed"><div className="rich-media-embed-layout"><span className="rich-media-embed-icon" aria-hidden="true"><Icon className="size-[18px]" strokeWidth={1.9} /></span><div className="min-w-0"><p className="rich-block-eyebrow truncate">{config.publisher || host}</p><h3 className="rich-block-title mt-1.5 text-balance">{config.title || host}</h3>{config.description && <p className="rich-block-copy mt-1.5 max-w-2xl">{config.description}</p>}</div><a href={url} target="_blank" rel="noreferrer" className="rich-media-embed-action">Open preview <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" /></a></div></aside>;
}

function ImageBlock({ config }: { config: MediaConfig }) {
  const images = config.images?.filter((image) => safeUrl(image.src));
  if (!images?.length) return <InvalidBlock />;
  const beforeAfter = config.layout === "before-after" && images.length >= 2;
  return <figure className="my-8 w-full min-w-0 max-w-full"><div className={`grid min-w-0 gap-3 ${beforeAfter || images.length > 1 ? "sm:grid-cols-2" : ""}`}>{images.map((image, index) => <div key={`image-${index}`} className="rich-block-frame group min-w-0 overflow-hidden bg-white"><div className="relative m-1.5 overflow-hidden rounded-[1rem] bg-[#f3f3f4]"><img src={safeUrl(image.src) || ""} alt={image.alt || ""} className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.018]" loading="lazy" />{image.label && <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#35383b] shadow-[0_4px_12px_rgba(18,20,22,0.08)] backdrop-blur-md">{image.label}</span>}</div>{image.caption && <p className="rich-block-copy px-4 pb-4 pt-2">{image.caption}</p>}</div>)}</div>{config.title && <figcaption className="mt-3 px-1 text-xs leading-5 text-[#7d8187]">{config.title}</figcaption>}</figure>;
}

function Map({ config }: { config: MediaConfig }) {
  if (!config.locations?.length) return <InvalidBlock />;
  return <section className="my-8"><p className="rich-block-eyebrow">Locations</p><h3 className="rich-block-title mt-1.5">{config.title || "Geographic summary"}</h3><div className="rich-block-frame relative mt-4 aspect-[16/8] min-h-52 overflow-hidden bg-[radial-gradient(circle_at_28%_24%,rgba(79,99,217,0.11),transparent_34%),linear-gradient(145deg,#f6f8ff,#eef1f7)]" role="img" aria-label={`${config.title || "Location map"}, showing ${config.locations.length} locations`}>{[18, 42, 67, 84].map((top) => <span key={top} className="absolute h-px w-full bg-brand-blue/[0.07]" style={{ top: `${top}%` }} />)}{[22, 48, 74].map((left) => <span key={left} className="absolute h-full w-px bg-brand-blue/[0.07]" style={{ left: `${left}%` }} />)}{config.locations.map((location, index) => <MapPin key={`location-pin-${index}`} aria-hidden="true" className="absolute size-5 -translate-x-1/2 -translate-y-full text-brand-blue drop-shadow-sm" style={{ left: `${Math.min(Math.max(location.x, 0), 100)}%`, top: `${Math.min(Math.max(location.y, 0), 100)}%` }} fill="#f3f5ff" strokeWidth={1.9} />)}</div><ul className="mt-3 grid gap-2 sm:grid-cols-2">{config.locations.map((location, index) => <li key={`location-detail-${index}`} className="rich-block-card flex gap-2.5 px-3 py-2.5 text-sm leading-6 text-[#5f6368]"><MapPin className="mt-1 size-3.5 shrink-0 text-brand-blue" aria-hidden="true" /><span><strong className="font-medium text-[#1d1d1f]">{location.name}</strong>{location.detail && ` · ${location.detail}`}</span></li>)}</ul></section>;
}

export default function RichMediaBlock({ type, configStr }: { type: MediaType; configStr: string }) {
  const config = useMemo<MediaConfig | null>(() => { try { return JSON5.parse(configStr.trim()); } catch { return null; } }, [configStr]);
  if (!config) return <InvalidBlock />;
  if (type === "embed") return <Embed config={config} />;
  if (type === "image") return <ImageBlock config={config} />;
  return <Map config={config} />;
}
