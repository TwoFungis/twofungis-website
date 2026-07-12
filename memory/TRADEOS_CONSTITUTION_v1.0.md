# TRADEOS CONSTITUTION v1.0
## The Permanent Architectural Philosophy

**Effective Date:** July 12, 2026  
**Status:** RATIFIED  
**Authority:** This document governs all TradeOS development decisions.

---

## PREAMBLE

TradeOS is **NOT** accounting software.  
TradeOS is **NOT** estimating software.  
TradeOS is **NOT** project management software.  

**TradeOS is the Operating System for Contractors.**

Every future decision must reinforce this philosophy. This Constitution serves as the parent document for all TradeOS specifications. No specification may contradict these principles.

---

## ARTICLE I: THE PRIMARY OBJECT IS WORK

### Section 1.1 — Work-Centric Architecture

The software shall never be organized around disconnected modules. Everything revolves around **WORK**.

Work simply changes state throughout its lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE LIFECYCLE OF WORK                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    LEAD ──▶ OPPORTUNITY ──▶ TENDER ──▶ AWARDED PROJECT                      │
│                                              │                               │
│                                              ▼                               │
│                                        ACTIVE WORK                           │
│                                              │                               │
│              ┌───────────────┬──────────────┼──────────────┬──────────────┐ │
│              ▼               ▼              ▼              ▼              ▼ │
│         SERVICE         WARRANTY      MAINTENANCE       ASSET         FUTURE│
│          CALL            CLAIM        CONTRACT       MANAGEMENT       STATES│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Section 1.2 — Unified Experience

The contractor shall always feel like they are moving **one piece of work** through its lifecycle — not navigating unrelated software modules.

### Section 1.3 — Work Types

Work may manifest as:
- Lead
- Opportunity
- Tender
- Awarded Project
- Service Call
- Warranty Claim
- Maintenance Contract
- Asset Management *(future)*

All are expressions of the same fundamental object: **WORK**.

---

## ARTICLE II: THE WORKSPACE PHILOSOPHY

### Section 2.1 — Universal Workspace Pattern

Everything inside TradeOS shall become a **Workspace**.

| Workspace Type | Description |
|----------------|-------------|
| Platform Workspace | TradeOS administration (hidden) |
| Organization Workspace | Company-level overview |
| Company Workspace | Alias for Organization Workspace |
| Opportunity Workspace | A potential piece of work |
| Tender Workspace | Building an estimate within an Opportunity |
| Project Workspace | An active piece of work |
| Client Workspace | A customer relationship |
| Builder Workspace | A general contractor relationship |
| Supplier Workspace | A vendor relationship |
| Employee Workspace | A team member |
| Equipment Workspace | A company asset |
| Vehicle Workspace | A company vehicle |
| Document Workspace | A file or drawing |
| Asset Workspace | A managed property *(future)* |

### Section 2.2 — Common Workspace Structure

Every Workspace shall follow a common design philosophy:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIVERSAL WORKSPACE LAYOUT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  WORKSPACE HEADER                                                    │   │
│   │  [Icon] Name                               Status    Actions    ⋮    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌──────────┬──────────────────────────────────────────────────────────┐   │
│   │          │                                                          │   │
│   │  TABS    │  CONTENT AREA                                            │   │
│   │          │                                                          │   │
│   │ Overview │  Content changes based on selected tab.                  │   │
│   │ Activity │  Each workspace may show/hide tabs based on relevance.   │   │
│   │ Timeline │                                                          │   │
│   │ Documents│  The user learns ONE interface.                          │   │
│   │ Tasks    │  Every workspace feels familiar.                         │   │
│   │ Convo    │                                                          │   │
│   │ AI       │                                                          │   │
│   │ History  │                                                          │   │
│   │ Finance  │                                                          │   │
│   │ Analytics│                                                          │   │
│   │ Settings │                                                          │   │
│   │          │                                                          │   │
│   └──────────┴──────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  COMPANY BRAIN CONTEXT                                              │   │
│   │  AI insights relevant to this workspace                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Section 2.3 — Workspace Tabs

