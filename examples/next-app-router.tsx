// app/article/page.tsx
import { StaticMarkdown } from "@hrisheesh/markdown-render/server";
import "@hrisheesh/markdown-render/core.css";

export default function ArticlePage() {
  return <StaticMarkdown content="# A server-rendered article\n\nNo client boundary is required." />;
}
