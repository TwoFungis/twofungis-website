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

## What's Been Implemented (February 17, 2026)

### ✅ Critical Bug Fixes Completed
- [x] **AbortError on Quote Save - FIXED** - Added session validation with `waitForSession` helper and `refreshSession` fallback before database operations
- [x] **"Not authenticated" on Onboarding - FIXED** - Added session validation in `updateProfile` with retry logic for JWT errors
- [x] Improved `onAuthStateChange` handling for `SIGNED_IN` and `TOKEN_REFRESHED` events
- [x] Added consistent error handling across all Supabase operations

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

#### Authentication (Fully Functional)
- [x] Login page (email/password + magic link toggle)
- [x] Signup page with plan selection
- [x] **Onboarding flow (3-step) - NOW WORKING**
- [x] Protected route middleware
- [x] Session persistence and refresh handling

#### App Shell & Navigation
- [x] App Layout with sidebar navigation
- [x] Desktop sidebar + Mobile bottom nav
- [x] Quick Add dropdown (New Quote, Project, CO, Daily Log)
- [x] User profile display + sign out

#### App Pages (All Functional)
- [x] Dashboard with stats cards (mock data)
- [x] **Projects CRUD** - List, Create, View Detail, Edit, Delete
- [x] **Quote Builder** - Line items, pricing calculation, PDF export, **SAVE NOW WORKS**
- [x] Labor Cost Calculator (fully functional)
- [x] Change Orders page (mock data)
- [x] Production Logs page (mock data)
- [x] Reports page (Elite-gated)
- [x] **Settings with Stripe Upgrade** - Pro/Elite plan upgrade buttons

#### Database Schema
- [x] Complete SQL schema at `/app/supabase_schema.sql`
- [x] Row Level Security (RLS) policies
- [x] Auto-create user profile trigger
- [x] Tables: users_profile, projects, change_orders, labor_profiles, scope_library, quotes, quote_lines, production_logs, payment_transactions

---

## Testing Status (Feb 17, 2026)
- **Backend API:** ✅ 100% Pass
- **Frontend E2E:** ✅ 100% Pass (verified with testing_agent)
  - Signup flow ✅
  - Onboarding 3-step wizard ✅
  - Dashboard ✅
  - Projects CRUD ✅
  - Quote Builder (AbortError fix verified) ✅
  - Labor Calculator ✅
  - Navigation ✅
  - Quick Add dropdown ✅
  - Sign out ✅
