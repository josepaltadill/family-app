# Verification Report — PR2

**Change**: vehicle-maintenance-app
**Scope**: PR2 only (tasks 5–9 in `tasks.md`) — reopened PR1 ports/use-cases/`ProveedorIdentidad` for household scoping, Supabase mappers against existing schema, server-only Supabase adapter, atomic event+mileage contract, auth/RLS credential bootstrap. Includes remediation of a subsequent 4-lens adversarial review (2 CRITICAL, 3 WARNING) applied after the initial PR2 apply.
**Mode**: Strict TDD

## Completeness

| Metric | Value |
|--------|-------|
| PR2 tasks (section 5–9) total | 30 subtasks |
| PR2 tasks complete | 29 |
| PR2 tasks incomplete | 1 (task 9, real `OperacionesBootstrap` vs Postgres/Admin API + DB uniqueness guard — explicitly deferred, requires live Supabase env + new migration) |
| PR1 (sections 1–4) | Unaffected; still `[x]`, not broken by PR2 changes |
| PR3 (sections 10–13) | Correctly untouched — no files in `src/modulos/vehiculos/interfaz/` or `src/app/vehiculos/` exist |

The single unchecked item (tasks.md line 130) is honestly represented: it is split out from the completed orchestration/interface task (line 129, `[x]`) and explicitly documents why it can't be completed in this session (no live Supabase environment, would need a new migration for a DB-level `unique` constraint on `mv_households.nombre`). This is correct and not a silent gap.

## Build & Tests Execution

**Build**: ✅ Passed
```
npm run build
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 1056ms
✓ TypeScript finished, no errors
✓ Static pages generated (3/3)
```

**Tests**: ✅ 120 passed / ❌ 0 failed / ⚠️ 0 skipped
```
npm test
Test Files  17 passed (17)
     Tests  120 passed (120)
```
Matches the count claimed in `apply-progress.md` ("120/120 tests, 17 archivos") for the remediated state.

**Coverage**: ➖ Not available (no coverage tool configured; `package.json` has no coverage script, no `vitest.config.ts` coverage block).
**Linter**: ➖ Not available (no ESLint config found in repo root).

## Remediation Verification (5 items requested)

| # | Item | Verified in code | Verified in tests |
|---|------|-------------------|--------------------|
| 1 | Bootstrap race detection: `ErrorRaceBootstrapHogar` thrown after re-query if >1 household with same name | ✅ `bootstrap-servidor.ts` L36–48, 83–93 — re-queries only after CREATE path (not the idempotent found-path), throws typed error | ✅ `bootstrap-servidor.test.ts` — dedicated test simulates `contarHogaresPorNombre` returning 2, asserts `ErrorRaceBootstrapHogar` instance + message; also idempotency test confirms count-check is NOT called on the found-path |
| 1b | `tasks.md` §9 honesty split | ✅ Confirmed: line 129 `[x]` (orchestration/interface, tested against doubles) is distinct from line 130 `[ ]` (real Postgres/Admin-API impl + DB uniqueness constraint, explicitly deferred — needs live env + new migration) | N/A (doc check) |
| 2 | Typed `ErrorAdaptadorSupabase` with `codigo`, used across 4 adapter files | ✅ `errores-adaptador.ts` defines class + `errorAdaptadorSupabaseDesde` helper; used in `repositorio-vehiculos-supabase.ts` (4 sites), `repositorio-eventos-supabase.ts` (5 sites incl. atomic point), `proveedor-identidad-supabase-servidor.ts` (1 site, membership read), `cliente-supabase-servidor.ts` (1 site, auth) — remaining `throw new Error(...)` in those files are app-state assertions, not raw Postgres errors, correctly left untouched | ✅ `errores-adaptador.test.ts` (2 tests: with/without code) + assertions in all 4 adapter test files checking `instanceof ErrorAdaptadorSupabase` and `.codigo` |
| 2b | Structured `console.error` at atomicity-risk point | ✅ `repositorio-eventos-supabase.ts` L121–126 — logs `householdId`, `vehiculoId`, `codigo`, `mensaje` only at the real-risk point (event insert fails AFTER vehicle update committed); correctly NOT logged when vehicle update itself fails (no inconsistency exists yet at that point) | ✅ `repositorio-eventos-supabase.test.ts` covers both branches |
| 3 | `Vehiculo` constructor rejects inconsistent `estado`/`fechaDesactivacion` | ✅ `vehiculo.ts` L137–152, `validarConsistenciaEstadoDesactivacion` called from the shared private constructor (applies to `crear`, `desactivar`, `corregirKilometraje`, `reconstruir`) | ✅ `vehiculo.test.ts` — 2 dedicated tests: activo+fecha and inactivo+no-fecha, both assert `ErrorDominio` |
| 4 | `existeMatricula` no longer case-normalizes in in-memory double | ✅ `repositorio-vehiculos-en-memoria.ts` L23–31 — direct `===` comparison, comment explains parity with Supabase's `.eq()` and the DB's case-sensitive `unique(household_id, matricula)` | ✅ `rg` search across `src/` found zero lingering assertions of case-insensitive behavior; new test in `vehiculos-casos-uso.test.ts` L75 asserts the corrected behavior (same matricula, different case, IS allowed in same household) |
| 5 | Events use `.insert()` not `.upsert()`; vehicles remain `.upsert()` | ✅ `repositorio-eventos-supabase.ts` L33 (`guardar`) and L111 (`registrarEventoYActualizarKilometraje`) both use `.insert()`; L93 (vehicle write) still uses `.upsert()` correctly | ✅ `repositorio-eventos-supabase.test.ts` L45–59, L108–112 explicitly assert `.insert()` present and `.upsert()` absent for event writes |

