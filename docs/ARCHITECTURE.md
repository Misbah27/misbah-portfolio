# Portfolio Architecture — System Design Overview

## Overview

This engineering portfolio is a production-grade Next.js application that showcases five real-world systems built over 11+ years at Amazon. Each application is a fully interactive demo with synthetic data, real UI patterns, and LLM-powered features using the Anthropic Claude API.

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Browser"]
    end

    subgraph Hosting["AWS Amplify"]
        NextJS["Next.js 14+\nApp Router"]
    end

    subgraph API["API Routes"]
        InboundIQ_API["InboundIQ API\n4 endpoints"]
        FreightLens_API["FreightLens API\n3 endpoints"]
        Nova_API["Nova API\n4 endpoints"]
        DataOps_API["DataOps API\n4 endpoints"]
        LoFAT_API["LoFAT API\n5 endpoints"]
    end

    subgraph LLM["LLM Layer"]
        Anthropic["Anthropic Claude\nclaude-sonnet-4-20250514"]
    end

    subgraph Data["Static Data Layer"]
        JSON["Synthetic JSON\n/data/*"]
    end

    subgraph CDN["Content Delivery"]
        CloudFront["CloudFront\nStatic Assets"]
        Route53["Route53\nCustom Domain"]
    end

    Browser --> Route53
    Route53 --> CloudFront
    CloudFront --> NextJS
    Browser --> NextJS
    NextJS --> InboundIQ_API
    NextJS --> FreightLens_API
    NextJS --> Nova_API
    NextJS --> DataOps_API
    NextJS --> LoFAT_API
    InboundIQ_API --> Anthropic
    FreightLens_API --> Anthropic
    Nova_API --> Anthropic
    DataOps_API --> Anthropic
    LoFAT_API --> Anthropic
    InboundIQ_API --> JSON
    FreightLens_API --> JSON
    Nova_API --> JSON
    DataOps_API --> JSON
    LoFAT_API --> JSON
```

---

## Application Map

```mermaid
flowchart LR
    subgraph Portfolio["Portfolio Landing /"]
        Hero["Hero Section"]
        Impact["Impact Numbers"]
        Products["Products Grid"]
        Career["Career Timeline"]
        Leadership["Leadership"]
        TechStack["Tech Stack"]
    end

    subgraph Apps["Interactive Applications"]
        subgraph IQ["InboundIQ /apps/inboundiq"]
            IQ1["Dashboard\nYard Queue + Dock Status"]
            IQ2["Analytics"]
            IQ3["About"]
        end

        subgraph FL["FreightLens /apps/freightlens"]
            FL1["Rolling 21 Days"]
            FL2["Standing Appointments"]
            FL3["FC Metric"]
            FL4["Admin Portal"]
            FL5["About"]
        end

        subgraph NV["Nova /apps/nova"]
            NV1["Delay Alert\nLH/MR Tabs"]
            NV2["Rescue Planner\n5-Tab Workflow"]
            NV3["About"]
        end

        subgraph DO["DataOps Suite /apps/dataops"]
            DO1["Quality Dashboard"]
            DO2["Ingest Wizard\n4-Step Pipeline"]
            DO3["Catalog\n6-Tab Detail"]
            DO4["Obfuscation\n4-Tab Service"]
            DO5["About"]
        end

        subgraph LF["LoFAT /apps/lofat"]
            LF1["Live Monitor\nDriver Table + Fraud Scores"]
            LF2["Analytics\n6 Charts + Zone Map"]
            LF3["Cases\nInvestigation Management"]
            LF4["About"]
        end
    end

    Products --> IQ
    Products --> FL
    Products --> NV
    Products --> DO
    Products --> LF
```

---

## LLM Integration Architecture

```mermaid
flowchart TB
    subgraph Client["Client Components"]
        UI["React Component"]
        Loading["Skeleton Loading State"]
        Error["Error Boundary + Retry"]
    end

    subgraph Route["Next.js API Route"]
        Handler["POST Handler"]
        Prompt["Prompt Builder"]
        Parse["Response Parser"]
        Fallback["Deterministic Fallback"]
    end

    subgraph LLM["Anthropic API"]
        Claude["claude-sonnet-4-20250514\nmax_tokens: 1000"]
    end

    UI -->|"fetch('/api/...')"| Handler
    Handler --> Prompt
    Prompt --> Claude
    Claude -->|"Success"| Parse
    Parse --> UI
    Claude -->|"Failure"| Fallback
    Fallback --> UI
    UI --> Loading
    UI --> Error
