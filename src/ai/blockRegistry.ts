import type { MarkdownFlowBlockType } from "./protocol";

/** The model-facing contract for one built-in Markdown Flow block. */
export interface MarkdownFlowBlockDefinition {
  type: MarkdownFlowBlockType;
  /** A short description of the visual result. */
  description: string;
  /** Guidance for choosing the block instead of ordinary Markdown. */
  usage: string;
  /** The smallest configuration accepted by the built-in validator. */
  minimalExample: string;
  /** Generated compact contract suitable for a model instruction. */
  instruction: string;
}

const definition = (
  type: MarkdownFlowBlockType,
  description: string,
  usage: string,
  minimalExample: string,
): MarkdownFlowBlockDefinition => ({
  type,
  description,
  usage,
  minimalExample,
  instruction: `${type}: ${description} ${usage} Minimal valid body: ${minimalExample}`,
});

/**
 * Canonical built-in block metadata. Keep this registry aligned with the
 * validator: prompt contracts and product documentation should never need to
 * duplicate individual block shapes.
 */
export const MARKDOWN_FLOW_BLOCK_REGISTRY: Readonly<Record<MarkdownFlowBlockType, MarkdownFlowBlockDefinition>> = {
  callout: definition("callout", "A highlighted note with an optional title and tone.", "Use for a concise warning, decision, or important takeaway.", '{"title":"Important"}'),
  metrics: definition("metrics", "A compact group of labeled values.", "Use when a few headline numbers are more useful than a table.", '{"metrics":[{"label":"Revenue","value":1200}]}'),
  timeline: definition("timeline", "A chronological list of milestones.", "Use for dates, releases, or a sequence over time.", '{"items":[{"title":"Launch"}]}'),
  steps: definition("steps", "An ordered sequence of actionable steps.", "Use for procedures or recommended next actions.", '{"items":[{"title":"Install dependencies"}]}'),
  comparison: definition("comparison", "A labeled comparison table.", "Use to compare a small number of options on shared criteria.", '{"columns":["Option"],"rows":[{"label":"Cost","values":["Low"]}]}'),
  accordion: definition("accordion", "A set of expandable detail sections.", "Use for optional supporting detail that would otherwise make the answer long.", '{"items":[{"title":"Details","content":"Supporting information"}]}'),
  tabs: definition("tabs", "A set of labeled content panels.", "Use for mutually exclusive views such as platforms or approaches.", '{"tabs":[{"label":"Overview","content":"Summary"}]}'),
  cards: definition("cards", "A collection of concise summary cards.", "Use to present several peer items, recommendations, or resources.", '{"cards":[{"title":"Option A"}]}'),
  filetree: definition("filetree", "A hierarchical file and folder list.", "Use to explain a project layout or changed files.", '{"files":[{"name":"src","type":"folder"}]}'),
  progress: definition("progress", "A list of progress indicators.", "Use to show measurable completion toward a total.", '{"items":[{"title":"Migration","value":3,"total":5}]}'),
  checklist: definition("checklist", "A list of checked and unchecked tasks.", "Use for a small actionable checklist.", '{"items":[{"title":"Review","checked":false}]}'),
  status: definition("status", "A list of items with delivery status.", "Use for project, incident, or rollout state.", '{"items":[{"title":"Deploy","status":"current"}]}'),
  quote: definition("quote", "An attributed quotation.", "Use only for a short quote that adds context or evidence.", '{"body":"Keep it simple."}'),
  chart: definition("chart", "A validated data visualization.", "Use only when a trend or comparison is clearer visually; prefer an approved dataset for substantial data.", '{"type":"bar","data":[{"name":"Jan","value":1}],"x":"name","y":"value"}'),
  mermaid: definition("mermaid", "A Mermaid diagram.", "Use for a compact relationship, flow, or architecture diagram; its body is Mermaid syntax, not JSON.", "graph TD\n  A-->B"),
  embed: definition("embed", "A trusted external link, video, or document preview.", "Use only for an approved external URL when embeds are enabled.", '{"url":"https://example.com"}'),
  image: definition("image", "A trusted external image or gallery.", "Use only for approved external images when image URLs are enabled.", '{"images":[{"src":"https://example.com/image.png","alt":"Example"}]}'),
  map: definition("map", "A simple collection of labeled locations.", "Use to compare a small set of locations or coordinates.", '{"locations":[{"name":"Office","x":0,"y":0}]}'),
};

export const MARKDOWN_FLOW_BLOCK_TYPES = Object.freeze(Object.keys(MARKDOWN_FLOW_BLOCK_REGISTRY) as MarkdownFlowBlockType[]);

export function getMarkdownFlowBlockDefinition(type: MarkdownFlowBlockType): MarkdownFlowBlockDefinition {
  return MARKDOWN_FLOW_BLOCK_REGISTRY[type];
}

/** Creates compact, validator-aligned prompt contracts for enabled blocks. */
export function createMarkdownFlowBlockInstructions(blockTypes: readonly MarkdownFlowBlockType[]): string[] {
  return blockTypes.map((type) => {
    const block = getMarkdownFlowBlockDefinition(type);
    return `- ${block.instruction}`;
  });
}

/** Generated default instruction content for every built-in block. */
export const MARKDOWN_FLOW_BLOCK_INSTRUCTIONS = createMarkdownFlowBlockInstructions(MARKDOWN_FLOW_BLOCK_TYPES).join("\n");
