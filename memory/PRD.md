# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (Feb 18, 2026)

### ✅ Beta Trial Strategy (NEW - Completed)
| Feature | Status |
|---------|--------|
| **30-Day Free Trial** | ✅ Trial duration extended to 30 days |
| **Setup Progress Checklist** | ✅ 6-item checklist on dashboard top |
| **Trial Countdown Badge** | ✅ Shows in header (e.g., "6 days left") |
| **Reminder Modals** | ✅ Auto-show at 7, 3, 1, 0 days |
| **Trial Expired Modal** | ✅ Shows after expiration with upgrade prompt |
| **Labor Rate Setting** | ✅ New field in Settings page |
| **Email Trigger System** | ✅ 7 branded emails at days 1,3,7,14,21,25,30 |

**Setup Progress Checklist Items:**
1. Create first project
2. Set labor rate (NEW)
3. Create first quote
4. Add first expense
5. Create first milestone
6. Generate first invoice

**After Trial Expiration:**
- Pro/Elite features locked
- Upgrade modal shown
- User data preserved

### ✅ Dashboard Restructure
**3-Zone Layout:**
| Zone | Components |
|------|------------|
| **Execution** | Active Projects, Upcoming Milestones, Pending Change Orders |
| **Financial Control** | Total Contract Value, Forecast Profit, Outstanding Receivables, Overdue Invoices, Forecast Margin |
| **Alerts** | Past Due Invoices, Trial Expiring, Low Margin Warning |
| **This Month Summary** | Revenue, Expenses, Est. Tax Owing, Recommended Set-Aside |

### ✅ Project Page Restructure
**Financial Health Panel:**
- Original Contract, Approved COs Total, Total Revenue, Total Expenses, Total Labor, Forecast Gross Profit, Forecast Margin %

**Tabbed Interface:**
- Overview, Milestones, Invoices, Change Orders, Expenses, Documents, Activity Log

### ✅ Previous Implementations
- Invoicing System (auto-numbering, status workflow, email notifications)
- Milestone Management (CRUD, status workflow, edit lock)
- Expenses API (CRUD, category tracking, tax summary)
- Bug fixes (Expense modal, Document upload, Elite gate)

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

### Trial Emails API (NEW)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trial/status` | GET | Check email system status |
| `/api/trial/send-email` | POST | Send trial email for specific trigger day |
| `/api/trial/check-pending-emails` | GET | Check pending emails for user |
| `/api/trial/process-pending-emails` | POST | Process and send pending emails |

### Invoices API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices` | GET | List invoices with stats |
| `/api/invoices` | POST | Create invoice |
| `/api/invoices/{id}/send` | POST | Mark as sent + email |
| `/api/invoices/{id}/mark-paid` | POST | Mark as paid |

### Other APIs
- Milestones: `/api/milestones/*`
- Expenses: `/api/expenses/*`
- Stripe: `/api/stripe/*`

---

## Testing Status
- ✅ Setup Progress Checklist: 100%
- ✅ Trial Countdown Badge: 100%
- ✅ Labor Rate Setting: 100%
- ✅ Trial Email API: 100%
- ✅ Dashboard 3-Zone: 100%
- ✅ Project Detail Page: 100%

---

## Backlog

### P0 - Invoice Hardening (Next)
- [ ] Automatic overdue status calculation based on due_date
- [ ] Global Receivables Report page

### P1 - Reporting Section
- [ ] Reports page with: Profit by Project, Revenue by Month, Expense by Category
- [ ] PDF/CSV export functionality

### P2 - UI Polish & Performance
- [ ] Increase whitespace
- [ ] Lazy loading for components
- [ ] Mobile layout verification

---

## Files Reference

### Trial System
- `/app/frontend/src/components/trial/SetupProgressChecklist.jsx`
- `/app/frontend/src/components/trial/TrialCountdown.jsx`
- `/app/frontend/src/components/trial/TrialExpiredModal.jsx`
- `/app/backend/routes/trial_emails.py`

### Core Pages
- `/app/frontend/src/pages/app/DashboardPage.jsx`
- `/app/frontend/src/pages/app/ProjectDetailPage.jsx`
- `/app/frontend/src/pages/app/SettingsPage.jsx`

### Layout
- `/app/frontend/src/components/layout/AppLayout.jsx`

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.4 | **Beta Trial Strategy**: 30-day trial, Setup Progress Checklist, Trial Countdown, Reminder Modals, Labor Rate setting, Email triggers |
| Feb 18, 2026 | 2.3 | Dashboard 3-zone restructure, Project Page restructure with Financial Health Panel and tabs |
| Feb 18, 2026 | 2.2 | Bug fixes (Expense modal, Document upload, Elite gate), Expenses API |
| Feb 18, 2026 | 2.1 | Dashboard Financial Health Panel, Reports Page, Complete Settings Page |
| Feb 18, 2026 | 2.0 | Strategic pivot, Invoicing & Milestones |
