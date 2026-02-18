# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (Feb 18, 2026)

### ✅ Bug Fixes
| Bug | Status |
|-----|--------|
| Add Expense button not working | ✅ FIXED - Modal now opens |
| Upload Document button not working | ✅ FIXED - Modal now opens |
| Reports Elite gate showing for Lifetime members | ✅ FIXED - Now checks for 'lifetime', 'elite', 'founding' tier variations |

### ✅ Dashboard Financial Health Panel
- Contract Value, Approved COs, Total Revenue, Gross Profit
- Average Margin with health indicator (Excellent/On Target/Below/At Risk)
- Project breakdown with margin bars

### ✅ Reports Page (Elite Feature)
- 4 tabs (Overview, Revenue, Expenses, Projects)
- Date range filter (Month/Quarter/YTD/All)
- PDF export (P&L, Revenue, Projects reports)

### ✅ Settings Page - Complete
- Edit Profile form with validation
- Change Password functionality
- Delete Account with confirmation modal
- Subscription display with upgrade buttons

### ✅ Invoicing System
- Invoice creation with line items
- Auto-incrementing invoice numbers
- Status workflow (Draft → Sent → Paid)
- Email notification on send (if client email provided)
- Receivables dashboard widget

### ✅ Milestone Management
- Milestone CRUD with status workflow
- Status workflow (Draft → Submitted → Approved → Invoiced → Paid)
- Edit lock after invoicing
- Invoice generation from milestones

### ✅ Expenses API (NEW)
- Full CRUD API for expenses
- Category tracking (Materials, Labor, Equipment, etc.)
- Tax deductible flag
- Receipt URL storage
- Tax summary endpoint

---

## Database Migrations Required

### Run These in Supabase SQL Editor:

1. **`/app/migrations/006_invoicing_milestones_schema.sql`** - Creates:
   - `project_milestones` table
   - `invoices` table
   - `invoice_line_items` table
   - `invoice_counters` table
   - `invoice_activity_log` table

2. **`/app/migrations/007_expenses_schema_fix.sql`** - Updates expenses table:
   - Adds missing columns: `expense_date`, `amount`, `category`, `description`, etc.
   - Creates indexes and RLS policies

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **Payments:** Stripe (subscriptions + one-time)
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Email:** Resend
- **AI:** GPT-4 Vision (via Emergent LLM key)

---

## API Endpoints

### Invoices API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices` | GET | List invoices with stats |
| `/api/invoices` | POST | Create invoice |
| `/api/invoices/{id}` | GET | Get invoice details |
| `/api/invoices/{id}` | PATCH | Update draft invoice |
| `/api/invoices/{id}/send` | POST | Mark as sent + email |
| `/api/invoices/{id}/mark-paid` | POST | Mark as paid |
| `/api/invoices/{id}` | DELETE | Delete draft invoice |

### Milestones API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/milestones` | GET | List milestones |
| `/api/milestones` | POST | Create milestone |
| `/api/milestones/{id}` | GET | Get milestone |
| `/api/milestones/{id}` | PATCH | Update milestone |
| `/api/milestones/{id}/status` | POST | Update status |
| `/api/milestones/{id}` | DELETE | Delete draft milestone |

### Expenses API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/expenses` | GET | List expenses with stats |
| `/api/expenses` | POST | Create expense |
| `/api/expenses/{id}` | GET | Get expense |
| `/api/expenses/{id}` | PATCH | Update expense |
| `/api/expenses/{id}` | DELETE | Delete expense |
| `/api/expenses/summary/tax` | GET | Tax summary |

---

## Testing Status
- ✅ Frontend: 100% (All modals, buttons, forms working)
- ⚠️ Backend: Database tables need to be created
- ✅ Reports Elite gate: Working for all tier variations

---

## Backlog

### P1 - Next Up
- [ ] Automatic overdue invoice status updates (cron job)
- [ ] Invoice PDF generation and download

### P2 - Future
- [ ] Client portal for invoice viewing
- [ ] Payment reminders automation
- [ ] Advanced tax reporting
- [ ] Final code cleanup (remove orphaned marketplace files)

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.2 | Bug fixes (Expense modal, Document upload, Elite gate), Expenses API |
| Feb 18, 2026 | 2.1 | Dashboard Financial Health Panel, Reports Page, Complete Settings Page |
| Feb 18, 2026 | 2.0 | Strategic pivot, Invoicing & Milestones |
