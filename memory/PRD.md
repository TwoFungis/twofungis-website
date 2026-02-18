# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

## Problem Statement
Contractors need a purpose-built operating system to manage their business operations - from quoting jobs to tracking profitability, managing change orders, and logging daily production. TradeOS provides all these tools in a single, mobile-first platform designed specifically for the construction trades.

## Core Requirements

### Branding & Design
- Professional, minimal, industrial style
- Dark theme with deep charcoal background (#0d0d0d - #333333)
- Steel blue accents (#5a8fb8)
- Status colors: Success (green), Warning (yellow), Risk (red)

### Tech Stack
- **Frontend:** React with Tailwind CSS
- **Backend:** FastAPI (Python) + Supabase (PostgreSQL)
- **Payments:** Stripe (subscriptions via emergentintegrations)
- **State Management:** Zustand
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **AI Receipt Scanning:** GPT-4 Vision (via Emergent LLM key)

---

## What's Been Implemented (February 18, 2026)

### ✅ Quality Audit & App Hardening (NEW - Feb 18)
**Removed all mock data - app now shows REAL database data everywhere**

- [x] **Dashboard** - Now shows REAL project data, change orders, milestones (no more mock)
- [x] **Change Orders CRUD** - Full create, edit, delete, status change (was mock only)
- [x] **Production Logs CRUD** - Full create, edit, delete (was mock only)
- [x] **Labor Profile Save** - Now persists to database (was non-functional)
- [x] **Flexible Payment Terms** - Quote builder supports Net 7/14/30/45/60 + custom days input
- [x] **Quote Validity** - Custom quote validity days input

**Database Tables Added:**
- `change_orders` - Track change orders with status, costs, notes
- `production_logs` - Daily crew production tracking
- `labor_profiles` - Save labor cost calculator profiles

### ✅ Phase 2.5: Bookkeeping & Tax Management
- [x] **Bookkeeping Page** - `/app/bookkeeping` for expense tracking
- [x] **AI Receipt Scanner** - GPT-4 Vision powered OCR
- [x] **Manual Expense Form** - Add expenses without scanning
- [x] **Bulk Receipt Upload** - Upload and scan multiple receipts
- [x] **Document Vault** - Store invoices, contracts, quotes
- [x] **PDF Report Export** - Generate tax-ready expense reports
- [x] **Tax Savings Advisor** - Tax set-aside %, quarterly calculator, deduction tips

### ✅ Phase 1: Milestone Approval Engine
- [x] **Milestones Tab** - Tabbed interface (Overview, Milestones, Activity)
- [x] **Milestone CRUD** - Add, edit, delete with auto-calculated values
- [x] **Status Workflow** - Draft → Submitted → Approved → Paid
- [x] **Client Review System** - Secure shareable links for approval
- [x] **Dashboard Widget** - Milestone summary

### ✅ Phase 2: Contractor Hub
- [x] **Profile Page** - Editable profile with avatar, bio, skills, certifications
- [x] **Public Profile** - `/contractor/:id` for customers to view

### ✅ Core Features
- [x] **Authentication** - Login, signup, magic link, onboarding
- [x] **Projects CRUD** - Full project management with detail pages
- [x] **Quote Builder** - Line items, pricing, flexible terms, PDF export
- [x] **Labor Cost Calculator** - With profile saving
- [x] **Settings** - Stripe subscription upgrade

---

## Database Schema (Required Tables)

### Tables Applied via SQL:
```
- users_profile (extended with contractor fields)
- projects
- project_milestones
- change_orders (NEW)
- production_logs (NEW)
- labor_profiles (NEW)
- client_approval_tokens
- milestone_approval_log
- contractor_reviews
- contractor_badges
- portfolio_images
- expenses
- documents
```

**Important:** Run `/app/APPLY_THIS_SCHEMA.sql` and `/app/APPLY_ADDITIONAL_TABLES.sql` in Supabase SQL Editor.

---

## Testing Status (Feb 18, 2026)
- **Dashboard:** ✅ Shows real data
- **Change Orders CRUD:** ✅ Verified working
- **Production Logs CRUD:** ✅ Modal functional
- **Labor Profile Save:** ✅ Saves to database
- **Quote Builder:** ✅ Flexible payment terms working

---

## Upcoming: Margin & Invoice Discipline Hardening (P0)

User's 7-point plan for next phase:

1. **Milestone-Based Invoice Triggers** - Generate invoice when milestone approved
2. **Project Profit Clarity Panel** - Financial health metrics on project page
3. **Change Order Impact Visibility** - Show margin impact on COs
4. **Receivables Control Dashboard Widget** - Outstanding payments overview
5. **Audit Trail Locking** - Activity log for key actions
6. **UI Simplification** - Remove redundant widgets
7. **Payment Terms Template** - Default terms in settings

---

## Future Tasks (DE-PRIORITIZED)
- Live Demo mode
- Customer-facing marketplace
- AI renovation visualization
- Payment escrow

---

## Files of Reference
- `/app/frontend/src/pages/app/DashboardPage.jsx` - Dashboard with real data
- `/app/frontend/src/pages/app/ChangeOrdersPage.jsx` - Change Orders CRUD
- `/app/frontend/src/pages/app/ProductionPage.jsx` - Production Logs CRUD
- `/app/frontend/src/pages/app/LaborPage.jsx` - Labor calculator with save
- `/app/frontend/src/pages/app/EstimatingPage.jsx` - Quote builder with flexible terms
- `/app/APPLY_ADDITIONAL_TABLES.sql` - New tables SQL
