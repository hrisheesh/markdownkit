// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import RichStructuredBlock from "../../src/components/markdown/RichStructuredBlock";

describe("structured block accessibility", () => {
  it("renders an accessible, keyboard-operable accordion", async () => {
    const { container } = render(
      <RichStructuredBlock
        type="accordion"
        configStr={JSON.stringify({ title: "Answers", items: [{ title: "What is Markdown Flow?", content: "A secure AI answer renderer." }] })}
      />,
    );
    const button = screen.getByRole("button", { name: "What is Markdown Flow?" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "What is Markdown Flow?" })).toHaveTextContent("A secure AI answer renderer.");

    // jsdom has no canvas implementation, so axe cannot evaluate color contrast here.
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
