# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors/tradespeople. Features include project management, invoicing, expense tracking, milestones, estimates, and an "Intelligence Layer" with AI copilot. The app should function as a PWA with offline capabilities.

## User Personas
- **Small Trade Contractors**: Electricians, plumbers, carpenters who need to track projects, invoices, and expenses
- **Growing Trades Businesses**: Contractors scaling up who need financial intelligence and forecasting

## Core Requirements
1. Project Management with margin tracking
2. Invoicing with PDF generation and reminders
3. Expense tracking with tax categorization
4. Milestone tracking tied to projects
5. Estimates/Quotes system
6. PWA with offline support
7. Financial dashboard with real-time metrics

---

## What's Been Implemented

### P0-1: CTA & PWA Update (COMPLETED - Feb 20, 2026)
- Added `UpdateBanner` component to `AppLayout.jsx` - shows when service worker update is available
- Added "App" section to `SettingsPage.jsx` with:
  - "Update App" button to check for updates
  - "Install App" button for non-PWA users
  - "Installed" badge for PWA users
- Created `/app/frontend/public/sw.js` service worker
- Created `/app/frontend/public/manifest.json` for PWA support
- Updated `index.html` with PWA meta tags

### P0-2: Supabase Profile Update Fix (COMPLETED - Feb 20, 2026)
- Created `/app/backend/routes/profile.py` with:
  - `PATCH /api/profile/update` - reliable profile updates using service key
  - `GET /api/profile/me` - fetch current user profile
  - `POST /api/profile/activation-status` - update activation flow status
- Updated `authStore.js` to use backend API as primary method, Supabase as fallback
- **REQUIRES USER ACTION**: Run migration `/app/migrations/009_activation_columns.sql` in Supabase

### P0-3: Setup Progress Real-Time Updates (COMPLETED - Feb 20, 2026)
- Added `setupProgress` state to `authStore.js` tracking:
  - has_project, has_labor_rate, has_quote, has_expense, has_milestone, has_invoice
- Added `refreshSetupProgress()` function for full refresh
- Added `markSetupComplete(item)` function for immediate UI updates
- Updated `SetupProgressChecklist.jsx` to use authStore state
- Added `markSetupComplete` calls to:
  - `ProjectsPage.jsx` - when project created
  - `InvoicesPage.jsx` - when invoice created
  - `ExpensesPage.jsx` - when expense created
  - `EstimatingPage.jsx` - when estimate created
  - `MilestonesPage.jsx` - when milestone created
  - `SettingsPage.jsx` - when labor rate saved
  - `QuickAddFab.jsx` - when quick expense added

### Previous Phase Completions
- **Financial Clarity (Phase 1)**: Profit Snapshot, Receivables page, Cash Flow Forecast
- **Activate Your Business Flow**: 5-step onboarding wizard with skip option
- **Quick Add + Offline Queue**: Floating action button with offline support
- **Today's Activity Panel**: Dashboard summary of daily activities

---

## Prioritized Backlog

### P0 - Critical (User Action Required)
- [ ] **Run Database Migration**: User must run `/app/migrations/009_activation_columns.sql` in Supabase SQL Editor to add missing columns (labor_rate, business_activated, etc.)

### P1 - High Priority
- [ ] Estimate Templates + Production Rates
- [ ] QuickBooks Sync (Sandbox-Ready)

### P2 - Medium Priority
- [ ] Trust Pack Settings Tab (Contractor Packet PDF)
- [ ] Complete AI Copilot (context injection, plan gating)
- [ ] Delete Account functionality
- [ ] Performance optimization (lazy loading)

### P3 - Future
- [ ] Full QuickBooks production integration
- [ ] Multi-user team support
- [ ] Client portal

---

## Key Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main entry point
- `/app/backend/routes/` - API route modules
  - `profile.py` - Profile updates (NEW)
  - `receivables.py` - Invoice reminders, cash flow
  - `copilot.py` - AI assistance
  - `founders.py` - Founder account management

### Frontend (React)
- `/app/frontend/src/store/authStore.js` - Global state with Zustand
  - User auth, profile, setupProgress tracking
- `/app/frontend/src/components/` - Reusable components
- `/app/frontend/src/pages/` - Page components

### Database (Supabase/Postgres)
- `users_profile` - User settings and preferences
- `projects`, `milestones`, `invoices`, `expenses` - Core business data

### PWA
- Service worker at `/app/frontend/public/sw.js`
- Manifest at `/app/frontend/public/manifest.json`

---

## Test Credentials
- **Founder Account**: info@twofungis.ca / Marshall!31

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 20, 2026 | 2.5 | P0-1/2/3: PWA updates, Profile API, Real-time progress |
| Feb 18, 2026 | 2.4 | Quick Add, Today's Activity, CTA updates |
| Feb 18, 2026 | 2.3 | Activate Your Business flow |
| Feb 17, 2026 | 2.2 | Financial Clarity phase |
