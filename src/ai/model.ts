import { isMarkdownFlowBlockType, type MarkdownFlowBlockType } from "./protocol";

export type MarkdownFlowStructuredLanguage = MarkdownFlowBlockType | "artifact";
export type MarkdownFlowBlockLifecycle = "pending" | "ready" | "invalid" | "denied" | "unavailable";
export type MarkdownFlowBlockErrorCode = "incomplete" | "invalid" | "denied" | "unavailable" | "limit";

export interface MarkdownFlowBlockError {
  code: MarkdownFlowBlockErrorCode;
  message: string;
  language: MarkdownFlowStructuredLanguage;
}

export type MarkdownFlowNode =
  | { id: string; type: "markdown"; content: string }
  | { id: string; type: "block"; content: string; language: MarkdownFlowStructuredLanguage; lifecycle: "ready" }
  | { id: string; type: "pending"; content: string; language: MarkdownFlowStructuredLanguage; lifecycle: "pending"; error?: MarkdownFlowBlockError };

const fenceStart = /^```([\w-]+)\s*$/;
const fenceEnd = /^```\s*$/;

export function isMarkdownFlowStructuredLanguage(value: string | undefined): value is MarkdownFlowStructuredLanguage {
  return value === "artifact" || Boolean(value && isMarkdownFlowBlockType(value));
}

export function joinMarkdownFlowNodes(nodes: readonly MarkdownFlowNode[]): string {
  return nodes.map((node) => node.content).join("");
}

/** A pure, framework-independent incremental model for Markdown Flow content. */
export class MarkdownFlowNodeParser {
  private readonly committed: MarkdownFlowNode[] = [];
  private lineBuffer = "";
  private textBuffer = "";
  private fenceBuffer = "";
  private fenceLanguage: MarkdownFlowStructuredLanguage | undefined;
  private ordinaryFenceOpen = false;
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
    this.ordinaryFenceOpen = false;
    this.nextId = 0;
    this.append(content);
  }

  finish(): void {
    if (this.lineBuffer) {
      const line = this.lineBuffer;
      this.lineBuffer = "";
      this.consumeLine(line);
    }
    if (!this.fenceLanguage) this.flushMarkdown();
  }

  getNodes(): readonly MarkdownFlowNode[] {
    const nodes = [...this.committed];
    if (this.fenceLanguage) {
      nodes.push({ id: `pending-${this.nextId}`, type: "pending", content: this.fenceBuffer + this.lineBuffer, language: this.fenceLanguage, lifecycle: "pending" });
    } else if (this.textBuffer || this.lineBuffer) {
      nodes.push({ id: `markdown-${this.nextId}`, type: "markdown", content: this.textBuffer + this.lineBuffer });
    }
    return nodes;
  }

  private consumeLine(line: string): void {
    const lineWithoutNewline = line.endsWith("\n") ? line.slice(0, -1) : line;
    if (this.fenceLanguage) {
      this.fenceBuffer += line;
      if (fenceEnd.test(lineWithoutNewline)) {
        this.committed.push({ id: `block-${this.nextId++}`, type: "block", content: this.fenceBuffer, language: this.fenceLanguage, lifecycle: "ready" });
        this.fenceBuffer = "";
        this.fenceLanguage = undefined;
      }
      return;
    }
    if (this.ordinaryFenceOpen) {
      this.textBuffer += line;
      if (fenceEnd.test(lineWithoutNewline)) this.ordinaryFenceOpen = false;
      return;
    }
    const match = fenceStart.exec(lineWithoutNewline);
    if (match) {
      if (isMarkdownFlowStructuredLanguage(match[1])) {
        this.flushMarkdown();
        this.fenceLanguage = match[1];
        this.fenceBuffer = line;
      } else {
        this.ordinaryFenceOpen = true;
        this.textBuffer += line;
      }
      return;
    }
    this.textBuffer += line;
    if (!lineWithoutNewline.length) this.flushMarkdown();
  }

  private flushMarkdown(): void {
    if (!this.textBuffer) return;
    this.committed.push({ id: `markdown-${this.nextId++}`, type: "markdown", content: this.textBuffer });
    this.textBuffer = "";
  }
}

/** Normalizes a complete or partial Markdown response into stable render nodes. */
export function normalizeMarkdownFlowContent(content: string, options: { complete?: boolean } = {}): readonly MarkdownFlowNode[] {
  const parser = new MarkdownFlowNodeParser();
  parser.append(content);
  if (options.complete ?? true) parser.finish();
  return parser.getNodes();
}
