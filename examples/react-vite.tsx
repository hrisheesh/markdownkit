import { RichMarkdown } from "markdown-flow";
import "markdown-flow/styles.css";

const content = "# Welcome\n\nThis document is rendered in a standard React application.";

export function App() {
  return <main><RichMarkdown content={content} /></main>;
}