All 5 remediation items are genuinely present, correctly scoped, and covered by passing tests — not just claimed in `apply-progress.md`.

## Spec Compliance Matrix (PR2-relevant only)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Aislamiento por hogar (multi-tenant) | `buscarPorId`/`listar` no filtran entre hogares | `vehiculos-casos-uso.test.ts` (aislamiento) | ✅ COMPLIANT |
| Matrícula única por hogar | Rechaza duplicado mismo hogar, permite en hogar distinto | `vehiculos-casos-uso.test.ts` | ✅ COMPLIANT |
| Adaptar esquema Supabase existente, prefijo `mv_`, sin migración nueva | Mapeadores contra columnas reales | `mapeadores-supabase.test.ts` (21 asserts) | ✅ COMPLIANT |
| Backend/server actions como frontera de datos; sin acceso browser-side | Ningún `'use client'` importa adaptadores Supabase | `seguridad-servidor.test.ts` (8 tests incl. barrido real del repo) | ✅ COMPLIANT |
| Sin `service_role` en cliente | Detector de patrón de clave privilegiada | `seguridad-servidor.test.ts` | ✅ COMPLIANT |
| Evento + kilometraje atómico/coordinado | Fallo del vehículo no confirma evento; histórico no actualiza km | `registrar-evento-vehiculo.test.ts`, `repositorio-eventos-supabase.test.ts` | ✅ COMPLIANT (app-level coordination, not a real SQL transaction — documented risk, in-scope per design decision) |

## Correctness (Static Evidence)

| Area | Status | Notes |
|------|--------|-------|
| No PR3/UI/server-action code added | ✅ Confirmed | `find src/modulos/vehiculos/interfaz` and `src/app/vehiculos` return nothing |
| No migration file touched | ✅ Confirmed | `git status` shows `supabase/migrations/20260710000000_supabase_persistence_short.sql` untouched; only `supabase/migrations/README.md` (docs) modified |
| No `service_role`/privileged credential client-reachable | ✅ Confirmed | Only `SUPABASE_ANON_KEY` used in `entorno.ts`; all `service_role` mentions are comments/docs/the security-guard test itself |
| `entorno.ts` rejects `NEXT_PUBLIC_*` for app-data vars | ✅ Confirmed | L39-43 |
| DB schema mapping accuracy | ✅ Confirmed | Compared `mapeadores-supabase.ts` field-by-field against `20260710000000_supabase_persistence_short.sql`; matches exactly (no `creado_en`, `fecha_creacion` used correctly, composite FK `(household_id, vehiculo_id)`) |
| Assertion Quality Audit | ✅ Clean | No tautologies, no ghost loops, no ratio-imbalanced mock-heavy tests found across new/modified adapter and domain test files |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| §15.6 credential decision (real seeded `auth.users` + RLS, no `service_role`) | ✅ Yes | Implemented exactly as decided |
| Atomic contract via app coordination (no RPC, since no new migration allowed) | ✅ Yes | Documented risk explicitly in code + apply-progress |
| Dominio agnóstico al `householdId` | ✅ Yes | Confirmed via grep, no `householdId` references in `dominio/` |

## Issues Found

**CRITICAL**: None — both previously-identified CRITICAL issues (bootstrap race, typed errors) are confirmed remediated and tested.

**WARNING**:
- Real `OperacionesBootstrap` implementation against Postgres/Supabase Admin API, plus a DB-level uniqueness guard on `mv_households.nombre`, remains genuinely pending (tasks.md §9, unchecked `[ ]`). This is **not a PR2-completion blocker** (explicitly scoped as follow-up requiring a live Supabase environment and a new migration), but it **is a pre-real-deployment blocker**: without it, concurrent/multi-instance bootstrap runs could silently duplicate a household before the loud-failure detection catches it, and there is still no DB-level backstop.
- `.env.example` could not be created in this session due to a sandbox restriction on writing `.env*` files; variable names are documented in `supabase/migrations/README.md` as mitigation, but a human operator still needs to create the real file before deployment.

**SUGGESTION**: None beyond what's already tracked.

## TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Present in `apply-progress.md` for both the original PR2 apply and the 4R remediation pass |
| All tasks have tests | ✅ | 12 test files touched/created for PR2, plus 6 more touched for remediation |
| RED confirmed | ✅ | Test files exist and RED failures documented per task |
| GREEN confirmed | ✅ | `npm test` → 120/120 passing at time of this verify |
| Triangulation adequate | ✅ | Multiple cases per behavior throughout (household isolation, active/inactive, error codes, case sensitivity) |
| Safety Net for modified files | ✅ | Each remediation fix records a pre-change safety-net run |

**TDD Compliance**: 6/6 checks passed

## Verdict

**PASS WITH WARNINGS**

PR2 (tasks 5–9) is correctly and honestly implemented, including the full remediation of the prior 4-lens adversarial review. All 5 requested remediation items are verified present and tested, not just claimed. 120/120 tests pass, build is green, no PR3 scope creep, no migration touched, no privileged credentials reachable client-side. The only outstanding item is the explicitly-deferred real Postgres/Admin-API bootstrap implementation + DB uniqueness constraint, which is honestly represented as pending in `tasks.md` and does not block closing PR2, but **must** be resolved before any real/multi-instance deployment.
