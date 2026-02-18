# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (February 18, 2026)

### ✅ Full Testing Complete - All Features Verified
**Testing Agent Results:** 100% Pass Rate (Backend: 11/11, Frontend: All features verified)

---

### ✅ PHASE: Margin & Invoice Discipline Hardening (COMPLETE)

#### 1. Dashboard Financial Pulse
- **Quick Stats Bar** - Receivables, This Month, Pending COs, Overdue (60+)
- **Outstanding Payments Widget** - Aging breakdown with visual progress bar
- **Staggered entrance animations** for polished UX
- **Hover effects** on cards (lift + glow)

#### 2. Project Financial Health Panel
- Contract Value, Approved COs, Total Revenue, Cost to Date
- Gross Profit calculation with health indicator
- Margin % with status (Excellent/On Target/Below/At Risk)

#### 3. Change Order Margin Impact
- Each CO displays calculated margin % and profit
- Color-coded badges: green (≥15%), yellow (≥0%), red (<0%)

#### 4. Invoice Generation from Milestones
- "Generate Invoice" button on approved milestones
- Professional PDF with company branding
- Invoice number, due date, payment terms
- Activity log entry for audit trail

#### 5. Email Notifications (NEW)
- **Resend integration** for invoice emails
- Professional HTML email template with branding
- Non-blocking - doesn't fail invoice generation
- Ready to use when RESEND_API_KEY is configured

#### 6. Audit Trail / Activity Logging
- `activity_log` table captures key actions
- Invoice generation logged with metadata

#### 7. Default Payment Terms in Settings
- Quick select: Net 7, 14, 30, 45, 60
- Custom days input
- Saved to user profile, auto-applied to invoices

#### 8. Reports Page with Real Analytics
- KPI cards: Avg Margin, Revenue MTD, CO Approval Rate, At-Risk Projects
- Revenue Trend chart (6 months)
- Margin by Project visualization
- Project Performance Table

#### 9. UI Polish & Animations (NEW)
- Staggered fade-in animations on dashboard load
- Progress bar grow animations
- Hover lift effects on cards
- Card glow effects on hover
- Subtle pulse animation on overdue indicators

---

### ✅ Quality Audit Fixes (Complete)
- Dashboard shows 100% REAL data (no mock)
- Change Orders: Full CRUD working
- Production Logs: Full CRUD working
- Labor Profile Save: Persists to database
- Quote Builder: Flexible payment terms (Net 7-60 + custom)

---

## Database Schema

### Tables Required:
```sql
-- Core tables (APPLY_THIS_SCHEMA.sql)
users_profile, projects, project_milestones, client_approval_tokens...

-- Additional tables (APPLY_ADDITIONAL_TABLES.sql)
change_orders, production_logs, labor_profiles

-- Invoice/Audit fields:
ALTER TABLE project_milestones ADD COLUMN invoice_number TEXT;
ALTER TABLE project_milestones ADD COLUMN invoice_date TIMESTAMPTZ;
ALTER TABLE project_milestones ADD COLUMN due_date TIMESTAMPTZ;
ALTER TABLE project_milestones ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE users_profile ADD COLUMN default_payment_days INTEGER DEFAULT 30;

-- Activity log table:
CREATE TABLE activity_log (...);
```

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Email:** Resend (optional)
- **AI:** GPT-4 Vision (via Emergent LLM key)
- **Payments:** Stripe (configured)

---

## Key Files
- `/app/frontend/src/pages/app/DashboardPage.jsx` - Financial pulse + animations
- `/app/frontend/src/pages/app/ProjectDetailPage.jsx` - Financial Health Panel
- `/app/frontend/src/pages/app/ChangeOrdersPage.jsx` - Margin impact
- `/app/frontend/src/pages/app/SettingsPage.jsx` - Business Defaults
- `/app/frontend/src/pages/app/ReportsPage.jsx` - Real analytics
- `/app/frontend/src/components/milestones/ProjectMilestones.jsx` - Invoice generation
- `/app/backend/routes/email.py` - Email notifications API
- `/app/frontend/src/index.css` - Animation CSS

---

## Email Configuration (Optional)
To enable invoice email notifications:
1. Get API key from [resend.com](https://resend.com)
2. Add to `/app/backend/.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   SENDER_EMAIL=invoices@yourdomain.com
   ```
3. Restart backend: `sudo supervisorctl restart backend`

---

## Testing Status
- ✅ Backend: 11/11 tests passed
- ✅ Frontend: All features verified
- ✅ Dashboard: Real data + animations
- ✅ Change Orders CRUD: Working
- ✅ Production Logs CRUD: Working
- ✅ Invoice Generation: Working
- ✅ Email API: Ready (needs API key)
- ✅ Reports: Real analytics

---

## Future Tasks (Backlog)
- Live Demo mode
- Customer-facing marketplace
- AI renovation visualization
- Payment escrow
- Payment reminders automation

---

## Credentials
- Test: `test703691@tradeos.test` / `TestPass123!`
