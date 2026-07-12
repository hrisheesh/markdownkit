// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMarkdownFlowDataset } from "../../src/ai/data";

describe("dataset resolver", () => {
  it("normalizes resolver failures without exposing implementation errors", async () => {
    const resolver = { resolve: vi.fn().mockRejectedValue(new Error("tenant secret")) };
    const { result } = renderHook(() => useMarkdownFlowDataset({ id: "sales", fields: ["month"] }, resolver));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.message).toBe("Approved data could not be loaded.");
  });

  it("rejects ready datasets that do not satisfy the approved request", async () => {
    const resolver = {
      resolve: vi.fn().mockResolvedValue({
        status: "ready",
        value: { id: "sales", schema: { fields: ["month"] }, data: [{ month: "Jan" }] },
      }),
    };
    const { result } = renderHook(() => useMarkdownFlowDataset({ id: "sales", fields: ["revenue"] }, resolver));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.message).toBe("The approved data does not contain the requested fields.");
  });
});
