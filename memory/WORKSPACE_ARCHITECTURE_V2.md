# TradeOS Opportunity Workspace - Architecture V2
## Panel-First Operating System Design

**Version:** 2.0  
**Date:** July 12, 2026  
**Status:** Pre-Implementation Blueprint

---

## Philosophy

> "The workspace should feel like entering a physical project office."

TradeOS is not a website. It is not an application with pages. It is an **operating system** where contractors live and work. The Opportunity Workspace is the first room in this operating system.

### Core Principles

1. **Spatial, Not Navigational**  
   Users don't "navigate to pages" — they move between areas within a persistent environment.

2. **Panels, Not Pages**  
   Information appears in contextual panels that slide into view when needed, then recede when focus shifts.

3. **Ambient Intelligence, Not Destinations**  
   Company Brain is not a place to visit. It is the air in the room — present everywhere, surfacing insights naturally during work.

4. **Persistent Context**  
   The Activity Timeline is not something you check. It is the wall beside you, always visible, recording everything.

5. **IDE Mentality**  
   Like VS Code, Figma, or Linear — work happens in one environment. Panels open, dock, collapse. The workspace adapts to the current task.

---

## Spatial Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WORKSPACE HEADER                                │
│  ← Opportunities    OPP-2026-047: East Peak Tower B                         │
│                     Westbank Corp · Vancouver · $2.4M · Due in 12 days      │
│                                                            [TENDERING ▼]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────┬──────────────┐ │
│  │                                                         │              │ │
│  │                                                         │   TIMELINE   │ │
│  │                   PRIMARY WORKSPACE                     │   PANEL      │ │
│  │                                                         │              │ │
│  │   ┌───────────────┬───────────────┬───────────────┐     │  ──────────  │ │
│  │   │ Command       │    Tender     │  Information  │     │  2h ago      │ │
│  │   │ Center        │               │               │     │  RFI-003...  │ │
│  │   └───────────────┴───────────────┴───────────────┘     │              │ │
│  │                                                         │  Yesterday   │ │
│  │   ╔═══════════════════════════════════════════════╗     │  Estimate... │ │
│  │   ║                                               ║     │              │ │
│  │   ║           ACTIVE CONTENT AREA                 ║     │  3 days ago  │ │
│  │   ║                                               ║     │  Site visit  │ │
│  │   ║   (Command Center / Tender / Information)     ║     │              │ │
│  │   ║                                               ║     │              │ │
│  │   ╚═══════════════════════════════════════════════╝     │              │ │
│  │                                                         │              │ │
│  │   ┌─────────────────────────────────────────────────┐   │  [Filter ▼]  │ │
│  │   │ 💡 BRAIN: Your labor rate is 15% below market   │   │              │ │
│  │   │    for this project type. Consider adjusting.   │   │              │ │
│  │   └─────────────────────────────────────────────────┘   │              │ │
│  │                                                         │              │ │
│  └─────────────────────────────────────────────────────────┴──────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  CONTEXTUAL PANEL DOCK                                               │   │
│  │  [Documents 📄 3] [RFIs ❓ 2] [Communications 💬] [Site Notes 📍]     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. WORKSPACE HEADER (Persistent)

The header is the **ceiling** — always visible, providing orientation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Opportunities                                                             │
│                                                                             │
│ OPP-2026-047                                   $2.4M        Due: Jul 24     │
│ East Peak Tower B                              ───────      ───────────     │
│ Westbank Corp · Vancouver, BC                  Value        12 days left    │
│                                                                             │
│                                                      [TENDERING ▼] [⋯]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Back Context:** "← Opportunities" (breadcrumb, not navigation)
- **Identity:** Reference number, name
- **Client & Location:** One-line context
- **Key Metrics:** Value, Due Date with countdown
- **Stage Badge:** Interactive dropdown to change workflow stage
- **Actions Menu:** Edit, Archive, Delete (collapsed)

**No:** Submit Proposal button here. That action belongs in the Tender area.

---

### 2. PRIMARY WORKSPACE (3 Sections)

Three tabs — and only three. These represent the **rooms** within the workspace.

#### A. Command Center
**Purpose:** "What needs my attention right now?"

