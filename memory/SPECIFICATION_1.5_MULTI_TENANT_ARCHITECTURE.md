# TRADEOS SPECIFICATION 1.5
## Multi-Tenant Platform Architecture

**Version:** 1.5.1  
**Date:** July 12, 2026  
**Author:** Chief Software Architect  
**Status:** APPROVED (Post-Constitution Compliance Review)

---

## DOCUMENT HIERARCHY

**Parent Document(s):**
- TradeOS Constitution v1.0

**Related Specifications:**
- Specification 1.0: TFCS Mainframe Foundation
- Specification 1.2: Company Brain Foundation
- Specification 2.0: Opportunity Lifecycle & Tender Workspace

**Specification Type:** Platform Specification (Foundation)

---

## 1. PURPOSE

Define the multi-tenant architecture that enables TradeOS to serve multiple contractor businesses as completely isolated workspaces while maintaining a unified platform.

## 2. PROBLEM STATEMENT

Contractors need business software that is both powerful enough for enterprise use and simple enough for one-person operations. The architecture must ensure complete data isolation between companies while allowing platform-level management and continuous improvement.

## 3. BUSINESS OBJECTIVE

Create a scalable SaaS foundation that supports growth from early customers to thousands of organizations without architectural redesign.

---

## EXECUTIVE SUMMARY

TradeOS is a multi-tenant SaaS platform where every customer operates within their own completely isolated Company Workspace. This specification defines the foundational architecture that ensures:

- **Complete Data Isolation** — No company ever sees another company's data
- **Scalable Role System** — From one-man contractors to enterprise organizations
- **Platform vs. Company Separation** — Clear distinction between platform operations and customer workspaces
- **Future-Proof Design** — Architecture that scales without redesign

---

## CORE PRINCIPLE

> **Everything belongs to an Organization. Nothing belongs directly to a User.**

A User is a person. An Organization is a business. Users can belong to multiple Organizations with different roles in each. All business data (projects, clients, invoices, etc.) belongs to the Organization, not the User who created it.

---

## PLATFORM HIERARCHY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TRADEOS PLATFORM                                  │
│                     (Global: Feature Flags, Defaults, Analytics)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────────────┐    ┌──────────────────────┐                     │
│    │    ORGANIZATION A    │    │    ORGANIZATION B    │    ...              │
│    │   (Two Fungis)       │    │   (ABC Contracting)  │                     │
│    ├──────────────────────┤    ├──────────────────────┤                     │
│    │                      │    │                      │                     │
│    │  ┌────────────────┐  │    │  ┌────────────────┐  │                     │
│    │  │   WORKSPACE    │  │    │  │   WORKSPACE    │  │                     │
│    │  ├────────────────┤  │    │  ├────────────────┤  │                     │
│    │  │ • Projects     │  │    │  │ • Projects     │  │                     │
│    │  │ • Company Brain│  │    │  │ • Company Brain│  │                     │
│    │  │ • Prod Library │  │    │  │ • Prod Library │  │                     │
│    │  │ • Clients      │  │    │  │ • Clients      │  │                     │
│    │  │ • Builders     │  │    │  │ • Builders     │  │                     │
│    │  │ • Suppliers    │  │    │  │ • Suppliers    │  │                     │
│    │  │ • Documents    │  │    │  │ • Documents    │  │                     │
│    │  │ • Invoices     │  │    │  │ • Invoices     │  │                     │
│    │  │ • Expenses     │  │    │  │ • Expenses     │  │                     │
│    │  │ • Reports      │  │    │  │ • Reports      │  │                     │
│    │  │ • Settings     │  │    │  │ • Settings     │  │                     │
│    │  └────────────────┘  │    │  └────────────────┘  │                     │
│    │                      │    │                      │                     │
│    │  Users:              │    │  Users:              │                     │
│    │  • Scott (Owner)     │    │  • John (Owner)      │                     │
│    │  • Beau (Owner)      │    │  • Jane (Estimator)  │                     │
│    │  • Mike (Foreman)    │    │  • Bob (Foreman)     │                     │
│    │                      │    │                      │                     │
│    └──────────────────────┘    └──────────────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ENTITY DEFINITIONS

### Platform Level (Global)

| Entity | Description | Scope |
|--------|-------------|-------|
| **Platform** | TradeOS itself | Global singleton |
| **Platform Users** | Administrators who manage TradeOS | Global |
| **Feature Flags** | Enable/disable features globally or per-org | Global |
| **Default Templates** | Starter templates for new organizations | Global |
| **Default Production Library** | Industry-standard rates and items | Global |
| **Subscription Plans** | Pricing tiers and features | Global |
| **Platform Analytics** | Aggregate usage metrics (anonymized) | Global |

