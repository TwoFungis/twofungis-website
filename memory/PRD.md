# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors. The application includes:
- Profit Snapshot dashboard
- Receivables/reminder system
- "Activate Your Business" onboarding flow
- "Quick Add" functionality for expenses
- PWA installation support
- **Trial + Locked access monetization model** ✅ IMPLEMENTED
- **TFCS Mainframe** - Internal operational system for Two Fungis Finishing ✅ SPEC 1.1 COMPLETE

## User Personas
- **Primary:** Independent contractors and small trade businesses
- **Secondary:** Founding/Elite lifetime members with premium access
- **Internal:** Two Fungis Finishing team (Owner, Manager, Employee roles)

## Tech Stack
- **Frontend:** React, TailwindCSS, Zustand, shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Integrations:** Stripe (payments), Resend (email), OpenAI GPT-5.2 (AI Copilot via emergentintegrations)

## Core Features Implemented
1. ✅ User authentication (Supabase) + Password visibility toggle
2. ✅ Profit Snapshot dashboard
3. ✅ Project management with quotes/invoices
4. ✅ Expense tracking with Quick Add
5. ✅ AI Copilot (project-aware, GPT-5.2 powered)
6. ✅ Receivables system with reminders
7. ✅ Setup Progress / Activation flow
8. ✅ PWA support with service worker
9. ✅ Subscription tiers (free, pro, elite, lifetime)
10. ✅ **Trial + Locked Access Model**
11. ✅ **TFCS Mainframe Specification 1.0** (Backend Foundation)
12. ✅ **TFCS Mainframe Specification 1.1** (Command Center Dashboard)

---

## TFCS Mainframe - Specification 1.1 COMPLETE (July 11, 2026)

### Command Center Dashboard
Premium "Mission Control" interface for Two Fungis Finishing operations.

### UI Components ✅
| Component | Status | Data Source |
|-----------|--------|-------------|
| **Header** | ✅ | Title, Notifications, Catch Me Up, Owner Access, Quick Add |
| **Today's Focus** | ✅ Architecture | Empty state until priority logic implemented |
| **Projects Card** | ✅ LIVE | Real data from `/api/projects` |
| **Opportunities Card** | ✅ Architecture | Shows zeros until `/api/opportunities` endpoint exists |
| **Company Brain** | ✅ Placeholder | "Company Brain will summarize activity here in a future specification." |
| **Recent Activity** | ✅ LIVE | Real data from `/api/tfcs/activity` |
| **Notifications Panel** | ✅ LIVE | Real data from `/api/tfcs/notifications` |
| **Owner Access Panel** | ✅ LIVE | Real data from `/api/tfcs/role/me` |

### Design Philosophy
- Mission Control aesthetic, NOT accounting software
- Dark theme with premium gold accents
- High-density, industrial premium feel
- Fully responsive (Desktop, Tablet, Mobile)

### Key Files
- `/app/frontend/src/pages/app/MainframePage.jsx` - Command Center UI
- `/app/frontend/src/components/layout/AppLayout.jsx` - TFCS Sidebar hierarchy
- `/app/design_guidelines.json` - Design specifications

---

## TFCS Mainframe - Specification 1.0 (Backend Foundation)

### Overview
TFCS Mainframe is an internal operational system for Two Fungis Finishing that runs within TradeOS but is strictly separated from the customer-facing side.

### Architecture
- **Separate workspace** from commercial TradeOS
- **Role-Based Access Control (RBAC)** with 3 roles: Owner, Manager, Employee
- **Activity Events** - Permanent operational history
- **Notifications** - Temporary alerts derived from events

### Roles
| Role | Access Level |
|------|-------------|
| **Owner** | Full access to everything, manages users, sees private events |
| **Manager** | Operational access, manages projects/employees, limited visibility |
| **Employee** | Restricted to own data and assigned work |

