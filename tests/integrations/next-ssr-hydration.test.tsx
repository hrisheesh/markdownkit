// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { AIResponse } from "../../src/ai/AIResponse";

const roots: ReturnType<typeof hydrateRoot>[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) root.unmount();
  document.body.replaceChildren();
});

describe("Next.js-style SSR and hydration", () => {
  it("hydrates a completed AI response without changing its rendered content", async () => {
    const content = "## Deployment status\n\nEverything is ready [cite:release].";
    const sources = [{ id: "release", filename: "Release checklist" }];
    const html = renderToString(<AIResponse content={content} sources={sources} preset="rag" />);
    const container = document.createElement("main");
    container.innerHTML = html;
    document.body.append(container);

    await act(async () => {
      roots.push(hydrateRoot(container, <AIResponse content={content} sources={sources} preset="rag" />));
    });

    expect(container).toHaveTextContent("Deployment status");
    expect(container).toHaveTextContent("Everything is ready");
  });
});
