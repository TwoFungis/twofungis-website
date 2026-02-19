# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (Feb 18, 2026)

### ✅ Theme: Light Background + Dark Cards
- Light cloud grey background (#f4f6f8)
- Dark charcoal cards for content
- Dark sidebar for contrast
- Larger TRADEOS™ logo with text in sidebar

### ✅ Materials System (Phase 1 - Complete)
**Materials Tab in Projects:**
- Summary panel: Pre-Tax Total, Tax Total, Total w/ Tax, Billable, Non-Billable
- Full CRUD for materials with categories: Materials, Consumables, Tools, Equipment, Rental, Delivery
- Units: Each, Box, Sheet, Linear Ft, Sq Ft, Hours, Days, Gallon, Pound, Other
- Tax types: GST, PST, HST, Sales Tax, None
- Billable toggle with markup percentage

### ✅ Enhanced Expenses (Phase 2 - Complete)
**14 Contractor-Focused Categories:**
| Category | Default Deductibility |
|----------|----------------------|
| Materials (COGS) | 100% |
| Consumables | 100% |
| Tools (<$500) | 100% |
| Equipment (Capital) | 100% |
| Vehicle & Fuel | 100% |
| **Meals & Entertainment** | **50%** |
| Subcontractors | 100% |
| Insurance | 100% |
| Office/Admin | 100% |
| Phone/Internet | 100% |
| Travel/Lodging | 100% |
| Training/Certifications | 100% |
| Rent/Shop | 100% |
| Other | 100% |

**New API Endpoints:**
- `/api/expenses/categories/list` - Returns categories with deductibility
- `/api/expenses/summary/monthly` - Monthly expense summary
- `/api/expenses/summary/quarterly` - Quarterly expense summary

### ✅ Tax Summary Page (Phase 3 - Complete)
**Features:**
- Monthly / Quarterly / Yearly view toggle
- Year and Month/Quarter selectors
- Tax Rate selector (15%, 20%, 25%, 30%, 35%, 40%)
- Summary cards: Revenue, Expenses, Deductible, Tax Paid
- Tax Projection panel with:
  - Estimated Tax Owing
  - Net Income (Revenue - Expenses)
  - Recommended Set-Aside
- Expenses by Category breakdown with visual bars
- Export CSV functionality
- Disclaimer: "Estimates only — confirm with your accountant."

### ✅ TradeOS Refinement Pack Phase 1 (Complete - Feb 19, 2026)
**Focus: Financial Clarity - Get contractors paid faster**

**1. 30-Day Cash Flow Forecast (Dashboard)**
- Expected Income: Open invoices + Milestones due within 30 days
- Projected Expenses: Based on last 30 days spending pattern
- Net Projected Balance with positive/negative styling
- Cash flow status indicator (Positive Flow / Cash Gap / Neutral)
- Quick links to View Invoices and Track Expenses

**2. Profit Snapshot on Project Cards**
- Margin % badge next to project name (color-coded)
- New "Projected Profit" column: contract_value + approved_cos - cost_to_date
- 5-column grid: Contract Value, Approved COs, % Complete, Cost to Date, Projected Profit

**3. Receivables Page (/app/receivables)**
- 4 summary cards: Total Outstanding, Overdue, Due This Week, Reminders Sent
- Invoice table with client name, amount, due date, days_overdue
- Send Reminder modal with 3 tone options:
  - Friendly: "Hope you're doing well! Just a quick reminder..."
  - Standard: "This is a reminder that invoice remains unpaid..."
  - Firm: "URGENT: Immediate payment required..."
- Uses Resend API for email delivery

**4. Receivables at a Glance (Dashboard)**
- Shows top 4 outstanding invoices with days overdue
- Quick "Send Reminder" links for overdue invoices
- Summary: Total Outstanding and Total Overdue

**New API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/receivables/outstanding` | GET | List outstanding invoices with days_overdue |
| `/api/receivables/cash-flow-forecast` | GET | 30-day income/expense projection |
| `/api/receivables/reminder-templates` | GET | Get 3 reminder tone templates |
| `/api/receivables/send-reminder` | POST | Send reminder email via Resend |

### ✅ Previous Implementations
- Beta Trial Strategy (30-day trial, setup checklist, countdown)
- Dashboard 3-Zone Layout
- Project Page with Financial Health Panel + Tabs
- Invoicing System
- Milestone Management
- Expenses API

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **Database:** Supabase (Postgres)
- **Payments:** Stripe
- **Email:** Resend
- **AI:** GPT-4 Vision (via Emergent LLM key)

---

## API Endpoints

### Materials API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/materials` | GET/POST | List/Create materials |
| `/api/materials/{id}` | GET/PATCH/DELETE | CRUD operations |
| `/api/materials/project/{id}/summary` | GET | Project summary |
| `/api/materials/categories/list` | GET | Categories/units list |

### Expenses API (Enhanced)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/expenses` | GET/POST | List/Create expenses |
| `/api/expenses/categories/list` | GET | Categories with deductibility |
| `/api/expenses/summary/monthly` | GET | Monthly summary |
| `/api/expenses/summary/quarterly` | GET | Quarterly summary |
| `/api/expenses/summary/tax` | GET | Yearly tax summary |

### Other APIs
- Invoices: `/api/invoices/*`
- Milestones: `/api/milestones/*`
- Trial: `/api/trial/*`

---

## Color System

| Element | Color |
|---------|-------|
| Background | `cloud-100` (#f4f6f8) |
| Cards | `charcoal-800` (#1a1a1a) |
| Sidebar | `charcoal-800` (#1a1a1a) |
| Card Borders | `charcoal-700` |
| Primary Button | `steel-500` |
| Success | `success` (green) |
| Warning | `warning` (amber) |
| Risk | `risk` (red) |

---

## Navigation Structure
1. Dashboard
2. Projects
3. Estimates
4. Change Orders
5. Milestones
6. Invoices
7. Expenses
8. Document Vault
9. **Tax Summary** (NEW)
10. Reports
11. Settings

---

## Testing Status
- ✅ Theme (Light bg + Dark cards): 100%
- ✅ Sidebar Logo: 100%
- ✅ Materials Tab: 100%
- ✅ Tax Summary Page: 100%
- ✅ Enhanced Expenses API: 100%
- ✅ Expense Creation: 100% (P0 Fixed Feb 18)
- ✅ Invoice Creation: 100% (P0 Fixed Feb 18)
- ✅ Text Visibility: 100% (P0 Fixed Feb 18)
- ✅ Setup Progress Checklist Visibility: 100% (Fixed Feb 18)
- ✅ Phase 2 Enhanced Expenses UI: 100% (Feb 18)
- ✅ Quick Add Expense Global Button: 100% (Feb 18)
- ✅ Founder Accounts: 100% (Feb 18)
- ✅ Shield Branding App Headers: 100% (Feb 18)

---

## Founder Accounts
Three founding members have been granted lifetime Elite access:
1. info@twofungis.ca
2. swdmarshall@gmail.com
3. carpenterbeau@hotmail.com

**API Endpoints:**
- `GET /api/founders/count` - Returns founder count (97/100 remaining)
- `GET /api/founders/status/{email}` - Check if email is a founder
- `POST /api/founders/sync-all` - Sync all founder accounts to elite tier

---

## Backlog

### P1 - Invoice Hardening
- [ ] Automatic overdue status calculation
- [ ] Global Receivables Report

### P2 - Reports Enhancement
- [ ] Materials by Project report
- [ ] PDF export for reports

---

## Files Reference

### Tax Summary
- `/app/frontend/src/pages/app/TaxSummaryPage.jsx`

### Materials
- `/app/frontend/src/components/project/MaterialsTab.jsx`
- `/app/backend/routes/materials.py`

### Expenses
- `/app/backend/routes/expenses.py`

### Layout
- `/app/frontend/src/components/layout/AppLayout.jsx`

### Migrations
- `/app/migrations/008_materials_and_expenses.sql`

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 19, 2026 | 6.0 | **TradeOS Refinement Pack Phase 1**: 30-Day Cash Flow Forecast on dashboard (Expected Income, Projected Expenses, Net Projected), Profit Snapshot on project cards (Margin % badge + Projected Profit column), Receivables page with Send Reminder feature (3 tone templates via Resend), Receivables at a Glance on dashboard, Outstanding/Overdue invoice tracking with days_overdue |
| Feb 19, 2026 | 5.1 | **Critical Bug Fixes**: Fixed founder account Reports page access (email check uses user.email), fixed sidebar plan display for founders (shows 'Lifetime Elite Plan'), fixed Setup Progress visibility for all users, fixed expense date field mapping (expense_date not date), verified AI Copilot typeable input, verified Quick Expense standalone button, verified Expenses edit/delete functionality |
| Feb 19, 2026 | 5.0 | **AI Copilot**: Added context-aware AI assistant with GPT-5.2, right-side drawer UI, suggested prompts per page, project context fetching, structured estimate generation, plan gating (Pro vs Elite), and AI logging |
| Feb 19, 2026 | 4.0 | **Intelligence Layer Upgrade**: Added tagline branding site-wide, central Average Margin metric on dashboard, Profit Snapshot panel on projects, Margin Risk Alerts in estimates, AI Estimate Generator (GPT-5.2), QuickBooks Integration page (mocked), Integrations nav link |
| Feb 18, 2026 | 3.2 | **Shield Headers Fixed**: Dark text with shield icons beside all app page headings, removed right shield from landing page, Reports page upgrade button fixed ($59/mo + link), Founder accounts API created and synced |
| Feb 18, 2026 | 3.1 | **Pricing & Founder Plan**: Fixed pricing (Pro $29, Elite $59), restored Lifetime Founder $599 plan with badging, darker subpage headers, more visible shield watermark (6%), shields on all subpages |
| Feb 18, 2026 | 3.0 | **Brand Overhaul**: Shield icon branding throughout app (sidebar, login, signup, dashboard, settings, landing page), larger header logos, background watermarks, "Free Month Trial" text |
| Feb 18, 2026 | 2.9 | **UI Polish**: Setup Progress minimized by default with dark header, larger logos (website/app), shield backdrop watermark, "Free Month Trial" text updated |
| Feb 18, 2026 | 2.8 | **Phase 2 Complete**: Setup Progress visibility fix, Enhanced Expenses UI (Business/Personal toggle, Deductibility %, Payment Method), Quick Add Expense global button |
| Feb 18, 2026 | 2.7 | **P0 Bug Fixes**: Fixed ExpensesPage runtime error (CATEGORIES case sensitivity), fixed expense/invoice creation auth, fixed text visibility across all pages |
| Feb 18, 2026 | 2.6 | **Phase 2 & 3**: Enhanced Expenses (14 categories + deductibility), Tax Summary Page |
| Feb 18, 2026 | 2.5 | Light background theme, Materials System Phase 1 |
| Feb 18, 2026 | 2.4 | Beta Trial Strategy |
| Feb 18, 2026 | 2.3 | Dashboard/Project restructure |