### Organization Level (Tenant)

| Entity | Description | Scope |
|--------|-------------|-------|
| **Organization** | A company/business using TradeOS | Tenant root |
| **Workspace** | The operational environment | 1:1 with Organization |
| **Organization Members** | Users with roles in this org | Per-Organization |
| **Organization Settings** | Branding, preferences, integrations | Per-Organization |
| **Subscription** | The org's billing/plan status | Per-Organization |

### Workspace Level (Business Data)

| Entity | Description | Owner |
|--------|-------------|-------|
| **Projects** | Active and completed work | Organization |
| **Opportunities** | Potential projects (leads, tenders) | Organization |
| **Company Brain** | AI assistant with org's knowledge | Organization |
| **Production Library** | Rates, items, assemblies | Organization |
| **Clients** | Customer companies | Organization |
| **Builders** | General contractors (who hire you) | Organization |
| **Suppliers** | Material vendors | Organization |
| **Subcontractors** | Trade partners | Organization |
| **Documents** | Files, drawings, specs | Organization |
| **Invoices** | Billing records | Organization |
| **Expenses** | Cost tracking | Organization |
| **Reports** | Generated analytics | Organization |

---

## USER IDENTITY MODEL

### Core Concept: User vs. Membership

A **User** is a human with login credentials (email/password via Supabase Auth).

A **Membership** is the relationship between a User and an Organization, including their role.

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER: Scott Marshall                     │
│                    Email: inbox@twofungis.ca                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MEMBERSHIP 1                      MEMBERSHIP 2                 │
│   ┌─────────────────────┐          ┌─────────────────────┐      │
│   │ Organization:       │          │ Organization:       │      │
│   │ TradeOS Platform    │          │ Two Fungis Finishing│      │
│   │                     │          │                     │      │
│   │ Role:               │          │ Role:               │      │
│   │ Platform Admin      │          │ Company Owner       │      │
│   │                     │          │                     │      │
│   │ Access:             │          │ Access:             │      │
│   │ • Platform Settings │          │ • Projects          │      │
│   │ • All Organizations │          │ • Company Brain     │      │
│   │ • Feature Flags     │          │ • Team Management   │      │
│   │ • Analytics         │          │ • Financial         │      │
│   │ • Support Tools     │          │ • Settings          │      │
│   └─────────────────────┘          └─────────────────────┘      │
│                                                                  │
│   When Scott logs in, he can SWITCH between these contexts.      │
│   Each context shows completely different data and UI.           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Organization Users

A single user MAY belong to multiple organizations:

| Scenario | Example |
|----------|---------|
| Platform Admin + Company Owner | Scott manages TradeOS AND runs Two Fungis |
| Consultant | An accountant serves multiple contracting companies |
| Subcontractor | A drywaller works with multiple GCs |
| Franchise | A user manages multiple franchise locations |

When a multi-org user logs in, they select which organization to enter (or default to their primary).

---

## ROLE & PERMISSION SYSTEM

### Role Categories

Roles are divided into two categories:

1. **Platform Roles** — For managing TradeOS itself
2. **Organization Roles** — For working within a company

### Platform Roles

| Role | Description | Granted To |
|------|-------------|------------|
| **Platform Administrator** | Full control of TradeOS platform | TradeOS founders/staff |
| **Platform Support** | Read access for customer support | Support team |
| **Platform Developer** | Feature flags, beta features | Dev team |

#### Platform Administrator Permissions

```
PLATFORM ADMINISTRATION
├── Organizations
│   ├── View all organizations
│   ├── Create organizations
│   ├── Suspend/reactivate organizations
│   └── Access organization as support (audit logged)
├── Users
│   ├── View all platform users
│   ├── Reset passwords
│   └── Manage platform roles
├── Subscriptions
│   ├── View all subscriptions
│   ├── Apply discounts/credits
│   └── Manage billing issues
├── Feature Flags
│   ├── Enable/disable features globally
│   ├── Enable features per-organization
│   └── Manage beta programs
├── Default Templates
│   ├── Manage default production library
│   ├── Manage starter templates
│   └── Manage onboarding content
├── Analytics
│   ├── Platform usage metrics
│   ├── Revenue analytics
│   └── Feature adoption
└── System
    ├── View system health
    ├── Manage integrations
    └── Configure platform settings
```

### Organization Roles

| Role | Description | Typical User |
|------|-------------|--------------|
| **Company Owner** | Full control of the organization | Business owner |
| **Company Administrator** | Manages org settings and users | Office manager |
| **Estimator** | Creates and manages tenders | Estimating department |
| **Project Manager** | Manages active projects | PM |
| **Foreman** | Field operations, time tracking | Site supervisor |
| **Office Administrator** | Documents, scheduling, coordination | Admin staff |
| **Accounting** | Financial operations | Bookkeeper/accountant |
| **Employee** | Basic access, time entry | Field workers |

