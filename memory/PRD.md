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

### ✅ Strategic Pivot - Complete (Feb 18, 2026)
- Marketplace functionality removed from navigation and UI
- New landing page with updated branding and messaging
- Simplified navigation focusing on core business functions

### ✅ Invoicing System (Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Invoice creation with line items | ✅ Complete |
| Auto-incrementing invoice numbers | ✅ Complete |
| Status workflow (Draft → Sent → Paid) | ✅ Complete |
| Receivables dashboard widget | ✅ Complete |
| Invoice detail view | ✅ Complete |
| Mark as paid functionality | ✅ Complete |

### ✅ Milestone Management (Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Milestone CRUD operations | ✅ Complete |
| Status workflow (Draft → Submitted → Approved → Invoiced → Paid) | ✅ Complete |
| Edit lock after invoicing | ✅ Complete |
| Invoice generation from milestones | ✅ Complete |
| Milestone statistics | ✅ Complete |

### ✅ Dashboard Financial Health Panel (Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Contract Value display | ✅ Complete |
| Approved COs tracking | ✅ Complete |
| Total Revenue calculation | ✅ Complete |
| Gross Profit calculation | ✅ Complete |
| Average Margin with health indicator | ✅ Complete |
| Project breakdown with margin bars | ✅ Complete |

### ✅ Reports Page (Elite Feature) (Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Elite gate for non-Elite users | ✅ Complete |
| Overview tab with KPIs | ✅ Complete |
| Revenue tab with monthly breakdown | ✅ Complete |
| Expenses tab with category breakdown | ✅ Complete |
| Projects tab with performance table | ✅ Complete |
| Date range filter (Month/Quarter/YTD/All) | ✅ Complete |
| PDF Export (P&L, Revenue, Projects) | ✅ Complete |

### ✅ Settings Page - Complete (Feb 18, 2026)
| Feature | Status |
|---------|--------|
| Profile viewing & editing | ✅ Complete |
| Change password | ✅ Complete |
| Delete account with confirmation | ✅ Complete |
| Subscription display & upgrade | ✅ Complete |
| Invoice defaults | ✅ Complete |
| Notification preferences | ✅ Complete |

### ✅ Stripe Integration (Live Mode)
| Plan | Price | Type |
|------|-------|------|
| PRO | $49 CAD/mo | Subscription |
| ELITE | $99 CAD/mo | Subscription |
| LIFETIME_ELITE | $599 CAD | One-time (100 seats, Canada-only) |

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
Dashboard      - Financial overview with Health Panel
Projects       - Project management
Estimates      - Quote builder
Change Orders  - CO tracking
Milestones     - Milestone management
Invoices       - Invoice management
Expenses       - Expense tracking
Document Vault - File storage
Reports        - Business analytics (Elite)
Settings       - Account & subscription
```

---

## API Endpoints

### Invoices API
- `GET /api/invoices` - List all invoices with stats
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/{id}` - Get invoice details
- `PATCH /api/invoices/{id}` - Update draft invoice
- `POST /api/invoices/{id}/send` - Mark as sent
- `POST /api/invoices/{id}/mark-paid` - Mark as paid
- `DELETE /api/invoices/{id}` - Delete draft invoice
- `GET /api/invoices/stats/receivables` - Aging report

### Milestones API
- `GET /api/milestones` - List all milestones with stats
- `POST /api/milestones` - Create new milestone
- `GET /api/milestones/{id}` - Get milestone details
- `PATCH /api/milestones/{id}` - Update milestone
- `POST /api/milestones/{id}/status` - Update status with workflow validation
- `DELETE /api/milestones/{id}` - Delete draft milestone

---

## Testing Status
- ✅ Backend: 100% (28/28 tests passed)
- ✅ Frontend: 100% (All features verified)
- ✅ Dashboard Financial Health Panel verified
- ✅ Reports Page Elite gate verified
- ✅ Settings Page all sections verified

---

## User Actions Required

### Critical - Database Setup
Run SQL migration `/app/migrations/006_invoicing_milestones_schema.sql` in Supabase SQL Editor

---

## Backlog (P1)
- [ ] Email notifications when invoices sent (integrate with Resend)
- [ ] Invoice PDF generation and download
- [ ] Automatic overdue invoice status updates

## Future Tasks (P2)
- [ ] Payment reminders automation
- [ ] Client portal for invoice viewing
- [ ] Advanced tax reporting
- [ ] Final code cleanup (remove orphaned marketplace files)

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.1 | Dashboard Financial Health Panel, Reports Page with PDF export, Complete Settings Page |
| Feb 18, 2026 | 2.0 | Strategic pivot, Invoicing & Milestones |
| Feb 17, 2026 | 1.5 | Marketplace V2 (now removed) |
| Feb 16, 2026 | 1.0 | Initial Stripe integration |
