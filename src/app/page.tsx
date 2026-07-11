"use client";

import React, { useState } from "react";
import { Check, Copy, Eye, FileText, Trash2 } from "lucide-react";
import RichMarkdown from "@/components/markdown/RichMarkdown";

export default function MarkdownPlayground() {
  const [markdown, setMarkdown] = useState<string>(`# Markdown Flow playground

## Structured blocks

\`\`\`callout
{
  "tone": "insight",
  "title": "A clearer document vocabulary",
  "body": "Use a structured block whenever a paragraph is not the clearest way to communicate the idea."
}
\`\`\`

\`\`\`metrics
{
  "title": "This week",
  "metrics": [
    { "label": "Active users", "value": "24.8K", "change": "+12.4%", "detail": "vs last week" },
    { "label": "Conversion", "value": "6.2%", "change": "+0.8%", "detail": "vs last week" },
    { "label": "Response time", "value": "142ms", "change": "-18ms", "detail": "p95" }
  ]
}
\`\`\`

\`\`\`timeline
{
  "title": "Launch plan",
  "items": [
    { "date": "May 06", "title": "Design review", "description": "Align the core experience.", "status": "complete" },
    { "date": "May 14", "title": "Private beta", "description": "Invite the first customers.", "status": "current" },
    { "date": "May 28", "title": "Public release", "description": "Open the experience to everyone.", "status": "upcoming" }
  ]
}
\`\`\`

\`\`\`steps
{
  "title": "Getting started",
  "items": [
    { "title": "Define the intent", "description": "Give the model a clear outcome." },
    { "title": "Choose the right block", "description": "Use the format that makes the content easiest to scan." }
  ]
}
\`\`\`

\`\`\`comparison
{
  "title": "Plans",
  "columns": ["Personal", "Team"],
  "rows": [
    { "label": "Rich markdown", "values": [true, true] },
    { "label": "Shared workspaces", "values": [false, true] }
  ]
}
\`\`\`

\`\`\`accordion
{
  "title": "Frequently asked questions",
  "items": [
    { "title": "Can an LLM generate these?", "content": "Yes. Each block is plain JSON5 inside a familiar fenced Markdown block.", "open": true },
    { "title": "Can I mix blocks with prose?", "content": "Yes. Use them anywhere in the document." }
  ]
}
\`\`\`

\`\`\`tabs
{
  "title": "A flexible writing surface",
  "tabs": [
    { "label": "Overview", "content": "Keep the narrative clean and use structure only where it makes information faster to understand." },
    { "label": "For models", "content": "The JSON5 syntax is concise, predictable, and easy for an LLM to generate or revise." },
    { "label": "For readers", "content": "Responsive interactions stay subtle, clear, and accessible across every screen size." }
  ]
}
\`\`\`

\`\`\`cards
{
  "title": "Design principles",
  "cards": [
    { "eyebrow": "01", "title": "Useful by default", "description": "Choose form from content, not decoration.", "meta": "Clear hierarchy" },
    { "eyebrow": "02", "title": "Quiet confidence", "description": "Use whitespace, typography, and restraint to create premium focus.", "meta": "Calm interface" }
  ]
}
\`\`\`

\`\`\`filetree
{
  "title": "Project structure",
  "files": [
    { "name": "src", "type": "folder" },
    { "name": "app", "type": "folder", "depth": 1 },
    { "name": "page.tsx", "depth": 2, "detail": "workspace" },
    { "name": "components", "type": "folder", "depth": 1 },
    { "name": "RichStructuredBlock.tsx", "depth": 2, "detail": "formats" }
  ]
}
\`\`\`

\`\`\`progress
{
  "title": "Release readiness",
  "items": [
    { "title": "Experience", "value": 92, "description": "The renderer has been refined across the core format set." },
    { "title": "Documentation", "value": 68, "meta": "In progress" }
  ]
}
\`\`\`

\`\`\`checklist
{
  "title": "Launch checklist",
  "items": [
    { "title": "Validate rendering", "description": "Review the document across desktop and mobile.", "checked": true },
    { "title": "Share the new vocabulary", "description": "Give authors a concise format reference.", "checked": false }
  ]
}
\`\`\`

\`\`\`status
{
  "title": "System health",
  "items": [
    { "title": "Renderer", "description": "All core formats are available.", "meta": "Operational", "status": "complete" },
    { "title": "Format library", "description": "New-generation block vocabulary is expanding.", "meta": "In progress", "status": "current" }
  ]
}
\`\`\`

\`\`\`quote
{
  "body": "The best interface is the one that lets the idea arrive before the interface does.",
  "attribution": "Design principle",
  "role": "Markdown renderer"
}
\`\`\`

\`\`\`embed
{
  "kind": "document",
  "title": "A safe, concise link preview",
  "publisher": "Resource library",
  "description": "Links, videos, and documents can be represented without embedding untrusted third-party content.",
  "url": "https://developer.mozilla.org/en-US/docs/Web/Markdown"
}
\`\`\`

\`\`\`image
{
  "title": "A refined visual gallery",
  "layout": "gallery",
  "images": [
    { "src": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", "alt": "Bright studio workspace", "caption": "A visual can sit naturally beside the written narrative." },
    { "src": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80", "alt": "Minimal modern office", "caption": "Use labels and captions when they add context." }
  ]
}
\`\`\`

\`\`\`map
{
  "title": "Launch locations",
  "locations": [
    { "name": "San Francisco", "detail": "Design partner", "x": 18, "y": 48 },
    { "name": "London", "detail": "Early access", "x": 50, "y": 34 },
    { "name": "Singapore", "detail": "Community", "x": 78, "y": 62 }
  ]
}
\`\`\`

## 1. Native Charts (Recharts)

### Next-generation chart types

\`\`\`chart
{
  "type": "sparkline",
  "title": "Weekly momentum",
  "data": [{ "name": "Mon", "value": 18 }, { "name": "Tue", "value": 24 }, { "name": "Wed", "value": 21 }, { "name": "Thu", "value": 38 }, { "name": "Fri", "value": 46 }],
  "keys": ["value"]
}
\`\`\`

\`\`\`chart
{
  "type": "gauge",
  "title": "Experience score",
  "data": [{ "name": "Score", "value": 86 }],
  "keys": ["value"],
  "max": 100
}
\`\`\`

\`\`\`chart
{
  "type": "heatmap",
  "title": "Engagement by cohort",
  "data": [{ "name": "Week 1", "Mon": 82, "Tue": 64, "Wed": 48 }, { "name": "Week 2", "Mon": 71, "Tue": 55, "Wed": 39 }, { "name": "Week 3", "Mon": 58, "Tue": 42, "Wed": 26 }],
  "keys": ["Mon", "Tue", "Wed"],
  "max": 100
}
\`\`\`

\`\`\`chart
{
  "type": "funnel",
  "title": "Activation funnel",
  "data": [{ "name": "Visitors", "value": 1200 }, { "name": "Signups", "value": 640 }, { "name": "Activated", "value": 380 }, { "name": "Subscribed", "value": 160 }],
  "keys": ["value"]
}
\`\`\`

\`\`\`chart
{
  "type": "scatter",
  "title": "Speed and satisfaction",
  "data": [{ "name": "A", "speed": 18, "satisfaction": 72 }, { "name": "B", "speed": 31, "satisfaction": 84 }, { "name": "C", "speed": 42, "satisfaction": 63 }, { "name": "D", "speed": 55, "satisfaction": 91 }],
  "keys": ["speed", "satisfaction"]
}
\`\`\`

\`\`\`chart
{
  "type": "waterfall",
  "title": "Monthly movement",
  "data": [{ "name": "Base", "value": 120 }, { "name": "Growth", "value": 42 }, { "name": "Churn", "value": -18 }, { "name": "Expansion", "value": 28 }],
  "keys": ["value"]
}
\`\`\`

### Area Chart (Smooth Gradients)
\`\`\`chart
{
  "type": "area",
  "title": "Server Load Distribution",
  "data": [
    { "name": "00:00", "cpu": 20, "ram": 40 },
    { "name": "04:00", "cpu": 30, "ram": 45 },
    { "name": "08:00", "cpu": 80, "ram": 75 },
    { "name": "12:00", "cpu": 95, "ram": 90 },
    { "name": "16:00", "cpu": 70, "ram": 80 },
    { "name": "20:00", "cpu": 40, "ram": 55 }
  ],
  "keys": ["cpu", "ram"]
}
\`\`\`

### Composed Chart (Mixed Data)
\`\`\`chart
{
  "type": "composed",
  "title": "Revenue vs Margin",
  "data": [
    { "name": "Q1", "revenue": 4000, "margin": 2400 },
    { "name": "Q2", "revenue": 3000, "margin": 1398 },
    { "name": "Q3", "revenue": 2000, "margin": 9800 },
    { "name": "Q4", "revenue": 2780, "margin": 3908 }
  ],
  "bars": ["revenue"],
  "lines": ["margin"]
}
\`\`\`

### Radar Chart (Multi-Variable Analysis)
\`\`\`chart
{
  "type": "radar",
  "title": "Developer Skill Profile",
  "data": [
    { "name": "React", "score": 90 },
    { "name": "Python", "score": 85 },
    { "name": "SQL", "score": 70 },
    { "name": "CSS", "score": 95 },
    { "name": "Docker", "score": 60 }
  ],
  "keys": ["score"]
}
\`\`\`

### Bar Chart
\`\`\`chart
{
  "type": "bar",
  "title": "Quarterly Revenue",
  "data": [
    { "name": "Q1", "revenue": 4000 },
    { "name": "Q2", "revenue": 3000 },
    { "name": "Q3", "revenue": 2000 },
    { "name": "Q4", "revenue": 2780 }
  ],
  "keys": ["revenue"]
}
\`\`\`

## 2. Mermaid Diagrams (Advanced & Complex)

### Complex Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant Browser
    participant API as GraphQL API
    participant Cache as Redis Cache
    participant DB as Postgres DB

    User->>Browser: Interacts with UI
    Browser->>API: query { getUserProfile }
    activate API
    API->>Cache: checkCache(userId)
    activate Cache
    alt Cache Hit
        Cache-->>API: return cachedProfile
    else Cache Miss
        Cache-->>API: return null
        API->>DB: SELECT * FROM users WHERE id = 1
        activate DB
        DB-->>API: return userData
        deactivate DB
        API->>Cache: setCache(userId, userData, ttl)
    end
    deactivate Cache
    API-->>Browser: HTTP 200 OK (Profile Data)
    deactivate API
    Browser-->>User: Renders Dashboard
\`\`\`

### GitGraph
\`\`\`mermaid
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "feat: add login"
    branch feature-auth
    checkout feature-auth
    commit id: "feat: jwt integration"
    commit id: "fix: token refresh"
    checkout develop
    merge feature-auth
    checkout main
    merge develop tag: "v1.0.0"
    commit id: "docs: update readme"
\`\`\`

### Gantt Chart
\`\`\`mermaid
gantt
    title Q3 Development Roadmap
    dateFormat  YYYY-MM-DD
    section Backend
    Design API Architecture     :done,    des1, 2026-07-01,2026-07-05
    Implement Authentication    :active,  dev1, 2026-07-06, 7d
    Optimize Postgres Queries   :         dev2, after dev1, 10d
    section Frontend
    Wireframe Dashboard         :done,    ui1, 2026-07-01, 3d
    Build React Components      :         ui2, 2026-07-08, 14d
    State Management (Redux)    :         ui3, after ui2, 7d
\`\`\`

### Entity Relationship (ER) Diagram
\`\`\`mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string customerNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
\`\`\`

### State Diagram
\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: New Job Arrives
    Processing --> Validating: Extract Metadata
    Validating --> Rejected: Invalid Schema
    Validating --> Executing: Schema OK
    Executing --> Completed: Success
    Executing --> Failed: Exception Thrown
    Failed --> Processing: Retry (max 3)
    Failed --> [*]: Max Retries Reached
    Completed --> [*]
    Rejected --> [*]
\`\`\`

## 3. Code & Syntax Highlighting

### Python Example
\`\`\`python
def calculate_fibonacci(n: int) -> list[int]:
    """Calculate the first n Fibonacci numbers."""
    if n <= 0: return []
    if n == 1: return [0]
    
    sequence = [0, 1]
    for _ in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print(f"Fib(10) = {calculate_fibonacci(10)}")
\`\`\`

### JSON Payload
\`\`\`json
{
  "api_version": "v2",
  "status": 200,
  "data": {
    "user": {
      "id": "usr_98a7f",
      "roles": ["admin", "developer"],
      "isActive": true
    }
  }
}
\`\`\`

## 4. LaTeX Math Rendering

### Display Math (Block)
The Riemann zeta function is defined as:
$$
\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} = \\prod_{p \\text{ prime}} \\frac{1}{1 - p^{-s}}
$$

### Inline Math
Einstein's famous equation $E = mc^2$ shows the equivalence of mass and energy, where $E$ is energy, $m$ is mass, and $c$ is the speed of light ($c \\approx 3 \\times 10^8 \\text{ m/s}$).

## 5. GitHub Flavored Markdown (GFM)

### Tables
| Feature | Supported | Description |
| :--- | :---: | :--- |
| **Mermaid** | ✅ | Native rendering of diagrams and charts |
| **KaTeX** | ✅ | Complex math equations |
| **XSS Protection** | ✅ | Strict AST sanitization |
| **Tables** | ✅ | Responsive data tables |

### Task Lists
- [x] Refactor Rich Text Engine
- [x] Secure against XSS
- [x] Fix React Hydration Issues
- [ ] Implement Admonitions (Callouts)

## 6. Typography & Blockquotes

> **Design Philosophy**
> 
> "Good design is obvious. Great design is transparent."
> — *Joe Sparano*

This demonstrates how the rich text engine handles **bold text**, *italic text*, ~~strikethrough~~, and \`inline code\` blocks wrapped seamlessly around inline citations like this one [1].
`);

  const [activePanel, setActivePanel] = useState<"editor" | "preview">("editor");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = markdown.length;
  const lineCount = markdown.length === 0 ? 0 : markdown.split(/\r\n|\r|\n/).length;
  const isEmpty = markdown.trim().length === 0;

  async function copyMarkdown() {
    if (isEmpty) {
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 1800);
    }
  }

  return (
    <main id="main-content" className="workspace-shell flex h-svh min-h-svh min-w-0 flex-col overflow-hidden text-ink">
      <a
        href="#markdown-input"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
      >
        Skip to editor
      </a>
      <header className="shrink-0 border-b border-black/[0.08] bg-white/75 px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex w-full max-w-[120rem] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f0f5ff] text-[#007aff]">
              <FileText size={14} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-semibold tracking-[-0.015em] text-ink">Untitled document</h1>
              <p className="mt-0.5 text-[11px] text-steel">Markdown workspace</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
            <div
              className="grid grid-cols-2 rounded-lg border border-hairline bg-surface-soft p-1 md:hidden"
              role="tablist"
              aria-label="Editor and preview panels"
            >
              <button
                type="button"
                onClick={() => setActivePanel("editor")}
                role="tab"
                aria-controls="editor-panel"
                aria-selected={activePanel === "editor"}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                  activePanel === "editor" ? "bg-white text-ink shadow-sm" : "text-steel hover:text-ink"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("preview")}
                role="tab"
                aria-controls="preview-panel"
                aria-selected={activePanel === "preview"}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                  activePanel === "preview" ? "bg-white text-ink shadow-sm" : "text-steel hover:text-ink"
                }`}
              >
                Preview
              </button>
            </div>
            <div id="document-stats" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-steel">
              <span>{wordCount.toLocaleString()} words</span>
              <span>{lineCount.toLocaleString()} lines</span>
              <span>{characterCount.toLocaleString()} chars</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[120rem] flex-1 overflow-hidden border-t-0 border-black/[0.08] bg-white sm:m-5 sm:flex-none sm:h-[calc(100svh-7.75rem)] sm:rounded-2xl sm:border md:grid-cols-[minmax(19rem,0.88fr)_1px_minmax(0,1.12fr)] lg:m-7 lg:h-[calc(100svh-9rem)]">
        <section
          id="editor-panel"
          aria-labelledby="editor-heading"
          className={`workspace-panel min-h-0 min-w-0 flex-col overflow-hidden md:flex ${
            activePanel === "editor" ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#86868b]">#</span>
              <h2 id="editor-heading" className="text-xs font-medium text-[#6e6e73]">Write</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="sr-only" aria-live="polite">
                {copied ? "Markdown copied." : copyFailed ? "Could not copy markdown." : ""}
              </span>
              <button
                type="button"
                onClick={copyMarkdown}
                disabled={isEmpty}
                className="inline-flex size-8 items-center justify-center rounded-md text-steel transition-colors duration-150 hover:bg-surface-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:opacity-35"
                title={copied ? "Copied" : "Copy markdown"}
                aria-label={copied ? "Copied markdown" : "Copy markdown"}
              >
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setMarkdown("")}
                disabled={isEmpty}
                className="inline-flex size-8 items-center justify-center rounded-md text-steel transition-colors duration-150 hover:bg-surface-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:opacity-35"
                title="Clear editor"
                aria-label="Clear editor"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
          <textarea
            id="markdown-input"
            className="editor-canvas internal-scroll min-h-0 flex-1 resize-none bg-transparent px-5 py-5 font-mono text-[12px] leading-6 text-charcoal outline-none placeholder:text-muted sm:px-6 sm:py-6"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Start typing markdown..."
            aria-label="Markdown input"
            aria-describedby="document-stats"
            spellCheck={false}
          />
        </section>

        <div className="workspace-divider hidden min-h-0 md:block" aria-hidden="true" />

        <section
          id="preview-panel"
          aria-labelledby="preview-heading"
          className={`workspace-panel min-h-0 min-w-0 flex-col overflow-hidden md:flex ${
            activePanel === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.07] bg-white/90 px-5 py-3.5 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-steel" aria-hidden="true" />
              <h2 id="preview-heading" className="text-xs font-medium text-[#6e6e73]">Preview</h2>
            </div>
            <span className="hidden text-[11px] text-steel sm:block">Live rendering</span>
          </div>
          <div className="internal-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-7 sm:px-9 sm:py-9 lg:px-14">
            <div className="mx-auto min-w-0 max-w-[42rem]">
              {isEmpty ? (
                <div
                  className="flex min-h-[20rem] items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/50 px-6 py-10 text-center"
                  role="status"
                >
                  <div className="max-w-sm">
                    <p className="text-sm font-semibold text-ink">Your document will appear here</p>
                    <p className="mt-2 text-sm leading-6 text-steel">
                      Start with a heading, a thought, or paste in existing Markdown.
                    </p>
                  </div>
                </div>
              ) : (
                <RichMarkdown content={markdown} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
