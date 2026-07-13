# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," an end-to-end operating system for Canadian contractors. The application includes:
- Project Management
- Commercial Estimating
- Client & CRM
- Scheduling
- Company Brain AI
- Document Management
- Invoicing & Expenses
- Milestones & Receivables
- Contractor Marketplace
- Team Management
- Business Intelligence
- **Command Center** - Enterprise command center for multi-project operations ✅ COMPLETE

## Brand Identity (Updated July 12, 2026)
- **Positioning:** "The Operating System for Canadian Contractors"
- **Tagline:** "Run Your Entire Business. One Platform."
- **Color Palette:** Black (#0a0a0a), Deep Charcoal (#111111), Emerald Green accents
- **Target Market:** Canadian commercial and residential contractors

---

## V2 FOUNDATION LOCK ✅ COMPLETE (July 12, 2026)

### Architectural Freeze Status
The TradeOS V2 Foundation has been officially locked and stabilized.

| Component | Status | Description |
|-----------|--------|-------------|
| Workspace Shell | ✅ STABLE | Universal workspace container |
| Command Center | ✅ STABLE | Priority-driven landing experience |
| Organization Routing | ✅ STABLE | Organization-first authentication |
| Sidebar Architecture | ✅ STABLE | Workflow-oriented navigation |
| Universal Workspace Pattern | ✅ STABLE | Panel-first design |
| Panel Dock System | ✅ STABLE | Contextual sliding panels |
| Company Brain Integration | ✅ STABLE | AI integration points |
| Core API Organization | ✅ STABLE | /api/workspace, /api/organizations |

### Foundation Lock Deliverables
- ✅ Legacy TFCS authorization removed
- ✅ All "TFCS Mainframe" references updated to "TradeOS"
- ✅ Brand consistency audit complete
- ✅ Repository cleanup complete
- ✅ `/app/VISION.md` created (architectural north star)
- ✅ Design system documented
- ✅ Deployment verification complete

### Key Reference Document
**See `/app/VISION.md` for the permanent architectural north star.**

---

## PHASE 2 ARCHITECTURE (July 12, 2026)

### V2 Architecture Consolidation ✅ COMPLETE (July 12, 2026)
**Eliminated dual application architecture — TradeOS is now ONE unified operating system**

**Architectural Decision:**
- ALL authenticated users enter the same V2 environment
- Command Center is the universal entry point
- No conditional UI based on workspace access
- Onboarding happens INSIDE the application via progressive disclosure

**Legacy Components Removed:**
- ❌ `MainframePage.jsx` - Deleted (orphaned TFCS legacy)
- ❌ `DashboardPage.jsx` - Deleted (legacy ERP dashboard)
- ❌ `AICopilot.jsx` - Deleted (replaced by Company Brain)
- ❌ `QuickAddFab.jsx` - Deleted (replaced by Quick Add panel)
- ❌ `DashboardRedirect.jsx` - Deleted (routing now direct)
- ❌ `EstimatingPage.jsx` - Deleted (replaced by Production Library)

---

### Phase 2: Company Knowledge Engine ✅ FOUNDATION COMPLETE (July 12, 2026)
**Build knowledge first, not quotes. The Production Library is the foundation.**

**Database Schema Created:**
- Migration: `/app/migrations/015_production_library_foundation.sql`
- Tables: `measurement_units`, `knowledge_domains`, `service_categories`, `production_items`, `production_item_service_categories`, `production_item_revisions`, `production_item_attachments`, `production_assemblies`, `assembly_items`, `historical_production_records`
- All tables have RLS policies for multi-tenant isolation
- Triggers for assembly totals and revision history

**⚠️ MIGRATION REQUIRED:** User must run the migration SQL in their Supabase database before Production Library features will work.

**Four-Level Hierarchy:**
- Level 1: Knowledge Domain (Finish Carpentry, Doors & Hardware, etc.)
- Level 2: Service Category (Residential, Commercial, etc.)
- Level 3: Production Item (the knowledge records)
- Level 4: Measurement Unit (EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, COST)

### Phase 2.1: Expanded Production Library Hierarchy 🚧 IN PROGRESS (July 13, 2026)
**Expand the Production Library to support a 6-level hierarchy for enterprise-scale estimating.**

**Six-Level Hierarchy:**
```
Knowledge Domain → Service Category → Area → Phase → Division → Production Item
```

**New Tables (Migration 016):**
- `production_areas` - Physical/logical project sections (Lobby, Corridors, Suites, Parking)
- `production_phases` - Construction stages (Framing, Rough-In, Finishing, Punchlist)
- `production_divisions` - CSI MasterFormat divisions (06-Wood & Plastics, 09-Finishes)
- `trade_disciplines` - Trade classifications (Carpentry, Millwork, Painting)
- `cost_codes` - Job costing integration

**Expanded Production Item Fields:**
- Production metrics: `production_output` (per hour), `production_per_day`, `crew_size`, `labour_hours`
- Labour rates: `low_labour_rate`, `standard_rate`, `premium_labour_rate`
- Material & Equipment: `material_rate`, `equipment_rate`
- Classification: `division_id`, `trade_discipline`, `cost_code`, `tags`
- Archival: `archived_at`, `archived_by`, `archive_reason`

**New API Endpoints:**
- `/api/production-library/areas` - CRUD for production areas
- `/api/production-library/phases` - CRUD for production phases
- `/api/production-library/divisions` - CRUD for divisions (CSI MasterFormat)
- `/api/production-library/trade-disciplines` - CRUD for trade disciplines
- `/api/production-library/cost-codes` - CRUD for cost codes
- `/api/production-library/hierarchy` - Full hierarchy stats and navigation tree
- `/api/production-library/seed/v2` - Seed default CSI divisions, trades, areas, phases

**Frontend Components:**
- `ProductionHierarchyManager.jsx` - Management UI for all hierarchy levels
- Integrated into Production Library Workspace under "Hierarchy Settings" nav item

**⚠️ MIGRATION REQUIRED:** User must run `/app/migrations/016_expanded_production_library.sql` in Supabase to enable the expanded hierarchy.

**API Endpoints Created:**
- `/api/production-library/units` - Controlled measurement unit lookup
- `/api/production-library/domains` - Knowledge domains CRUD
- `/api/production-library/service-categories` - Service categories CRUD
- `/api/production-library/items` - Production items CRUD with pagination
- `/api/production-library/items/{id}/revisions` - Revision history
- `/api/production-library/assemblies` - Assemblies CRUD
- `/api/production-library/assemblies/{id}/items` - Assembly items management
- `/api/production-library/seed` - Initialize library with default domains/categories
- `/api/production-library/seed/status` - Check if library is initialized (with schema error detection)
- `/api/production-library/import/template/download` - Get official TradeOS CSV template
- `/api/production-library/import/validate` - Validate CSV before import
- `/api/production-library/import/commit` - Commit validated import to database
- `/api/production-library/stats` - Library statistics

### Phase 3: Production Library Flagship Workspace ✅ COMPLETE (July 12, 2026)
**Transform the Production Library into a modern knowledge management experience**

**Component:** `/app/frontend/src/pages/app/ProductionLibraryWorkspace.jsx` (~1450 lines)

**Architecture:**
- Left Navigation Panel (w-64) - Knowledge hierarchy with collapsible sections
- Main Content Area - Production Grid with list/grid views
- Right Detail Panel (w-420) - Sliding drawer for item details
- Command Palette (Cmd+K) - Global search overlay

**Left Navigation Sections:**
- KNOWLEDGE: Knowledge Domains, Production Items, Assemblies
- ORGANIZATION: Service Categories, Templates
- HISTORY: Production History, Archives (collapsed)
- Quick action: "New Item" CTA button

**Top Header Features:**
- View tabs: Items | Domains | Assemblies | Categories
- Command Palette trigger (Search... ⌘K)
- Refresh and Settings buttons

**Production Grid Features:**
- Search input (instant filtering)
- View mode toggle (List / Grid)
- Filter panel (Domain, Category, Status, Company Standard)
- Bulk selection and actions (Edit, Duplicate, Archive, Export)
- Sortable columns (Code, Name, Domain, Rate, Output)

**List View Row:**
- Checkbox for selection
- Production Code (monospace emerald)
- Production Name + Description
- Domain
- Measurement Unit badge
- Standard Rate
- Production Per Day
- Company Standard indicator
- Actions menu

**Grid View Card:**
- Production Code header
- Production Name + Description
- Domain badge
- Stats footer (Unit, Rate, Output)
- Company Standard sparkle icon

**Detail Panel Sections:**
- Quick Stats (Std Rate, Per Day, Unit)
- General Information
- Pricing (Standard, Premium, Complex)
- Production Standards (Output, Crew Size, Labour Hours)
- Company Brain Insights (Related items, Productivity trends)
- Notes
- Actions (Edit, Duplicate, Delete)

**Command Palette:**
- Global search overlay (Cmd+K or click)
- Searches Production Items, Domains, Categories
- Results grouped by type
- Keyboard hints (↑↓ Navigate, Enter Select, Esc Close)

**Empty State:**
- "Build Your Production Library" message
- "Import Knowledge" and "Add Manually" buttons
- Links to Import Wizard

**Schema Error State:**
- "Database Setup Required" warning
- Migration file path display
- Link to Import Wizard

**Import Wizard Integration:**
- URL parameter handling (?tab=import)
- ImportWizard component rendered when tab=import
- Back button to return to main workspace
- Data refresh on import completion

**Design Inspiration:** Notion, Linear, Figma, Stripe Dashboard
- Dark theme (#0A0A0A, #111111 backgrounds)
- Emerald accents (#10b981)
- Lucide icons with strokeWidth={1.5}
- Subtle borders (border-neutral-800)
- Hover states and transitions
- Professional, minimal aesthetic

### Phase 3.5: Company Knowledge Engine Experience ✅ COMPLETE (July 12, 2026)
**Transform Production Library from data management to Company Intelligence Management**

**Language Transition:**
- External: "Company Standards" (not "Production Items")
- External: "Company Knowledge Engine" (subtitle)
- Internal database: Still uses `production_items` etc.

**Complete Dedicated Workspaces:**
1. **Company Standards View** - Main grid with search, filters, bulk actions, list/grid toggle
2. **Knowledge Domains View** - Domain cards with item counts, stats, icons
3. **Assemblies View** - Visual assembly cards with "Create First Assembly" empty state
4. **Service Categories View** - Category cards with usage indicators
5. **Templates View** - Placeholder with "Coming in Estimate Builder" message

**Enhanced Detail Panel (Tabbed Interface):**
- **Overview Tab**: Quick stats, general info, frequently used with, Company Brain insights, related standards
- **Pricing Tab**: Rate comparison bars (Standard, Premium, Complex), pricing staleness alert
- **Productivity Tab**: Output per day, crew size, labour hours, productivity trend insight
- **Usage Tab**: Assemblies count, estimates count, average per project, used in assemblies list
- **History Tab**: Revision timeline with version numbers

**Visual Relationships:**
- "X Assemblies" badge on list rows and cards
- "Y Estimates" badge in detail panel header
- "Last used Z days ago" indicator
- "Frequently Used With" chips
- "Related Standards" section

**Company Brain (Mock Insights):**
- Pricing staleness alerts ("Pricing has not been reviewed in 14 months")
- Usage patterns ("This standard appears in 73% of Multifamily estimates")
- Relationship suggestions ("Commonly used with MDF Baseboard")
- Productivity insights ("Production rate is 11% higher than similar standards")
- Assembly suggestions ("Consider converting this into an Assembly")

**Command Palette Enhancements:**
- Quick Actions: Create Company Standard, Create Assembly, Import Knowledge
- Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)
- Recent Standards list
- Grouped search results (Standards, Domains, Assemblies)
- Keyboard hints footer

**"Add to Estimate" Integration:**
- Primary action button in Detail Panel footer
- Bulk action option when multiple items selected
- Toast message preparing for Estimate Builder

**Component:** `/app/frontend/src/pages/app/ProductionLibraryWorkspace.jsx` (~2100 lines)

**Premium onboarding experience for importing company knowledge into TradeOS**

**Component:** `/app/frontend/src/components/production/ImportWizard.jsx`

**Wizard Steps:**
1. **Initialize Production Library** - Seed foundational data (domains, categories, units)
2. **Download TradeOS CSV Template** - Official standardized import format
3. **Upload CSV** - Drag & drop interface
4. **Validate & Preview** - Pre-import validation with detailed error reporting
5. **Import Summary** - Success confirmation with next action buttons

**TradeOS CSV Template Columns:**
| Column | Required | Description |
|--------|----------|-------------|
| Production Code | Yes | Unique identifier (max 50 chars) |
| Production Name | Yes | Human-readable name (max 255 chars) |
| Knowledge Domain | Yes | Must match existing domain |
| Service Categories | No | Comma-separated list |
| Measurement Unit | Yes | EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, COST |
| Production Per Day | No | Units per 8-hour day |
| Crew Size | No | Default: 1 |
| Labour Hours | No | Hours per unit |
| Standard Rate | No | Base pricing |
| Premium Rate | No | Rush pricing |
| Complex Rate | No | Complex conditions pricing |
| Company Standard | No | true/false |
| Notes | No | Additional specs |

**Validation Features:**
- Row-by-row validation before database write
- Each error shows: Row Number, Column, Issue, Recommended Fix
- Warnings for non-critical issues (still allow import)
- Duplicate detection (both in-file and against existing database)
- Rate hierarchy validation (premium > standard > complex)

**Schema Error Handling:**
- Backend detects missing tables (PGRST205 Supabase error)
- Frontend shows actionable "Database Migration Required" message
- Prevents silent failures when schema is not applied

---

## PHASE 4: VERTICAL SLICE #1 - FIRST COMPLETE TRADEOS WORKFLOW 🚧 IN PROGRESS (July 12, 2026)

**Development Strategy Change:**
> "Stop building around the workflow. Start building through the workflow."
> Every sprint should complete ONE working workflow from beginning to end.
> Not another framework. Not another shell. Not another placeholder.
> A complete workflow.

### Target Workflow:
```
Create Opportunity
       ↓
Open Estimate
       ↓
Browse Company Standards
       ↓
Select Standards
       ↓
Adjust Quantities
       ↓
Automatic Totals
       ↓
Company Brain Review
       ↓
Estimate Saved
```

### Architectural Rules (Phase 4):
1. **Estimates NEVER exist independently** - Always tied to an Opportunity
2. **Flat Area structure** (v1) - No Phases/Divisions yet
3. **Combined Unit Pricing** - Single unit cost, no labor/material breakdown yet
4. **No Proposal Generation** - Focus strictly on estimating workflow (Phase 5)
5. **Company Brain as Senior Estimator** - Mock intelligent review insights

### Components Built:

**1. Create Opportunity Modal** ✅ COMPLETE
- File: `/app/frontend/src/pages/app/opportunities/OpportunitiesPage.jsx`
- Working form with: Name, Client/Builder, City, Estimated Value, Project Type
- Proper validation with "Required" hint for empty name
- Creates opportunity and navigates to workspace

**2. Estimate Builder (3-Panel Layout)** ✅ COMPLETE
- File: `/app/frontend/src/components/estimate/EstimateBuilder.jsx`
- Left Panel: Company Standards Browser (search, domain filter, add to estimate)
- Center Panel: Estimate with line items (quantity adjust, totals)
- Right Panel: Company Brain Review (mock insights)
- Summary Footer: Subtotal, Markup, Tax, Total with Save button

**3. EstimateTab Integration** ✅ COMPLETE
- File: `/app/frontend/src/components/workspace/tabs/PlaceholderTabs.jsx`
- EstimateTab now renders real EstimateBuilder (not placeholder)
- Session properly tracked in authStore

**4. Graceful Migration Error Handling** ✅ COMPLETE
- Opportunities page detects missing database tables
- Shows "Database Migration Required" with migration file reference
- Create Opportunity modal shows clear migration error message

### ⚠️ BLOCKER: Database Migration Required
The Vertical Slice #1 code is complete, but requires database tables to be created:

```
Required Migration Files:
1. /app/migrations/014_opportunity_tender_foundation.sql (Opportunities, Tenders, Tender Line Items)
2. /app/migrations/015_production_library_foundation.sql (Production Library - Company Standards)

Run in: Supabase SQL Editor (https://supabase.com/dashboard)
```

**Tables Created by Migration 014:**
- `opportunities` - Parent workspace for estimates
- `tenders` - Estimate versions (tied to opportunity)
- `tender_sections` - Flat areas in estimate
- `tender_line_items` - Line items with full cost structure
- `opportunity_contacts`, `opportunity_documents`, `opportunity_communications`, `opportunity_site_notes`, `opportunity_rfis`, `opportunity_activity_log`

### Next Steps After Migration:
1. Run both migration files in Supabase SQL Editor
2. Test full workflow: Create Opportunity → Open Estimate → Add Standards → Adjust Quantities → Save
3. Verify Company Brain review insights appear
4. Verify automatic totals calculate correctly

---

**Frontend Updated:**
- `ProductionLibraryPage.jsx` now uses real API instead of localStorage
- Full production item modal with all required fields
- Knowledge Domain and Measurement Unit dropdowns
- Service Category multi-select
- Pricing tiers (Standard, Premium, Complex)
- Production standards (Per Day, Crew Size, Labour Hours)
- Company Standard toggle
- **Import tab now features the full Import Wizard v1.0**

**Architecture Spec:**
- Full specification at `/app/memory/PRODUCTION_LIBRARY_SPEC.md`

**⚠️ REQUIRED ACTION: Database migration must be run in Supabase to create the tables.**
```
File: /app/migrations/015_production_library_foundation.sql
Run in: Supabase SQL Editor (https://supabase.com/dashboard)
```

---

### Command Center Transition ✅ COMPLETE (July 12, 2026)
**Retired legacy dashboard approach — Command Center is now the permanent operational headquarters**

**Backend Implementation:**
- ✅ Created `/api/command-center/dashboard` - Unified data aggregation endpoint
- ✅ Created `/api/command-center/quick-stats` - Lightweight stats for header
- ✅ Created `/api/command-center/health` - Service health check
- ✅ Returns: today_focus, projects, opportunities, recent_activity, brain_insights, quick_stats

**Frontend Implementation:**
- ✅ Completely overhauled `CommandCenterPage.jsx` - Living operational headquarters
- ✅ Personalized greeting with time-of-day awareness
- ✅ Today's Focus section with AI-driven priority queue
- ✅ Projects card with status breakdown (Starting Soon, In Progress, On Hold, Completed)
- ✅ Opportunities card with workflow phases (Pipeline, Active Work, Outcomes)
- ✅ Company Brain card with interactive input field
- ✅ Recent Activity timeline with action icons
- ✅ Quick Add panel for rapid entity creation
- ✅ 60-second auto-refresh polling
- ✅ Progressive onboarding WelcomeCard for users without organization
- Routing via `DashboardRedirect.jsx` unchanged (already correct)

**Test Results:**
- Backend: 100% (6/6 tests passing)
- Frontend: 100% (11/11 acceptance criteria verified)
- Test file: `/app/backend/tests/test_command_center.py`

### TradeOS Operating System Transition ✅ COMPLETE (July 12, 2026)
**Complete architectural transition from legacy TFCS Mainframe to TradeOS OS**

**Phase 1: Legacy Authorization Removal** ✅
- Removed all `tfcs_user_roles` dependency from frontend routing
- Created new `/api/workspace/context` endpoint for organization-based auth
- Authorization now uses `organization_members` and `platform_admins` tables
- Login redirects to `/app/command-center` (not `/app/mainframe`)
- No more "Access Restricted" screens for organization members

**Phase 2: Workflow Navigation** ✅
- New sidebar with workflow-oriented navigation:
  - Home (Command Center)
  - Opportunities
  - Projects
  - Estimating
  - Financial
  - Expenses
  - Documents
  - Reports
  - Integrations
  - Settings
- Dark theme with emerald green accents for workspace users

**Phase 3: Download Experience** ✅
- Landing page now has dual CTAs: "Get Started Free" + "Download App"
- Download App triggers PWA install modal (no account required)
- Available in both header navigation and hero section

**Phase 3.1: PWA Installation Experience Redesign** ✅ (July 12, 2026)
- **One-click install**: Desktop/Android trigger native browser install prompt immediately
- **iOS visual guide**: Clean 3-step visual flow (Share → Add to Home Screen → Tap Add)
- **Installation detection**: App shows "Open App" instead of "Download App" when already installed
- **Premium UX**: Minimal text, visual icons, no technical jargon
- **Platform-aware**: Automatically detects iOS/Android/Desktop and shows appropriate flow

**Phase 3.2: Google OAuth Integration** ✅ (July 12, 2026)
- **Sign in with Google**: Button added to Login and SignUp pages
- **Emergent OAuth**: Uses Emergent-managed Google authentication
- **Session handling**: Backend exchanges session_id for user data
- **User creation**: Automatically creates profile for new Google users
- **Existing user linking**: Links Google account to existing email users

**Phase 3.3: File & Media Storage Integration** ✅ (July 12, 2026)
- **Emergent Object Storage**: File uploads using Emergent storage API
- **Organization-scoped paths**: `tradeos/{org_id}/uploads/{category}/{uuid}.{ext}`
- **File categories**: documents, drawings, photos, receipts, avatars, general
- **50MB max file size**: Images, PDFs, documents, CAD files supported
- **Supabase metadata**: File references stored in database with soft-delete support

**Phase 3.4: OpenAI Chat Models Integration** ✅ (July 12, 2026)
- **Company Brain AI**: GPT-5.4 powered AI assistant for construction operations
- **Multi-turn conversations**: Session-based chat with history persistence
- **Context-aware prompts**: Construction industry knowledge built into system prompt
- **Multiple endpoints**: `/api/ai/chat/completions`, `/api/ai/chat/company-brain`, `/api/ai/chat/quick-assist`
- **Model selection**: Support for GPT-5.4, GPT-4o, Claude, Gemini models
- **React hook**: `useAIChat` for easy frontend integration

**Key Files Created/Modified:**
- `/app/backend/routes/workspace.py` - New workspace context API
- `/app/frontend/src/pages/app/CommandCenterPage.jsx` - New Command Center
- `/app/frontend/src/components/routing/DashboardRedirect.jsx` - Updated routing
- `/app/frontend/src/components/layout/AppLayout.jsx` - New navigation structure
- `/app/frontend/src/pages/landing/LandingPage.jsx` - Download App CTAs

---

## NEXT MILESTONE: Phase 2 - Opportunity Intake Engine

### Objective
Establish AI-native workflow where TradeOS assembles opportunities from:
- Emails (forwarded invitation parsing)
- Drawings (OCR + AI analysis)
- Tender packages (document extraction)
- Builder portals (integration)
- Historical company knowledge (Company Brain)

**Goal**: Minimal manual input — intelligent opportunity construction.

---

### Governing Documents
| Document | Version | Purpose |
|----------|---------|---------|
| TradeOS Constitution v1.0 | RATIFIED | Permanent architectural philosophy |
| Specification Governance | RATIFIED | Document standards and templates |
| Specification 1.5 | v1.5.1 APPROVED | Multi-Tenant Platform Architecture |
| Specification 2.0 | v2.0.1 APPROVED | Opportunity Lifecycle & Tender Workspace |

### Key Architectural Decisions
- **Work-Centric Design:** Everything revolves around Work moving through lifecycle states
- **Universal Workspace Pattern:** Consistent UI across all entity types
- **Multi-Tenant Isolation:** Complete data separation between organizations
- **Company Brain:** Operations Manager, not chatbot — proactive intelligence
- **Learning Company:** Every completed project improves future work
- **No Orgs in URLs:** Context via JWT/Workspace Switcher
- **First-Class External Users:** Clients, Builders, etc. are full authenticated users

### Implementation Sequence
1. Multi-Tenant Foundation (Spec 1.5) ✅ **COMPLETE**
2. Opportunity Foundation (Spec 2.0 Phase 1) ← **IN PROGRESS**
3. Tender Workspace (Spec 2.0 Phase 2-3)
4. Project Conversion (Spec 2.0 Phase 4)
5. Company Brain Integration (Spec 2.0 Phase 5)
6. Production Library (Spec 2.1 - Future)

### Phase 1A Status - COMPLETE (July 12, 2026)
**Organization Foundation Implementation**
- ✅ Database migration created (`013_organization_foundation.sql`)
- ✅ Backend routes created (`/app/backend/routes/organizations.py`)
- ✅ Frontend hook created (`useOrganization`)
- ✅ Workspace Switcher component created
- ✅ App.js updated with OrganizationProvider
- ✅ User executed migration in Supabase
- ✅ User executed `assign_scott_marshall_roles()`

### Phase 1B Status - Vertical Slice 1 (July 12, 2026)
**Opportunity Workspace Foundation**

**Backend Complete:**
- ✅ Database migration created (`014_opportunity_tender_foundation.sql` v2.0.0)
- ✅ Opportunities API (`/app/backend/routes/opportunities.py`)
- ✅ Tenders API (`/app/backend/routes/tenders.py`)
- ✅ Routes registered in server.py

**Frontend V2 Architecture Complete:**
- ✅ WorkspaceShell.jsx - Universal workspace container with Focus Layer & Memory
- ✅ CommandCenter.jsx - Priority queue answering "What should I work on next?"
- ✅ TimelinePanel.jsx - Persistent right sidebar, always visible, filterable
- ✅ TenderSection.jsx - Estimate builder with sub-tabs (Estimate, Proposal, History)
- ✅ InformationSection.jsx - Consolidated reference material
- ✅ Panel Dock system - Documents, RFIs, Communications, Site Notes as slide-up panels
- ✅ OpportunitiesPage.jsx - Pipeline list with stats, filters
- ✅ OpportunityWorkspaceV2.jsx - Main workspace using WorkspaceShell

**Architecture V2 Features:**
- 3 Primary Sections: Command Center, Tender, Information
- Persistent Timeline (right panel, always visible)
- Contextual Panel Dock (Documents, RFIs, Comms, Site Notes)
- Focus Layer - Workspace knows what user is working on
- Workspace Memory - Persists state between sessions (localStorage)
- Progressive Disclosure - Complexity revealed when needed
- Universal Template - Reusable for Client, Project, Invoice workspaces

**Workflow Stages (not CRM stages):**
```
DISCOVERED → QUALIFYING → TENDERING → SUBMITTED → NEGOTIATION → AWARDED → PROJECT
                                                                  ↓
                                               DECLINED | LOST | ARCHIVED
```

**Database Tables (10 total):**
- `opportunities` - Parent workspace container
- `opportunity_documents` - Drawings, specs, photos
- `opportunity_communications` - Emails, calls, meetings
- `opportunity_rfis` - Requests for information
- `opportunity_site_notes` - Site visit notes
- `opportunity_activity` - Audit trail
- `tenders` - Estimates/quotes
- `tender_sections` - Organizational groupings
- `tender_line_items` - FULL cost structure
- `tender_versions` - Immutable submission history

**Full Estimate Line Item Structure:**
Category, Scope, Description, Quantity, Unit, Labor (hours, rate, burden), Material (qty, unit, cost), Equipment, Subcontractor, Production Rate, Crew, Duration, Waste, Markup, Overhead, Profit, Contingency, Tax, Notes, Attachments, Production Library reference, Company Brain reference

**API Endpoints:**
- `GET /api/opportunities/health` - Health check
- `GET /api/opportunities/workflow-stages` - Get all workflow stages
- `GET /api/opportunities` - List opportunities
- `POST /api/opportunities` - Create opportunity
- `GET /api/opportunities/{id}` - Get opportunity workspace
- `PATCH /api/opportunities/{id}` - Update opportunity
- `POST /api/opportunities/{id}/status` - Change workflow stage
- `GET/POST /api/opportunities/{id}/activity` - Activity timeline
- `DELETE /api/opportunities/{id}` - Delete opportunity
- `GET /api/opportunities/stats/pipeline` - Pipeline statistics
- `GET /api/tenders/health` - Health check
- `POST /api/tenders` - Create tender
- `GET /api/tenders/{id}` - Get tender with sections/items
- `PATCH /api/tenders/{id}` - Update tender
- `POST /api/tenders/{id}/sections` - Create section
- `PATCH/DELETE /api/tenders/{id}/sections/{id}` - Update/delete section
- `POST /api/tenders/{id}/items` - Create line item
- `PATCH/DELETE /api/tenders/{id}/items/{id}` - Update/delete item
- `POST /api/tenders/{id}/items/reorder` - Reorder items
- `POST /api/tenders/{id}/submit` - Submit tender
- `POST /api/tenders/{id}/revise` - Create revision

⏳ **PENDING:** User runs `014_opportunity_tender_foundation.sql` in Supabase
⏳ **PENDING:** New Opportunity create form/modal
⏳ **PENDING:** Full implementation of remaining workspace tabs

---

## User Personas
- **Primary:** Independent contractors and small trade businesses
- **Secondary:** Founding/Elite lifetime members with premium access
- **Internal:** Two Fungis Finishing team (Owner, Manager, Employee roles)

## Tech Stack
- **Frontend:** React, TailwindCSS, Zustand, shadcn/ui
- **Backend:** FastAPI (Python) - NO MongoDB (Supabase only)
- **Database:** Supabase (Postgres) - SOLE production database
- **Auth:** Supabase Auth
- **Integrations:** Stripe (payments), Resend (email), OpenAI GPT-5.2 (AI Copilot via emergentintegrations)

## Core Features Implemented
1. ✅ User authentication (Supabase) + Password visibility toggle
2. ✅ Project management with quotes/invoices
3. ✅ Commercial Estimating
4. ✅ Expense tracking with Quick Add
5. ✅ AI Copilot (project-aware, GPT-5.2 powered)
6. ✅ Receivables system with reminders
7. ✅ Setup Progress / Activation flow
8. ✅ PWA support with service worker
9. ✅ Subscription tiers (free, pro, elite, lifetime)
10. ✅ **Trial + Locked Access Model**
11. ✅ **TFCS Mainframe Specification 1.0-1.2** (Complete)
12. ✅ **Company Brain Foundation**
13. ✅ **Login Page Refresh** (July 11, 2026)
14. ✅ **PWA Manifest Fix** (July 11, 2026)
15. ✅ **MongoDB Removal** (July 12, 2026) - Supabase is sole DB
16. ✅ **Landing Page - Contractor OS Messaging** (July 12, 2026)
17. ✅ **Two Fungis Code Cleanup** (July 12, 2026)

---

## Production Deployment Preparation (July 12, 2026)

### Architecture Changes
- **Removed MongoDB entirely** - All data now stored in Supabase
- **Removed Two Fungis marketing files** - TradeOS is standalone
- **Updated landing page messaging** - Positioned as contractor operating system

### Environment Variables (Backend)
- SUPABASE_URL ✅
- SUPABASE_SERVICE_KEY ✅
- SUPABASE_ANON_KEY ✅
- STRIPE_SECRET_KEY ✅
- STRIPE_WEBHOOK_SECRET ✅
- STRIPE_PRO_PRICE_ID ✅
- STRIPE_ELITE_PRICE_ID ✅
- STRIPE_LIFETIME_PRICE_ID ✅
- EMERGENT_LLM_KEY ✅
- RESEND_API_KEY ✅
- SENDER_EMAIL ✅
- FRONTEND_URL ✅
- CORS_ORIGINS ✅

### Environment Variables (Frontend/Netlify)
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY
- REACT_APP_BACKEND_URL (set after backend deploy)

---

## Login Page Refresh (July 11, 2026)

### Changes Made
- Updated tagline to "Built for Builders. Intelligence for Trades."
- Applied Two Fungis brand colors (Black, Deep Charcoal, Emerald Green)
- Modernized button styling with gradient and shadow effects
- Improved input field focus states with emerald accents
- Added subtle background gradient accents
- Added "Secured by TradeOS" footer badge
- Preserved all existing functionality (email/password login, magic link, PWA modal)

### PWA Manifest Fix
- Fixed `manifest.json` start_url from `/app/dashboard` to `/app`
- This allows DashboardRedirect to properly route TFCS users to Mainframe

---

## Landing Page Refresh (July 11, 2026)

### Changes Made
- Updated hero tagline to "Built for Builders. Intelligence for Trades."
- Applied Two Fungis brand colors (Black #0a0a0a, Charcoal #111111, Emerald Green)
- Changed all CTAs to "Get Started Free" with emerald gradient buttons
- Updated feature card icons to emerald accents
- Updated trust indicators with emerald icons
- Modernized testimonials section header: "Trusted by Canadian Trades"
- Added subtle gradient accents in hero and CTA sections
- Preserved all existing functionality (PWA install, navigation, responsiveness)

---

## TFCS Mainframe - Specification 1.2.1 COMPLETE (July 11, 2026)

### Owner Completion & Account Management
Both company owners are now fully operational in TFCS Mainframe.

### Centralized Post-Login Routing Architecture ✅ (July 11, 2026)
Implemented clean, architectural routing that determines the correct landing page after authentication.

**Architecture:**
```
User logs in → navigate('/app') → DashboardRedirect component
                                         ↓
                               Check /api/tfcs/role/me
                                         ↓
                    ┌────────────────────┴────────────────────┐
                    ↓                                         ↓
            has_role: true                            has_role: false
                    ↓                                         ↓
         Navigate to /app/mainframe              Navigate to /app/dashboard
```

**Key Decisions:**
- Login flow ONLY authenticates, no routing decisions
- Single centralized routing component: `DashboardRedirect.jsx`
- Uses existing TFCS role API (`/api/tfcs/role/me`) - no hardcoded emails
- No duplicate routing logic anywhere in codebase

**Key Files:**
- `/app/frontend/src/components/routing/DashboardRedirect.jsx` - Centralized routing
- `/app/frontend/src/App.js` - Route index uses DashboardRedirect

### Company Owners ✅
| Name | Email | Role | Status |
|------|-------|------|--------|
| **Scott Marshall** | inbox@twofungis.ca | Owner | Active |
| **Beau** | carpenterbeau@hotmail.com | Owner | Active |

### Owner Access Panel ✅
- **Company Owners section**: Shows both owners with name, email, role badge, status, last login
- **Your Account section**: Current user's name, email, role
- **Permissions section**: Full Access, Financial, User Management, Company Brain, System Settings

### Password Management ✅
- Users can change password via Settings
- Password changes are PRIVATE (no activity history, no notifications)
- Uses Supabase Auth directly (bypasses backend logging)

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tfcs/owners/create` | POST | Create new owner (owner only) |
| `/api/tfcs/owners` | GET | List all company owners |
| `/api/tfcs/team` | GET | List all team members by role |

---

## TFCS Mainframe - Specification 1.2 COMPLETE (July 11, 2026)

### Company Brain Foundation
The permanent architecture for Company Brain - the operational intelligence of the company.

### ONE BRAIN RULE
- There is only ONE Company Brain
- Projects, CRM, Financial never contain their own AI
- Every AI interaction routes through ONE Company Brain
- Company Brain calls modules; modules NEVER call Company Brain

### MODULE ISOLATION RULE (Architectural Constraint)
**No module communicates directly with another module.**

```
❌ FORBIDDEN:
   Projects → Financial (direct call)
   Financial → CRM (direct call)
   Production Library → Projects (direct call)

✅ REQUIRED:
   Projects → Service Interface → Financial
   Module A → Company Brain → Module B
```

**Principles:**
1. Each module owns its own data exclusively
2. Cross-module requests occur through service interfaces
3. Company Brain is the orchestrator for cross-module operations
4. This preserves modularity and prevents tight coupling

**Examples:**
- Creating an invoice from a project milestone → Company Brain orchestrates
- Linking a client to a project → Service interface, not direct DB call
- Updating production rates that affect estimates → Event-driven through services

### UI Refinement (July 11, 2026)
Following "One Action = One Way" principle, removed duplicate controls for TFCS users:
- ❌ Blue Quick Add button → Use Company Brain
- ❌ Quick Expense floating button → Use Company Brain
- ❌ Floating AI Assistant → Use Company Brain
- ❌ Quick Add FAB → Use Company Brain
- ✅ Company Brain is now the SINGLE entry point for all operations

### UI Components ✅
| Component | Status | Description |
|-----------|--------|-------------|
| **Global Side Panel** | ✅ | Collapsible panel accessible from anywhere via Brain button |
| **Company Brief** | ✅ Placeholder | "Operational briefing will appear here." |
| **Conversation** | ✅ Architecture | Input, send, microphone (disabled), message history |
| **Context Selector** | ✅ | Switch between General, Project, Opportunity, etc. threads |
| **Suggested Actions** | ✅ Placeholder | Context-aware action suggestions |
| **Action History** | ✅ | Permanent history of Company Brain actions |

### Action Pipeline Architecture
```
Intent → Plan → Permission Check → Execute → Activity Log → Result → Undo Window
```

### Module Contracts
Company Brain can interact with these modules:
| Module | Capabilities |
|--------|-------------|
| **Projects** | Create, Update, Assign, Archive, Search |
| **Opportunities** | Create, Update, Submit, Search |
| **Financial** | Create Invoice, Record Payment, Send Reminder |
| **Expenses** | Create, Categorize, GST Summary |
| **CRM** | Create Client/Contact, Update, Search |
| **Production Library** | Search, Create, Update |
| **Documents** | Search, Store, Summarize |
| **Reports** | Generate, Export |
| **Settings** | Read, Update |

### Context Types
- General, Project, Opportunity, Estimate, Financial, CRM, Production, Documents, Reports, Settings

### Proactive Intelligence Categories (Architecture)
- Deadlines, Late Tenders, Outstanding Invoices, Production Inconsistencies
- Cash Flow, Scheduling Conflicts, Missing Documents, Follow-ups

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brain/health` | GET | Health check with capabilities |
| `/api/brain/contracts` | GET | Get module contracts |
| `/api/brain/threads` | GET | List conversation threads |
| `/api/brain/threads/{context_type}` | GET | Get/create context thread |
| `/api/brain/messages` | POST | Send message to Brain |
| `/api/brain/messages/{thread_id}` | GET | Get thread messages |
| `/api/brain/suggested-actions` | GET | Get suggested actions |
| `/api/brain/action-history` | GET | Get action history |
| `/api/brain/actions/queue` | POST | Queue action for execution |
| `/api/brain/brief` | GET | Get company brief |
| `/api/brain/proactive` | GET | Get proactive alerts |

### Key Files
- `/app/backend/routes/company_brain.py` - All Company Brain endpoints
- `/app/frontend/src/components/brain/CompanyBrainPanel.jsx` - Global side panel
- `/app/frontend/src/hooks/useBrainContext.js` - Context tracking
- `/app/migrations/012_company_brain_foundation.sql` - Database schema (PENDING)

### Migration Required
Run `/app/migrations/012_company_brain_foundation.sql` in Supabase SQL Editor to create:
- `company_brain_threads` - Conversation threads
- `company_brain_messages` - Messages
- `company_brain_actions` - Action history

---

## TFCS Mainframe - Specification 1.1 (Command Center Dashboard)

### UI Components ✅
| Component | Status | Data Source |
|-----------|--------|-------------|
| **Header** | ✅ | Title, Notifications, Catch Me Up, Owner Access, Quick Add, **Brain** |
| **Today's Focus** | ✅ Architecture | Empty state until priority logic |
| **Projects Card** | ✅ LIVE | Real data from `/api/projects` |
| **Opportunities Card** | ✅ Architecture | Shows zeros until endpoint exists |
| **Company Brain** | ✅ Placeholder | Points to Brain panel |
| **Recent Activity** | ✅ LIVE | Real data from `/api/tfcs/activity` |

### Key Files
- `/app/frontend/src/pages/app/MainframePage.jsx`
- `/app/frontend/src/components/layout/AppLayout.jsx`

---

## TFCS Mainframe - Specification 1.0 (Backend Foundation)

### Architecture
- Role-Based Access Control (RBAC): Owner, Manager, Employee
- Activity Events - Permanent operational history
- Notifications - Temporary alerts

### Key Files
- `/app/backend/routes/tfcs.py` - TFCS routes
- `/app/backend/routes/tfcs_activity.py` - Activity logging
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Database schema

---

## Upcoming Tasks (Priority Order)

### P0 - Run Production Library Database Migration
The migration file has been created at `/app/migrations/015_production_library_foundation.sql`.
This needs to be executed in Supabase to create the tables.

### P0 - Seed Initial Knowledge Domains & Service Categories
After migration, seed the organization with:
- Knowledge Domains: Finish Carpentry, Doors & Hardware, Architectural Millwork, Cabinetry, Flooring, Countertops, Stairs & Railings, etc.
- Service Categories: Residential, Multifamily, Commercial, Hospitality, Institutional, Healthcare, Retail, Industrial, etc.

### P0 - Import Existing Production Library
Import the existing production library data that represents years of operational knowledge.

### P1 - Phase 4: New Opportunity Experience Design
Before building the traditional form, design the entire Opportunity Creation Experience:
- Forward Email parsing
- Upload Drawings/Tender Package
- AI Recommendation engine
*Note: Must present design for review before coding.*

### P1 - Connect V2 Opportunity Workspace Panels
Connect panels (Documents, Communications, Site Notes) to actual API data endpoints.

### P2 - Full Estimate Line Item Editor
Build inside the Tender Section with support for all 22 requested fields:
Labour, Material, Equipment, Subcontractor, etc.

### P3 - Legacy Module Migration
Migrate legacy modules to new architecture:
- Projects
- Invoices
- Expenses
- Production Library
- CRM

### P3 - Apply Universal Workspace Template
Apply WorkspaceShell pattern to:
- Project Workspace
- Client Workspace
- Invoice Workspace

### P4 - QuickBooks Sync

---

## Test Credentials
| Account | Email | Password | Tier |
|---------|-------|----------|------|
| Primary Owner | inbox@twofungis.ca | TradeOS2024! | founding_lifetime |
| Legacy Founder | info@twofungis.ca | Marshall!31 | founding_lifetime |

---

## Key Files Reference

### Company Brain (Spec 1.2)
- `/app/backend/routes/company_brain.py`
- `/app/frontend/src/components/brain/CompanyBrainPanel.jsx`
- `/app/frontend/src/hooks/useBrainContext.js`
- `/app/migrations/012_company_brain_foundation.sql`
- `/app/backend/tests/test_company_brain.py`

### Production Library (July 12, 2026)
- `/app/frontend/src/pages/app/ProductionLibraryPage.jsx` - Company Knowledge Engine workspace
- Routes: `/app/estimating`, `/app/production-library`
- Data-testids: production-library-page, tab-{library|assemblies|scopes|labour|pricing|templates|imports|builder}, production-item-modal

### Command Center (July 12, 2026)
- `/app/backend/routes/command_center.py` - Dashboard aggregation API
- `/app/frontend/src/pages/app/CommandCenterPage.jsx` - Universal operational headquarters
- `/app/backend/tests/test_command_center.py` - Backend tests
- `/app/backend/tests/test_workspace_context.py` - Workspace context tests

### Deleted Legacy Files (July 12, 2026)
The following files were permanently removed during V2 consolidation:
- ❌ `/app/frontend/src/pages/app/MainframePage.jsx`
- ❌ `/app/frontend/src/pages/app/DashboardPage.jsx`
- ❌ `/app/frontend/src/components/ai/AICopilot.jsx`
- ❌ `/app/frontend/src/components/app/QuickAddFab.jsx`
- ❌ `/app/frontend/src/components/routing/DashboardRedirect.jsx`

### TFCS Mainframe (Spec 1.0-1.1) - DEPRECATED
- `/app/frontend/src/pages/app/MainframePage.jsx`
- `/app/frontend/src/components/layout/AppLayout.jsx`
- `/app/frontend/src/components/routing/DashboardRedirect.jsx` - Centralized post-login routing
- `/app/backend/routes/tfcs.py`
- `/app/backend/routes/tfcs_activity.py`
- `/app/migrations/011_tfcs_mainframe_foundation.sql`
- `/app/design_guidelines.json`
- `/app/backend/tests/test_tfcs_mainframe.py`

### Access Control
- `/app/backend/routes/access_control.py`
- `/app/backend/routes/profile.py`

### Server-Side Enforcement
- `/app/backend/routes/projects.py`
- `/app/backend/routes/quotes.py`
- `/app/backend/routes/invoices.py`
- `/app/backend/routes/copilot.py`

### PWA
- `/app/frontend/src/services/PWAInstallService.js`
- `/app/frontend/src/components/app/PWARedirectModal.jsx`
