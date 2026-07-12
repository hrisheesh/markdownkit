import { MARKDOWN_FLOW_PROTOCOL, type MarkdownFlowCitation, type MarkdownFlowDataset, type MarkdownFlowResponse, type MarkdownFlowStreamEvent } from "./protocol";
import { joinMarkdownFlowNodes, MarkdownFlowNodeParser, type MarkdownFlowNode } from "./model";

export type MarkdownFlowStreamStatus = "streaming" | "complete" | "error" | "cancelled";

export type MarkdownFlowStreamSegment = MarkdownFlowNode;

export interface MarkdownFlowStreamSnapshot {
  content: string;
  segments: readonly MarkdownFlowStreamSegment[];
  status: MarkdownFlowStreamStatus;
  error?: string;
  citations: readonly MarkdownFlowCitation[];
  datasets: readonly MarkdownFlowDataset[];
}

/** @deprecated Use MarkdownFlowNodeParser when only the normalized model is needed. */
export class MarkdownFlowStreamParser extends MarkdownFlowNodeParser {
  getSegments(): readonly MarkdownFlowStreamSegment[] {
    return this.getNodes();
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
    content: joinMarkdownFlowNodes(parser.getSegments()),
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
    content: joinMarkdownFlowNodes(segments),
    segments,
    status: "complete",
    citations: response.citations ?? [],
    datasets: response.datasets ?? [],
  };
}