This is not a dashboard. This is a **priority queue**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚡ FOCUS                                                           │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  🔴 RFI-003: Door hardware spec clarification                      │   │
│  │     Overdue by 3 days · From: Smith Architecture                   │   │
│  │     💡 Similar RFIs averaged 2-day response time                   │   │
│  │                                               [Respond →]          │   │
│  │                                                                     │   │
│  │  🟡 Tender due in 12 days                                          │   │
│  │     Estimate: 72% complete · $1.84M of $2.4M estimated             │   │
│  │     Missing: Drywall section, Equipment costs                      │   │
│  │                                               [Continue →]         │   │
│  │                                                                     │   │
│  │  🟢 Drawing Rev C uploaded yesterday                               │   │
│  │     Architectural set · 47 sheets · Changes detected               │   │
│  │     💡 Review structural sheets first — highest impact             │   │
│  │                                               [Review →]           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  TENDER STATUS                 │  │  KEY CONTACTS                  │   │
│  │  ────────────────────────────  │  │  ────────────────────────────  │   │
│  │  Version: 3 (Draft)            │  │  Client: James Wong            │   │
│  │  Total: $1,847,200             │  │         jwong@westbank.ca      │   │
│  │  Confidence: 65%               │  │                                │   │
│  │                                │  │  Architect: Smith Architecture │   │
│  │  ████████████░░░░░ 72%         │  │            info@smitharch.ca   │   │
│  │                                │  │                                │   │
│  │            [Open Tender →]     │  │            [Call] [Email]      │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Items sorted by urgency (overdue → due soon → informational)
- Each item has ONE primary action button
- Brain insights appear inline, not in a separate section
- No more than 5-7 items visible (prioritization, not enumeration)

---

#### B. Tender
**Purpose:** Build estimates, generate proposals, submit.

This is where **the work happens**. The Tender area is itself a mini-IDE.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TENDER                                                    v3 Draft         │
│                                                                             │
│  ┌────────────────┬────────────────┬────────────────┐                      │
│  │   Estimate     │    Proposal    │    History     │                      │
│  └────────────────┴────────────────┴────────────────┘                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ESTIMATE BUILDER                                                   │   │
│  │  ───────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │  ▼ DRYWALL                                           $487,200      │   │
│  │    ├─ Level 5 finish, floors 1-12        $312,000                  │   │
│  │    │  💡 Your avg rate: $4.20/sf · This bid: $3.90/sf             │   │
│  │    ├─ Shaft walls, Type X                $98,400                   │   │
│  │    └─ Bulkheads and soffits              $76,800                   │   │
│  │                                                                     │   │
│  │  ▼ PAINTING                                          $234,600      │   │
│  │    ├─ Prime and 2-coat walls             $156,400                  │   │
│  │    └─ Specialty finishes                 $78,200                   │   │
│  │                                                                     │   │
│  │  ▷ ACOUSTIC (collapsed)                              $89,400       │   │
│  │  ▷ TRIM (collapsed)                                  $156,200      │   │
│  │                                                                     │   │
│  │  [+ Add Section]                                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUMMARY                                                            │   │
│  │  Subtotal        $967,400    Overhead (8%)     $77,392             │   │
│  │  Markup (12%)    $116,088    Profit (10%)      $96,740             │   │
│  │  Contingency (5%) $48,370    Tax (12%)        $156,719             │   │
│  │                                                                     │   │
│  │                              TOTAL            $1,462,709            │   │
│  │                                                                     │   │
│  │                         [Preview Proposal]  [Submit Tender →]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sub-sections within Tender:**
- **Estimate:** Line item builder (primary view)
- **Proposal:** Document preview/editor for client-facing content
- **History:** Version comparison, submitted tenders, outcomes

**Rules:**
- Brain suggestions appear inline (per line item, not in a panel)
- Collapsible sections for focus
- Real-time totals always visible
- Submit action prominent when estimate is complete

---

#### C. Information
**Purpose:** Reference material that supports the work.

This consolidates what were previously 5 separate tabs into one organized area.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INFORMATION                                                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SEARCH: ___________________________  [Filter: All ▼]               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │ Documents      │ │ RFIs           │ │ Communications │ │ Site Notes   │ │
│  │     12         │ │     3          │ │      8         │ │     2        │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ └──────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RECENT ITEMS                                                       │   │
│  │                                                                     │   │
│  │  📄 Architectural Drawings Rev C              Yesterday   47 sheets │   │
│  │  ❓ RFI-003: Door hardware clarification      3 days ago  OVERDUE   │   │
│  │  💬 Email from Smith Architecture             3 days ago            │   │
│  │  📄 Structural Drawings Rev B                 1 week ago  23 sheets │   │
│  │  📍 Site Visit Notes - Initial walkthrough    2 weeks ago           │   │
│  │  ❓ RFI-002: Ceiling height confirmation      2 weeks ago  ANSWERED │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Showing all items · Sort by: Recent ▼                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Unified search across all information types
- Category cards show counts at a glance
- Clicking a category filters the list
- Items sorted by recency by default
- Clicking an item opens it in a **slide-over panel** (not a new page)

---

