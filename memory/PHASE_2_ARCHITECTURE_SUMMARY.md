# TRADEOS PHASE 2 ARCHITECTURE SUMMARY
## Foundational Document Relationships

**Date:** July 12, 2026  
**Status:** ARCHITECTURE COMPLETE — READY FOR IMPLEMENTATION

---

## DOCUMENT HIERARCHY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                      TRADEOS CONSTITUTION v1.0                               │
│                    ═══════════════════════════════                           │
│                     Permanent Architectural Law                              │
│                                                                              │
│    Defines: Work-Centric Design, Workspace Philosophy, Company Brain,       │
│             Learning Company, Multi-Tenancy, External Users, UX Standards   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    SPECIFICATION GOVERNANCE                                  │
│                    ════════════════════════                                  │
│              Document Standards & Template                                   │
│                                                                              │
├──────────────────────────────┬──────────────────────────────────────────────┤
│                              │                                               │
│   PLATFORM SPECIFICATIONS    │        PRODUCT SPECIFICATIONS                 │
│   ════════════════════════   │        ═══════════════════════                │
│                              │                                               │
│   ┌────────────────────┐     │     ┌────────────────────┐                   │
│   │ SPEC 1.5 (v1.5.1)  │     │     │ SPEC 1.0-1.2       │                   │
│   │ Multi-Tenant       │     │     │ TFCS Mainframe     │                   │
│   │ Architecture       │     │     │ (Complete)         │                   │
│   │ ─────────────────  │     │     └────────────────────┘                   │
│   │ • Organizations    │     │              │                                │
│   │ • Memberships      │     │              ▼                                │
│   │ • Roles/Perms      │     │     ┌────────────────────┐                   │
│   │ • RLS Security     │     │     │ SPEC 2.0 (v2.0.1)  │                   │
│   │ • External Users   │     │     │ Opportunity &      │                   │
│   │ • Workspace Switch │     │     │ Tender Workspace   │                   │
│   └────────────────────┘     │     │ ─────────────────  │                   │
│            │                 │     │ • Work Lifecycle   │                   │
│            │                 │     │ • Tender Building  │                   │
│            │                 │     │ • Brain Integration│                   │
│            │                 │     │ • Learning Loop    │                   │
│            │                 │     └────────────────────┘                   │
│            │                 │              │                                │
│            │                 │              ▼                                │
│            │                 │     ┌────────────────────┐                   │
│            │                 │     │ SPEC 2.1 (Planned) │                   │
│            │                 │     │ Production Library │                   │
│            │                 │     └────────────────────┘                   │
│            │                 │                                               │
│            └─────────────────┼───────────────────────────────────────────── │
│                              │                                               │
│     All Product Specs inherit from Platform Specs                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CONSTITUTIONAL COMPLIANCE STATUS

| Document | Version | Compliance | Notes |
|----------|---------|------------|-------|
| Constitution | v1.0 | N/A | Source of truth |
| Spec Governance | v1.0 | ✅ | Ratified |
| Spec 1.5 | v1.5.1 | ✅ | Updated per compliance review |
| Spec 2.0 | v2.0.1 | ✅ | Updated per compliance review |

---

## KEY ARCHITECTURAL DECISIONS

### From Constitution

| Decision | Reference | Impact |
|----------|-----------|--------|
| Work is primary object | Article I | All features revolve around Work lifecycle |
| Universal Workspace Pattern | Article II | Consistent UI across all entity types |
| Multi-tenant isolation | Article III | RLS on all tables, org-scoped data |
| Hidden Platform Workspace | Article IV | No separate admin app |
| No orgs in URLs | Article V | Context via JWT, not URL |
| Workspace Switcher | Article VI | Slack/Notion-style switching |
| First-class external users | Article VII | No lightweight portals |
| Brain = Operations Manager | Article VIII | Proactive, not reactive |
| Learning from every project | Article IX | Continuous improvement loop |

### From Spec 1.5

| Decision | Impact |
|----------|--------|
| `organization_id` on all tables | Data isolation foundation |
| `organization_members` for roles | Flexible role assignment |
| JWT contains org context | RLS enforcement |
| External users in same auth | Unified user model |

### From Spec 2.0

| Decision | Impact |
|----------|--------|
| Work flows through lifecycle states | Opportunity → Project is state change, not separate systems |
| Tender Workspace inside Opportunity | Focused context for estimating |
| Brain touchpoints at every stage | AI-first design |
| Variance tracking on completion | Powers the Learning Company |

---

## IMPLEMENTATION SEQUENCE

