"use client";

import React, { useState } from "react";
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <div className="flex w-1/2 flex-col border-r border-[#E5E5E5] bg-white">
        <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Markdown Input</h2>
        </div>
        <textarea
          className="flex-1 resize-none p-6 font-mono text-sm leading-relaxed text-[#374151] outline-none"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
      </div>
      <div className="flex w-1/2 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[#E5E5E5] bg-[#FAFAFA]/90 p-4 backdrop-blur-md">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Rich Text Output</h2>
        </div>
        <div className="p-8">
          <RichMarkdown content={markdown} />
        </div>
      </div>
    </div>
  );
}
