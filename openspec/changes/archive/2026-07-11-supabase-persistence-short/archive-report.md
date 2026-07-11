# Archive Report: supabase-persistence-short

**Date**: 2026-07-11  
**Change**: supabase-persistence-short  
**Mode**: openspec (file-based)  
**Status**: PASS WITH WARNINGS (2 intentional, both reconciled)

## SDD Cycle Summary

This change has completed the full SDD cycle: proposal → specification → design → implementation → verification → archive.

**Verdict**: PASS WITH WARNINGS
- 0 CRITICAL issues
- 2 WARNINGs (both documented and reconciled):
  1. Strict TDD Mode exception: This is a static/documentation-only cut (SQL migration + Markdown) with no executable code to unit-test. The process exception is self-documented in proposal.md/design.md/tasks.md and consistent across all artifacts.
  2. apply-progress.md stale pending list: The RLS runtime validation work was separately handled in the change `supabase-rls-runtime-validation` (archived 2026-07-11), and apply-progress.md now correctly reflects that resolution.

**Tests**: 59/59 passed (no drift in implementation artifacts)

## Scope and Deliverables

This change defines the first reviewable Supabase persistence slice:

- SQL migration: `supabase/migrations/20260710000000_supabase_persistence_short.sql`
  - Four application-owned tables: `mv_households`, `mv_household_members`, `mv_vehiculos`, `mv_eventos_vehiculo`
  - All objects prefixed with `mv_`
  - RLS policies for household-scoped access control
  - Database-enforced invariants: last-admin preservation, household-event tenancy, plate uniqueness per household

- Documentation and guardrails:
  - `supabase/migrations/README.md` updated to permit the four new tables and document schema rules
  - `openspec/changes/supabase-persistence-short/validation-checklist.md` for static review

- SDD artifacts:
  - proposal.md: problem statement and acceptance criteria
  - spec.md: human-readable spec (companion to normative spec)
  - specs/supabase-persistence/spec.md: normative capability specification
  - design.md: technical architecture and schema design
  - tasks.md: implementation units and validation criteria
  - apply-progress.md: remediation history and TDD evidence
  - verify-report.md: PASS WITH WARNINGS verdict

## Scope Boundaries

**In scope** (completed):
- Versioned, unapplied SQL migration
- RLS design and policies
- Migration guardrails and validation checklist
- Static SQL/documentation review
- Strict TDD exception documented

**Out of scope** (intentionally deferred):
- Real Supabase deployment
- TypeScript adapter implementation
- UI/product code
- Runtime RLS validation (moved to separate change `supabase-rls-runtime-validation`, now archived)
- Operator assignment and backup rehearsal (gated on real deployment)
- Post-deployment metrics capture (gated on real deployment)

## Task Completion Status

**Unidad 1** (Base SQL migration): 5/5 tasks complete ✅
**Unidad 2** (RLS and permissions): 5/5 tasks complete ✅
**Unidad 3** (Migration guardrails): 5/5 tasks complete ✅
**Unidad 4** (Static validation): 5/5 tasks complete ✅
**Unidad 5** (Post-deployment preparation): 2/4 items checked ✅
  - 2 unchecked items (`asignar operador, registrar backup restaurable y ensayar recuperación en local/efímero` and `tras una aplicación real, registrar métricas y decisiones`) are explicitly gated on a real Supabase deployment that has not occurred, per tasks.md: "este punto no se ejecuta en el corte estático". These are correctly deferred, not implementation gaps.

**Total**: 25/27 framework tasks complete (2 intentionally out of scope for this static cut)

## Verification Findings

### Compliance Matrix

| Requirement | Status | Evidence |
|---|---|---|
| Objects prefixed with `mv_` | COMPLIANT | All tables, functions, indexes, policies use `mv_` prefix; no unrelated public tables touched |
| Four minimum tables exist | COMPLIANT | `mv_households`, `mv_household_members`, `mv_vehiculos`, `mv_eventos_vehiculo` all present |
| Household tenancy boundary | COMPLIANT (static) | `household_id not null` on vehiculos/eventos; composite FK `(household_id, vehiculo_id)` prevents cross-household events; runtime validation in archived `supabase-rls-runtime-validation` change |
| Plate uniqueness per household | COMPLIANT (static) | `unique (household_id, matricula)` constraint; includes inactive vehicles; runtime validation in archived change |
| Operational data integrity | COMPLIANT | Checks for non-negative km/coste/vencimiento_km; state/type bounds; desactivation coherence |
| Household deletion cascade | COMPLIANT (static) | `on delete cascade` from household → members/vehicles → events; runtime validation in archived change |
| RLS by household membership | COMPLIANT (static) | RLS enabled on all 4 tables; `anon` privileges revoked; policies use `mv_es_miembro`/`mv_tiene_rol`; runtime matrix in archived change |
| Last-admin preservation | COMPLIANT (static) | Function `mv_preservar_admin_hogar()` + triggers (update/delete) with `for update` row lock; runtime concurrency validation in archived change |
| Migration guardrails | COMPLIANT | README updated; no `drop schema`/`drop database`/resets found; only justified parent→child cascades |
| Validation without mutation | COMPLIANT | Static SQL/diff review only; no `supabase db push`/`migration up`/`psql` against shared instance |
| Review budget exception | COMPLIANT | `size:exception` documented in tasks.md/spec.md; payload remains small (1 migration + docs); future adapter/UI work to be split |

