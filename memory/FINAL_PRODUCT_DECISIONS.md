# TRADEOS FINAL PRODUCT DECISIONS
## Architectural Decisions Record (ADR)

**Date:** July 12, 2026  
**Status:** RATIFIED  
**Authority:** Product Owner  
**Effective:** Immediately

---

## DECISION SUMMARY

All open questions from Specifications 1.5 and 2.0 have been permanently resolved.

| Question | Decision | Rationale |
|----------|----------|-----------|
| TFCS Migration | Migrate to Organization model | TFCS becomes internal OS of an org |
| Opportunities View | Both Kanban AND List | User chooses their workflow |
| Tender Templates | Include from V1 | Biggest time-saving feature |
| Tender Versioning | Full version history | Nothing ever overwritten |
| Production Library | Build first, not deferred | Foundational to estimating |
| PDF Branding | Organization owns branding | Platform provides defaults |

---

## DECISION 1: TFCS MIGRATION

**Decision:** Migrate away from TFCS-specific roles to Organization model.

**Implementation:**
- TFCS becomes the internal operating system of an Organization
- All new development targets Organization/Membership model
- Maintain backward compatibility during migration
- `tfcs_user_roles` → `organization_members`

**Rationale:** The future architecture revolves around Organizations and Organization Memberships. TFCS is not a special case—it's the standard operational mode for any contractor business.

---

## DECISION 2: OPPORTUNITY VIEWS

**Decision:** Support multiple views, not either/or.

**Version 1 Views:**
- Kanban (columns by status)
- List (sortable table)

**Future Views:**
- Calendar (by due date)
- Timeline (Gantt-style)
- Map (by location)

**Implementation:** Single data source, multiple view components. User preference persisted.

**Rationale:** Users should choose the view that fits their workflow. Don't force a single paradigm.

---

## DECISION 3: TENDER TEMPLATES

**Decision:** Implement templates from Version 1.

**Template Types:**
| Type | Purpose |
|------|---------|
| Tender Templates | Pre-built estimate structures |
| Scope Templates | Standard scope of work text |
| Proposal Templates | Cover letter and terms |
| Email Templates | Communication templates |

**Implementation:** Templates are organization-owned. TradeOS provides starter templates. Users create and save their own.

**Rationale:** Templates are one of the biggest time-saving features. The system should become faster every time it is used.

---

## DECISION 4: TENDER VERSIONING

**Decision:** Full version history from Version 1.

**Version States:**
```
Draft v1 → Draft v2 → Submitted (Rev 1) → Revised (Rev 2) → Final → Awarded
```

**Rules:**
- Every submission is preserved
- Nothing is ever overwritten
- Users can view any historical version
- Awarded version becomes project baseline

**Implementation:** Immutable tender records. New versions are new records with version number and parent reference.

**Rationale:** Audit trail is essential. Contractors need to prove what was quoted.

---

## DECISION 5: PRODUCTION LIBRARY

**Decision:** Production Library is foundational. Build first.

**Implementation:**
- Begin with manual production data entry
- Every estimate connects to Production Library items
- Company Brain learns from actual vs. estimated over time
- Intelligence expands through completed projects

**Sequence:**
1. Manual library management
2. Tender Workspace uses library items
3. Completed projects feed back actuals
4. Company Brain suggests rate adjustments

**Rationale:** Production Library is the knowledge foundation. AI cannot provide value without data to reason over.

---

## DECISION 6: PDF BRANDING

**Decision:** Organizations own their branding. TradeOS provides professional defaults.

**Organization Customization:**
- Logo
- Letterhead
- Brand colors
- Proposal templates
- Invoice templates
- Email templates

**Implementation:**
- `organization_settings.branding` stores customization
- PDF generation uses org branding
- New orgs get professional TradeOS defaults
- Branding editor in Settings

**Rationale:** The documents belong to the company. TradeOS is the platform, not the brand on the output.

---

## DECISION 7: IMPLEMENTATION STRATEGY

**Decision:** Vertical slices, not horizontal layers.

**Approach:**
```
❌ WRONG: Build all APIs, then all UIs, then connect
✅ RIGHT: Build one complete workflow end-to-end
```

