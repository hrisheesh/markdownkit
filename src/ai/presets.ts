import type { MarkdownFlowBlockType, MarkdownFlowRenderPolicy } from "./protocol";

export const AI_RESPONSE_PRESETS = ["minimal", "chat", "rag", "technical", "analytics"] as const;

export type AIResponsePreset = (typeof AI_RESPONSE_PRESETS)[number];

const chatBlocks: readonly MarkdownFlowBlockType[] = ["callout", "quote", "steps", "checklist", "status"];

/** Deliberately small capability sets for common AI answer surfaces. */
export const AI_RESPONSE_PRESET_POLICIES: Readonly<Record<AIResponsePreset, Readonly<MarkdownFlowRenderPolicy>>> = {
  minimal: { allowedBlocks: [] },
  chat: { allowedBlocks: chatBlocks },
  rag: { allowedBlocks: chatBlocks },
  technical: { allowedBlocks: [...chatBlocks, "comparison", "tabs", "filetree", "mermaid"] },
  analytics: { allowedBlocks: [...chatBlocks, "metrics", "comparison", "progress", "chart"] },
};

export function getAIResponsePresetPolicy(preset: AIResponsePreset = "chat"): MarkdownFlowRenderPolicy {
  return AI_RESPONSE_PRESET_POLICIES[preset];
}
