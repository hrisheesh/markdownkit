// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RichMarkdown from "../../src/components/markdown/RichMarkdown";

describe("renderer trust boundary", () => {
  it("does not turn hostile HTML or URLs in model text into executable markup", () => {
    const { container } = render(
      <RichMarkdown content={'<script>window.pwned = true</script>\n\n<a href="javascript:alert(1)">bad link</a>'} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("window.pwned");
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("normalizes known rich blocks without requiring a render policy", () => {
    const { container } = render(<RichMarkdown content={"```cards\n[{ heading: 'Launch', text: 'Ready', }]\n```"} />);
    expect(container.textContent).toContain("Launch");
    expect(container.textContent).toContain("Ready");
    expect(container.textContent).not.toContain("valid JSON configuration");
  });

  it("renders empty and malformed blocks as readable neutral fallbacks", () => {
    const empty = render(<RichMarkdown content={'```tabs\n{"title":"Details","tabs":[]}\n```'} />);
    expect(empty.container.textContent).toContain("No items were provided");

    const malformed = render(<RichMarkdown content={'```cards\n{"cards":[{"title":"Launch","description":"Ready"}]\n```'} />);
    expect(malformed.container.textContent).toContain("Rendered as plain content");
    expect(malformed.container.textContent).toContain("Launch");
  });
});