Standard tabs available to all workspaces (shown/hidden by relevance):

| Tab | Purpose |
|-----|---------|
| **Overview** | Summary and key metrics |
| **Activity** | Recent actions and updates |
| **Timeline** | Chronological view of events |
| **Documents** | Files, drawings, attachments |
| **Tasks** | Action items and to-dos |
| **Conversations** | Communication history |
| **AI Insights** | Company Brain analysis |
| **History** | Complete audit trail |
| **Financials** | Money in/out, invoices, costs |
| **Analytics** | Performance metrics |
| **Settings** | Workspace-specific configuration |

### Section 2.4 — One Interface Principle

> **The user shall only learn one interface.**

Regardless of which workspace they enter, the navigation, layout, and interaction patterns remain consistent. Mastery of one workspace grants mastery of all.

---

## ARTICLE III: MULTI-TENANT ARCHITECTURE

### Section 3.1 — Fundamental Principle

> **Everything belongs to an Organization. Nothing belongs directly to a User.**

TradeOS is a true multi-tenant SaaS platform.

### Section 3.2 — Organization Isolation

Every company receives:
- Isolated data
- Isolated Company Brain
- Isolated Production Library
- Isolated documents
- Isolated financials
- Isolated projects

**Complete separation.** No organization shall ever access another organization's data.

### Section 3.3 — Reference Specification

**Specification 1.5: Multi-Tenant Platform Architecture** defines the technical implementation of these principles.

---

## ARTICLE IV: PLATFORM ADMINISTRATION

### Section 4.1 — Dual Identity

The Platform Administrator account shall have two completely separate identities:

1. **Platform Administrator** — Manages TradeOS itself
2. **Company Owner** — Experiences TradeOS exactly like every paying customer

### Section 4.2 — Hidden Platform Workspace

Platform Administration shall exist as a **hidden Platform Workspace** inside the same application.

- ❌ No separate admin website
- ❌ No separate authentication
- ✅ One platform

The Platform Workspace is invisible to regular users. Only users with Platform roles may access it.

### Section 4.3 — Complete Separation

When acting as Platform Administrator: manage TradeOS.  
When acting as Company Owner: be a customer.

These contexts never blend.

---

## ARTICLE V: URL PHILOSOPHY

### Section 5.1 — No Organizations in URLs

Organizations shall **never** appear in URLs.

```
❌ FORBIDDEN:
   tradeos.ca/app/two-fungis/projects
   tradeos.ca/orgs/abc-contracting/dashboard
   tradeos.ca/workspace/123-uuid/...

✅ REQUIRED:
   tradeos.ca/app
   tradeos.ca/app/projects
   tradeos.ca/app/opportunities
   tradeos.ca/app/settings
```

### Section 5.2 — Context-Based Routing

Organization context is determined by:
- JWT claims (set at login/workspace switch)
- Session state
- Workspace Switcher selection

The URL reflects **what** the user is viewing, not **which organization** owns it.

### Section 5.3 — Deep Linking

Deep links to specific resources shall use UUIDs:
```
tradeos.ca/app/projects/abc123-uuid
tradeos.ca/app/opportunities/def456-uuid
```

The system validates the user has access to that resource in their current organization context.

---

## ARTICLE VI: MULTI-ORGANIZATION SUPPORT

### Section 6.1 — Multiple Memberships

Users may belong to multiple organizations with different roles in each.

### Section 6.2 — Workspace Switcher

TradeOS shall provide a **Workspace Switcher** similar to:
- Slack
- Notion
- Microsoft Teams
- Linear

### Section 6.3 — Context Persistence

