# TRADEOS SPECIFICATION 2.0
## Opportunity Lifecycle & Tender Workspace

**Version:** 2.0.1  
**Date:** July 12, 2026  
**Author:** Chief Software Architect  
**Status:** APPROVED (Post-Constitution Compliance Review)

---

## DOCUMENT HIERARCHY

**Parent Document(s):**
- TradeOS Constitution v1.0
- Specification 1.5: Multi-Tenant Platform Architecture

**Related Specifications:**
- Specification 1.2: Company Brain Foundation
- Specification 2.1: Production Library Foundation (Planned)

**Specification Type:** Product Specification

---

## 1. PURPOSE

Define the lifecycle of contractor opportunities from initial lead through tender creation to project conversion, establishing the Tender Workspace as the focused environment for building estimates.

## 2. PROBLEM STATEMENT

Contractors manage opportunities across spreadsheets, emails, and disconnected tools. Estimating is time-consuming and error-prone. Knowledge from completed projects doesn't flow back to improve future estimates.

## 3. BUSINESS OBJECTIVE

Create a unified workflow where opportunities flow naturally through their lifecycle, tenders are built with AI assistance, and every completed project makes future estimating faster and more accurate.

## 4. USER PERSONAS

| Persona | Role | Primary Actions |
|---------|------|-----------------|
| **Estimator** | Creates tenders, manages opportunities | Build estimates, track submissions |
| **Owner** | Reviews and approves | Approve tenders, monitor pipeline |
| **Project Manager** | Converts to projects | Receive awarded work, begin execution |
| **Client** (External) | Receives tenders | View proposals, approve/reject |

---

## DESIGN PHILOSOPHY

### The Three Pillars

1. **WORKFLOW FIRST** — The software follows how contractors actually work. No feature exists in isolation.
2. **PROJECT CENTRIC** — Everything connects to a project. A project is the atomic unit of contractor work.
3. **AI-FIRST** — The Company Brain participates at every stage, learning from each completed project to make the next one smarter.

### The Core Mantra
> "Every project makes the next project smarter."

When a contractor completes a project, TradeOS captures:
- What they estimated vs. what it actually cost
- Time estimates vs. actual time
- Materials quoted vs. materials used
- Margin predicted vs. margin achieved

This institutional knowledge feeds the Company Brain, which surfaces insights for future opportunities.

---

## THE OPPORTUNITY LIFECYCLE

An **Opportunity** represents a potential project from first discovery to either conversion (becomes a Project) or closure (lost/declined).

### Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPPORTUNITY LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   LEAD          TENDER           SUBMITTED        AWARDED/LOST          │
│     │              │                 │                 │                │
│     ▼              ▼                 ▼                 ▼                │
│  ┌──────┐    ┌───────────┐    ┌───────────┐    ┌─────────────┐         │
│  │Intake│───▶│ Workspace │───▶│  Pending  │───▶│  Outcome    │         │
│  └──────┘    └───────────┘    └───────────┘    └─────────────┘         │
│                                                       │                 │
│                                                       ▼                 │
│                                              ┌─────────────────┐        │
│                                              │ PROJECT (if won)│        │
│                                              └─────────────────┘        │
│                                                       │                 │
│                                                       ▼                 │
│                                              ┌─────────────────┐        │
│                                              │  COMPANY BRAIN  │        │
│                                              │   LEARNS        │        │
│                                              └─────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stage Definitions

| Stage | Status | Description | Company Brain Role |
|-------|--------|-------------|-------------------|
| **LEAD** | `lead` | Initial contact. Basic client + project info captured. | Suggests similar past projects |
| **TENDER** | `tendering` | Active work in Tender Workspace. Building the estimate. | Provides production rates, flags risks |
| **SUBMITTED** | `submitted` | Tender sent to client. Awaiting decision. | Tracks follow-up timing |
| **AWARDED** | `awarded` | Client accepted. Converts to active Project. | Captures baseline for learning |
| **LOST** | `lost` | Did not win. Capture reason for learning. | Analyzes patterns in lost tenders |
| **DECLINED** | `declined` | We chose not to pursue. | Logs reasoning for future reference |

