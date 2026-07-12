import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { validateMarkdownFlowBlock } from "../../src/ai/validation";

describe("AI block security corpus", () => {
  it("rejects malformed JSON, non-object payloads, and prototype-shaped keys", () => {
    for (const payload of ["{", "[]", "null", "true", "{\"__proto__\":{\"polluted\":true},\"title\":\"x\"}", "{\"constructor\":{\"prototype\":{}},\"title\":\"x\"}"]) {
      expect(validateMarkdownFlowBlock("callout", payload)).toMatchObject({ valid: false });
    }
  });

  it("rejects script-capable URLs and unapproved renderer properties", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "//example.com", "ftp://example.com"]) {
      expect(validateMarkdownFlowBlock("embed", JSON.stringify({ url }), { allowExternalUrls: true })).toMatchObject({ valid: false });
    }
    expect(validateMarkdownFlowBlock("image", JSON.stringify({ images: [{ src: "https://example.com/a.png", alt: "a", onerror: "alert(1)" }] }), { allowExternalUrls: true })).toMatchObject({ valid: false });
  });

  it("never accepts arbitrary malformed callout JSON", () => {
    fc.assert(fc.property(fc.string(), (payload) => {
      const outcome = validateMarkdownFlowBlock("callout", payload);
      if (outcome.valid) {
        const value = JSON.parse(payload) as Record<string, unknown>;
        expect(typeof value).toBe("object");
        expect(value).not.toBeNull();
        expect(Array.isArray(value)).toBe(false);
        expect(Object.keys(value).every((key) => ["title", "tone", "body", "metrics", "items", "columns", "rows", "tabs", "cards", "files", "attribution", "role"].includes(key))).toBe(true);
        expect(typeof value.title === "string" || typeof value.body === "string").toBe(true);
      }
    }), { numRuns: 500 });
  });
});