### 3. TIMELINE PANEL (Persistent Right Side)

The Timeline is not a destination. It is the **wall beside you**.

```
┌──────────────────┐
│  TIMELINE    [×] │
│  ───────────────│
│  Filter: All ▼   │
│                  │
│  TODAY           │
│  ────────────── │
│  2h ago          │
│  RFI-003 sent    │
│  to Smith Arch   │
│  ·               │
│  9:00 AM         │
│  Stage changed   │
│  → Tendering     │
│                  │
│  YESTERDAY       │
│  ────────────── │
│  4:30 PM         │
│  Drawing Rev C   │
│  uploaded        │
│  ·               │
│  11:00 AM        │
│  Estimate v3     │
│  created         │
│                  │
│  LAST WEEK       │
│  ────────────── │
│  Jul 8           │
│  Site visit      │
│  completed       │
│  ·               │
│  Jul 7           │
│  Opportunity     │
│  created         │
│                  │
│  ──────────────│
│  [Load more]     │
└──────────────────┘
```

**Behaviors:**
- **Default:** Visible on desktop, collapsed on mobile
- **Collapsible:** User can collapse to gain full workspace width
- **Filterable:** All | Documents | RFIs | Estimates | Communications
- **Clickable:** Each entry links to the source item
- **Persistent:** Stays visible when switching between Command Center / Tender / Information

---

### 4. AMBIENT BRAIN (Not a Panel)

Company Brain does not exist as a destination. It exists **within the work**.

**Manifestations:**

#### A. Inline Suggestions (In Estimate Builder)
```
├─ Level 5 finish, floors 1-12        $312,000
│  💡 Your avg rate: $4.20/sf · This bid: $3.90/sf — Review?
```

#### B. Context Cards (In Command Center Focus Items)
```
🔴 RFI-003: Door hardware spec clarification
   Overdue by 3 days · From: Smith Architecture
   💡 Similar RFIs averaged 2-day response — prioritize today
```

#### C. Passive Insights (Bottom of Primary Workspace)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💡 BRAIN: This project resembles "Oakridge Centre Phase 2" (2024).         │
│    Win rate for similar scope: 72%. Consider referencing that estimate.    │
│                                                      [View Reference →]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Brain suggestions are **dismissible** (don't repeat once dismissed)
- Brain suggestions are **actionable** (always include a verb)
- Brain suggestions are **contextual** (appear where relevant, not globally)
- Brain **never interrupts** — suggestions appear in natural pauses, not during active typing

---

### 5. CONTEXTUAL PANEL DOCK (Bottom)

Quick access to supporting panels that **slide up** when needed.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Documents 📄 12] [RFIs ❓ 3] [Communications 💬 8] [Site Notes 📍 2]    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Clicking a dock item **slides up a panel** from the bottom (like a drawer)
- Panel overlays the content area (50% height by default)
- Panel can be **expanded** to full height or **collapsed** to dock
- Panel can be **detached** into a floating window (future)
- Multiple panels cannot be open simultaneously (one at a time)