#### External Roles (Portal Access)

| Role | Description | Typical User |
|------|-------------|--------------|
| **Client** | Views their projects, approves quotes | Customer |
| **Builder** | Views assigned projects, submits RFIs | General contractor |
| **Subcontractor** | Views assigned work, submits hours | Trade partner |

---

## PERMISSION MATRIX

### Organization Role Permissions

```
Permission                    Owner  Admin  Estimator  PM   Foreman  Office  Accounting  Employee
─────────────────────────────────────────────────────────────────────────────────────────────────
ORGANIZATION
  View organization             ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Edit organization settings    ✓      ✓        -       -      -        -        -          -
  Manage subscription           ✓      -        -       -      -        -        -          -
  Delete organization           ✓      -        -       -      -        -        -          -

TEAM MANAGEMENT
  View team members             ✓      ✓        ✓       ✓      ✓        ✓        ✓          -
  Invite team members           ✓      ✓        -       -      -        -        -          -
  Edit team member roles        ✓      ✓        -       -      -        -        -          -
  Remove team members           ✓      ✓        -       -      -        -        -          -

PROJECTS
  View all projects             ✓      ✓        ✓       ✓      ✓        ✓        ✓          -
  View assigned projects        ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Create projects               ✓      ✓        ✓       ✓      -        -        -          -
  Edit projects                 ✓      ✓        ✓       ✓      -        -        -          -
  Delete projects               ✓      ✓        -       -      -        -        -          -
  Archive projects              ✓      ✓        ✓       ✓      -        -        -          -

OPPORTUNITIES
  View opportunities            ✓      ✓        ✓       ✓      -        ✓        -          -
  Create opportunities          ✓      ✓        ✓       -      -        ✓        -          -
  Edit opportunities            ✓      ✓        ✓       -      -        -        -          -
  Submit tenders                ✓      ✓        ✓       -      -        -        -          -

TENDER WORKSPACE
  Access tender workspace       ✓      ✓        ✓       -      -        -        -          -
  Create/edit tenders           ✓      ✓        ✓       -      -        -        -          -
  View tender history           ✓      ✓        ✓       ✓      -        -        ✓          -

COMPANY BRAIN
  Chat with Company Brain       ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Execute Brain actions         ✓      ✓        ✓       ✓      -        -        -          -
  View Brain insights           ✓      ✓        ✓       ✓      ✓        ✓        ✓          -
  Configure Brain settings      ✓      ✓        -       -      -        -        -          -

PRODUCTION LIBRARY
  View production library       ✓      ✓        ✓       ✓      ✓        -        -          -
  Create/edit items             ✓      ✓        ✓       -      -        -        -          -
  Delete items                  ✓      ✓        -       -      -        -        -          -
  Import/export library         ✓      ✓        ✓       -      -        -        -          -

CLIENTS / CRM
  View all clients              ✓      ✓        ✓       ✓      -        ✓        ✓          -
  Create/edit clients           ✓      ✓        ✓       ✓      -        ✓        -          -
  Delete clients                ✓      ✓        -       -      -        -        -          -

BUILDERS / SUPPLIERS
  View all                      ✓      ✓        ✓       ✓      ✓        ✓        -          -
  Create/edit                   ✓      ✓        ✓       ✓      -        ✓        -          -
  Delete                        ✓      ✓        -       -      -        -        -          -

DOCUMENTS
  View all documents            ✓      ✓        ✓       ✓      ✓        ✓        ✓          -
  View project documents        ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Upload documents              ✓      ✓        ✓       ✓      ✓        ✓        -          -
  Delete documents              ✓      ✓        ✓       ✓      -        -        -          -

INVOICES
  View all invoices             ✓      ✓        -       ✓      -        ✓        ✓          -
  Create invoices               ✓      ✓        -       ✓      -        -        ✓          -
  Edit invoices                 ✓      ✓        -       -      -        -        ✓          -
  Send invoices                 ✓      ✓        -       -      -        -        ✓          -
  Record payments               ✓      ✓        -       -      -        -        ✓          -
  Delete invoices               ✓      -        -       -      -        -        -          -

EXPENSES
  View all expenses             ✓      ✓        -       ✓      -        -        ✓          -
  View own expenses             ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Create expenses               ✓      ✓        ✓       ✓      ✓        ✓        ✓          ✓
  Approve expenses              ✓      ✓        -       ✓      -        -        ✓          -
  Delete expenses               ✓      ✓        -       -      -        -        ✓          -

REPORTS
  View reports                  ✓      ✓        ✓       ✓      -        ✓        ✓          -
  Generate reports              ✓      ✓        ✓       ✓      -        -        ✓          -
  Export reports                ✓      ✓        ✓       ✓      -        -        ✓          -

SETTINGS
  View settings                 ✓      ✓        -       -      -        -        -          -
  Edit company profile          ✓      ✓        -       -      -        -        -          -
  Manage integrations           ✓      ✓        -       -      -        -        -          -
  Manage billing                ✓      -        -       -      -        -        -          -
```