### API Endpoints
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/tfcs/health` | GET | Health check | None |
| `/api/tfcs/role/me` | GET | Get current user's TFCS role | JWT |
| `/api/tfcs/roles` | GET | List all TFCS roles | TFCS Role |
| `/api/tfcs/roles/assign` | POST | Assign role (Owner only) | Owner |
| `/api/tfcs/roles/{user_id}` | DELETE | Remove role (Owner only) | Owner |
| `/api/tfcs/activity` | GET | Activity feed | TFCS Role |
| `/api/tfcs/activity/log` | POST | Manual activity logging | TFCS Role |
| `/api/tfcs/notifications` | GET | User's notifications | JWT |
| `/api/tfcs/notifications/{id}/read` | PATCH | Mark as read | JWT |
| `/api/tfcs/notifications/read-all` | PATCH | Mark all as read | JWT |
| `/api/tfcs/init-owner` | POST | Initialize owner | JWT |
| `/api/tfcs/diagnostics` | GET | System diagnostics | Owner |

### Database Tables
```
tfcs_user_roles           - Role assignments
tfcs_activity_events      - Permanent activity history
tfcs_notifications        - Temporary alerts
tfcs_settings             - System configuration
tfcs_notification_preferences - Per-user preferences
```

### Backend Files
- `/app/backend/routes/tfcs.py` - TFCS routes with RBAC
- `/app/backend/routes/tfcs_activity.py` - Activity logging helper
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Database migration

---

## Trial + Locked Access Model

### Access States
- `ACTIVE`: Paid subscribers (pro, elite, lifetime, founding) OR grandfathered users
- `TRIAL`: New users with 30-day PRO trial
- `LOCKED`: Trial expired users

### LOCKED Mode Restrictions
- Create max 1 project, 1 quote, 1 invoice (total while locked)
- Cannot send/issue quotes or invoices
- AI Copilot: 3 messages/day, General Mode only (no project context)
- Can view all existing data

---

## Upcoming Tasks (Priority Order)

### P1 - TFCS AI Features (Company Brain)
- "Catch Me Up" actual AI summaries based on Activity Events
- Daily/project summaries using GPT-5.2
- Replace placeholder text in Command Center

### P2 - Additional Features
- Production Library (Single source of truth for estimating)
- Add second Owner role for 'Beau'
- Estimate Templates + Production Rates
- QuickBooks Sync (Sandbox-Ready)

### P3 - Future/Backlog
- Trust Pack Settings Tab
- `/api/opportunities` endpoint for Opportunities card
- Priority logic for Today's Focus
- Complete AI Copilot enhancements
- Delete Account functionality
- Performance optimization

---

## Test Credentials
| Account | Email | Password | Tier |
|---------|-------|----------|------|
| Primary Owner | inbox@twofungis.ca | TradeOS2024! | founding_lifetime |
| Legacy Founder | info@twofungis.ca | Marshall!31 | founding_lifetime |

---

## Key Files Reference

### TFCS Mainframe
- `/app/frontend/src/pages/app/MainframePage.jsx` - Command Center Dashboard
- `/app/frontend/src/components/layout/AppLayout.jsx` - TFCS Sidebar
- `/app/backend/routes/tfcs.py` - TFCS routes with RBAC
- `/app/backend/routes/tfcs_activity.py` - Activity logging helper
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Database migration
- `/app/design_guidelines.json` - Design specifications
- `/app/backend/tests/test_tfcs_mainframe.py` - Backend test suite

### Access Control
- `/app/backend/routes/access_control.py` - Core access state logic
- `/app/backend/routes/profile.py` - `/api/profile/access-state` endpoint

### Server-Side Enforcement
- `/app/backend/routes/projects.py` - Create enforcement
- `/app/backend/routes/quotes.py` - Create + send enforcement
- `/app/backend/routes/invoices.py` - Create + send enforcement
- `/app/backend/routes/copilot.py` - AI daily limit + mode enforcement

### PWA
- `/app/frontend/src/services/PWAInstallService.js`
- `/app/frontend/src/components/app/PWARedirectModal.jsx`
