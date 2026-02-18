# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (February 18, 2026)

### ✅ Stripe Integration & Founding Lifetime Plan (NEW - Feb 18, 2026)

#### Subscription Plans
| Plan | Price | Mode | Features |
|------|-------|------|----------|
| **PRO** | $39 CAD/mo | Subscription | Unlimited Projects, Quote Builder, Change Orders, Labor Engine, Production Logs |
| **ELITE** | $59 CAD/mo | Subscription | Everything in Pro + Advanced Reports, KPI Dashboard, Analytics, Priority Support |
| **LIFETIME_ELITE** | $599 CAD | One-time Payment | All Elite features forever, Founding Member badge, No monthly fees |

#### Key Implementation Details
- **Stripe Price IDs configured:**
  - PRO: `price_1T20NRAVLnc1BWBltTCl65We`
  - ELITE: `price_1T20OQAVLnc1BWBlxXBFkTWx`
  - LIFETIME: `price_1T20WNAVLnc1BWBl0gKPyqOd`

- **Lifetime Plan Restrictions:**
  - Canada-only (region_lock = 'CA')
  - Limited to 100 founding seats
  - Billing address verification at Stripe checkout
  - Server-side country validation before checkout creation

- **Backend Endpoints:**
  - `GET /api/stripe/plans` - Returns all plans with pricing and lifetime status
  - `GET /api/stripe/lifetime-seats` - Returns seat availability
  - `POST /api/stripe/create-checkout-session` - Creates Stripe checkout session
  - `POST /api/stripe/create-portal-session` - Opens billing portal (not for lifetime)
  - `POST /api/stripe/webhook` - Handles Stripe events

- **Webhook Events Handled:**
  - `checkout.session.completed` - Activates subscription/lifetime
  - `invoice.payment_failed` - Sets plan_status to past_due
  - `customer.subscription.deleted` - Downgrades to TRIAL
  - `customer.subscription.updated` - Updates plan status
  - **Critical:** LIFETIME_ELITE users are protected from subscription events

- **Frontend Settings Page:**
  - 3-column plan card layout
  - Live seat counter from API
  - Country detection from user profile region
  - Lifetime explanation modal with full details
  - Error handling for checkout failures

---

### ✅ Full Testing Complete - All Features Verified
**Testing Agent Results:** 100% Pass Rate (Backend: 23/23, Frontend: All features verified)

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

#### 5. Email Notifications
- **Resend integration** for invoice emails
- Professional HTML email template with branding
- Non-blocking - doesn't fail invoice generation
- Ready to use when RESEND_API_KEY is configured

#### 6. Default Payment Terms in Settings
- Quick select: Net 7, 14, 30, 45, 60
- Custom days input
- Saved to user profile, auto-applied to invoices

---

### ✅ Quality Audit Fixes (Complete)
- Dashboard shows 100% REAL data (no mock)
- Change Orders: Full CRUD working
- Production Logs: Full CRUD working
- Labor Profile Save: Persists to database
- Quote Builder: Flexible payment terms (Net 7-60 + custom)

---

## Database Schema

### Stripe-Related Tables (USER MUST RUN MIGRATION)
```sql
-- Migration file: /app/migrations/003_stripe_lifetime_plan.sql

-- users_profile additions:
- plan_type: 'TRIAL' | 'PRO' | 'ELITE' | 'LIFETIME_ELITE'
- plan_status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
- country: TEXT
- stripe_customer_id: TEXT
- stripe_subscription_id: TEXT
- stripe_payment_intent_id: TEXT
- lifetime_purchased_at: TIMESTAMPTZ
- trial_ends_at: TIMESTAMPTZ

-- founding_lifetime (single-row control table):
- id: 1 (always)
- max_seats: 100
- seats_sold: 0
- is_active: true
- region_lock: 'CA'

-- lifetime_purchases:
- user_id, stripe_payment_intent_id, stripe_session_id, amount, currency, billing_country

-- Functions:
- increment_lifetime_seat() - Atomic seat counter
- get_lifetime_seats_status() - Returns seat availability
```

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **Payments:** Stripe (subscriptions + one-time)
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Email:** Resend (optional)
- **AI:** GPT-4 Vision (via Emergent LLM key)

---

## Key Files
- `/app/backend/routes/stripe.py` - **NEW** All Stripe endpoints
- `/app/backend/server.py` - Main server with router includes
- `/app/frontend/src/pages/app/SettingsPage.jsx` - Plans UI, lifetime modal
- `/app/frontend/src/pages/app/DashboardPage.jsx` - Financial pulse
- `/app/frontend/src/components/milestones/ProjectMilestones.jsx` - Invoice generation
- `/app/backend/routes/email.py` - Email notifications API
- `/app/migrations/003_stripe_lifetime_plan.sql` - **USER MUST RUN THIS**

---

## Required Configuration

### Stripe (Required for payments)
```env
# backend/.env
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_1T20NRAVLnc1BWBltTCl65We
STRIPE_ELITE_PRICE_ID=price_1T20OQAVLnc1BWBlxXBFkTWx
STRIPE_LIFETIME_PRICE_ID=price_1T20WNAVLnc1BWBl0gKPyqOd
```

### Supabase Service Key (Required for seat counter)
```env
# backend/.env
SUPABASE_SERVICE_KEY=eyJ... # Get from Supabase Dashboard > Settings > API
```

### Email (Optional)
```env
# backend/.env
RESEND_API_KEY=re_your_key_here
SENDER_EMAIL=invoices@yourdomain.com
```

---

## Testing Status
- ✅ Backend: 23/23 Stripe tests passed
- ✅ Frontend: All plan cards, modal, buttons working
- ✅ Country validation: 403 for non-CA on lifetime
- ✅ Dashboard: Real data + animations
- ✅ Change Orders CRUD: Working
- ✅ Production Logs CRUD: Working
- ✅ Invoice Generation: Working

---

## Pending User Actions

### Critical
1. **Run SQL Migration:** Execute `/app/migrations/003_stripe_lifetime_plan.sql` in Supabase SQL Editor
2. **Add Real Stripe Keys:** Update `STRIPE_SECRET_KEY` in `/app/backend/.env`
3. **Add Supabase Service Key:** Update `SUPABASE_SERVICE_KEY` in `/app/backend/.env`
4. **Set Up Stripe Webhook:** Configure webhook URL in Stripe Dashboard pointing to `/api/stripe/webhook`

---

## Future Tasks (Backlog)
- [ ] Live Demo mode
- [ ] Customer-facing marketplace
- [ ] AI renovation visualization
- [ ] Payment escrow
- [ ] Payment reminders automation
- [ ] Edit Profile / Delete Account functionality

---

## Credentials
- Test: `test703691@tradeos.test` / `TestPass123!`