---

## SCOTT MARSHALL: DUAL IDENTITY

### The Problem
Scott Marshall is both:
1. The creator/administrator of the TradeOS platform
2. The owner of Two Fungis Finishing, a paying customer

These MUST be completely separate experiences.

### The Solution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SCOTT MARSHALL'S LOGIN EXPERIENCE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  After authentication, Scott sees:                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    SELECT WORKSPACE                                 │ │
│  │                                                                     │ │
│  │    ┌─────────────────────────────┐                                 │ │
│  │    │  🔧 TRADEOS PLATFORM        │  ← Platform Administrator       │ │
│  │    │     Platform Administration │                                 │ │
│  │    └─────────────────────────────┘                                 │ │
│  │                                                                     │ │
│  │    ┌─────────────────────────────┐                                 │ │
│  │    │  🏢 TWO FUNGIS FINISHING    │  ← Company Owner                │ │
│  │    │     Company Workspace       │                                 │ │
│  │    └─────────────────────────────┘                                 │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Platform Administrator Context

When Scott selects "TradeOS Platform":

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TRADEOS PLATFORM ADMIN                              Scott Marshall ▼    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SIDEBAR                          MAIN CONTENT                           │
│  ┌────────────┐                  ┌────────────────────────────────────┐ │
│  │ Dashboard  │                  │                                    │ │
│  │ ───────────│                  │  PLATFORM DASHBOARD                │ │
│  │ Orgs       │                  │                                    │ │
│  │ Users      │                  │  Active Organizations: 147         │ │
│  │ Subs       │                  │  Monthly Revenue: $12,450          │ │
│  │ Features   │                  │  Active Users: 523                 │ │
│  │ Templates  │                  │                                    │ │
│  │ Analytics  │                  │  ┌─────────────────────────────┐   │ │
│  │ Support    │                  │  │ RECENT SIGNUPS             │   │ │
│  │ Settings   │                  │  │ • ABC Contracting (Pro)    │   │ │
│  │            │                  │  │ • XYZ Builders (Trial)     │   │ │
│  │ ───────────│                  │  │ • 123 Renovations (Free)   │   │ │
│  │ Switch to: │                  │  └─────────────────────────────┘   │ │
│  │ Two Fungis │                  │                                    │ │
│  └────────────┘                  └────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Point:** No Two Fungis data visible here. This is platform-level only.

### Company Owner Context

When Scott selects "Two Fungis Finishing":

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TWO FUNGIS FINISHING                                Scott Marshall ▼    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  This is the MAINFRAME (Spec 1.0-1.2)                                   │
│  Scott sees EXACTLY what any paying customer would see.                 │
│                                                                          │
│  • Two Fungis projects                                                  │
│  • Two Fungis clients                                                   │
│  • Two Fungis Company Brain (with Two Fungis knowledge)                 │
│  • Two Fungis Production Library                                        │
│  • Two Fungis team members                                              │
│                                                                          │
│  NO platform admin features visible.                                    │
│  NO other organization's data visible.                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Context Switching

Scott can switch contexts at any time via:
- User menu dropdown → "Switch Workspace"
- Keyboard shortcut (Cmd+K → "Switch")

The current context is ALWAYS visible in the header.

---

## NEW CUSTOMER EXPERIENCE

### Signup Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEW CUSTOMER SIGNUP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: CREATE ACCOUNT                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Email: john@abccontracting.com                                      │ │
│  │ Password: ••••••••                                                  │ │
│  │ Full Name: John Smith                                               │ │
│  │                                                                     │ │
│  │ [Create Account]                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  STEP 2: CREATE ORGANIZATION                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Company Name: ABC Contracting                                       │ │
│  │ Primary Trade: [Drywall & Finishing ▼]                             │ │
│  │ Company Size: [2-5 employees ▼]                                    │ │
│  │ Province: [Ontario ▼]                                              │ │
│  │                                                                     │ │
│  │ [Create Company]                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  STEP 3: WELCOME TO YOUR WORKSPACE                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  Welcome to ABC Contracting!                                       │ │
│  │                                                                     │ │
│  │  Your workspace is ready. Let's set it up:                         │ │
│  │                                                                     │ │
│  │  □ Upload your logo                                                │ │
│  │  □ Add your business details                                       │ │
│  │  □ Review your Production Library                                  │ │
│  │  □ Invite your first team member                                   │ │
│  │  □ Create your first project                                       │ │
│  │                                                                     │ │
│  │  [Get Started]                                                     │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### What a New Organization Receives

