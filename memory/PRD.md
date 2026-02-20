# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors. The application includes:
- Profit Snapshot dashboard
- Receivables/reminder system
- "Activate Your Business" onboarding flow
- "Quick Add" functionality for expenses
- PWA installation support
- Trial + Locked access monetization model (pending implementation)

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

## Recent Fixes (Feb 20, 2026)
### UI Issues Fixed:
1. **AI Copilot Mobile Height** - Fixed drawer height for mobile viewports with safe area support
2. **PWA Re-Install Detection** - Improved detection logic to properly reset when app is uninstalled  
3. **Quick Add Button** - Restyled with Shield icon (amber) and repositioned above AI Support

## Pending Implementation (P0)
### Trial + Locked Access Model
- 30-day PRO trial for new users
- Database columns: `trial_started_at`, `trial_ends_at` on users_profile
- Access states: `ACTIVE`, `TRIAL`, `LOCKED`
- TRIAL mode: Dashboard banner "PRO Trial — X days left"
- LOCKED mode:
  - Banner: "Trial ended — Subscribe to keep sending invoices and using AI"
  - View all existing data
  - Create only 1 new project, 1 quote, 1 invoice (total)
  - Disable sending/issuing
  - AI Copilot: 3 messages/day, no Project Context mode
- Server-side enforcement required

## Upcoming Tasks
- **(P1)** Post-signup PWA install prompt enhancement
- **(P1)** Estimate Templates + Production Rates
- **(P1)** QuickBooks Sync (Sandbox-Ready)

## Future/Backlog
- **(P2)** Trust Pack Settings Tab
- **(P2)** Complete AI Copilot (plan gating, interaction logging)
- **(P2)** Delete Account functionality
- **(P2)** Performance optimization

## Known Issues
- Backend receivables API has datetime comparison bug (offset-naive vs offset-aware)
- Setup Progress milestones need user verification

## Test Credentials
- **Founder Account:** info@twofungis.ca / Marshall!31

## Key Files
- `/app/frontend/src/components/ai/AICopilot.jsx`
- `/app/frontend/src/components/app/QuickAddFab.jsx`
- `/app/frontend/src/services/PWAInstallService.js`
- `/app/frontend/src/components/app/PWARedirectModal.jsx`
- `/app/frontend/src/store/authStore.js`
- `/app/backend/routes/users.py`
- `/app/backend/supabase_client.py`
