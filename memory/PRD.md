# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (Feb 18, 2026)

### ✅ Dashboard Restructure (NEW - Completed)
**3-Zone Layout as per user PRD:**
| Zone | Components |
|------|------------|
| **Execution** | Active Projects, Upcoming Milestones, Pending Change Orders |
| **Financial Control** | Total Contract Value, Forecast Profit, Outstanding Receivables, Overdue Invoices, Forecast Margin with visual indicator |
| **Alerts** | Past Due Invoices, Trial Expiring, Low Margin Warning (with selectable threshold) |
| **This Month Summary** | Revenue, Expenses, Est. Tax Owing, Recommended Set-Aside (with selectable tax rate) |

**User Preference Dropdowns:**
- Margin Threshold: 10%, 15%, 20%, 25%, 30% (stored in localStorage)
- Tax Rate: 15%, 20%, 25%, 30%, 35% (stored in localStorage)

### ✅ Project Page Restructure (NEW - Completed)
**Financial Health Panel (Top Section):**
- Original Contract, Approved COs Total, Total Revenue, Total Expenses, Total Labor, Forecast Gross Profit, Forecast Margin %
- Completion progress bar

**Tabbed Interface:**
- Overview, Milestones, Invoices, Change Orders, Expenses, Documents, Activity Log

### ✅ Bug Fixes (Previous Session)
| Bug | Status |
|-----|--------|
| Add Expense button not working | ✅ FIXED |
| Upload Document button not working | ✅ FIXED |
| Reports Elite gate showing for Lifetime members | ✅ FIXED |

### ✅ Invoicing System
- Invoice creation with line items
- Auto-incrementing invoice numbers (INV-XXXX)
- Status workflow (Draft → Sent → Paid)
- Email notification on send
- Receivables dashboard widget

### ✅ Milestone Management
- Milestone CRUD with status workflow
- Status workflow (Draft → Submitted → Approved → Invoiced → Paid)
- Edit lock after invoicing
- Invoice generation from milestones

### ✅ Expenses API
- Full CRUD API for expenses
- Category tracking
- Tax deductible flag
- Receipt URL storage
- Tax summary endpoint

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
- ✅ Dashboard Page: 100% - All 3 zones working, dropdowns persist to localStorage
- ✅ Project Detail Page: 100% - Financial Health Panel and all 7 tabs working
- ✅ Edit/Delete Project: Working with confirmation modal
- ✅ Frontend: Fully tested

---

## Backlog

### P0 - Invoice Hardening (Next)
- [ ] Invoice status workflow: Draft → Sent → Paid → Overdue
- [ ] Automatic overdue calculation based on due_date
- [ ] Global Receivables Report page

### P1 - Reporting Section
- [ ] Reports page with: Profit by Project, Revenue by Month, Expense by Category, Labor Cost Summary, Outstanding Invoices, Margin Trend
- [ ] PDF/CSV export functionality

### P1 - Tax & Expense Improvement
- [ ] Monthly summary panel (already in dashboard)
- [ ] Quarterly summary projection

### P2 - UI Polish
- [ ] Increase whitespace throughout app
- [ ] Larger fonts for financial metrics
- [ ] Color scheme adherence check

### P2 - Performance
- [ ] Lazy loading for components
- [ ] Optimized dashboard queries
- [ ] Mobile layout verification

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.3 | Dashboard 3-zone restructure, Project Page restructure with Financial Health Panel and tabs |
| Feb 18, 2026 | 2.2 | Bug fixes (Expense modal, Document upload, Elite gate), Expenses API |
| Feb 18, 2026 | 2.1 | Dashboard Financial Health Panel, Reports Page, Complete Settings Page |
| Feb 18, 2026 | 2.0 | Strategic pivot, Invoicing & Milestones |
