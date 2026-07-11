// app/article/page.tsx
import { StaticMarkdown } from "markdown-flow/server";
import "markdown-flow/core.css";

export default function ArticlePage() {
  return <StaticMarkdown content="# A server-rendered article\n\nNo client boundary is required." />;
}
