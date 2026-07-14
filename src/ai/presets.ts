import { MARKDOWN_FLOW_LLM_BLOCK_TYPES, type MarkdownFlowBlockType, type MarkdownFlowRenderPolicy } from "./protocol";

export const AI_RESPONSE_PRESETS = ["minimal", "chat", "rag", "technical", "analytics", "showcase"] as const;

export type AIResponsePreset = (typeof AI_RESPONSE_PRESETS)[number];

// The default surface is intentionally open: users should not have to learn a
// hidden allowlist before a supported Markdown Flow block can render.
const chatBlocks: readonly MarkdownFlowBlockType[] = MARKDOWN_FLOW_LLM_BLOCK_TYPES;

/** Ready-to-use policies; callers can supply a stricter policy when needed. */
export const AI_RESPONSE_PRESET_POLICIES: Readonly<Record<AIResponsePreset, Readonly<MarkdownFlowRenderPolicy>>> = {
  minimal: { allowedBlocks: [] },
  chat: { allowedBlocks: chatBlocks, allowExternalUrls: true },
  rag: { allowedBlocks: chatBlocks, allowExternalUrls: true },
  technical: { allowedBlocks: chatBlocks, allowExternalUrls: true },
  analytics: { allowedBlocks: chatBlocks, allowExternalUrls: true },
  showcase: { allowedBlocks: ["callout", "metrics", "timeline", "steps", "comparison", "accordion", "tabs", "cards", "filetree", "progress", "checklist", "status", "quote", "chart", "mermaid", "embed", "image", "map"], allowExternalUrls: true },
};

export function getAIResponsePresetPolicy(preset: AIResponsePreset = "chat"): MarkdownFlowRenderPolicy {
  return AI_RESPONSE_PRESET_POLICIES[preset];
}
