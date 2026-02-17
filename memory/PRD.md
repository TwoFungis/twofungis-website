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
- **Backend:** Supabase (Authentication + PostgreSQL Database with RLS)
- **Payments:** Stripe (for subscriptions)
- **State Management:** Zustand

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

### 7-Day Free Trial
- No credit card required
- Full access to selected plan features
- Coupon support for early adopters via Stripe

---

## What's Been Implemented (January 2026)

### ✅ Completed Features

#### Public Pages
- [x] Landing Page with hero, features, pricing, testimonials, FAQ
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] Responsive design (mobile + desktop)

#### Authentication (UI)
- [x] Login page (email/password + magic link toggle)
- [x] Signup page with plan selection
- [x] Onboarding flow (3-step: name/company → trade → region)
- [x] Protected route middleware
- [x] Supabase client configuration

#### App Shell & Navigation
- [x] App Layout with sidebar navigation
- [x] Desktop sidebar with all navigation items
- [x] Mobile bottom nav + hamburger menu
- [x] Quick Add dropdown for common actions
- [x] User profile display + sign out

#### App Pages (UI with Mock Data)
- [x] Dashboard with stats cards and project overview
- [x] Projects page with list view and create modal
- [x] Project Detail page (placeholder)
- [x] Estimating page (placeholder with feature preview)
- [x] Labor Cost Engine (fully functional calculator)
- [x] Change Orders page with status tracking
- [x] Production Logs page with daily log tracking
- [x] Reports page (gated for Elite users)
- [x] Settings page (profile, subscription, security)

### 🔧 Configuration
- [x] Supabase credentials configured in .env
- [x] Tailwind CSS with custom TradeOS color palette
- [x] Zustand auth store with Supabase integration

---

## What's Not Yet Implemented

### P0 - Critical (Blocks Real Usage)
- [ ] Supabase database tables creation (users_profile, projects, change_orders, etc.)
- [ ] Row Level Security (RLS) policies
- [ ] Stripe subscription integration
- [ ] Email verification flow
- [ ] Password reset flow

### P1 - Core Features
- [ ] Projects CRUD with Supabase
- [ ] Quote Builder with PDF export
- [ ] Change Order Manager with PDF export
- [ ] Production Log data persistence
- [ ] Labor Profile save/load
- [ ] Scope Library management
- [ ] Billing page for subscription management

### P2 - Elite Features
- [ ] Reports module with charts (Recharts integration)
- [ ] KPI calculations
- [ ] Monthly performance summaries
- [ ] Overrun warning system
- [ ] Production analytics

### P3 - Polish
- [ ] Onboarding data persistence
- [ ] User profile editing
- [ ] Notification preferences
- [ ] Two-factor authentication
- [ ] Data export functionality

---

## Database Schema (Pending Supabase Setup)

```sql
-- users_profile
CREATE TABLE users_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  company_name TEXT,
  trade_type TEXT,
  region TEXT,
  phone TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'pro',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  client_gc TEXT,
  region TEXT,
  contract_value NUMERIC DEFAULT 0,
  approved_cos NUMERIC DEFAULT 0,
  cost_to_date NUMERIC DEFAULT 0,
  percent_complete INTEGER DEFAULT 0,
  forecast_margin NUMERIC DEFAULT 20,
  risk_flag TEXT DEFAULT 'green',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- change_orders, labor_profiles, scope_library, quotes, quote_lines, production_logs...
```

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://trade-build.preview.emergentagent.com
REACT_APP_SUPABASE_URL=https://ubhdmytfuzbabtnegxrd.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[configured]
```

---

## Testing Status
- Frontend UI: ✅ 100% Pass
- Authentication: ⏳ Pending (Supabase tables needed)
- Data persistence: ⏳ Pending

## Files of Reference
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/store/authStore.js` - Auth state
- `/app/frontend/src/lib/supabase.js` - Supabase client
- `/app/frontend/src/pages/` - All page components
- `/app/frontend/src/components/layout/AppLayout.jsx` - App shell