### Build & Tests

```text
$ git diff --check -- supabase/migrations/20260710000000_supabase_persistence_short.sql supabase/migrations/README.md openspec/changes/supabase-persistence-short/
exit=0 (no whitespace/conflict-marker issues)

$ npm test
> vitest run
 Test Files  7 passed (7)
      Tests  59 passed (59)
```

No regression in existing tests. The one Supabase-related test file (`validate-supabase-rls.test.ts`) belongs to the sibling archived change; its tests are not in scope for this change's artifacts.

## Specs Synced to Main Repository

| Domain | Action | Details |
|---|---|---|
| supabase-persistence | Created | New spec file `openspec/specs/supabase-persistence/spec.md` created from normative specification. This is the source of truth for future Supabase persistence work. |

## Archive Contents

The following artifacts have been moved to `openspec/changes/archive/2026-07-11-supabase-persistence-short/`:

- ✅ proposal.md — Problem statement and scope
- ✅ spec.md — Human-readable specification
- ✅ specs/supabase-persistence/spec.md — Normative capability specification (also copied to main specs)
- ✅ design.md — Technical architecture and schema design
- ✅ tasks.md — Implementation units and acceptance criteria
- ✅ apply-progress.md — Remediation history and TDD evidence
- ✅ verify-report.md — PASS WITH WARNINGS verdict
- ✅ validation-checklist.md — Static review checklist
- ✅ explore.md — Exploration notes

## Reconciliation Notes

**Apply-Progress Sync**: The `apply-progress.md` "Desviaciones y pendientes" section correctly notes:
- RLS runtime validation: "Resuelto" (RESOLVED in separate archived change `2026-07-11-supabase-rls-runtime-validation`)
- Operator/backup/recovery rehearsal: "Pendiente bloqueante" (PENDING GATE on real deployment)
- Post-deployment metrics: "no se ejecuta en el corte estático" (NOT IN SCOPE for this static cut)

No additional sync needed; artifacts align with the user's pre-archive hand reconciliation.

**TDD Exception**: Strict TDD Compliance column in verify-report documents that this is a deliberate exception:
- No automated test files expected or created (SQL/Markdown only)
- "Criterio de terminado del corte estático" explicitly defines static review as acceptable evidence
- Pattern self-documented for future static-cut SDD changes
- Runtime TDD behavior for underlying schema satisfied by sibling archived change

## Archival Confirmation

✅ Main specs updated with new domain: `openspec/specs/supabase-persistence/spec.md`
✅ All change artifacts moved to archive: `openspec/changes/archive/2026-07-11-supabase-persistence-short/`
✅ Original change folder `/home/josep/proyectos/manteniment-vehicles/openspec/changes/supabase-persistence-short/` removed from active changes
✅ No CRITICAL issues block archive
✅ Reconciliation documented for all WARNING-level deviations
✅ Dependency on archived `supabase-rls-runtime-validation` change properly cross-referenced

## Next Steps

This change is complete and closed. Future work:

1. **Real Supabase Deployment** (when approved):
   - Requires pre-deployment: operator assignment, verified backup rehearsal, fix-forward/rollback procedure validated locally
   - Requires immediate post-deployment observation: RLS/DB error rates, latency baseline
   - See validation-checklist.md and design.md for runbooks and escalation thresholds

2. **Adapter Implementation** (separate SDD change when starting):
   - TypeScript Supabase client integration
   - Domain→repository mapping
   - Must track against the committed migration (no schema drift allowed)
   - Separate PR from this archive to keep implementation payloads small

3. **UI/Multi-Household Product** (separate SDD change when needed):
   - Household selection flow
   - Member invitation/management
   - Only after adapter is stable and deployed

## Sign-Off

This SDD change has passed verification with documented, reconciled warnings and is now archived. The change is closed for further modification. All in-scope work is complete; out-of-scope items are properly documented as post-deployment gates (operator/backup/metrics) or separate concerns (adapter/UI).

The normative specification is now at `/home/josep/proyectos/manteniment-vehicles/openspec/specs/supabase-persistence/spec.md` and serves as the source of truth for all future Supabase persistence work in this project.
