/**
 * Server-safe Markdown entry point. It has no browser APIs or interactive rich blocks.
 * Use this from React Server Components or traditional server-side rendering.
 */
export { RichMarkdownCore as StaticMarkdown } from "./core";
export type { RichMarkdownCoreProps as StaticMarkdownProps } from "./core";