| Component | Initial State |
|-----------|---------------|
| **Organization** | Created with provided name and details |
| **Workspace** | Empty, ready for use |
| **Owner Membership** | Creator becomes Company Owner |
| **Subscription** | Free tier (or selected plan) |
| **Company Brain** | Fresh instance, no prior knowledge |
| **Production Library** | Copy of TradeOS Default Library |
| **Templates** | Copy of TradeOS Default Templates |
| **Projects** | None |
| **Clients** | None |
| **Documents** | None |
| **Settings** | Defaults, ready for customization |

### What a New Organization Does NOT Receive

- ❌ Any other organization's data
- ❌ Two Fungis projects, clients, or documents
- ❌ Any Company Brain knowledge from other companies
- ❌ Access to platform administration
- ❌ Any confidential business data from TradeOS or other tenants

---

## COMPANY BRAIN ISOLATION

### The One Brain Per Company Rule

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     COMPANY BRAIN ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ORGANIZATION A                       ORGANIZATION B                     │
│  (Two Fungis)                         (ABC Contracting)                  │
│                                                                          │
│  ┌─────────────────────┐             ┌─────────────────────┐            │
│  │   COMPANY BRAIN A   │             │   COMPANY BRAIN B   │            │
│  │                     │             │                     │            │
│  │ Knows:              │             │ Knows:              │            │
│  │ • Two Fungis projects│             │ • ABC projects      │            │
│  │ • Two Fungis clients │             │ • ABC clients       │            │
│  │ • Two Fungis rates   │             │ • ABC rates         │            │
│  │ • Two Fungis history │             │ • ABC history       │            │
│  │                     │             │                     │            │
│  │ Cannot see:         │             │ Cannot see:         │            │
│  │ • ABC anything      │             │ • Two Fungis anything│            │
│  │ • Platform data     │             │ • Platform data     │            │
│  │ • Other orgs        │             │ • Other orgs        │            │
│  └─────────────────────┘             └─────────────────────┘            │
│           │                                   │                          │
│           │                                   │                          │
│           ▼                                   ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    PLATFORM LEARNING (ANONYMOUS)                     ││
│  │                                                                      ││
│  │  Aggregated, anonymized insights improve TradeOS defaults:           ││
│  │  • "Average drywall rate across all orgs: 44 sq ft/hr"              ││
│  │  • "Commercial projects typically have 15% scope creep"             ││
│  │                                                                      ││
│  │  NO confidential data. NO org-identifiable information.              ││
│  │  Used ONLY to improve platform defaults and suggestions.             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Company Brain Data Boundaries

| Data Type | Scope | Shared? |
|-----------|-------|---------|
| Conversation history | Organization | Never |
| Project knowledge | Organization | Never |
| Client information | Organization | Never |
| Production rates | Organization | Never |
| Financial data | Organization | Never |
| Document content | Organization | Never |
| Action history | Organization | Never |
| Learned patterns | Organization | Never (except anonymized aggregates) |

### Platform Learning (Anonymized)

The platform MAY aggregate anonymized data to improve defaults:

```
ALLOWED:
- "Average production rate for drywall installation: 44 sq ft/hr"
- "Commercial projects average 12% over initial estimate"
- "Most common expense categories: Materials, Labor, Equipment"

NOT ALLOWED:
- "Two Fungis charges $85/hr for labor"
- "ABC Contracting's biggest client is XYZ Corp"
- "Company A lost 3 bids to Company B last month"
```

---

## PRODUCTION LIBRARY INHERITANCE

### The Library Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION LIBRARY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LAYER 1: TRADEOS DEFAULT LIBRARY                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Maintained by TradeOS Platform                                      │ │
│  │ Industry-standard rates and items                                   │ │
│  │ Updated periodically based on market research                       │ │
│  │ Examples:                                                           │ │
│  │   • Drywall Installation: 45 sq ft/hr (base rate)                  │ │
│  │   • Paint (2 coats): 200 sq ft/hr                                  │ │
│  │   • Trim Installation: 25 linear ft/hr                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                          │                                               │
│                          │ Copied on org creation                        │
│                          ▼                                               │
│  LAYER 2: ORGANIZATION LIBRARY                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Owned by the Organization                                           │ │
│  │ Starts as copy of Default Library                                   │ │
│  │ Can be customized:                                                  │ │
│  │   • Adjust rates based on team speed                               │ │
│  │   • Add company-specific items                                     │ │
│  │   • Remove irrelevant items                                        │ │
│  │   • Organize into custom categories                                │ │
│  │ Example:                                                            │ │
│  │   • Drywall Installation: 48 sq ft/hr (our team is faster)         │ │
│  │   • Custom Coffered Ceiling: 4 hrs each (specialty item)           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                          │                                               │
│                          │ Learns from completed projects                │
│                          ▼                                               │
│  LAYER 3: LEARNED ADJUSTMENTS                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Company Brain analyzes actual vs. estimated                         │ │
│  │ Suggests rate adjustments                                           │ │
│  │ Example:                                                            │ │
│  │   "Your drywall rate is 48 sq ft/hr but last 5 commercial          │ │
│  │    projects averaged 42 sq ft/hr. Update rate?"                    │ │
│  │                                                                     │ │
│  │ User can accept or dismiss suggestions                              │ │
│  │ Accepted changes update Organization Library                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Library Isolation