**Example: Documents Panel Open**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRIMARY WORKSPACE                                          │ TIMELINE     │
│  (dimmed)                                                   │              │
│                                                             │              │
├─────────────────────────────────────────────────────────────┤              │
│  DOCUMENTS                                          [↑] [×] │              │
│  ───────────────────────────────────────────────────────── │              │
│  Search: _______________  Type: All ▼  Sort: Recent ▼      │              │
│                                                             │              │
│  📁 Architectural                                           │              │
│     📄 Drawings Rev C (Current)         Jul 11   47 sheets │              │
│     📄 Drawings Rev B (Superseded)      Jul 2    45 sheets │              │
│                                                             │              │
│  📁 Structural                                              │              │
│     📄 Drawings Rev B                   Jul 5    23 sheets │              │
│                                                             │              │
│  📁 Specifications                                          │              │
│     📄 Project Manual                   Jun 28   1 file    │              │
│                                                             │              │
│                                              [+ Upload]     │              │
└─────────────────────────────────────────────────────────────┴──────────────┘
```

---

## Interaction Patterns

### Navigation Within Workspace

| From | To | Method |
|------|-----|--------|
| Command Center | Tender | Click "Tender" tab |
| Command Center | RFI-003 | Click action → RFI panel slides up |
| Tender | Specific Drawing | Click drawing reference → Documents panel slides up |
| Anywhere | Timeline Item | Click timeline entry → Opens relevant panel |
| Anywhere | Close Panel | Click [×] or click outside panel |

### Panel Behaviors

| Action | Result |
|--------|--------|
| Click dock item | Panel slides up (50% height) |
| Click [↑] | Panel expands to full height |
| Click [↓] | Panel collapses to 50% |
| Click [×] | Panel closes, returns to dock |
| Click outside | Panel closes |
| Press Escape | Panel closes |

### Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `1` | Go to Command Center |
| `2` | Go to Tender |
| `3` | Go to Information |
| `D` | Toggle Documents panel |
| `R` | Toggle RFIs panel |
| `T` | Toggle Timeline |
| `Esc` | Close any open panel |
| `/` | Focus search |

---

## Universal Workspace Pattern

This architecture becomes the **template** for every future workspace.

### Template Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKSPACE HEADER                                                           │
│  [← Parent Context]  [Entity Name]  [Key Metrics]  [Stage Badge]  [Actions]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┬──────────────┐ │
│  │                                                         │              │ │
│  │  PRIMARY WORKSPACE                                      │   TIMELINE   │ │
│  │  ┌─────────────────────────────────────────────┐       │   PANEL      │ │
│  │  │  [Tab 1]  [Tab 2]  [Tab 3]                  │       │              │ │
│  │  └─────────────────────────────────────────────┘       │   (Always    │ │
│  │                                                         │    visible)  │ │
│  │  ╔═══════════════════════════════════════════════╗     │              │ │
│  │  ║  CONTENT AREA                                 ║     │              │ │
│  │  ║  (Specific to workspace type)                 ║     │              │ │
│  │  ╚═══════════════════════════════════════════════╝     │              │ │
│  │                                                         │              │ │
│  │  ┌─────────────────────────────────────────────────┐   │              │ │
│  │  │ 💡 AMBIENT BRAIN SUGGESTION                     │   │              │ │
│  │  └─────────────────────────────────────────────────┘   │              │ │
│  │                                                         │              │ │
│  └─────────────────────────────────────────────────────────┴──────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  CONTEXTUAL PANEL DOCK  [Panel A] [Panel B] [Panel C]                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workspace Instances

| Workspace | Tab 1 | Tab 2 | Tab 3 | Dock Panels |
|-----------|-------|-------|-------|-------------|
| **Opportunity** | Command Center | Tender | Information | Documents, RFIs, Comms, Sites |
| **Project** | Dashboard | Schedule | Costs | Documents, Changes, Photos, Team |
| **Client** | Overview | Opportunities | Projects | Contacts, History, Notes |
| **Invoice** | Line Items | Payments | Documents | Communications, History |
| **Employee** | Profile | Assignments | Time | Documents, Notes, Reviews |

---

## Responsive Behavior

### Desktop (1200px+)
- Full layout as described
- Timeline visible by default
- Panel dock at bottom

### Tablet (768px - 1199px)
- Timeline collapsed by default (toggle button)
- Panel dock remains
- Content area full width when Timeline collapsed

### Mobile (< 768px)
- Timeline accessed via button (slides in from right)
- Contextual panels slide up full-screen
- Header condensed (metrics move to dropdown)
- Tabs become bottom navigation

---

## Implementation Phases

### Phase 1: Core Structure
1. Build workspace shell with header, primary area, timeline, dock
2. Implement Command Center as priority queue
3. Build panel slide-up mechanism
4. Make Timeline persistent and filterable

### Phase 2: Tender Integration
1. Build Estimate Builder within Tender tab
2. Implement inline Brain suggestions
3. Add Proposal preview/editor
4. Connect to existing tender API

### Phase 3: Information Consolidation
1. Build unified Information tab
2. Implement document/RFI/communication panels
3. Add cross-search functionality
4. Connect to existing APIs

### Phase 4: Polish & Patterns
1. Keyboard shortcuts
2. Animation refinements
3. Mobile responsive adaptation
4. Extract Universal Workspace Template component

---

## Success Metrics

The redesigned workspace succeeds if:

1. **5-Second Test:** User can identify what needs attention within 5 seconds
2. **Zero-Navigation Ideal:** Most tasks completable without clicking tabs
3. **IDE Fluency:** Power users can work entirely with keyboard
4. **Ambient Brain:** Users report Brain suggestions feel "helpful, not intrusive"
5. **Timeline Value:** Users reference Timeline at least once per session
6. **Consistency:** Other workspaces feel immediately familiar

---

## Approval Checklist

- [x] Three primary sections (Command Center, Tender, Information)
- [x] Timeline as persistent panel, not tab
- [x] Company Brain as ambient intelligence, not destination
- [x] Contextual panels via dock, not navigation
- [x] IDE-style single-environment philosophy
- [x] Universal template applicable to future workspaces

---

**Status:** Ready for implementation approval.

**Next Step:** Build workspace shell and Command Center as first implementation milestone.
