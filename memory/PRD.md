# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application  
**Target Audience:** Trades, Subcontractors, and Small General Contractors

## Problem Statement
Contractors need a purpose-built operating system to manage their business operations - from quoting jobs to tracking profitability, managing change orders, and logging daily production. TradeOS provides all these tools in a single, mobile-first platform designed specifically for the construction trades.

## Core Requirements

### Branding & Design
- Professional, minimal, industrial style
- Dark theme with deep charcoal background (#0d0d0d - #333333)
- Steel blue accents (#5a8fb8)
- Status colors: Success (green), Warning (yellow), Risk (red)

### Tech Stack
- **Frontend:** React with Tailwind CSS
- **Backend:** FastAPI (Python) + Supabase (PostgreSQL)
- **Payments:** Stripe (subscriptions via emergentintegrations)
- **State Management:** Zustand
- **PDF Generation:** jsPDF

### Pricing Tiers
| Feature | Pro ($39/mo) | Elite ($59/mo) |
|---------|--------------|----------------|
| Unlimited Projects | ✓ | ✓ |
| Quote Builder + PDF | ✓ | ✓ |
| Change Order Manager | ✓ | ✓ |
| Labor Cost Engine | ✓ | ✓ |
| Production Logs | ✓ | ✓ |
| Dashboard Analytics | ✓ | ✓ |
| Advanced Reports & KPIs | ✗ | ✓ |
| Production Analytics | ✗ | ✓ |
| Priority Support | ✗ | ✓ |

---

## What's Been Implemented (January 2026)

### ✅ Completed Features

#### Backend API
- [x] FastAPI server with health check
- [x] Stripe subscription checkout (Pro/Elite plans)
- [x] Payment status verification endpoint
- [x] Webhook handler for Stripe events
- [x] User subscription status endpoint
- [x] MongoDB for transaction tracking

#### Public Pages
- [x] Landing Page with hero, features, pricing, testimonials, FAQ
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] Responsive design (mobile + desktop)

#### Authentication (UI)
- [x] Login page (email/password + magic link toggle)
- [x] Signup page with plan selection
- [x] Onboarding flow (3-step)
- [x] Protected route middleware
- [x] Supabase client configuration

#### App Shell & Navigation
- [x] App Layout with sidebar navigation
- [x] Desktop sidebar + Mobile bottom nav
- [x] Quick Add dropdown
- [x] User profile display + sign out

#### App Pages
- [x] Dashboard with stats cards (mock data)
- [x] **Projects CRUD** - List, Create, Delete (wired to Supabase)
- [x] **Quote Builder** - Line items, pricing calculation, PDF export
- [x] Labor Cost Calculator (fully functional)
- [x] Change Orders page (mock data)
- [x] Production Logs page (mock data)
- [x] Reports page (Elite-gated)
- [x] **Settings with Stripe Upgrade** - Pro/Elite plan upgrade buttons

#### Database Schema
- [x] Complete SQL schema created at `/app/supabase_schema.sql`
- [x] Row Level Security (RLS) policies
- [x] Auto-create user profile trigger
- [x] Tables: users_profile, projects, change_orders, labor_profiles, scope_library, quotes, quote_lines, production_logs, payment_transactions

---

## ⚠️ ACTION REQUIRED: Run Database Schema

**The Supabase database tables have not been created yet.**

To enable full functionality:
1. Log into your Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `/app/supabase_schema.sql`
4. Run the SQL script
5. Tables and RLS policies will be created automatically

---

## What's Not Yet Implemented

### P1 - Core Features (After Schema Creation)
- [ ] Change Orders CRUD with Supabase
- [ ] Production Logs CRUD with Supabase
- [ ] Scope Library management
- [ ] Labor Profile save/load
- [ ] Change Order PDF export

### P2 - Elite Features
- [ ] Reports module with Recharts visualizations
- [ ] KPI calculations from real data
- [ ] Monthly performance summaries
- [ ] Overrun warning system

### P3 - Polish
- [ ] User profile editing
- [ ] Password reset flow
- [ ] Email verification
- [ ] Notification preferences
- [ ] Data export functionality

---

## API Endpoints

### Backend (FastAPI)
```
GET  /api/health                      - Health check
GET  /api/subscription/plans          - Get Pro/Elite plan details
POST /api/subscription/checkout       - Create Stripe checkout session
GET  /api/subscription/status/{id}    - Check payment status
GET  /api/subscription/user/{id}      - Get user subscription status
POST /api/webhook/stripe              - Stripe webhook handler
```

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://trade-build.preview.emergentagent.com
REACT_APP_SUPABASE_URL=https://ubhdmytfuzbabtnegxrd.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[configured]
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
STRIPE_API_KEY=your_stripe_api_key_here
SUPABASE_URL=[configured]
SUPABASE_ANON_KEY=[configured]
```

---

## Testing Status
- Backend API: ✅ 100% Pass (11/11 tests)
- Frontend UI: ✅ 100% Pass (all pages rendering)
- Stripe Integration: ✅ Working (creates real checkout sessions)
- Supabase CRUD: ⏳ Pending (tables not created yet)

## Files of Reference
- `/app/backend/server.py` - FastAPI with Stripe
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/store/authStore.js` - Auth state
- `/app/frontend/src/lib/supabase.js` - Supabase client
- `/app/frontend/src/pages/app/SettingsPage.jsx` - Stripe upgrade
- `/app/frontend/src/pages/app/EstimatingPage.jsx` - Quote Builder
- `/app/frontend/src/pages/app/ProjectsPage.jsx` - Projects CRUD
- `/app/supabase_schema.sql` - Database schema to run