- Each organization has its own Production Library
- Changes to one org's library do NOT affect others
- Platform defaults can be updated, but won't overwrite org customizations
- Organizations can "reset to defaults" if desired

---

## DATA MODEL

### Core Tables

```sql
-- PLATFORM LEVEL

platform_settings (
  id uuid PRIMARY KEY,
  key text UNIQUE,
  value jsonb,
  updated_at timestamp
)

platform_feature_flags (
  id uuid PRIMARY KEY,
  key text UNIQUE,
  enabled boolean,
  org_overrides jsonb,  -- {"org_id": true/false}
  created_at timestamp
)

platform_default_library (
  id uuid PRIMARY KEY,
  category text,
  name text,
  description text,
  unit text,
  default_rate decimal,
  default_material_cost decimal,
  metadata jsonb,
  created_at timestamp,
  updated_at timestamp
)

-- ORGANIZATION LEVEL

organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,           -- URL-friendly identifier
  primary_trade text,
  company_size text,
  province text,
  logo_url text,
  settings jsonb,             -- org-specific settings
  subscription_tier text,
  subscription_status text,
  created_at timestamp,
  updated_at timestamp
)

organization_members (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL,         -- owner, admin, estimator, etc.
  permissions jsonb,          -- role overrides if needed
  is_primary boolean,         -- default org for this user
  invited_by uuid,
  invited_at timestamp,
  accepted_at timestamp,
  created_at timestamp,
  
  UNIQUE(organization_id, user_id)
)

-- WORKSPACE DATA (All include organization_id)

projects (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

opportunities (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

clients (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

production_library (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  source_default_id uuid,     -- links to platform default if derived
  -- ... other fields
)

company_brain_threads (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

documents (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

invoices (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)

expenses (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  -- ... other fields
)
```

### Key Constraint

**EVERY business data table MUST have:**
```sql
organization_id uuid REFERENCES organizations(id) NOT NULL
```

No exceptions. This is the foundation of multi-tenancy.

---

## ROW LEVEL SECURITY (RLS)

### Supabase RLS Strategy

Every table with business data implements RLS policies that:
1. Check the user's organization membership
2. Filter data to only their organization(s)
3. Validate role permissions for write operations

### Example RLS Policies

```sql
-- Enable RLS on all business tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ... etc.

-- Helper function: Get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS uuid[] AS $$
  SELECT array_agg(organization_id)
  FROM organization_members
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: Get current organization context
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS uuid AS $$
  -- Retrieved from JWT claim set during auth
  SELECT (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid
$$ LANGUAGE sql;

-- PROJECTS: Users can only see projects in their organizations
CREATE POLICY "Users see own org projects"
  ON projects FOR SELECT
  USING (organization_id = get_current_organization_id());

CREATE POLICY "Users insert in own org"
  ON projects FOR INSERT
  WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "Users update own org projects"
  ON projects FOR UPDATE
  USING (organization_id = get_current_organization_id());

-- Similar policies for all other tables...
```

### Organization Context in JWT

When a user authenticates and selects an organization:

```javascript
// Custom JWT claims include:
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "organization_id": "selected-org-uuid",
  "role": "owner"  // Role in that organization
}
```

This allows RLS policies to enforce organization-scoped access at the database level.

---

## API ARCHITECTURE

### Organization-Scoped Endpoints

All business data endpoints are organization-scoped:

```
/api/organizations/{org_id}/projects
/api/organizations/{org_id}/opportunities
/api/organizations/{org_id}/clients
/api/organizations/{org_id}/brain/...
/api/organizations/{org_id}/library/...
```

Or, with organization context in headers/JWT:

```
X-Organization-ID: {org_id}

/api/projects          # Implicitly scoped by header
/api/opportunities     # Implicitly scoped by header
```

### Platform Admin Endpoints

Separate routes for platform administration:

```
/api/platform/organizations        # List all orgs (admin only)
/api/platform/users                # List all users (admin only)
/api/platform/analytics            # Platform metrics (admin only)
/api/platform/feature-flags        # Feature management (admin only)
/api/platform/default-library      # Manage defaults (admin only)
```

### Permission Middleware

```python
# Example FastAPI middleware

async def require_permission(permission: str):
    """Decorator to check organization role permissions"""
    async def middleware(request: Request):
        org_id = request.headers.get("X-Organization-ID")
        user_id = get_current_user_id(request)
        
        # Check membership and role
        membership = await get_membership(user_id, org_id)
        if not membership:
            raise HTTPException(403, "Not a member of this organization")
        
        # Check permission
        if not has_permission(membership.role, permission):
            raise HTTPException(403, f"Permission denied: {permission}")
        
        return membership
    return middleware

# Usage
@router.post("/projects")
@require_permission("projects.create")
async def create_project(...):
    ...
```

---

## SCALABILITY CONSIDERATIONS

### Small Contractor (1-5 users)

- Single organization
- Owner does everything
- Minimal role complexity
- Free or Pro tier

### Growing Business (5-20 users)

- Single organization
- Multiple roles (Owner, Estimator, PM, Foreman, Office)
- Role-based access control becomes important
- Pro or Elite tier

### Enterprise Contractor (20-100 users)

- Single organization with complex structure
- All roles in use
- Department-level organization
- Custom reporting needs
- Elite or custom tier

### Multi-Location / Franchise (Multiple orgs)

- Multiple organizations under same owner
- Cross-org reporting (platform feature)
- Shared resources (future feature)
- Enterprise pricing

### Property Manager / Developer

- Multiple organizations (per property/project)
- Portal access for contractors
- Document management focus
- Enterprise pricing

### Government / Institutional

- Single large organization
- Strict compliance requirements
- Audit logging
- Custom SLA

The architecture supports all these without modification because:
1. Organization is the isolation boundary (not company size)
2. Roles are flexible (add/remove as needed)
3. RLS scales with data volume
4. Subscription tiers unlock features (not change architecture)

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation

1. Create `organizations` table
2. Create `organization_members` table
3. Migrate existing users to organization structure
4. Create Two Fungis organization
5. Create Platform organization (for admin access)
6. Assign Scott Marshall to both
7. Implement organization context switching

### Phase 2: RLS Implementation

1. Add `organization_id` to all existing business tables
2. Backfill `organization_id` for existing data (Two Fungis)
3. Enable RLS on all tables
4. Create RLS policies
5. Update all API endpoints to be organization-scoped

### Phase 3: New User Experience

1. Update signup flow to create organization
2. Copy default library on org creation
3. Initialize empty Company Brain
4. Create onboarding checklist

### Phase 4: Platform Administration

1. Build platform admin dashboard
2. Implement platform-level endpoints
3. Create feature flag system
4. Build default library management

### Phase 5: Role & Permission System

1. Implement full permission matrix
2. Build role management UI
3. Add permission checks to all endpoints
4. Create invitation system for team members

---

## MIGRATION STRATEGY

### Existing Data

All existing TradeOS data belongs to Two Fungis Finishing.

```sql
-- Create Two Fungis organization
INSERT INTO organizations (id, name, slug, ...)
VALUES ('two-fungis-uuid', 'Two Fungis Finishing', 'two-fungis', ...);

-- Assign existing owners
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'two-fungis-uuid', user_id, 'owner'
FROM tfcs_user_roles
WHERE role = 'owner';

-- Backfill organization_id on all existing data
UPDATE projects SET organization_id = 'two-fungis-uuid';
UPDATE clients SET organization_id = 'two-fungis-uuid';
UPDATE invoices SET organization_id = 'two-fungis-uuid';
-- ... etc.
```

### Scott Marshall Setup

```sql
-- Create Platform organization (special)
INSERT INTO organizations (id, name, slug, is_platform)
VALUES ('platform-uuid', 'TradeOS Platform', 'tradeos-platform', true);

-- Scott is Platform Admin
INSERT INTO organization_members (organization_id, user_id, role, is_primary)
VALUES ('platform-uuid', 'scott-user-uuid', 'platform_admin', false);

-- Scott is also Two Fungis Owner (existing)
UPDATE organization_members 
SET is_primary = true 
WHERE user_id = 'scott-user-uuid' 
  AND organization_id = 'two-fungis-uuid';
```

---

## SECURITY CHECKLIST

