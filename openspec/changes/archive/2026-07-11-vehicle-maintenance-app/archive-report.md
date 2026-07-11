# Archive Report: vehicle-maintenance-app

**Date**: 2026-07-11
**Change**: vehicle-maintenance-app
**Mode**: openspec (file-based)
**Status**: PASS — no CRITICAL blockers remaining

## SDD Cycle Summary

This change has completed the full SDD cycle: proposal → specification → design → tasks → apply → verify → archive, delivered across 3 chained PRs (stacked-to-main):

- **PR 1**: base stack (Next.js + TypeScript + Tailwind + Vitest), pure domain (`Vehiculo`, `EventoVehiculo`, `Vencimiento`, `RolUsuario`), and use cases against in-memory repositories.
- **PR 2**: household-scoped ports/use cases, Supabase server-only adapter against the existing multi-tenant migration, atomic event+mileage coordination, and the temporary auth/RLS boundary.
- **PR 3**: minimal Next.js screens (list/create/deactivate vehicles, register events, correct mileage, view history/expirations) and server actions.
- **PR 4** (`feat/vehiculos-bootstrap-admin`, PR #4, merge commit `56cab35`, closes issue #3): the one task left unmarked after PR3's verification — a real `OperacionesBootstrapPostgres` against administrative Postgres plus a `unique (nombre)` constraint on `mv_households` — was implemented, adversarially reviewed (4 lenses), and merged. See the addendum at the end of `verify-report.md` for the full account of what the review found and how it was fixed.

**Tests**: 208/208 passed (0 skipped — the Postgres integration test that used to skip without a live database now runs and passes against the local Supabase stack).
**Types**: `tsc --noEmit` — same 7 pre-existing errors, 0 new.
**Build**: `npm run build` — succeeds, generates `/vehiculos` routes.

## Scope and Deliverables

- Pure domain: `src/modulos/vehiculos/dominio/` (vehicle, event, expiry, role — no framework/infra imports).
- Application layer: household-scoped ports and use cases in `src/modulos/vehiculos/aplicacion/`.
- Supabase adapter: server-only repositories, mappers, atomic event+mileage coordination, and the bootstrap-admin module in `src/modulos/vehiculos/adaptadores/supabase/`.
- Interface: Zod validation, server actions, and minimal screens in `src/modulos/vehiculos/interfaz/` and `src/app/vehiculos/`.
- Migration: `supabase/migrations/20260711000000_mv_households_nombre_unique.sql` (`unique (nombre)` on `mv_households`), documented preflight/recovery in `supabase/migrations/README.md`.
- SDD artifacts: `proposal.md`/`propuesta.md`, `spec.md`, `diseno.md`, `tasks.md`, `apply-progress.md`, `verify-report.md` (all preserved verbatim in this archive folder).

## Task Completion Status

**74/74 tasks complete** across the 13 sections in `tasks.md` (PR1: sections 1-4, PR2: sections 5-9 including the PR1 amendment for household scoping, PR3: sections 10-13). Zero unchecked items remain.

## Specs Synced to Main Repository

| Domain | Action | Details |
|---|---|---|
| vehicle-maintenance-app | Created | New spec file `openspec/specs/vehicle-maintenance-app/spec.md`, based on the change's `spec.md` with a "Decisiones de especificación (resueltas durante la implementación)" section added to record the stack, event-cost, and role-matrix decisions that were open questions at spec time. This is the source of truth for future vehicle-maintenance-app work. |

## Archive Contents

The following artifacts were moved (via `git mv`, content preserved exactly) to `openspec/changes/archive/2026-07-11-vehicle-maintenance-app/`:

- ✅ proposal.md / propuesta.md — problem statement and scope (English/Spanish pair, both original)
- ✅ spec.md — human-readable specification
- ✅ diseno.md — technical architecture and design
- ✅ tasks.md — implementation units, 74/74 complete
- ✅ apply-progress.md — apply-phase evidence and history
- ✅ verify-report.md — original PR3 pre-commit verdict, plus a new final addendum covering PR4 and archive readiness

## Reconciliation Notes

**Correction to this archive run**: an earlier automated pass at archiving this change produced lossy, summarized rewrites of `spec.md`, `tasks.md`, `diseno.md`, and `verify-report.md` (English prose replacing the original Spanish requirements/tasks/design content) and omitted `apply-progress.md` entirely. That draft was discarded before being committed. This archive instead moves every original file byte-for-byte and adds new content only as clearly-marked addenda, consistent with how prior addenda in this same `verify-report.md` were handled (e.g. the `R3-REL-001` and `R3-001`/`R3-002` addenda already present in the file).

**Follow-up work, not part of this archive**: the 4-lens review on PR4 surfaced non-blocking warnings, filed as GitHub issues #5–#13 (server-only import boundary, automated migration preflight, connection timeout/retry, wiring a real bootstrap runner, `nombre` case/whitespace normalization, membership role upgrade on re-run, SQL-substring-coupled tests, CI setup, and documenting the `auth.users` internal-schema dependency). None block this archive.

## Archival Confirmation

✅ Main spec created: `openspec/specs/vehicle-maintenance-app/spec.md`
✅ All change artifacts moved to archive: `openspec/changes/archive/2026-07-11-vehicle-maintenance-app/`
✅ Original change folder `openspec/changes/vehicle-maintenance-app/` no longer present in active changes
✅ No CRITICAL issues block archive (all found in PR4's 4-lens review were fixed pre-merge)
✅ Follow-up warnings tracked as GitHub issues #5–#13, cross-referenced above

## Next Steps

This change is complete and closed. Future work belongs to separate SDD changes or the tracked follow-up issues:

1. Harden the bootstrap-admin module per issues #5–#8 (server-only guard, migration preflight automation, connection timeout/retry, real runner wiring) before relying on it in a multi-instance or production deployment.
2. Close the `nombre` normalization and membership-role-upgrade gaps (#9, #10) if household-name collisions across case/whitespace become a real concern.
3. Improve bootstrap test quality and add CI (#11, #12) before trusting this module's contracts on future changes without manual re-verification.
4. Any adjuntos/OCR/IA/notifications/advanced-dashboard work is out of scope for this MVP and starts as a new SDD change.

## Sign-Off

This SDD change has passed verification (original PR3 verdict plus the PR4 closing addendum) and is now archived. All in-scope MVP work — vehicle CRUD, logical deactivation, event registration, automatic and manual mileage handling, recurring-maintenance expiry, household-scoped multi-tenancy, and the real-user (non-`service_role`) bootstrap/RLS boundary — is implemented, tested, and merged to `main`.

The normative specification is now at `openspec/specs/vehicle-maintenance-app/spec.md` and serves as the source of truth for all future vehicle-maintenance-app work in this project.
