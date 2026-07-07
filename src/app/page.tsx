"use client";

import React, { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import RichMarkdown from "@/components/markdown/RichMarkdown";

export default function MarkdownPlayground() {
  const [markdown, setMarkdown] = useState<string>(`# Rich Markdown Renderer Test

## 1. Native Charts (Recharts)

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
    <main id="main-content" className="flex h-svh min-h-svh min-w-0 flex-col overflow-hidden bg-surface text-ink">
      <a
        href="#markdown-input"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
      >
        Skip to editor
      </a>
      <header className="shrink-0 border-b border-hairline-soft bg-canvas px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-ink sm:text-lg">Markdown Renderer</h1>
            <p className="text-xs font-medium text-steel">Clean writing input with rich rendered output.</p>
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
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
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
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                  activePanel === "preview" ? "bg-white text-ink shadow-sm" : "text-steel hover:text-ink"
                }`}
              >
                Preview
              </button>
            </div>
            <div id="document-stats" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-steel">
              <span>{wordCount.toLocaleString()} words</span>
              <span>{lineCount.toLocaleString()} lines</span>
              <span>{characterCount.toLocaleString()} chars</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[96rem] flex-1 gap-4 overflow-hidden p-3 sm:p-4 md:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.05fr)] md:p-6">
        <section
          id="editor-panel"
          aria-labelledby="editor-heading"
          className={`min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-sm md:flex ${
            activePanel === "editor" ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline-soft bg-white px-4 py-3">
            <h2 id="editor-heading" className="text-xs font-bold uppercase tracking-wider text-steel">
              Markdown Input
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="sr-only" aria-live="polite">
                {copied ? "Markdown copied." : copyFailed ? "Could not copy markdown." : ""}
              </span>
              <button
                type="button"
                onClick={copyMarkdown}
                disabled={isEmpty}
                className="inline-flex size-8 items-center justify-center rounded-md border border-hairline bg-canvas text-steel transition hover:border-hairline hover:bg-surface-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:opacity-45"
                title={copied ? "Copied" : "Copy markdown"}
                aria-label={copied ? "Copied markdown" : "Copy markdown"}
              >
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setMarkdown("")}
                disabled={isEmpty}
                className="inline-flex size-8 items-center justify-center rounded-md border border-hairline bg-canvas text-steel transition hover:border-hairline hover:bg-surface-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:opacity-45"
                title="Clear editor"
                aria-label="Clear editor"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        <textarea
          id="markdown-input"
            className="internal-scroll min-h-0 flex-1 resize-none bg-canvas p-4 font-mono text-sm leading-7 text-charcoal outline-none transition focus:bg-white sm:p-5"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Start typing markdown..."
            aria-label="Markdown input"
            aria-describedby="document-stats"
            spellCheck={false}
          />
        </section>

        <section
          id="preview-panel"
          aria-labelledby="preview-heading"
          className={`min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-sm md:flex ${
            activePanel === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="sticky top-0 z-10 border-b border-hairline-soft bg-white/95 px-4 py-3 backdrop-blur">
            <h2 id="preview-heading" className="text-xs font-bold uppercase tracking-wider text-steel">
              Rich Text Output
            </h2>
          </div>
          <div className="internal-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 md:px-7 lg:px-8">
            <div className="mx-auto min-w-0 max-w-3xl">
              {isEmpty ? (
                <div
                  className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-hairline bg-surface/60 px-6 py-10 text-center"
                  role="status"
                >
                  <div className="max-w-sm">
                    <p className="text-sm font-bold text-ink">Preview is waiting for markdown</p>
                    <p className="mt-2 text-sm leading-6 text-steel">
                      Write in the editor and the rendered result will appear here.
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