```

### LLM Endpoints by Application

| Application | Endpoint | Purpose | max_tokens |
|-------------|----------|---------|------------|
| **InboundIQ** | `/api/inboundiq/explain-rank` | Explain truck ranking | 1000 |
| | `/api/inboundiq/nl-filter` | Natural language yard filter | 1000 |
| | `/api/inboundiq/dock-intelligence` | Dock allocation recommendations | 1000 |
| | `/api/inboundiq/chat` | Conversational yard assistant | 1000 |
| **FreightLens** | `/api/freightlens/risk-analysis` | Scheduling risk analysis | 1000 |
| | `/api/freightlens/nl-query` | Natural language metric query | 1000 |
| | `/api/freightlens/forecast-summary` | Capacity forecast | 1000 |
| **Nova** | `/api/nova/delay-brief` | Delay intelligence brief | 1000 |
| | `/api/nova/rescue-recommend` | Rescue recommendation | 1000 |
| | `/api/nova/nl-filter` | Natural language delay filter | 1000 |
| | `/api/nova/exec-summary` | Executive summary | 1000 |
| **DataOps** | `/api/dataops/quality-check` | Data quality scoring | 1000 |
| | `/api/dataops/generate-metadata` | Metadata generation | 8000 |
| | `/api/dataops/catalog-chat` | Catalog conversational search | 1000 |
| | `/api/dataops/suggest-obfuscation` | PII obfuscation rules | 1000 |
| **LoFAT** | `/api/lofat/investigate` | Fraud investigation summary | 1000 |
| | `/api/lofat/explain-signal` | Signal explanation | 1000 |
| | `/api/lofat/nl-search` | Natural language driver search | 1000 |
| | `/api/lofat/daily-brief` | Daily intelligence brief | 1000 |
| | `/api/lofat/case-narrative` | Case report generator | 1000 |

---

## Route Architecture

```
/ ................................ Landing page (no sidebar)
├── (landing)/
│   ├── layout.tsx ............... Custom layout, no Fuse sidebar
│   ├── page.tsx ................. Entry point
│   └── LandingPage.tsx ......... 7-section orchestrator
│
├── (control-panel)/
│   ├── layout.tsx ............... Fuse sidebar layout
│   └── apps/
│       ├── inboundiq/ ........... Dock door allocation
│       ├── freightlens/ ......... Freight scheduling
│       ├── nova/ ................ Delay alerts + rescue
│       ├── dataops/ ............. LLM data platform
│       └── lofat/ ............... Fraud detection
│
└── (public)/
    └── sign-in/ ................. Auth pages (unused in portfolio)
```

---

## Data Architecture

All data is synthetic JSON stored in `/data/` with symlinks from `src/data/` for Next.js imports.

```
data/
├── inboundiq/
│   └── trucks.json .............. 150 trucks across 5 FCs
├── freightlens/
│   ├── rolling21.json ........... 21-day capacity grid
│   ├── standing.json ............ Standing appointments
│   ├── metrics.json ............. FC performance metrics
│   └── appointments.json ........ Appointment records
├── nova/
│   ├── delay-alerts.json ........ 150 vehicle delay records
│   └── rescues.json ............. 50 rescue records
├── dataops/
│   ├── catalog.json ............. 12 dataset catalog entries
│   ├── datasets/ ................ 12 × 500-row datasets
│   └── obfuscation-jobs.json .... 200 obfuscation job records
└── lofat/
    ├── drivers.json ............. 200 driver records
    ├── deliveries.json .......... 1000 delivery records
    ├── gpsTraces.json ........... GPS traces for 20 flagged drivers
    ├── cases.json ............... 30 investigation cases
    └── shiftMetrics.json ........ 90-day rolling aggregates
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict mode) |
| UI Template | Fuse React (Envato) |
| Styling | Tailwind CSS + MUI |
| Charts | Recharts |
| Maps | React Leaflet |
| Architecture Diagrams | React Flow (@xyflow/react) |
| Animations | motion/react (Framer Motion) |
| LLM | Anthropic Claude API |
| Hosting | AWS Amplify |
| Domain | Route53 |
| CI/CD | GitHub Actions → Amplify |
| Data | Synthetic JSON (no database) |

---

## Deployment Pipeline

```mermaid
flowchart LR
    Dev["Local Dev\nnpm run dev"]
    Git["GitHub\nPublic Repo"]
    CI["GitHub Actions\nLint + Build"]
    Amplify["AWS Amplify\nNext.js Runtime"]
    Route53["Route53\nCustom Domain"]
    User["End User"]

    Dev -->|"git push"| Git
    Git -->|"Webhook"| CI
    CI -->|"On success"| Amplify
    Amplify --> Route53
    Route53 --> User
```

Environment variables:
- `ANTHROPIC_API_KEY` — Set in Amplify console, never in code
- All other configuration is static (synthetic JSON data, no database connections)
