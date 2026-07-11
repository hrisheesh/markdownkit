import { MARKDOWN_FLOW_PROTOCOL, type MarkdownFlowCitation, type MarkdownFlowDataset, type MarkdownFlowResponse, type MarkdownFlowStreamEvent } from "./protocol";

export type MarkdownFlowStreamStatus = "streaming" | "complete" | "error" | "cancelled";

export type MarkdownFlowStreamSegment =
  | { id: string; type: "markdown" | "block"; content: string }
  | { id: string; type: "pending"; content: string; language?: string };

export interface MarkdownFlowStreamSnapshot {
  content: string;
  segments: readonly MarkdownFlowStreamSegment[];
  status: MarkdownFlowStreamStatus;
  error?: string;
  citations: readonly MarkdownFlowCitation[];
  datasets: readonly MarkdownFlowDataset[];
}

const fenceStart = /^```([\w-]+)\s*$/;
const fenceEnd = /^```\s*$/;

/**
 * Incrementally separates ordinary Markdown from fenced rich blocks. A rich
 * block remains pending until its closing fence arrives, so an incomplete JSON
 * configuration is never passed to an interactive renderer.
 */
export class MarkdownFlowStreamParser {
  private readonly committed: MarkdownFlowStreamSegment[] = [];
  private lineBuffer = "";
  private textBuffer = "";
  private fenceBuffer = "";
  private fenceLanguage: string | undefined;
  private nextId = 0;

  append(delta: string): void {
    this.lineBuffer += delta;

    let newlineIndex = this.lineBuffer.indexOf("\n");
    while (newlineIndex !== -1) {
      this.consumeLine(this.lineBuffer.slice(0, newlineIndex + 1));
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
      newlineIndex = this.lineBuffer.indexOf("\n");
    }
  }

  reset(content = ""): void {
    this.committed.length = 0;
    this.lineBuffer = "";
    this.textBuffer = "";
    this.fenceBuffer = "";
    this.fenceLanguage = undefined;
    this.nextId = 0;
    this.append(content);
  }

  /** Flushes a final unterminated line when the provider marks the stream complete. */
  finish(): void {
    if (!this.lineBuffer) return;
    const line = this.lineBuffer;
    this.lineBuffer = "";
    this.consumeLine(line);
    if (!this.fenceLanguage) this.flushMarkdown();
  }

  getSegments(): readonly MarkdownFlowStreamSegment[] {
    const segments = [...this.committed];

    if (this.fenceLanguage) {
      segments.push({ id: `pending-${this.nextId}`, type: "pending", content: this.fenceBuffer + this.lineBuffer, language: this.fenceLanguage });
    } else if (this.textBuffer || this.lineBuffer) {
      segments.push({ id: `markdown-${this.nextId}`, type: "markdown", content: this.textBuffer + this.lineBuffer });
    }

    return segments;
  }

  private consumeLine(line: string): void {
    const lineWithoutNewline = line.endsWith("\n") ? line.slice(0, -1) : line;

    if (this.fenceLanguage) {
      this.fenceBuffer += line;
      if (fenceEnd.test(lineWithoutNewline)) {
        this.commit("block", this.fenceBuffer);
        this.fenceBuffer = "";
        this.fenceLanguage = undefined;
      }
      return;
    }

    const match = fenceStart.exec(lineWithoutNewline);
    if (match) {
      this.flushMarkdown();
      this.fenceLanguage = match[1];
      this.fenceBuffer = line;
      return;
    }

    this.textBuffer += line;
    // A blank line is a stable Markdown boundary. Earlier segments can stay
    // mounted while only the trailing segment updates during a long stream.
    if (lineWithoutNewline.length === 0) this.flushMarkdown();
  }

  private flushMarkdown(): void {
    if (!this.textBuffer) return;
    this.commit("markdown", this.textBuffer);
    this.textBuffer = "";
  }

  private commit(type: "markdown" | "block", content: string): void {
    this.committed.push({ id: `${type}-${this.nextId++}`, type, content });
  }
}

export function createMarkdownFlowStream(initialContent = ""): MarkdownFlowStreamParser {
  const parser = new MarkdownFlowStreamParser();
  parser.append(initialContent);
  return parser;
}

/** Applies a provider-neutral event to a stream snapshot without provider SDK dependencies. */
export function applyMarkdownFlowStreamEvent(
  parser: MarkdownFlowStreamParser,
  snapshot: Omit<MarkdownFlowStreamSnapshot, "content" | "segments">,
  event: MarkdownFlowStreamEvent,
): MarkdownFlowStreamSnapshot {
  let status = snapshot.status;
  let error = snapshot.error;
  let citations = snapshot.citations;
  let datasets = snapshot.datasets;

  if (event.type === "text") parser.append(event.delta);
  if (event.type === "citation") citations = [...citations, event.citation];
  if (event.type === "dataset") datasets = [...datasets, event.dataset];
  if (event.type === "error") {
    status = "error";
    error = event.message;
  }
  if (event.type === "complete") {
    parser.finish();
    status = "complete";
  }

  return {
    content: parser.getSegments().map((segment) => segment.content).join(""),
    segments: parser.getSegments(),
    status,
    error,
    citations,
    datasets,
  };
}

/** Applies a completed provider-neutral response without treating its metadata as model text. */
export function applyMarkdownFlowResponse(
  parser: MarkdownFlowStreamParser,
  response: MarkdownFlowResponse,
): MarkdownFlowStreamSnapshot {
  if (response.protocol !== MARKDOWN_FLOW_PROTOCOL) {
    throw new Error(`Unsupported Markdown Flow protocol: ${response.protocol}`);
  }
  parser.reset(response.content);
  parser.finish();
  const segments = parser.getSegments();
  return {
    content: segments.map((segment) => segment.content).join(""),
    segments,
    status: "complete",
    citations: response.citations ?? [],
    datasets: response.datasets ?? [],
  };
}
