# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors. The application includes:
- Profit Snapshot dashboard
- Receivables/reminder system
- "Activate Your Business" onboarding flow
- "Quick Add" functionality for expenses
- PWA installation support
- **Trial + Locked access monetization model** ✅ IMPLEMENTED

## User Personas
- **Primary:** Independent contractors and small trade businesses
- **Secondary:** Founding/Elite lifetime members with premium access

## Tech Stack
- **Frontend:** React, TailwindCSS, Zustand, shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Integrations:** Stripe (payments), Resend (email), OpenAI GPT-5.2 (AI Copilot via emergentintegrations)

## Core Features Implemented
1. ✅ User authentication (Supabase)
2. ✅ Profit Snapshot dashboard
3. ✅ Project management with quotes/invoices
4. ✅ Expense tracking with Quick Add
5. ✅ AI Copilot (project-aware, GPT-5.2 powered)
6. ✅ Receivables system with reminders
7. ✅ Setup Progress / Activation flow
8. ✅ PWA support with service worker
9. ✅ Subscription tiers (free, pro, elite, lifetime)
10. ✅ **Trial + Locked Access Model**

## Recent Implementation (Feb 20, 2026)

### Trial + Locked Access Model
**Access States:**
- `ACTIVE`: Paid subscribers (pro, elite, lifetime, founding) OR grandfathered users
- `TRIAL`: New users with 30-day PRO trial
- `LOCKED`: Trial expired users

**LOCKED Mode Restrictions:**
- Create max 1 project, 1 quote, 1 invoice (total while locked)
- Cannot send/issue quotes or invoices
- AI Copilot: 3 messages/day, General Mode only (no project context)
- Can view all existing data

**Server-Side Enforcement:**
- `/api/projects` - Create limit enforced
- `/api/quotes` - Create + send limits enforced
- `/api/invoices` - Create + send limits enforced
- `/api/ai/copilot` - Daily message limit + mode restriction

**Database Columns Added (requires migration):**
- `trial_started_at` TIMESTAMPTZ
- `trial_ends_at` TIMESTAMPTZ
- `grandfathered_active` BOOLEAN
- `locked_project_created` BOOLEAN
- `locked_quote_created` BOOLEAN
- `locked_invoice_created` BOOLEAN
- `ai_daily_usage` INTEGER
- `ai_usage_reset_at` TIMESTAMPTZ

**Migration File:** `/app/migrations/010_trial_locked_model.sql`

### UI Fixes (Feb 20, 2026)
1. **AI Copilot Mobile Height** - Fixed drawer height for mobile with safe area support
2. **PWA Re-Install Detection** - Improved detection logic with automatic reset
3. **Quick Add Button** - Restyled with Shield icon (amber) above AI Support

### Backend Fixes (Feb 20, 2026)
- Fixed datetime comparison bug in receivables API (offset-naive vs offset-aware)

## Pending Implementation

### Database Migration Required
```sql
-- Run in Supabase SQL Editor
-- See /app/migrations/010_trial_locked_model.sql
```

## Upcoming Tasks
- **(P1)** Post-signup PWA install prompt enhancement
- **(P1)** Estimate Templates + Production Rates
- **(P1)** QuickBooks Sync (Sandbox-Ready)

## Future/Backlog
- **(P2)** Trust Pack Settings Tab
- **(P2)** Complete AI Copilot (plan gating, interaction logging)
- **(P2)** Delete Account functionality
- **(P2)** Performance optimization

## Test Credentials
- **Founder Account:** info@twofungis.ca / Marshall!31 (subscription_tier: founding_lifetime)

## Key Files
### Access Control
- `/app/backend/routes/access_control.py` - Core access state logic
- `/app/backend/routes/profile.py` - `/api/profile/access-state` endpoint
- `/app/frontend/src/store/authStore.js` - `computeAccessState()`, `accessState`
- `/app/frontend/src/components/app/TrialLockedBanner.jsx` - UI banners

### Server-Side Enforcement
- `/app/backend/routes/projects.py` - Create enforcement
- `/app/backend/routes/quotes.py` - Create + send enforcement
- `/app/backend/routes/invoices.py` - Create + send enforcement
- `/app/backend/routes/copilot.py` - AI daily limit + mode enforcement

### PWA
- `/app/frontend/src/services/PWAInstallService.js`
- `/app/frontend/src/components/app/PWARedirectModal.jsx`

### Database Migrations
- `/app/migrations/010_trial_locked_model.sql` - Trial + Locked columns
