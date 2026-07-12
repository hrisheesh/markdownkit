"use client";

import { AIResponse, useAIResponse } from "markdown-flow/ai";
import "markdown-flow/styles.css";

const sources = [{
  id: "release-notes",
  chunk_id: "release-notes-1",
  document_id: "docs",
  filename: "release-notes.md",
  text_preview: "Version 0.2.0 introduces the AIResponse API.",
}];

function ReleaseCard({ input }: { input: { version: string } }) {
  return <aside>Release {input.version}</aside>;
}

export function AIResponseExample() {
  const response = useAIResponse("Release notes are ready [cite:release-notes].\n\n```artifact\n{\"name\":\"release\",\"version\":\"1\",\"input\":{\"version\":\"0.2.0\"}}\n```");

  return (
    <AIResponse
      stream={response}
      sources={sources}
      preset="technical"
      components={{ release: ReleaseCard }}
      scrollBehavior="if-at-bottom"
    />
  );
}
