/** Provider-shaped replay data used to protect parser behavior at hostile boundaries. */
export const aiStreamReplays = [
  {
    name: "openai-content-deltas",
    chunks: ["A", "nswer\n\n```cal", "lout\n{\"title\":\"Ready\",\"body\":\"Safe\"}\n`", "``\nDone"],
    expected: "Answer\n\n```callout\n{\"title\":\"Ready\",\"body\":\"Safe\"}\n```\nDone",
  },
  {
    name: "anthropic-fence-boundaries",
    chunks: ["```chart", "\n{\"type\":\"line\",\"data\":[]}\n", "```"],
    expected: "```chart\n{\"type\":\"line\",\"data\":[]}\n```",
  },
  {
    name: "unterminated-provider-response",
    chunks: ["Before\n```callout\n{\"title\":\"Partial\"}"],
    expected: "Before\n```callout\n{\"title\":\"Partial\"}",
    incomplete: true,
  },
];
