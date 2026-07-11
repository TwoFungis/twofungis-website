# TradeOS - Product Requirements Document

## Original Problem Statement
Build "TradeOS," a financial tracking tool for contractors. The application includes:
- Profit Snapshot dashboard
- Receivables/reminder system
- "Activate Your Business" onboarding flow
- "Quick Add" functionality for expenses
- PWA installation support
- **Trial + Locked access monetization model** ✅ IMPLEMENTED
- **TFCS Mainframe** - Internal operational system for Two Fungis Finishing ✅ SPEC 1.2 COMPLETE

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
13. ✅ **TFCS Mainframe Specification 1.2** (Company Brain Foundation)

---

## TFCS Mainframe - Specification 1.2 COMPLETE (July 11, 2026)

### Company Brain Foundation
The permanent architecture for Company Brain - the operational intelligence of the company.

### ONE BRAIN RULE
- There is only ONE Company Brain
- Projects, CRM, Financial never contain their own AI
- Every AI interaction routes through ONE Company Brain
- Company Brain calls modules; modules NEVER call Company Brain

### UI Components ✅
| Component | Status | Description |
|-----------|--------|-------------|
| **Global Side Panel** | ✅ | Collapsible panel accessible from anywhere via Brain button |
| **Company Brief** | ✅ Placeholder | "Operational briefing will appear here." |
| **Conversation** | ✅ Architecture | Input, send, microphone (disabled), message history |
| **Context Selector** | ✅ | Switch between General, Project, Opportunity, etc. threads |
| **Suggested Actions** | ✅ Placeholder | Context-aware action suggestions |
| **Action History** | ✅ | Permanent history of Company Brain actions |

### Action Pipeline Architecture
```
Intent → Plan → Permission Check → Execute → Activity Log → Result → Undo Window
```

### Module Contracts
Company Brain can interact with these modules:
| Module | Capabilities |
|--------|-------------|
| **Projects** | Create, Update, Assign, Archive, Search |
| **Opportunities** | Create, Update, Submit, Search |
| **Financial** | Create Invoice, Record Payment, Send Reminder |
| **Expenses** | Create, Categorize, GST Summary |
| **CRM** | Create Client/Contact, Update, Search |
| **Production Library** | Search, Create, Update |
| **Documents** | Search, Store, Summarize |
| **Reports** | Generate, Export |
| **Settings** | Read, Update |

### Context Types
- General, Project, Opportunity, Estimate, Financial, CRM, Production, Documents, Reports, Settings

### Proactive Intelligence Categories (Architecture)
- Deadlines, Late Tenders, Outstanding Invoices, Production Inconsistencies
- Cash Flow, Scheduling Conflicts, Missing Documents, Follow-ups

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brain/health` | GET | Health check with capabilities |
| `/api/brain/contracts` | GET | Get module contracts |
| `/api/brain/threads` | GET | List conversation threads |
| `/api/brain/threads/{context_type}` | GET | Get/create context thread |
| `/api/brain/messages` | POST | Send message to Brain |
| `/api/brain/messages/{thread_id}` | GET | Get thread messages |
| `/api/brain/suggested-actions` | GET | Get suggested actions |
| `/api/brain/action-history` | GET | Get action history |
| `/api/brain/actions/queue` | POST | Queue action for execution |
| `/api/brain/brief` | GET | Get company brief |
| `/api/brain/proactive` | GET | Get proactive alerts |

### Key Files
- `/app/backend/routes/company_brain.py` - All Company Brain endpoints
- `/app/frontend/src/components/brain/CompanyBrainPanel.jsx` - Global side panel
- `/app/frontend/src/hooks/useBrainContext.js` - Context tracking
- `/app/migrations/012_company_brain_foundation.sql` - Database schema (PENDING)

### Migration Required
Run `/app/migrations/012_company_brain_foundation.sql` in Supabase SQL Editor to create:
- `company_brain_threads` - Conversation threads
- `company_brain_messages` - Messages
- `company_brain_actions` - Action history

---

## TFCS Mainframe - Specification 1.1 (Command Center Dashboard)

### UI Components ✅
| Component | Status | Data Source |
|-----------|--------|-------------|
| **Header** | ✅ | Title, Notifications, Catch Me Up, Owner Access, Quick Add, **Brain** |
| **Today's Focus** | ✅ Architecture | Empty state until priority logic |
| **Projects Card** | ✅ LIVE | Real data from `/api/projects` |
| **Opportunities Card** | ✅ Architecture | Shows zeros until endpoint exists |
| **Company Brain** | ✅ Placeholder | Points to Brain panel |
| **Recent Activity** | ✅ LIVE | Real data from `/api/tfcs/activity` |

### Key Files
- `/app/frontend/src/pages/app/MainframePage.jsx`
- `/app/frontend/src/components/layout/AppLayout.jsx`

---

## TFCS Mainframe - Specification 1.0 (Backend Foundation)

### Architecture
- Role-Based Access Control (RBAC): Owner, Manager, Employee
- Activity Events - Permanent operational history
- Notifications - Temporary alerts

### Key Files
- `/app/backend/routes/tfcs.py` - TFCS routes
- `/app/backend/routes/tfcs_activity.py` - Activity logging
- `/app/migrations/011_tfcs_mainframe_foundation.sql` - Database schema

---

## Upcoming Tasks (Priority Order)

### P1 - TFCS AI Integration (Specification 1.3)
- Integrate GPT-5.2 for actual AI responses
- "Catch Me Up" operational summaries
- Context-aware conversations
- Run migration 012

### P2 - Additional Features
- Production Library (Single source of truth for estimating)
- Add second Owner role for 'Beau'
- Estimate Templates + Production Rates
- QuickBooks Sync (Sandbox-Ready)

### P3 - Future/Backlog
- Trust Pack Settings Tab
- `/api/opportunities` endpoint
- Priority logic for Today's Focus
- Company Brain Learning capabilities
- Action execution engine

---

## Test Credentials
| Account | Email | Password | Tier |
|---------|-------|----------|------|
| Primary Owner | inbox@twofungis.ca | TradeOS2024! | founding_lifetime |
| Legacy Founder | info@twofungis.ca | Marshall!31 | founding_lifetime |

---

## Key Files Reference

### Company Brain (Spec 1.2)
- `/app/backend/routes/company_brain.py`
- `/app/frontend/src/components/brain/CompanyBrainPanel.jsx`
- `/app/frontend/src/hooks/useBrainContext.js`
- `/app/migrations/012_company_brain_foundation.sql`
- `/app/backend/tests/test_company_brain.py`

### TFCS Mainframe (Spec 1.0-1.1)
- `/app/frontend/src/pages/app/MainframePage.jsx`
- `/app/frontend/src/components/layout/AppLayout.jsx`
- `/app/backend/routes/tfcs.py`
- `/app/backend/routes/tfcs_activity.py`
- `/app/migrations/011_tfcs_mainframe_foundation.sql`
- `/app/design_guidelines.json`
- `/app/backend/tests/test_tfcs_mainframe.py`

### Access Control
- `/app/backend/routes/access_control.py`
- `/app/backend/routes/profile.py`

### Server-Side Enforcement
- `/app/backend/routes/projects.py`
- `/app/backend/routes/quotes.py`
- `/app/backend/routes/invoices.py`
- `/app/backend/routes/copilot.py`

### PWA
- `/app/frontend/src/services/PWAInstallService.js`
- `/app/frontend/src/components/app/PWARedirectModal.jsx`