---

## THE TENDER WORKSPACE

The **Tender Workspace** is where contractors build their estimates. It is NOT a separate feature — it exists only within an Opportunity in the `tendering` stage.

### Opening the Tender Workspace

```
Opportunity (tendering) → Open Tender Workspace → Build Estimate → Submit
```

The Tender Workspace is a focused environment containing:
1. **Scope Builder** — Define what work is included
2. **Cost Assembly** — Build up costs (labor, materials, equipment)
3. **Pricing Strategy** — Apply markup, overhead, profit
4. **Document Package** — Attach drawings, specs, notes
5. **Review & Submit** — Final checks before sending

### Workspace Layout (Conceptual)

```
┌────────────────────────────────────────────────────────────────────────┐
│ TENDER WORKSPACE                                           [Opportunity]│
│ 456 King St - Commercial Renovation                        Two Fungis  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────┐│
│  │   SECTIONS   │  │              ACTIVE SECTION                      ││
│  ├──────────────┤  │                                                  ││
│  │ □ Scope      │  │  ┌─────────────────────────────────────────────┐ ││
│  │ ■ Costs      │  │  │ DRYWALL INSTALLATION                        │ ││
│  │ □ Pricing    │  │  │                                             │ ││
│  │ □ Documents  │  │  │ Area: 2,400 sq ft                           │ ││
│  │ □ Review     │  │  │ Production Rate: 45 sq ft/hr (from library) │ ││
│  │              │  │  │ Labor Hours: 53.3 hrs                       │ ││
│  │              │  │  │ Labor Cost: $2,665 (@ $50/hr)               │ ││
│  │              │  │  │ Materials: $1,920 (@ $0.80/sq ft)           │ ││
│  │              │  │  │ ─────────────────────────────────           │ ││
│  │              │  │  │ Line Total: $4,585                          │ ││
│  │              │  │  └─────────────────────────────────────────────┘ ││
│  │              │  │                                                  ││
│  │              │  │  [+ Add Line Item]                               ││
│  │              │  │                                                  ││
│  └──────────────┘  └──────────────────────────────────────────────────┘│
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ COMPANY BRAIN                                                     │  │
│  │ ─────────────────────────────────────────────────────────────────│  │
│  │ "Your drywall rate of 45 sq ft/hr matches your 6-month average.  │  │
│  │  However, the last 3 commercial jobs averaged 42 sq ft/hr.       │  │
│  │  Consider using 42 for commercial projects."                      │  │
│  │                                                                   │  │
│  │ [Use 42 sq ft/hr] [Keep 45 sq ft/hr] [Ask for details]           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────┬──────────────┐│
│  │ Subtotal: $24,850   Markup (25%): $6,212            │ TOTAL        ││
│  │ Overhead (10%): $2,485   Contingency (5%): $1,243   │ $34,790      ││
│  └─────────────────────────────────────────────────────┴──────────────┘│
│                                                                         │
│  [Save Draft]                              [Preview PDF]  [Submit Tender]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## COMPANY BRAIN INTEGRATION

The Company Brain is present at every stage of the Opportunity lifecycle, not as a separate feature, but as an embedded intelligence layer.

### Brain Touchpoints by Stage

#### LEAD Stage
- **Auto-enrich:** When client/address is entered, Brain searches for past projects at same location or with same client
- **Similar Projects:** "You did similar work for ABC Corp in 2024. Want to review that project?"
- **Risk Flags:** "This client has 2 overdue invoices from past projects."

#### TENDER Stage (Workspace Active)
- **Production Rates:** Pulls rates from Production Library, suggests adjustments based on job type
- **Historical Comparison:** "Your average drywall cost on commercial jobs is $1.92/sq ft. You're estimating $1.80."
- **Missing Items:** "Commercial jobs usually include fire blocking. Did you account for this?"
- **Margin Analysis:** "At this markup, your margin will be 18%. Your target is 22%."

#### SUBMITTED Stage
- **Follow-up Reminders:** "It's been 7 days since submission. Time to follow up?"
- **Win Probability:** Based on historical data, estimates likelihood of winning

#### AWARDED Stage (Conversion to Project)
- **Baseline Capture:** Stores the estimate as the baseline for actual vs. estimated comparison
- **Scheduling Suggestion:** "Based on scope, this project will take ~3 weeks. Start date options?"
- **Resource Check:** "You have 2 other active projects. Team capacity may be tight."

#### LOST/DECLINED Stage
- **Post-Mortem:** "Why was this opportunity lost?" (captures structured reasons)
- **Pattern Analysis:** "You've lost 3 of the last 5 commercial over $50k. Common factor: pricing."

---

## DATA MODEL

### Opportunity

```
opportunity {
  id: uuid
  company_id: uuid
  
  -- Basic Info
  name: string              -- "456 King St Renovation"
  description: text
  status: enum              -- lead, tendering, submitted, awarded, lost, declined
  
  -- Client Link
  client_id: uuid (FK)
  contact_id: uuid (FK)
  
  -- Location
  address: string
  city: string
  province: string
  
  -- Classification
  project_type: enum        -- commercial, residential, industrial
  trade_category: string    -- e.g., "Finishing", "Drywall", "Painting"
  
  -- Value
  estimated_value: decimal  -- Total tender amount
  
  -- Timeline
  tender_due_date: timestamp
  decision_expected_date: timestamp
  project_start_date: timestamp (estimated)
  
  -- Source
  lead_source: string       -- e.g., "Referral", "Website", "Repeat Client"
  
  -- Outcome (populated when closed)
  outcome_reason: text      -- Why won/lost/declined
  outcome_date: timestamp
  
  -- Conversion
  converted_project_id: uuid (FK, nullable)
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid
  assigned_to: uuid
}
```

### Tender (The Estimate Document)

```
tender {
  id: uuid
  opportunity_id: uuid (FK)
  version: integer          -- Supports revisions
  
  -- Status
  status: enum              -- draft, submitted, superseded
  
  -- Summary Totals
  subtotal: decimal
  markup_percent: decimal
  markup_amount: decimal
  overhead_percent: decimal
  overhead_amount: decimal
  contingency_percent: decimal
  contingency_amount: decimal
  total: decimal
  
  -- Dates
  valid_until: date
  submitted_at: timestamp
  
  -- Document
  pdf_url: string           -- Generated PDF
  notes_to_client: text
  terms_and_conditions: text
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### Tender Line Items

```
tender_line_item {
  id: uuid
  tender_id: uuid (FK)
  
  -- Organization
  section: string           -- e.g., "Drywall", "Painting", "Trim"
  sort_order: integer
  
  -- Description
  description: string
  unit: string              -- "sq ft", "linear ft", "each", "hours"
  quantity: decimal
  
  -- Costing
  material_unit_cost: decimal
  material_total: decimal
  labor_hours: decimal
  labor_rate: decimal
  labor_total: decimal
  equipment_cost: decimal
  
  -- Line Total
  line_total: decimal
  
  -- Production Library Link
  production_item_id: uuid (FK, nullable)  -- Links to Production Library for rate tracking
  
  -- Metadata
  notes: text
}
```

### Opportunity Activity (Audit Trail)

```
opportunity_activity {
  id: uuid
  opportunity_id: uuid (FK)
  
  event_type: enum          -- created, status_changed, tender_created, tender_submitted, note_added, etc.
  event_data: jsonb         -- Structured event details
  
  created_at: timestamp
  created_by: uuid
}
```

---

## API ENDPOINTS

### Opportunities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/opportunities` | GET | List opportunities (with filters) |
| `/api/opportunities` | POST | Create new opportunity |
| `/api/opportunities/{id}` | GET | Get opportunity details |
| `/api/opportunities/{id}` | PATCH | Update opportunity |
| `/api/opportunities/{id}/status` | PATCH | Change status (with validation) |
| `/api/opportunities/{id}/convert` | POST | Convert awarded opportunity to project |
| `/api/opportunities/{id}/activity` | GET | Get opportunity activity log |

### Tenders (within Opportunity context)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/opportunities/{id}/tenders` | GET | List tenders for opportunity |
| `/api/opportunities/{id}/tenders` | POST | Create new tender (draft) |
| `/api/opportunities/{id}/tenders/{tender_id}` | GET | Get tender details with line items |
| `/api/opportunities/{id}/tenders/{tender_id}` | PATCH | Update tender |
| `/api/opportunities/{id}/tenders/{tender_id}/submit` | POST | Submit tender to client |
| `/api/opportunities/{id}/tenders/{tender_id}/pdf` | GET | Generate/retrieve PDF |

### Tender Line Items

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tenders/{tender_id}/items` | GET | List line items |
| `/api/tenders/{tender_id}/items` | POST | Add line item |
| `/api/tenders/{tender_id}/items/{item_id}` | PATCH | Update line item |
| `/api/tenders/{tender_id}/items/{item_id}` | DELETE | Remove line item |
| `/api/tenders/{tender_id}/items/reorder` | POST | Reorder items |

### Company Brain (Opportunity Context)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brain/opportunity/{id}/insights` | GET | Get Brain insights for opportunity |
| `/api/brain/opportunity/{id}/similar` | GET | Find similar past projects |
| `/api/brain/tender/{id}/analyze` | GET | Analyze tender for risks/suggestions |
| `/api/brain/tender/{id}/rate-check` | POST | Check line item rates against history |

---

## USER INTERFACE FLOW

### 1. Opportunities List (Entry Point)

From the Mainframe, user clicks "Opportunities" to see all opportunities in a kanban or list view:

```
┌────────────────────────────────────────────────────────────────────────┐
│ OPPORTUNITIES                                        [+ New Opportunity]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  ┌─────────┐  │
│  │  LEADS  │  │ TENDERING │  │ SUBMITTED │  │ AWARDED │  │  LOST   │  │
│  │   (3)   │  │    (2)    │  │    (4)    │  │   (1)   │  │   (2)   │  │
│  └─────────┘  └───────────┘  └───────────┘  └─────────┘  └─────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 456 King St Renovation        Commercial    $34,790   Due: Jul 18│   │
│  │ ABC Corp                      TENDERING                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 789 Queen St Office           Commercial    $52,000   Due: Jul 25│   │
│  │ XYZ Holdings                  LEAD                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Opportunity Detail View

Clicking an opportunity opens its detail view:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                     [More ▼]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  456 King St - Commercial Renovation                                    │
│  ABC Corporation                                    Status: TENDERING   │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ COMPANY BRAIN                                                    │   │
│  │ "You've done 3 projects for ABC Corp. Average margin: 24%.       │   │
│  │  They typically accept quotes within 5 days."                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│  │   Details   │   Tender    │  Documents  │  Activity   │             │
│  └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                         │
│  Client: ABC Corporation              Due Date: July 18, 2026          │
│  Contact: John Smith                  Est. Value: $34,790              │
│  Address: 456 King St, Toronto        Type: Commercial                 │
│  Lead Source: Repeat Client           Trade: Finishing                 │
│                                                                         │
│  CURRENT TENDER                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Draft v1                                          $34,790        │   │
│  │ Last edited: 2 hours ago                                         │   │
│  │                                                                   │   │
│  │ [Open Tender Workspace]                      [Preview] [Submit]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Move to Submitted]  [Mark as Lost]  [Decline Opportunity]            │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Tender Workspace (Full Screen Focus Mode)

Clicking "Open Tender Workspace" enters the focused estimating environment (see layout in Section 3 above).

---

## STATUS TRANSITIONS

Valid status changes (enforced by API):

```
lead → tendering         (Start working on tender)
lead → declined          (Choose not to pursue)

tendering → submitted    (Send tender to client)
tendering → declined     (Choose not to pursue)

submitted → awarded      (Client accepted)
submitted → lost         (Client rejected or chose competitor)
submitted → tendering    (Revise and resubmit)

awarded → [PROJECT]      (Automatic conversion)
```

Invalid transitions (API rejects):
- `lost → awarded` (Cannot resurrect lost opportunity)
- `awarded → lost` (Cannot un-award)
- `declined → tendering` (Cannot resurrect declined)

---

## PROJECT CONVERSION

When an opportunity is marked as `awarded`:

1. **Validation:** Tender must exist and be in `submitted` status
2. **Project Creation:** System creates a new Project with:
   - Name, client, address copied from Opportunity
   - Budget set to tender total
   - Link back to source opportunity
3. **Baseline Capture:** Tender line items become the budget baseline
4. **Learning Setup:** Company Brain flags this project for actual-vs-estimated tracking
5. **Opportunity Archived:** Opportunity status = `awarded`, `converted_project_id` set

```
POST /api/opportunities/{id}/convert

Response:
{
  "opportunity_id": "...",
  "project_id": "...",      // The newly created project
  "message": "Opportunity converted to project successfully"
}
```

---

## COMPANY BRAIN LEARNING LOOP

### The Learning Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY BRAIN LEARNING LOOP                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. ESTIMATE                    2. EXECUTE                      │
│   ┌─────────────┐               ┌─────────────┐                 │
│   │ Tender      │               │ Project     │                 │
│   │ $34,790     │──────────────▶│ Actual Work │                 │
│   │ 53 hrs labor│               │ Track Time  │                 │
│   └─────────────┘               └─────────────┘                 │
│                                        │                         │
│                                        ▼                         │
│                                 3. CAPTURE                       │
│                                 ┌─────────────┐                  │
│                                 │ Actual Cost │                  │
│                                 │ $36,200     │                  │
│                                 │ 58 hrs labor│                  │
│                                 └─────────────┘                  │
│                                        │                         │
│                                        ▼                         │
│                                  4. LEARN                        │
│                                 ┌─────────────┐                  │
│                                 │ Variance    │                  │
│                                 │ +$1,410     │                  │
│                                 │ +5 hrs      │                  │
│                                 └─────────────┘                  │
│                                        │                         │
│                                        ▼                         │
│   5. IMPROVE                                                     │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │ COMPANY BRAIN INSIGHT:                                     │ │
│   │ "Commercial drywall takes 9% longer than you estimate.     │ │
│   │  Adjusting your default rate from 45 to 41 sq ft/hr        │ │
│   │  would have predicted this project accurately."            │ │
│   │                                                            │ │
│   │ [Apply to Production Library]  [Dismiss]  [Learn More]     │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                        │                         │
│                                        ▼                         │
│                           NEXT ESTIMATE IS SMARTER               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Gets Learned

| Data Point | Source | Learning Application |
|------------|--------|---------------------|
| Labor hours per unit | Tender vs. Project timesheets | Refine production rates |
| Material costs | Tender vs. Expense receipts | Update material pricing |
| Markup effectiveness | Tender price vs. acceptance | Optimize pricing strategy |
| Project duration | Estimated vs. actual dates | Improve scheduling |
| Change orders | Unplanned scope additions | Flag common scope creep |
| Client behavior | Response times, payment patterns | Predict client interactions |

---

## IMPLEMENTATION PHASES

### Phase 1: Opportunity Foundation
- Opportunity CRUD (create, read, update, status changes)
- Status workflow with validation
- Opportunity list view (kanban optional, list required)
- Opportunity detail view
- Activity logging

### Phase 2: Tender Workspace
- Tender creation within opportunity
- Line item management (add, edit, delete, reorder)
- Section organization
- Totals calculation (subtotal, markup, overhead, contingency)
- Save draft functionality

### Phase 3: Tender Submission & PDF
- PDF generation with professional formatting
- Submit workflow (status change + record keeping)
- Tender versioning (revise and resubmit)

### Phase 4: Project Conversion
- Convert awarded opportunity to project
- Copy relevant data to project
- Establish baseline for tracking

### Phase 5: Company Brain Integration
- Similar project suggestions
- Production rate recommendations
- Risk and gap analysis
- Post-project learning capture

---

## ACCEPTANCE CRITERIA

| Criteria | Test |
|----------|------|
| Opportunity CRUD | Can create, view, edit, delete opportunities |
| Status Workflow | Status transitions follow defined rules |
| Tender Creation | Can create tender within opportunity |
| Line Item Management | Can add, edit, delete, reorder line items |
| Totals Calculation | Subtotal, markup, overhead, contingency calculate correctly |
| PDF Generation | Can generate professional tender PDF |
| Status Submission | Can submit tender, status changes correctly |
| Project Conversion | Awarded opportunity converts to project with baseline |
| Company Brain | Brain provides insights at each lifecycle stage |
| Data Isolation | All data properly scoped to organization |

---

## SECURITY & PERMISSIONS

Per Specification 1.5, access to Opportunity and Tender features is role-based:

| Role | Opportunities | Tenders | Submit |
|------|---------------|---------|--------|
| Owner | Full | Full | Yes |
| Admin | Full | Full | Yes |
| Estimator | Full | Full | Yes |
| Project Manager | View | View | No |
| Office Admin | View | No | No |
| Others | No | No | No |

---

## AUTOMATION OPPORTUNITIES

| Automation | Trigger | Action |
|------------|---------|--------|
| Follow-up Reminder | Tender submitted 7 days ago | Notify to follow up |
| Due Date Warning | Tender due in 48 hours | Notify estimator |
| Auto-Archive | Opportunity lost 30 days ago | Move to archive |
| Baseline Capture | Opportunity awarded | Auto-create project baseline |
| Rate Suggestions | Line item added | Suggest from Production Library |

---

## COMPETITIVE CONTEXT

| Competitor | Approach | TradeOS Differentiation |
|------------|----------|------------------------|
| **Buildxact** | Estimating-focused, separate from project management | Integrated lifecycle: Opportunity → Project |
| **Procore** | Estimating as add-on module | Estimating is native, Company Brain assists |
| **Clear Estimates** | Template-based estimating | Learning-based: improves from actuals |

TradeOS advantage: **Estimates become project baselines, actuals feed back to improve future estimates.**

---

## FUTURE EXPANSION

- Tender Templates (save and reuse)
- Client Portal (external users view/approve tenders)
- E-signature integration
- Change Order management (post-award)
- Multi-currency support
- Subcontractor quote collection

---

## DEPENDENCIES

| Dependency | Status | Notes |
|------------|--------|-------|
| Production Library | NOT YET BUILT | Required for rate suggestions |
| Project module | EXISTS | Required for conversion |
| Client/CRM module | EXISTS | Required for client linking |
| Company Brain base | EXISTS | Required for AI integration |
| PDF generation | NOT YET BUILT | Required for tender submission |

---

## OPEN QUESTIONS (All Resolved)

All open questions have been resolved per **Final Product Decisions** (July 12, 2026):

| Question | Decision |
|----------|----------|
| Kanban vs. List | **Both.** Support multiple views (Kanban, List). Future: Calendar, Timeline, Map. |
| Tender Templates | **Include from V1.** Templates are biggest time-saver. |
| Multi-tender versions | **Yes.** Full version history. Nothing ever overwritten. |
| Production Library first | **Yes.** Foundational. Build first with manual data. |
| PDF Branding | **Organization owns branding.** TradeOS provides professional defaults. |

---

## VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | July 12, 2026 | Chief Architect | Initial specification |
| 2.0.1 | July 12, 2026 | Chief Architect | Constitution compliance: added document hierarchy, personas, acceptance criteria, security, automation, competitive context |

---

## NEXT STEPS (UPON APPROVAL)

1. Create database migration for `opportunities`, `tenders`, `tender_line_items`, `opportunity_activity`
2. Implement Opportunity API endpoints
3. Build Opportunity list/detail UI
4. Implement Tender Workspace UI
5. Integrate Company Brain touchpoints
6. Test end-to-end workflow

---

**END OF SPECIFICATION 2.0**

*This document requires user approval before any implementation begins.*
