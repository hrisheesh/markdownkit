import { RichMarkdown } from "@hrisheesh/markdown-render";
import "@hrisheesh/markdown-render/styles.css";

const content = "# Welcome\n\nThis document is rendered in a standard React application.";

export function App() {
  return <main><RichMarkdown content={content} /></main>;
}