**Vertical Slice Pattern:**
```
Opportunity
    ↓
Tender Workspace
    ↓
Estimate (with Production Library)
    ↓
Proposal (with Templates)
    ↓
Submission
    ↓
Award
    ↓
Project Creation
    ↓
Learning (actuals → Production Library)
```

**Rationale:** Each slice is usable. Users get value immediately. Quality standard is established early.

---

## DECISION 8: DEFINITION OF DONE

A feature is **DONE** when:

| Criteria | Description |
|----------|-------------|
| ✅ Workflow Complete | End-to-end flow works |
| ✅ UX Polished | Professional, calm, minimal |
| ✅ AI Integrated | Company Brain touchpoints active |
| ✅ Automation Complete | Automated actions working |
| ✅ Documentation Updated | Specs reflect implementation |
| ✅ Company Brain Connected | Brain has context |
| ✅ Mobile Responsive | Works on all devices |
| ✅ Security Reviewed | Permissions enforced |
| ✅ Acceptance Criteria | All criteria satisfied |

**Nothing ships until all criteria are met.**

---

## VERTICAL SLICE 1: SPECIFICATION

### Scope

**Workflow:** Opportunity → Tender Workspace → Estimate → Proposal → Submission

This is the first fully usable workflow inside TradeOS.

### Components

| Component | Description |
|-----------|-------------|
| Opportunity List | Kanban + List views |
| Opportunity Workspace | Detail view with tabs |
| Tender Workspace | Focused estimating environment |
| Production Library | Item catalog with rates |
| Line Item Builder | Add items from library |
| Totals Engine | Calculate markup, overhead, contingency |
| Proposal Builder | Cover letter, terms, branding |
| PDF Generator | Professional output |
| Submission Flow | Send to client, track status |
| Company Brain | Insights at each stage |

### Excluded from Slice 1

- Project Conversion (Slice 2)
- Learning Loop / Actuals (Slice 2)
- Client Portal (Slice 3)
- Change Orders (Future)

### Success Criteria

A contractor can:
1. Create an opportunity from a lead
2. Open the Tender Workspace
3. Build an estimate using Production Library items
4. Add markup, overhead, contingency
5. Generate a professional PDF proposal
6. Submit the tender
7. Track submission status
8. Receive Company Brain insights throughout

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Prerequisites)

1. **Multi-Tenant Tables**
   - `organizations`
   - `organization_members`
   - `organization_settings` (including branding)

2. **Production Library Tables**
   - `production_categories`
   - `production_items`
   - Default library seeding

3. **Template Tables**
   - `tender_templates`
   - `scope_templates`
   - `proposal_templates`

### Phase 2: Opportunity

4. **Opportunity Tables**
   - `opportunities`
   - `opportunity_activity`

5. **Opportunity API**
   - CRUD endpoints
   - Status workflow

6. **Opportunity UI**
   - List view (Kanban + Table)
   - Opportunity Workspace (detail)

### Phase 3: Tender Workspace

7. **Tender Tables**
   - `tenders`
   - `tender_line_items`
   - `tender_versions`

8. **Tender API**
   - CRUD endpoints
   - Line item management
   - Version creation

9. **Tender Workspace UI**
   - Scope section
   - Cost assembly
   - Pricing strategy
   - Totals display

### Phase 4: Proposal & Submission

10. **Proposal Builder**
    - Template selection
    - Cover letter editor
    - Terms editor

11. **PDF Generation**
    - Branding integration
    - Professional layout

12. **Submission Flow**
    - Submit action
    - Status tracking
    - Activity logging

### Phase 5: Company Brain Integration

13. **Brain Touchpoints**
    - Similar projects (Opportunity)
    - Rate suggestions (Tender)
    - Risk analysis (Tender)
    - Follow-up reminders (Submitted)

---

## TIMELINE PHILOSOPHY

No time estimates. Implementation proceeds step by step.

Each step is:
- Designed
- Built
- Tested
- Polished
- Documented

Move to next step only when current step meets Definition of Done.

---

**END OF FINAL PRODUCT DECISIONS**

*These decisions are permanent unless explicitly revised by Product Owner.*