```
PHASE 2 IMPLEMENTATION ORDER
════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Multi-Tenant Foundation (Spec 1.5)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Create organizations table                                                │
│ • Create organization_members table                                         │
│ • Migrate existing data to Two Fungis organization                         │
│ • Add organization_id to all existing tables                               │
│ • Enable RLS policies                                                       │
│ • Implement Workspace Switcher UI                                          │
│ • Create Platform Workspace (hidden)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Opportunity Foundation (Spec 2.0 Phase 1)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Create opportunities table                                                │
│ • Implement Opportunity CRUD API                                            │
│ • Build Opportunity list view                                               │
│ • Build Opportunity detail view (Workspace pattern)                         │
│ • Implement status workflow                                                 │
│ • Activity logging                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Tender Workspace (Spec 2.0 Phase 2-3)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Create tenders and tender_line_items tables                              │
│ • Build Tender Workspace UI                                                 │
│ • Line item management (add, edit, delete, reorder)                        │
│ • Totals calculation engine                                                 │
│ • PDF generation                                                            │
│ • Submit workflow                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Project Conversion (Spec 2.0 Phase 4)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Convert awarded opportunity to project                                    │
│ • Establish cost baseline from tender                                       │
│ • Link opportunity to project                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Company Brain Integration (Spec 2.0 Phase 5)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Similar project suggestions                                               │
│ • Rate recommendations (manual until Production Library)                    │
│ • Risk analysis                                                             │
│ • Post-project learning capture                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Production Library (Spec 2.1 - Future)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Build Production Library module                                           │
│ • Integrate with Tender Workspace                                           │
│ • Connect learning loop                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DOCUMENT INVENTORY

### Governance Documents

| File | Purpose | Status |
|------|---------|--------|
| `/app/memory/TRADEOS_CONSTITUTION_v1.0.md` | Architectural law | RATIFIED |
| `/app/memory/SPECIFICATION_GOVERNANCE.md` | Standards & template | RATIFIED |

### Compliance Reviews

| File | Purpose | Status |
|------|---------|--------|
| `/app/memory/COMPLIANCE_REVIEW_SPEC_1.5.md` | 1.5 vs Constitution | COMPLETE |
| `/app/memory/COMPLIANCE_REVIEW_SPEC_2.0.md` | 2.0 vs Constitution | COMPLETE |

### Platform Specifications

| File | Purpose | Status |
|------|---------|--------|
| `/app/memory/SPECIFICATION_1.5_MULTI_TENANT_ARCHITECTURE.md` | Multi-tenancy | v1.5.1 APPROVED |

### Product Specifications

| File | Purpose | Status |
|------|---------|--------|
| `/app/memory/PRD.md` | Product requirements (legacy) | REFERENCE |
| `/app/memory/SPECIFICATION_2.0_TENDER_WORKSPACE.md` | Opportunity & Tender | v2.0.1 APPROVED |

---

## OPEN QUESTIONS (Require User Decision)

### From Spec 1.5
1. **TFCS Role Migration:** Migrate existing `tfcs_user_roles` to `organization_members` now, or maintain both during transition?

### From Spec 2.0
1. **Kanban vs. List:** Default view for Opportunities?
2. **Tender Templates:** Include in Phase 1 or defer?
3. **Multi-tender:** Allow multiple tender versions per opportunity?
4. **Production Library First:** Build library before Tender Workspace, or add manual rates first?
5. **PDF Branding:** Include company logo in tender PDFs?

---

## ARCHITECTURE HEALTH

| Metric | Status |
|--------|--------|
| Constitutional Compliance | ✅ All specs compliant |
| Internal Consistency | ✅ No conflicts between specs |
| Implementation Ready | ✅ Ready to begin |
| Open Questions | ⚠️ 6 questions pending user decision |

---

## NEXT ACTIONS

1. **User Decision:** Resolve open questions above
2. **Implementation:** Begin Step 1 (Multi-Tenant Foundation)
3. **Future Spec:** Draft Specification 2.1 (Production Library) when ready

---

## SUMMARY

TradeOS Phase 2 architecture is **internally consistent and ready for implementation**.

The foundation is:
- **Constitution v1.0** — Permanent architectural philosophy
- **Spec 1.5 v1.5.1** — Multi-tenant platform foundation
- **Spec 2.0 v2.0.1** — Opportunity lifecycle and Tender Workspace

All documents align with Constitutional principles. Implementation may begin upon resolution of open questions.

---

**END OF PHASE 2 ARCHITECTURE SUMMARY**
