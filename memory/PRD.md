# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## Strategic Direction (Updated February 18, 2026)
TradeOS has pivoted from a marketplace-hybrid model to a **focused Contractor Operating System** centered on:
- **Financial Control** - Margin tracking, receivables, expense management
- **Project Management** - Milestones, change orders, project timelines
- **Profitability** - Invoice discipline, payment tracking, tax-ready bookkeeping

**Removed:** All public marketplace functionality (contractor directory, job postings, service listings)

---

## What's Been Implemented

### ✅ Strategic Pivot - Phase 1 Complete (Feb 18, 2026)
- Marketplace functionality removed from navigation and UI
- New landing page with updated branding and messaging
- Simplified navigation focusing on core business functions

### ✅ Invoicing System (NEW - Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Invoice creation with line items | ✅ Complete |
| Auto-incrementing invoice numbers | ✅ Complete |
| Status workflow (Draft → Sent → Paid) | ✅ Complete |
| Receivables dashboard widget | ✅ Complete |
| Invoice detail view | ✅ Complete |
| Mark as paid functionality | ✅ Complete |

**Backend Endpoints:**
- `GET /api/invoices` - List all invoices with stats
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{id}` - Get invoice details
- `PATCH /api/invoices/{id}` - Update draft invoice
- `POST /api/invoices/{id}/send` - Mark as sent
- `POST /api/invoices/{id}/mark-paid` - Mark as paid
- `DELETE /api/invoices/{id}` - Delete draft invoice
- `GET /api/invoices/stats/receivables` - Aging report

### ✅ Milestone Management (NEW - Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Milestone CRUD operations | ✅ Complete |
| Status workflow (Draft → Submitted → Approved → Invoiced → Paid) | ✅ Complete |
| Edit lock after invoicing | ✅ Complete |
| Invoice generation from milestones | ✅ Complete |
| Milestone statistics | ✅ Complete |

**Backend Endpoints:**
- `GET /api/milestones` - List all milestones with stats
- `POST /api/milestones` - Create new milestone
- `GET /api/milestones/{id}` - Get milestone details
- `PATCH /api/milestones/{id}` - Update milestone (draft/submitted only)
- `POST /api/milestones/{id}/status` - Update status with workflow validation
- `DELETE /api/milestones/{id}` - Delete draft milestone
- `GET /api/milestones/project/{id}/summary` - Project milestone summary

### ✅ Stripe Integration (Live Mode)
| Plan | Price | Type |
|------|-------|------|
| PRO | $39 CAD/mo | Subscription |
| ELITE | $59 CAD/mo | Subscription |
| LIFETIME_ELITE | $599 CAD | One-time (100 seats, Canada-only) |

### ✅ Dashboard Financial Pulse
- Quick stats bar (Receivables, This Month, Pending COs, Overdue)
- Outstanding payments widget with aging breakdown
- Project financial health panel

### ✅ Other Features
- Change Order management with margin impact
- Expense tracking with AI receipt scanning
- Quote builder with flexible payment terms
- Production logs
- Labor profile management

---

## Database Schema

### New Tables Required (Run Migration!)
```sql
-- Migration file: /app/migrations/006_invoicing_milestones_schema.sql

-- project_milestones: Milestone tracking
-- invoices: Invoice records
-- invoice_line_items: Invoice line items
-- invoice_counters: Auto-increment invoice numbers
-- invoice_activity_log: Audit trail
```

### Tables to Remove (Optional Cleanup)
```sql
-- Migration file: /app/migrations/005_drop_marketplace_tables.sql

-- marketplace_jobs, contractor_services, contractor_connections
-- contractor_inquiries, contractor_profiles_public, contractor_verification
```

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **Payments:** Stripe (subscriptions + one-time)
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Email:** Resend
- **AI:** GPT-4 Vision (via Emergent LLM key)

---

## Navigation Structure
```
Dashboard      - Financial overview
Projects       - Project management
Estimates      - Quote builder
Change Orders  - CO tracking
Milestones     - Milestone management (NEW)
Invoices       - Invoice management (NEW)
Expenses       - Expense tracking
Document Vault - File storage
Reports        - Business analytics
Settings       - Account & subscription
```

---

## Key Files
| File | Purpose |
|------|---------|
| `/app/backend/routes/invoices.py` | Invoice API endpoints |
| `/app/backend/routes/milestones.py` | Milestone API endpoints |
| `/app/frontend/src/pages/app/InvoicesPage.jsx` | Invoice management UI |
| `/app/frontend/src/pages/app/MilestonesPage.jsx` | Milestone management UI |
| `/app/migrations/006_invoicing_milestones_schema.sql` | Database schema |

---

## Testing Status
- ✅ Backend: 100% (28/28 tests passed)
- ✅ Frontend: All UI elements present and functional
- ✅ Landing page branding verified
- ✅ Auth middleware working correctly

---

## Pending User Actions

### Critical - Database Setup
1. **Run SQL Migration:** Execute `/app/migrations/006_invoicing_milestones_schema.sql` in Supabase SQL Editor
2. **Optional Cleanup:** Execute `/app/migrations/005_drop_marketplace_tables.sql` to remove marketplace tables

### Configuration
- Stripe keys configured ✅
- Resend API key configured ✅
- Supabase connection configured ✅

---

## Backlog (P1)
- [ ] Dashboard Financial Health Panel - Project-level metrics
- [ ] Reporting Engine - PDF export functionality
- [ ] Complete Settings Page (Edit Profile, Security, Delete Account)

## Future Tasks (P2)
- [ ] Expense & Tax enhancements
- [ ] Payment reminders automation
- [ ] Advanced reports with charts
- [ ] Final code cleanup (remove orphaned marketplace files)

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.0 | Strategic pivot, Invoicing & Milestones |
| Feb 17, 2026 | 1.5 | Marketplace V2 (now removed) |
| Feb 16, 2026 | 1.0 | Initial Stripe integration |
