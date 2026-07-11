# Verification Report

## Change Details
**Change**: supabase-persistence-short
**Version**: N/A (single-cut change, no prior verify-report existed)
**Mode**: Strict TDD
**Date**: 2026-07-11

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total (all units + closing criteria) | 27 |
| Tasks complete | 25 |
| Tasks incomplete | 2 (Unidad 5, real-deployment-only tasks; explicitly out of scope for this static cut) |

Both remaining unchecked tasks ("asignar operador, registrar backup restaurable y ensayar recuperación en local/efímero" and "tras una aplicación real, registrar métricas y decisiones") are gated in their own wording on a real Supabase deployment happening — which has not happened and is not in scope for this change. tasks.md makes the scoping explicit ("este punto no se ejecuta en el corte estático"). These are correctly deferred, not blockers for this verify.

The "Bloqueo antes de despliegue real" task (RLS runtime validation) is now checked `[x]`, cross-referencing the archived change `supabase-rls-runtime-validation`. Verified independently: the archived `verify-report.md` shows `verdict: pass`, `blockers: 0`, `critical_findings: 0`, `test_exit_code: 0` (58/58 full suite at archive time), a focused harness run (19/19), and `./scripts/validate-supabase-rls.sh` exit 0. The archived spec/tasks (WU-5, WU-7, WU-8) confirm the matrix explicitly covered concurrency of the last-admin removal and explicit household-delete cascade (WU-5: "comprobar el borrado explícito del hogar y su cascade permitido... la ejecución local/efímera confirmó cero hijos restantes"). The cross-reference in tasks.md is accurate.

### Build & Tests Execution

**Build**: PASS (no compiled app code touched by this change; used `git diff --check` as the closest equivalent sanity check for the changed SQL/docs)
```text
$ git diff --check -- supabase/migrations/20260710000000_supabase_persistence_short.sql supabase/migrations/README.md openspec/changes/supabase-persistence-short/
exit=0 (no whitespace/conflict-marker issues)
```

**Tests**: PASS — 59 passed / 0 failed / 0 skipped (7 files)
```text
$ npm test
> vitest run
 Test Files  7 passed (7)
      Tests  59 passed (59)
```
None of these 59 tests exercise this change's SQL migration directly — that is expected and consistent with this change's own declared scope ("Criterio de terminado del corte estático": validation is static SQL/diff review only; no local/ephemeral or real Supabase execution was in scope for THIS cut). The one Supabase-related test file present, `src/compartido/pruebas/validate-supabase-rls.test.ts` (19 of the 59 tests), belongs to the separate, already-archived `supabase-rls-runtime-validation` change and tests its shell harness contracts, not this change's artifacts. `git diff` confirms the functional migration file `20260710000000_supabase_persistence_short.sql` has no working-tree drift from its committed state.

**Coverage**: Not available — no coverage tooling configured in `package.json`/vitest config for this project.

### Spec Compliance Matrix

Spec scenarios here describe properties of a SQL migration under static/manual review, not runtime-executable application behavior — consistent with the change's own "Validación esperada" section, which explicitly limits acceptable evidence to static SQL review, checklist review, and RLS design review (no real-database execution). Runtime RLS behavior for the underlying schema was separately, exhaustively covered by the archived `supabase-rls-runtime-validation` change (58/58 full suite, 19/19 focused, harness exit 0). Compliance below is therefore evaluated as static evidence per requirement, cross-referencing that runtime evidence where the requirement concerns runtime behavior.

| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| Objetos propios prefijados | Migración acotada a la app | All created tables/functions/indexes/policies in `20260710000000_supabase_persistence_short.sql` use `mv_` prefix; no unrelated public table touched | COMPLIANT (static) |
| Modelo mínimo multiusuario | Tablas mínimas presentes | `mv_households`, `mv_household_members`, `mv_vehiculos`, `mv_eventos_vehiculo` all present; `household_id` `not null` on vehiculos/eventos | COMPLIANT (static) |
| Tenancy por hogar | Vehículo asociado a hogar / evento mismo hogar | `household_id uuid not null` FK on vehiculos; composite FK `(household_id, vehiculo_id)` → `(household_id, id)` on eventos prevents cross-household events | COMPLIANT (static); runtime cross-write rejection COMPLIANT via archived harness |
| Matrícula única por hogar | Duplicada mismo hogar / distinta hogar | `unique (household_id, matricula)` constraint present, includes inactive vehicles | COMPLIANT (static); runtime duplicate-plate rejection COMPLIANT via archived harness |
| Integridad de datos operativos | Valores negativos / estados y tipos acotados | Checks: `kilometros_actuales >= 0`, `coste >= 0`, `proximo_vencimiento_km >= 0`, `estado in ('activo','inactivo')`, `tipo in ('mantenimiento','averia')` | COMPLIANT (static) |
| Borrado coherente del hogar | Borrado explícito del hogar | `on delete cascade` hogar→miembros, hogar→vehículos→eventos (composite FK cascade); admin-only delete via RLS policy | COMPLIANT (static); runtime cascade-with-zero-orphans COMPLIANT via archived harness (WU-5) |
| RLS obligatoria por membresía | Miembro accede / no miembro denegado / anónimo denegado | RLS enabled on all four tables; `anon` privileges revoked; policies scoped via `mv_es_miembro`/`mv_tiene_rol` | COMPLIANT (static); runtime anon/non-member/editor/admin matrix COMPLIANT via archived harness |
| Preservación del último administrador | Último admin no removible / concurrencia | `mv_preservar_admin_hogar()` + `before update/delete` triggers on `mv_household_members`; `for update` row lock serializes per household | COMPLIANT (static); runtime sequential + two-session concurrency COMPLIANT via archived harness (WU-7/WU-8) |
| Guardarraíles de migración | Checklist revisa operaciones peligrosas | No `drop schema`/`drop database`/global resets/unjustified `cascade` found in migration or README; only justified parent→child cascades documented | COMPLIANT (static) |
| Validación sin mutar Supabase real | Validación aceptable del corte | No `supabase db push`/`migration up`/`db reset`/`psql` against shared instance found anywhere in this change's diff or artifacts | COMPLIANT (static) |
| Recuperación y salud del despliegue | Operador elige recuperación / observación inmediata | Runbook, backup/restore rehearsal criteria, and monitoring/escalation thresholds fully documented in design.md/README.md/validation-checklist.md | COMPLIANT (documented as pre-deployment requirement; execution correctly deferred — no real deployment has occurred) |
| Presupuesto de revisión | Alcance crece fuera del corte | `size:exception` for single-commit SDD bundle explicitly recorded in tasks.md/spec.md; no adapter/UI found in diff | COMPLIANT (static) |

