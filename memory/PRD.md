# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

## Problem Statement
Contractors need a purpose-built operating system to manage their business operations - from quoting jobs to tracking profitability, managing change orders, and logging daily production. TradeOS provides all these tools in a single, mobile-first platform designed specifically for the construction trades.

---

## What's Been Implemented (February 18, 2026)

### ✅ PHASE: Margin & Invoice Discipline Hardening (COMPLETE)

#### 1. Dashboard Financial Pulse (NEW)
- **Quick Stats Bar** - Real-time metrics at top of dashboard:
  - Total Receivables (approved milestones + COs awaiting payment)
  - This Month Revenue (paid milestones MTD)
  - Pending COs value
  - Overdue Amount (60+ days)
- **Outstanding Payments Widget** - Aging breakdown:
  - 0-30 days (Current) - Green
  - 31-60 days (Follow up) - Yellow
  - 60+ days (At Risk) - Red
  - Visual progress bar showing distribution
- Dashboard now shows 100% REAL data from database

#### 2. Project Financial Health Panel (NEW)
- Prominent panel at top of each project page showing:
  - Contract Value
  - Approved COs (with +$ indicator)
  - Total Revenue (contract + COs)
  - Cost to Date
  - Gross Profit (calculated)
  - Profit at Completion (forecast)
  - Margin % with health indicator (Excellent/On Target/Below/At Risk)
  - Completion progress bar

#### 3. Change Order Margin Impact (NEW)
- Each CO now displays:
  - Calculated margin % based on value vs costs
  - Profit amount (value - labor - material)
  - Color-coded badge: green (≥15%), yellow (≥0%), red (<0%)

#### 4. Invoice Generation from Milestones (NEW)
- "Generate Invoice" button on approved milestones
- Professional PDF invoice generation with:
  - Company branding
  - Invoice number (auto-generated)
  - Client details from project
  - Milestone breakdown
  - Payment terms (uses default from settings)
  - Due date calculation
- Invoice details stored on milestone (invoice_number, invoice_date, due_date)
- Activity log entry created for audit trail

#### 5. Audit Trail / Activity Logging (NEW)
- `activity_log` table created
- Logs important actions:
  - Invoice generation
  - Milestone status changes
  - (Extensible for future actions)

#### 6. Default Payment Terms in Settings (NEW)
- Business Defaults section added to Settings page
- Quick select buttons: Net 7, 14, 30, 45, 60
- Custom days input for flexible terms
- Saved to user profile
- Applied automatically to new quotes and invoices

#### 7. Reports Page with Real Analytics (NEW)
- KPI cards with real data:
  - Average Margin
  - Revenue (MTD)
  - CO Approval Rate
  - At-Risk Projects count
- Revenue Trend chart (6 months bar chart)
- Margin by Project (visual breakdown)
- Project Performance Table with sortable columns

---

### ✅ Quality Audit Fixes (Prior Session)
- Dashboard: Removed all mock data, shows real DB data
- Change Orders: Full CRUD (was mock only)
- Production Logs: Full CRUD (was mock only)
- Labor Profile Save: Now persists to database
- Quote Builder: Flexible payment terms

---

## Database Schema

### Tables (run in Supabase SQL Editor):
```sql
-- Core tables from APPLY_THIS_SCHEMA.sql
users_profile, projects, project_milestones, client_approval_tokens, etc.

-- Additional tables from APPLY_ADDITIONAL_TABLES.sql
change_orders, production_logs, labor_profiles

-- Invoice/Audit fields (added Feb 18):
ALTER TABLE project_milestones ADD COLUMN invoice_number TEXT;
ALTER TABLE project_milestones ADD COLUMN invoice_date TIMESTAMPTZ;
ALTER TABLE project_milestones ADD COLUMN due_date TIMESTAMPTZ;
ALTER TABLE project_milestones ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE users_profile ADD COLUMN default_payment_days INTEGER DEFAULT 30;

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **AI:** GPT-4 Vision (via Emergent LLM key) for receipt scanning
- **Payments:** Stripe (configured)

---

## Key Files Updated This Session
- `/app/frontend/src/pages/app/DashboardPage.jsx` - Financial pulse dashboard
- `/app/frontend/src/pages/app/ProjectDetailPage.jsx` - Financial Health Panel
- `/app/frontend/src/pages/app/ChangeOrdersPage.jsx` - Margin impact visibility
- `/app/frontend/src/pages/app/SettingsPage.jsx` - Business Defaults section
- `/app/frontend/src/pages/app/ReportsPage.jsx` - Real analytics & charts
- `/app/frontend/src/components/milestones/ProjectMilestones.jsx` - Invoice generation

---

## Testing Status
- ✅ Dashboard Quick Stats: Working
- ✅ Outstanding Payments Widget: Working
- ✅ Change Orders with margin impact: Working
- ✅ Project Financial Health Panel: Implemented
- ✅ Invoice Generation: Implemented
- ✅ Settings Payment Terms: Implemented
- ✅ Reports with real data: Implemented

---

## Future Tasks (Backlog)
- Live Demo mode
- Customer-facing marketplace
- AI renovation visualization
- Payment escrow

---

## Credentials for Testing
- Test account: `test703691@tradeos.test` / `TestPass123!`
- Or create new account via signup
