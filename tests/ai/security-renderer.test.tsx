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
});
