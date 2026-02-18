# TradeOS - Product Requirements Document

## Product Overview
**Name:** TradeOS  
**Tagline:** Built for Builders  
**Headline:** Know your margin. Control your projects. Get paid faster.  
**Type:** SaaS Web Application - Contractor Operating System  
**Target Audience:** Trades, Subcontractors, Small GCs

---

## What's Been Implemented (Feb 18, 2026)

### ✅ Light Cloud Grey Theme (NEW - Completed)
- Changed dark backdrop to light cloud grey (#f4f6f8)
- Cards are white with light borders
- Dark charcoal sidebar retained for contrast
- White header with subtle shadow
- All text colors adjusted for readability

### ✅ Materials System - Phase 1 (NEW - Completed)
**Materials Tab in Projects:**
- Summary panel: Pre-Tax Total, Tax Total, Total w/ Tax, Billable, Non-Billable
- Add Material form with all fields:
  - Item Name, Category, Vendor
  - Qty, Unit, Unit Cost
  - Tax Type, Tax Amount
  - Purchased Date, Paid Status
  - Billable toggle, Markup %
  - Notes

**Material Categories:**
- Materials, Consumables, Tools, Equipment, Rental, Delivery

**Units:**
- Each, Box, Sheet, Linear Ft, Sq Ft, Hours, Days, Gallon, Pound, Other

**Backend API:**
- `/api/materials` - CRUD operations
- `/api/materials/project/{id}/summary` - Project summary
- `/api/materials/categories/list` - Category/unit lists

### ✅ Enhanced Expense Categories (NEW - Completed)
**Contractor-Focused Categories:**
| Category | Deductibility |
|----------|---------------|
| Materials (COGS) | 100% |
| Consumables | 100% |
| Tools (<$500) | 100% |
| Equipment (Capital) | 100% |
| Vehicle & Fuel | 100% |
| Meals & Entertainment | **50%** |
| Subcontractors | 100% |
| Insurance | 100% |
| Office/Admin | 100% |
| Phone/Internet | 100% |
| Travel/Lodging | 100% |
| Training/Certifications | 100% |
| Rent/Shop | 100% |
| Other | 100% |

### ✅ Previous Implementations
- Beta Trial Strategy (30-day trial, setup checklist, countdown)
- Dashboard 3-Zone Layout
- Project Page Financial Health Panel
- Invoicing System
- Milestone Management
- Expenses API

---

## Database Migration Required

**Run in Supabase SQL Editor:**
```
/app/migrations/008_materials_and_expenses.sql
```

This creates:
- `materials` table with all columns
- RLS policies for security
- Indexes for performance
- Enhanced `expenses` columns (deductibility, business/personal)

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** FastAPI + Supabase
- **Database:** Supabase (Postgres)
- **Payments:** Stripe
- **Email:** Resend
- **AI:** GPT-4 Vision (via Emergent LLM key)

---

## API Endpoints

### Materials API (NEW)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/materials` | GET | List materials with filters |
| `/api/materials` | POST | Create material |
| `/api/materials/{id}` | GET | Get material |
| `/api/materials/{id}` | PATCH | Update material |
| `/api/materials/{id}` | DELETE | Delete material |
| `/api/materials/project/{id}/summary` | GET | Project materials summary |
| `/api/materials/categories/list` | GET | Get valid categories/units |

### Other APIs
- Invoices: `/api/invoices/*`
- Milestones: `/api/milestones/*`
- Expenses: `/api/expenses/*`
- Trial: `/api/trial/*`

---

## Color System

### Light Theme
| Element | Color |
|---------|-------|
| Main Background | `cloud-100` (#f4f6f8) |
| Cards/Header | `white` |
| Card Borders | `cloud-300` (#dde2e8) |
| Input Backgrounds | `cloud-100` |

### Dark Accents
| Element | Color |
|---------|-------|
| Sidebar | `charcoal-800` (#1a1a1a) |
| Primary Text | `charcoal-800` (#1a1a1a) |
| Secondary Text | `charcoal-500` |

### Accent Colors
| Color | Use |
|-------|-----|
| `steel-500` | Primary buttons, links |
| `success` | Positive values, completed |
| `warning` | Caution, pending |
| `risk` | Errors, overdue |

---

## Backlog

### Phase 2 - Enhanced Expenses (In Progress)
- [x] Update expense categories for contractors
- [ ] Add deductibility % field
- [ ] Add business/personal toggle
- [ ] Quick Add Expense from any page

### Phase 3 - Tax Summary & Reports
- [ ] Tax Summary page (Monthly/Quarterly)
- [ ] Revenue, Expenses, Deductible totals
- [ ] Reports: Materials by Project, Expenses by Category
- [ ] PDF/CSV export

### P0 - Invoice Hardening
- [ ] Automatic overdue calculation
- [ ] Global Receivables Report

---

## Files Reference

### Theme/Layout
- `/app/frontend/tailwind.config.js` - Cloud colors
- `/app/frontend/src/components/layout/AppLayout.jsx` - Light header

### Materials System
- `/app/frontend/src/components/project/MaterialsTab.jsx`
- `/app/backend/routes/materials.py`
- `/app/migrations/008_materials_and_expenses.sql`

### Core Pages
- `/app/frontend/src/pages/app/DashboardPage.jsx`
- `/app/frontend/src/pages/app/ProjectDetailPage.jsx`
- `/app/frontend/src/pages/app/ExpensesPage.jsx`

---

## Testing Status
- ✅ Light Theme: 100%
- ✅ Materials Tab UI: 100%
- ✅ Materials API: 100% (needs DB migration)
- ✅ Enhanced Expense Categories: 100%

---

## Credentials
- Test Account: `test703691@tradeos.test` / `TestPass123!`

---

## Version History
| Date | Version | Changes |
|------|---------|---------|
| Feb 18, 2026 | 2.5 | **Light Cloud Grey Theme**, Materials System Phase 1, Enhanced Expense Categories |
| Feb 18, 2026 | 2.4 | Beta Trial Strategy |
| Feb 18, 2026 | 2.3 | Dashboard/Project restructure |
