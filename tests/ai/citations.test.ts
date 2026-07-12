import { describe, expect, it } from "vitest";

import { extractMarkdownFlowCitationIds, tokenizeMarkdownFlowCitations } from "../../src/ai/citations";

describe("Markdown Flow citations", () => {
  it("extracts and tokenizes only well-formed citation tokens", () => {
    const text = "One [cite:source_1] two [cite:A-2] and [cite: bad].";
    expect(extractMarkdownFlowCitationIds(text)).toEqual(["source_1", "A-2"]);
    expect(tokenizeMarkdownFlowCitations(text)).toEqual([
      { type: "text", value: "One " },
      { type: "citation", id: "source_1", value: "[cite:source_1]" },
      { type: "text", value: " two " },
      { type: "citation", id: "A-2", value: "[cite:A-2]" },
      { type: "text", value: " and [cite: bad]." },
    ]);
  });
});
