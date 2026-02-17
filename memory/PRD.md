# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS™  
**Tagline:** Built for Builders  
**Type:** SaaS Web Application → **Evolving to Renovation Marketplace**  
**Target Audience:** Trades, Subcontractors, Small GCs, and Homeowners (Customers)

## Problem Statement
Contractors need a purpose-built operating system to manage their business operations - from quoting jobs to tracking profitability, managing change orders, and logging daily production. TradeOS provides all these tools in a single, mobile-first platform designed specifically for the construction trades.

**NEW VISION:** TradeOS is evolving into a full renovation marketplace where:
- **Contractors** showcase skills, build reputation, and bid on jobs
- **Customers** post renovation projects, visualize results with AI, and hire contractors
- **Everyone** tracks project progress and milestones in real-time

## Core Requirements

### Branding & Design
- Professional, minimal, industrial style
- Dark theme with deep charcoal background (#0d0d0d - #333333)
- Steel blue accents (#5a8fb8)
- Status colors: Success (green), Warning (yellow), Risk (red)
- Milestone status colors: Draft (gray), Submitted (steel blue), Approved (green), Paid (dark green)

### Tech Stack
- **Frontend:** React with Tailwind CSS
- **Backend:** FastAPI (Python) + Supabase (PostgreSQL)
- **Payments:** Stripe (subscriptions via emergentintegrations)
- **State Management:** Zustand
- **PDF Generation:** jsPDF
- **AI Visualization:** Gemini Nano Banana (planned for Phase 5)

---

## What's Been Implemented (February 17, 2026)

### ✅ Phase 1: Milestone Approval Engine (NEW)
- [x] **Milestones Tab in Project Detail** - New tabbed interface (Overview, Milestones, Activity)
- [x] **Milestone CRUD** - Add, edit, delete milestones with auto-calculated values from contract %
- [x] **Status Workflow** - Draft → Submitted → Approved → Paid with color coding
- [x] **Client Review System** - Secure shareable links for client approval
- [x] **Client Approval Page** - Public page at `/client/review/:token`
- [x] **Dashboard Milestone Widget** - Summary of Total/Pending/Approved/Paid values
- [x] **Database Schema v2** - New tables: project_milestones, client_approval_tokens, milestone_approval_log

### ✅ Critical Bug Fixes Completed
- [x] **AbortError on Quote Save - FIXED**
- [x] **"Not authenticated" on Onboarding - FIXED**
- [x] Improved session handling across all Supabase operations

### ✅ Completed Features

#### Backend API
- [x] FastAPI server with health check
- [x] Stripe subscription checkout (Pro/Elite plans)
- [x] Payment status verification endpoint
- [x] Webhook handler for Stripe events

#### Authentication (Fully Functional)
- [x] Login page (email/password + magic link toggle)
- [x] Signup page with plan selection
- [x] Onboarding flow (3-step)
- [x] Session persistence and refresh handling

#### App Pages (All Functional)
- [x] Dashboard with stats cards + milestone summary widget
- [x] **Projects CRUD** with Detail Page (tabs: Overview, Milestones, Activity)
- [x] **Quote Builder** - Line items, pricing, PDF export
- [x] Labor Cost Calculator
- [x] Change Orders page (mock data)
- [x] Production Logs page (mock data)
- [x] Reports page (Elite-gated)
- [x] Settings with Stripe Upgrade

---

## ⚠️ ACTION REQUIRED: Run Database Schema v2

**To enable Milestone features, run the new SQL schema:**
1. Log into your Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `/app/supabase_schema_v2.sql`
4. Run the SQL script
5. New tables will be created: project_milestones, client_approval_tokens, milestone_approval_log

---

## Marketplace Roadmap (5 Phases)

### Phase 1: Foundation & Milestone Engine ✅ COMPLETE
- User roles (contractor/customer)
- Milestone system with client approval
- Dashboard updates

### Phase 2: Contractor Hub (NEXT)
- Contractor profiles (skills, certifications, portfolio)
- Work history & project showcase
- Review/rating system

### Phase 3: Customer Side & Job Posting
- Customer accounts & dashboard
- Post renovation projects with photos
- Define scope, budget, timeline

### Phase 4: Marketplace & Bidding
- Contractors browse available jobs
- Submit bids with proposals
- Client reviews & accepts bids

### Phase 5: AI Visualization
- Customer uploads room photo
- Select products/materials
- Gemini Nano Banana generates "after" visualization

---

## Testing Status (Feb 17, 2026)
- **Backend API:** ✅ 100% Pass
- **Frontend E2E:** ✅ 100% Pass
  - All existing features ✅
  - Milestones tab ✅
  - Tab navigation ✅
  - Client review page route ✅

---

## Files of Reference
- `/app/frontend/src/pages/app/ProjectDetailPage.jsx` - Project detail with tabs
- `/app/frontend/src/components/milestones/ProjectMilestones.jsx` - Milestone component
- `/app/frontend/src/pages/public/ClientReviewPage.jsx` - Client approval page
- `/app/frontend/src/pages/app/DashboardPage.jsx` - Dashboard with milestone widget
- `/app/supabase_schema_v2.sql` - New milestone database schema

---

## Notes
- Dashboard, Change Orders, and Production pages show MOCKED demo data by design
- Milestone feature requires running `supabase_schema_v2.sql` first
- Client review links expire after 90 days by default