| Requirement | Implementation |
|-------------|----------------|
| Data isolation | RLS policies on all tables |
| Cross-tenant leakage prevention | organization_id required, no direct queries |
| Permission enforcement | API middleware + RLS |
| Audit logging | All mutations logged with user + org context |
| Session management | JWT includes organization context |
| Admin access logging | Platform admin actions separately logged |
| Password security | Supabase Auth handles |
| API rate limiting | Per-organization limits |

---

## CONSTITUTIONAL DECISIONS (Resolved)

The following questions were resolved by TradeOS Constitution v1.0:

| Question | Constitutional Answer | Reference |
|----------|----------------------|-----------|
| Organization URL slugs? | **NO** — Organizations never appear in URLs | Article V |
| Remember last org? | **YES** — System remembers previously active workspace | Article VI |
| Lightweight portal users? | **NO** — External users are first-class authenticated users | Article VII |
| Separate admin app? | **NO** — Platform Admin is hidden workspace in same app | Article IV |

## OPEN QUESTIONS (All Resolved)

All open questions have been resolved per **Final Product Decisions** (July 12, 2026):

| Question | Decision |
|----------|----------|
| TFCS Role Migration | Migrate to Organization model. Maintain backward compatibility during transition. |

---

## URL PHILOSOPHY (Per Constitution Article V)

Organizations shall **never** appear in URLs.

```
❌ FORBIDDEN:
   tradeos.ca/app/two-fungis/projects
   tradeos.ca/orgs/abc-contracting/dashboard

✅ REQUIRED:
   tradeos.ca/app
   tradeos.ca/app/projects
   tradeos.ca/app/opportunities/[uuid]
```

Organization context is determined by JWT claims and Workspace Switcher selection.

---

## WORKSPACE SWITCHER (Per Constitution Article VI)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKSPACE SWITCHER                                 │
│                    (Accessible via header dropdown or Cmd+K)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   YOUR WORKSPACES                                                           │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │  🏢 Two Fungis Finishing                              Owner       │     │
│   │     Last active: 2 minutes ago                        ● Current   │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │  🔧 TradeOS Platform                                  Admin       │     │
│   │     Platform Administration                                       │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                              │
│   + Create New Organization                                                 │
│   ─────────────────────────────────────────────────────────────────────     │
│   ⚙ Workspace Settings                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- System remembers last active workspace
- User returns to last workspace on login (no prompt)
- Switch anytime via header or keyboard shortcut
- Platform Workspace only visible to Platform role holders

---

## EXTERNAL USERS (Per Constitution Article VII)

All external parties are **first-class authenticated TradeOS users**:

| External Role | Description | Workspace Access |
|---------------|-------------|------------------|
| **Client** | Customer receiving services | Their Client Workspace + invited Projects |
| **Builder** | General contractor | Their Builder Workspace + assigned Projects |
| **Architect** | Design professional | Invited Projects (documents, RFIs) |
| **Consultant** | External advisor | Invited Projects (read access) |
| **Subcontractor** | Trade partner | Assigned work within Projects |
| **Property Owner** | Building owner | Their properties, maintenance |
| **Inspector** | Code/quality inspector | Inspection records, documents |

External users:
- Authenticate through same Supabase Auth
- Have their own profile and settings
- Receive appropriate permissions per relationship
- Can belong to multiple organizations (e.g., a subcontractor working for multiple GCs)

---

## COMPANY BRAIN (Per Constitution Article VIII)

> **Company Brain is the Operations Manager of the company, not a chatbot.**

Each organization's Company Brain is completely isolated. See Specification 1.2 for detailed Company Brain architecture.

**Platform-Level Learning:**
Only anonymized, aggregate insights may improve platform defaults. No confidential data crosses organization boundaries.

---

## USER EXPERIENCE (Per Constitution Article X)

All UI implementations must adhere to Constitutional UX principles:
- Professional, Calm, Fast, Minimal, Modern
- Context Aware, Predictive
- Never overwhelming or cluttered

Detailed design specifications follow the TradeOS Design System (separate document).

---

## VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.5 | July 12, 2026 | Chief Architect | Initial specification |
| 1.5.1 | July 12, 2026 | Chief Architect | Constitution compliance updates: resolved open questions, added Workspace Switcher, external users, URL philosophy |

---

## SUMMARY

This specification establishes TradeOS as a true multi-tenant SaaS platform where:

- **Every company is isolated** — No data leakage between organizations
- **Scott Marshall has dual identity** — Platform Admin AND Company Owner, completely separate
- **New customers get a fresh start** — Empty workspace, default library, their own Company Brain
- **Roles scale with business** — From one-man contractor to enterprise
- **Architecture is future-proof** — No redesign needed as platform grows

**This is foundational.** All other specifications (Tender Workspace, Production Library, etc.) build on this architecture.

---

**END OF SPECIFICATION 1.5**

*This document requires user approval before any implementation begins.*