The system shall remember the previously active workspace. Users shall not repeatedly choose organizations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKSPACE SWITCHER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  CURRENT: Two Fungis Finishing                              ▼       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  YOUR WORKSPACES                                                    │   │
│   │                                                                     │   │
│   │  ┌─────────────────────────────────────┐                           │   │
│   │  │ 🏢 Two Fungis Finishing      Owner  │  ← Currently Active       │   │
│   │  └─────────────────────────────────────┘                           │   │
│   │                                                                     │   │
│   │  ┌─────────────────────────────────────┐                           │   │
│   │  │ 🔧 TradeOS Platform         Admin   │  ← Platform Access        │   │
│   │  └─────────────────────────────────────┘                           │   │
│   │                                                                     │   │
│   │  ┌─────────────────────────────────────┐                           │   │
│   │  │ + Create New Organization           │                           │   │
│   │  └─────────────────────────────────────┘                           │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ARTICLE VII: EXTERNAL USERS

### Section 7.1 — First-Class Citizens

The following external parties shall become **first-class authenticated TradeOS users**:

- Clients
- Builders
- Architects
- Consultants
- Subcontractors
- Property Owners
- Inspectors

### Section 7.2 — No Lightweight Portals

> **Do not build lightweight portals.**

External users authenticate through the same system, receive appropriate permissions, and collaborate within the platform.

### Section 7.3 — Collaboration by Design

Design collaboration correctly from the beginning. External users:
- Have their own workspaces
- Can view projects they're invited to
- Can communicate through the platform
- Can upload/download documents
- Can approve quotes and change orders
- Are subject to permission controls

---

## ARTICLE VIII: THE COMPANY BRAIN

### Section 8.1 — Fundamental Nature

> **Company Brain is NOT a chatbot.**

Company Brain is the **Operations Manager** of the company.

### Section 8.2 — Core Functions

Company Brain shall:

| Function | Description |
|----------|-------------|
| **Observe** | Monitor all company activity |
| **Organize** | Structure and connect information |
| **Recommend** | Suggest actions based on context |
| **Predict** | Anticipate future needs and risks |
| **Automate** | Execute routine operations |
| **Learn** | Improve from every completed project |

### Section 8.3 — Workspace Integration

Every Workspace shall contain Company Brain context. The Brain understands:

- Projects
- Clients
- Builders
- Employees
- Drawings
- Documents
- Emails
- Invoices
- Production
- Scheduling
- Cash Flow
- Lessons Learned

### Section 8.4 — Proactive Assistance

> **Company Brain shall quietly assist instead of requiring users to ask questions.**

The Brain surfaces insights, warnings, and opportunities without being prompted. Users may engage in conversation, but the primary value is proactive intelligence.

---

## ARTICLE IX: THE LEARNING COMPANY

### Section 9.1 — Institutional Knowledge

> **Institutional knowledge shall never disappear.**

Every completed project permanently improves:

| Domain | What Improves |
|--------|---------------|
| Production Library | Standard rates and items |
| Assemblies | Pre-built component groups |
| Labour Productivity | Actual vs. estimated performance |
| Material Pricing | Real costs over time |
| Proposal Writing | Successful bid patterns |
| Scheduling | Duration accuracy |
| Risk Detection | Problem pattern recognition |
| Supplier Performance | Reliability and pricing |
| Builder Relationships | Payment patterns, preferences |
| Cash Flow Forecasting | Revenue timing accuracy |
| Company Brain | Overall organizational intelligence |

### Section 9.2 — Continuous Improvement

Every completed project shall improve future work. The company becomes smarter with each job completed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE LEARNING LOOP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│       ESTIMATE ──────▶ EXECUTE ──────▶ CAPTURE ──────▶ LEARN                │
│          ▲                                               │                  │
│          │                                               │                  │
│          └───────────────── IMPROVE ◀────────────────────┘                  │
│                                                                              │
│       Every project makes the next project smarter.                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ARTICLE X: USER EXPERIENCE

### Section 10.1 — Design Principles

