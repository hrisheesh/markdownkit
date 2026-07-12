"use client";

import React from "react";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { RichMarkdownContent, type RichMarkdownProps } from "./RichMarkdown";

export default function MathRichMarkdown(props: Omit<RichMarkdownProps, "enableMath">) {
  return <RichMarkdownContent {...props} mathPlugins={{ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }} />;
}
