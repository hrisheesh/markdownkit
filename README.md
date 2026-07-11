# Markdown Render

<p align="center">
  <img src="./public/readme/markdown-render-hero.svg" alt="A bright Markdown Render workspace with a document, chart, callout, and metric card" width="100%" />
</p>

<p align="center">
  <strong>Markdown, with more ways to make an idea clear.</strong><br />
  An expressive workspace for turning plain text into polished, interactive documents.
</p>

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-149eca?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)

## Make every document easier to understand

Write naturally in the editor and watch the preview become a finished, readable document. When a paragraph is not the clearest tool, add a compact structured block—without leaving Markdown.

| Tell a story | Make a decision | Show the shape of the data |
| :--- | :--- | :--- |
| Callouts, timelines, quotes, steps, tabs, accordions, and image layouts keep a narrative moving. | Comparisons, cards, metrics, progress, checklists, file trees, and status blocks make information scannable. | Calm charts for trends, distributions, cohorts, funnels, and cumulative change make the signal easier to see. |

```text
Plain Markdown  →  One small fenced block  →  A richer reading experience
```

## Why it exists

Most Markdown previews stop at headings, tables, and code. Markdown Render keeps that simplicity while adding a deliberate visual language for the moments where a reader needs to compare, measure, decide, or follow a sequence.

- A calm, premium writing surface with responsive editor and preview panels
- Familiar CommonMark, GitHub-flavored Markdown, KaTeX, Mermaid, tables, task lists, images, and highlighted code
- Rich blocks expressed as compact JSON5 inside normal fenced code blocks
- Smooth, readable charts designed for comprehension rather than dashboard noise
- Safe link previews that do not embed third-party pages
- Sanitized rendered Markdown and defensive parsing for custom blocks

## Quick start

```bash
git clone https://github.com/hrisheesh/markdownrender.git
cd markdownrender
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The included document is a live format gallery: edit its Markdown and the preview updates immediately.

For production:

```bash
npm run build
npm start
```

## The format vocabulary

| Category | Formats |
| --- | --- |
| Narrative | CommonMark, GFM tables and tasks, blockquotes, links, images, citations |
| Technical | Syntax-highlighted code, Mermaid diagrams, KaTeX math |
| Structure | callout, metrics, timeline, steps, comparison, accordion, tabs, cards |
| Progress | filetree, progress, checklist, status, quote |
| Media | embed, image gallery / before-after, map |
| Data | bar, line, area, pie, radar, composed, sparkline, scatter, funnel, gauge, heatmap, cohort, waterfall |

Every rich format is generated from a fenced code block. This is intentional: the source remains easy to author, easy for an LLM to generate, version-control friendly, and fully portable as Markdown.

## Examples

### A focused callout

````md
```callout
{
  tone: "insight",
  title: "A clearer document vocabulary",
  body: "Use structure whenever a paragraph is not the clearest way to communicate the idea."
}
```
````

### A compact metric group

````md
```metrics
{
  title: "This week",
  metrics: [
    { label: "Active users", value: "24.8K", change: "+12.4%", detail: "vs last week" },
    { label: "Conversion", value: "6.2%", change: "+0.8%", detail: "vs last week" }
  ]
}
```
````

### A smooth chart

````md
```chart
{
  type: "area",
  title: "Weekly momentum",
  data: [
    { name: "Mon", value: 18 },
    { name: "Tue", value: 24 },
    { name: "Wed", value: 21 },
    { name: "Thu", value: 38 },
    { name: "Fri", value: 46 }
  ],
  keys: ["value"]
}
```
````

### A readable funnel

````md
```chart
{
  type: "funnel",
  title: "Activation funnel",
  data: [
    { name: "Visitors", value: 1200 },
    { name: "Signups", value: 640 },
    { name: "Activated", value: 380 },
    { name: "Subscribed", value: 160 }
  ],
  keys: ["value"]
}
```
````

### A safe link preview

````md
```embed
{
  kind: "document",
  title: "A concise resource preview",
  publisher: "Resource library",
  description: "Represent an external resource without embedding untrusted content.",
  url: "https://developer.mozilla.org/en-US/docs/Web/Markdown"
}
```
````

## Design principles

**Structure follows content.** A rich block earns its space by making a decision, relationship, or sequence faster to understand.

**Quiet confidence.** The interface favors typography, whitespace, subtle borders, and measured motion over decoration.

**Data should explain itself.** Charts preserve context through direct labels, restrained color, clear comparisons, and sensible scale—not visual spectacle.

**Safe by default.** Markdown HTML is sanitized. Custom block configurations are parsed defensively. External previews are links, never executable embeds.

## Architecture

```text
src/
├── app/page.tsx                       # Playground and live example document
└── components/markdown/
    ├── RichMarkdown.tsx               # Markdown renderer and fenced-block routing
    ├── RichChart.tsx                  # Recharts and bespoke data visualizations
    ├── RichStructuredBlock.tsx        # Content and workflow blocks
    ├── RichMediaBlock.tsx             # Safe embeds, image layouts, map summaries
    ├── RichMermaid.tsx                # Client-side Mermaid rendering
    └── RichCodeBlock.tsx              # Syntax-highlighted code
```

The renderer uses `react-markdown` with GFM and math plugins, a sanitization schema, `recharts` for native charts, Mermaid for diagrams, and JSON5 for approachable rich-block source.

## Development

```bash
npm run lint
npm run build
```

The project is intentionally dependency-light and does not require a backend, environment variables, or a database to run locally.

## Contributing

Keep additions readable in source and restrained in output. A new block should have a clear information purpose, graceful malformed-input behavior, responsive layout, keyboard-accessible interaction where relevant, and a representative example in the playground.

## License

This repository does not currently declare a license.