TradeOS shall feel:

| Attribute | Meaning |
|-----------|---------|
| **Professional** | Worthy of serious business use |
| **Calm** | No visual noise or anxiety |
| **Fast** | Instant response, no waiting |
| **Minimal** | Only what's needed, nothing more |
| **Modern** | Current design standards |
| **Context Aware** | Knows what user is doing |
| **Predictive** | Anticipates next action |

### Section 10.2 — Prohibitions

The software shall **never** be:
- Overwhelming
- Cluttered
- Require duplicate entry

### Section 10.3 — Anticipatory Design

> **The software shall anticipate the user's next action whenever possible.**

If a user creates a project, offer to create the first milestone.  
If a tender is awarded, offer to convert to project.  
If an invoice is overdue, surface it before the user asks.

---

## ARTICLE XI: COMPETITIVE PHILOSOPHY

### Section 11.1 — No Copying

> **Never copy competitors.**

Study them. Understand them. Improve upon them.

### Section 11.2 — Competitive Awareness

Compare every specification against:

| Category | Competitors |
|----------|-------------|
| Construction Management | Procore, Buildertrend, Autodesk Construction Cloud |
| Estimating | Buildxact, Clear Estimates |
| Field Service | ServiceTitan, Jobber |
| Project Management | Monday, Linear, ClickUp, Notion |
| Collaboration | Microsoft Teams, Slack |
| Contractor Tools | Contractor Foreman |

### Section 11.3 — Category Definition

> **Our objective is not feature parity. Our objective is to create a category-defining operating system.**

---

## ARTICLE XII: IMPLEMENTATION PHILOSOPHY

### Section 12.1 — Architecture First

> **No major feature begins with code. Every major feature begins with architecture.**

### Section 12.2 — Specification Requirements

Every specification shall include:

| Section | Purpose |
|---------|---------|
| Purpose | Why this feature exists |
| Workflow | How work flows through the feature |
| User Journey | Step-by-step user experience |
| Business Logic | Rules and calculations |
| Database Design | Data model and relationships |
| Workspace Design | UI structure and patterns |
| AI Opportunities | Company Brain integration points |
| Automation Opportunities | What can be automated |
| Security | Access control and data protection |
| Scalability | Performance at scale |
| Acceptance Criteria | Definition of done |
| Future Expansion | How this grows |

### Section 12.3 — Approval Gate

> **Only after approval may implementation begin.**

---

## ARTICLE XIII: AMENDMENTS

### Section 13.1 — Constitutional Changes

This Constitution may be amended only through explicit approval by the Product Owner.

### Section 13.2 — Specification Hierarchy

All specifications must comply with this Constitution. In case of conflict, the Constitution prevails.

---

## RATIFICATION

This Constitution is hereby ratified as the governing document for all TradeOS development.

**Signed:** Product Owner  
**Date:** July 12, 2026

---

## APPENDIX A: SPECIFICATION INDEX

| Spec | Title | Status |
|------|-------|--------|
| 1.0 | TFCS Mainframe Foundation | COMPLETE |
| 1.1 | Command Center Dashboard | COMPLETE |
| 1.2 | Company Brain Foundation | COMPLETE |
| 1.5 | Multi-Tenant Platform Architecture | PENDING REVISION |
| 2.0 | Opportunity Lifecycle & Tender Workspace | PENDING REVISION |
| 2.1 | Production Library Foundation | PLANNED |

---

## APPENDIX B: QUICK REFERENCE

### The Five Pillars

1. **WORK** — The primary object; everything revolves around work
2. **WORKSPACE** — Universal interface pattern for all entities
3. **BRAIN** — Operations Manager, not chatbot; proactive intelligence
4. **LEARNING** — Every project improves the company
5. **OPERATING SYSTEM** — Not software modules; a unified platform

### The Core Mantra

> "Every project makes the next project smarter."

---

**END OF CONSTITUTION**