**Compliance summary**: 11/11 requirements compliant given the change's own static-evidence scope; all requirements whose full compliance depends on runtime behavior (tenancy cross-writes, plate uniqueness enforcement, RLS matrix, last-admin concurrency, household-delete cascade) have that runtime evidence satisfied by the archived `supabase-rls-runtime-validation` verify-report (PASS, 58/58 + 19/19, harness exit 0), correctly cross-referenced from this change's tasks.md.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `mv_` prefix everywhere | Implemented | Verified by direct read of migration SQL; no unprefixed objects |
| Household FK boundaries | Implemented | `household_id not null` + composite FK on eventos |
| Plate uniqueness per household | Implemented | `unique (household_id, matricula)`, includes inactive vehicles |
| Non-negative checks | Implemented | km/coste/vencimiento_km all `>= 0` |
| RLS + grants | Implemented | RLS enabled on 4 tables; `anon` revoked; `authenticated` grants backed by named policies |
| Last-admin invariant | Implemented | `security definer` trigger function + 2 triggers (update/delete) with row lock |
| README/guardrail alignment | Implemented | `supabase/migrations/README.md` updated to permit exactly the 4 new tables and mirrors migration rules |
| No adapter/UI in diff | Confirmed | `rg` for `@supabase/supabase-js`/`createClient` under `src/` returns nothing; only pre-existing unrelated Supabase test file (`validate-supabase-rls.test.ts`) belongs to the sibling archived change |

### Coherence (Design)

All design decisions followed; no deviations found.

### TDD Compliance

**TDD Compliance**: This change is a deliberate exception to conventional Strict TDD (RED/GREEN/test-file) mechanics because its own scope explicitly excludes executable code and runtime validation (static SQL review only, per proposal.md/design.md/tasks.md). This is a **WARNING**, not a CRITICAL: the process gap is self-declared and consistent across proposal, spec, design, and tasks, and the runtime-testable behavior it defers was picked up and fully TDD'd (with real RED/GREEN test files, 19/19 focused + 58/58 full suite at archive time) by the separate, already-verified-and-archived `supabase-rls-runtime-validation` change. Flagging so a reviewer explicitly confirms this exception is acceptable for future static-cut changes, rather than silently treating it as full TDD compliance.

### Issues Found

**CRITICAL**: None

**WARNING**:
1. Strict TDD Mode is active project-wide, but this change's "TDD Cycle Evidence" table in `apply-progress.md` is documentation/review-based rather than automated-test-based, because the change intentionally contains no executable code (SQL + Markdown only). This is self-consistent with the change's declared static-only scope but is a deviation from the literal Strict TDD contract (`✅ Written`/`✅ Passed` against a real test file) that a reviewer should explicitly sign off on for future static-cut SDD changes.
2. `apply-progress.md`'s "Desviaciones y pendientes" section had stale items but was pre-synced by user before archive — artifacts now align.

**SUGGESTION**:
1. Consider adding a short "Static-cut TDD note" section to future static/documentation-only SDD changes' `apply-progress.md`, explicitly declaring the TDD exception up front.

### Verdict

**PASS WITH WARNINGS**

Rationale: All in-scope spec requirements are compliant given the change's own declared static-evidence scope; the two remaining unchecked tasks are correctly out of scope (gated on a real deployment that has not occurred); the RLS-runtime-validation cross-reference in tasks.md is accurate and independently verified against the archived change's PASS verify-report; `npm test` is green (59/59); no adapter/UI/dangerous-SQL scope creep was found; and the migration file has no working-tree drift from its committed state. The only findings are process-transparency WARNINGs (documented TDD exception) — neither blocks archive.
