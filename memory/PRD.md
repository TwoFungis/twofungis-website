# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors. The application includes:
- Profit Snapshot dashboard
- Receivables/reminder system
- "Activate Your Business" onboarding flow
- "Quick Add" functionality for expenses
- PWA installation support
- **Trial + Locked access monetization model** ✅ IMPLEMENTED
- **TFCS Mainframe** - Internal operational system for Two Fungis Finishing ✅ FOUNDATION COMPLETE

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
11. ✅ **TFCS Mainframe Foundation** (Backend architecture only)

---

## TFCS Mainframe (July 11, 2026)

### Overview
TFCS Mainframe is an internal operational system for Two Fungis Finishing that runs within TradeOS but is strictly separated from the customer-facing side. It tracks ALL meaningful business actions across TradeOS and TFCS itself.

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

### Activity Events
Captures meaningful business actions across ALL of TradeOS:
- Opportunities, Estimates, Quotes
- Projects, Milestones
- Production Library edits
- Documents, Expenses, Invoices, Payments
- Material/Tool Requests
- Daily Reports
- User management, Status changes

**NOT logged:** System-generated events (logins, page navigation, insignificant UI actions)

### Backend Implementation ✅
- `/app/backend/routes/tfcs.py` - Main TFCS routes (RBAC, Activity Events, Notifications)
- `/app/backend/routes/tfcs_activity.py` - Helper module for logging from other routes
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Complete database migration

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
| `/api/tfcs/init-owner` | POST | Initialize owner (inbox@twofungis.ca only) | JWT |
| `/api/tfcs/diagnostics` | GET | System diagnostics | Owner |

### Database Tables (Migration Required)
```
tfcs_user_roles           - Role assignments
tfcs_activity_events      - Permanent activity history
tfcs_notifications        - Temporary alerts
tfcs_settings             - System configuration
tfcs_notification_preferences - Per-user preferences
```

### Initial Owner
Email: `inbox@twofungis.ca` is designated as the initial Owner.

### Migration Instructions
1. Run `/app/migrations/011_tfcs_mainframe_foundation.sql` in Supabase SQL Editor
2. After migration, call `POST /api/tfcs/init-owner` while logged in as `inbox@twofungis.ca`
3. Optionally run: `SELECT tfcs_assign_owner_by_email('inbox@twofungis.ca');` directly in SQL

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

### Migration File
`/app/migrations/010_trial_locked_model.sql`

---

## Upcoming Tasks (Priority Order)

### P0 - TFCS Mainframe Dashboard
- Build Dashboard UI (AFTER foundation approved)
- Must wait for user approval before proceeding

### P1 - TFCS AI Features
- "Catch Me Up" summaries based on Activity Events
- Daily/project summaries using GPT-5.2

### P2 - Additional Features
- Add second Owner role for 'Beau'
- Estimate Templates + Production Rates
- QuickBooks Sync (Sandbox-Ready)

## Future/Backlog
- Trust Pack Settings Tab
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
- `/app/backend/routes/tfcs.py` - TFCS routes with RBAC
- `/app/backend/routes/tfcs_activity.py` - Activity logging helper
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Database migration

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
