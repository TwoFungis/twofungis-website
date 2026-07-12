# TradeOS Vision

> **The Architectural North Star for TradeOS Development**
> 
> Every engineering decision should be able to reference this document.

---

## Mission

TradeOS exists to eliminate administrative work for construction companies.

The software should continuously reduce manual effort by combining:
- Intelligent automation
- Reusable company knowledge
- AI-powered workflows
- Unified operating environment

Users should spend their time **making decisions** — not entering data.

---

## Long-Term Vision

TradeOS should evolve into a construction operating system capable of:

- Understanding tenders
- Reading drawings
- Analyzing specifications
- Assembling estimates
- Generating RFIs
- Coordinating communication
- Organizing documentation
- Forecasting labor
- Learning company standards
- Preserving institutional knowledge

**The software should continuously reduce administrative effort as organizations continue to use it.**

---

## Core Principles

### 1. AI-First, Never AI-Added
AI is not a feature bolted onto existing workflows.
AI is the foundation upon which workflows are designed.
Every process should ask: "Can intelligence handle this?"

### 2. Automation Before Manual Entry
If a task can be automated, it should be.
Manual entry is a last resort, not a default.
The system should anticipate needs before users request them.

### 3. Workspaces Instead of Disconnected Pages
Navigation should feel spatial, not transactional.
Users work inside contexts — not between isolated screens.
Everything related to a piece of work lives together.

### 4. Company Brain Is a Platform Capability
AI assistance is not a chatbot.
Company Brain is an operations manager that understands context.
It should proactively surface insights, not wait for questions.

### 5. Context-Aware Assistance Everywhere
Intelligence should be ambient.
Help should arrive at the moment of need.
The system should know what users are trying to accomplish.

### 6. Progressive Disclosure Over Overwhelming Forms
Complexity should be revealed when needed.
New users see simplicity; experts unlock depth.
The interface adapts to experience level.

### 7. Reusable Systems Over Isolated Features
Every component should strengthen the platform.
Avoid one-off implementations.
Build systems that compound in value.

### 8. Design Before Implementation
Architecture decisions persist.
Thoughtful design prevents technical debt.
Quality is non-negotiable.

### 9. Consistency Over Complexity
Patterns should be predictable.
Users learn once, apply everywhere.
Coherent experiences build trust.

### 10. Intelligence Over Configuration
Smart defaults beat endless options.
The system should learn preferences.
Configuration should be exceptional, not required.

---

## User Experience Philosophy

Every workflow should ask:

1. **Can TradeOS determine this automatically?**
2. **Can previous company knowledge answer this?**
3. **Can Company Brain complete this task?**
4. **Can user input be reduced?**
5. **Can repetitive work disappear?**

**If the answer is yes, automation should always be preferred.**

---

## Development Philosophy

### Build Systems, Not Features
Every feature should strengthen the platform.
Avoid isolated tools.
Build extensible, reusable systems.

### Favor Extensibility Over Shortcuts
Architectural decisions outlast sprint deadlines.
Invest in foundations.
Shortcuts become technical debt.

### Every Project Makes TradeOS Smarter
Completed work should improve future work.
Knowledge should accumulate automatically.
The platform should learn from every interaction.

---

## V2 Architectural Foundation

The following systems are considered **architecturally stable** as of V2:

| System | Status | Description |
|--------|--------|-------------|
| **Workspace Shell** | ✅ STABLE | Universal workspace container with Focus Layer & Memory |
| **Command Center** | ✅ STABLE | Priority-driven landing experience |
| **Organization Routing** | ✅ STABLE | Organization-first authentication and context |
| **Sidebar Architecture** | ✅ STABLE | Workflow-oriented navigation |
| **Universal Workspace Pattern** | ✅ STABLE | Consistent panel-first design |
| **Panel Dock System** | ✅ STABLE | Contextual sliding panels |
| **Company Brain Integration** | ✅ STABLE | AI integration points throughout platform |
| **Core API Organization** | ✅ STABLE | /api/workspace, /api/organizations, /api/opportunities |

**Future work should extend these systems rather than redesign them.**

Architectural changes beyond this point should only occur when a fundamental limitation has been identified.

---

## Universal Workspace Standard

All future workspaces must inherit from the WorkspaceShell architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Entity Name / Status / Quick Actions               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────┐ │
│  │  COMMAND    │  │    PRIMARY SECTION  │  │  TIMELINE   │ │
│  │  CENTER     │  │                     │  │  (Always    │ │
│  │             │  │  (Tender/Tasks/     │  │   Visible)  │ │
│  │  Priority   │  │   Content Area)     │  │             │ │
│  │  Queue      │  │                     │  │  Activity   │ │
│  │             │  │                     │  │  Feed       │ │
│  └─────────────┘  └─────────────────────┘  └─────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PANEL DOCK: Documents | Communications | RFIs | Notes      │
└─────────────────────────────────────────────────────────────┘
```

### Workspace Principles:
- **3 Primary Sections**: Command Center, Primary Content, Timeline
- **Persistent Timeline**: Always visible, filterable activity
- **Contextual Panel Dock**: Slides up when needed
- **Focus Layer**: Workspace knows current user task
- **Memory**: State persists between sessions

---

## Design System

### Color Palette
- **Background**: Black (#0a0a0a)
- **Surface**: Deep Charcoal (#111111)
- **Accent**: Emerald Green (#10b981)
- **Status Colors**: Red (urgent), Amber (warning), Green (success)

### Typography
- **Primary**: IBM Plex Sans
- **Monospace**: JetBrains Mono
- **Hierarchy**: Uppercase tracking for labels, sentence case for content

### Component Standards
- Cards with subtle borders
- Emerald accent for active states
- Zinc tones for secondary content
- Consistent 16px base spacing

---

## Next Milestone

### Phase 2: Opportunity Intake Engine & AI-Native Workflow

The next major development phase establishes an AI-native workflow where TradeOS assembles opportunities from:
- Emails
- Drawings
- Tender packages
- Builder portals
- Historical company knowledge

**Goal**: Minimal manual input — the system should intelligently construct opportunities.

---

## Document Governance

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Status** | RATIFIED |
| **Established** | July 12, 2026 |
| **Last Updated** | July 12, 2026 |
| **Owner** | TradeOS Engineering |

This document is the permanent architectural north star for TradeOS.

All future development should align with these principles.
