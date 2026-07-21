# Apply progress: family-app-modularization

## Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
applyState: ready
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
nextRecommended: parent-lifecycle
warnings: ["PR 1 REFACTOR complete; PR 2+ and parent lifecycle remain out of scope"]
```
PR 1 / `feature-branch-chain` on `feat/family-app-core-boundary`. This REFACTOR follows the earlier test-compaction correction: it renames already-resolved vehicle context dependencies, updates stale migration-guide paths, and formats request-scope tests without changing behavior, SQL, schema, staging, commit, push, or PR work.

## Completed implementation tasks
- [x] Añadir pruebas de frontera y composición.
- [x] Mover contratos, roles, contexto, proveedor, resolución, adaptadores y bootstrap al núcleo.
- [x] Crear composición server-only y hacer que vehículos consuma contexto resuelto.
- [x] Ejecutar `npm test` y añadir casos que comprueben que URL, formulario, cookie, cabecera o parámetro `household_id` no sustituyen el contexto resuelto por el servidor.
- [x] Verificar mediante búsqueda de imports y tests que el núcleo no depende de vehículos, que el cliente no importa adaptadores y que el runtime ordinario no usa `service_role`.
- [x] Consolidar nombres y paths del contexto ya resuelto, eliminar duplicación de resolución y corregir rutas operativas sin cambiar casos de uso del MVP.

Persisted checkbox updates: all nine PR 1 implementation rows, including REFACTOR, are `[x]`; PR 2–4, definition-of-done, and parent-owned rows remain unchanged.

## TDD Cycle Evidence
| Task | Test file / layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| Household context boundary | `src/compartido/pruebas/fronteras-arquitectura.test.ts` / AST unit | 16/16 focused correction baseline | Correction fixtures were added first; the existing detector already passed them, so no production code was changed | 16/16 focused | Positive fixtures now explicitly use `new URL(request.url).searchParams.get("household_id")` and `new FormData().get("household_id")`; params/searchParams, cookies, headers, explicit parameters, server-context negatives, and production scan remain covered | None needed |
| PR 1 REFACTOR | Vehicle use cases, composition, fixture, request-scope test, and migration README | 32/32 focused and 359/359 full baseline | N/A: behavior-preserving refactor after green baseline | 83/83 focused | Names now describe resolved family context; migration paths point to `nucleo-familiar`; focused formatting is reviewable | No behavior change |

## Files and verification
- `src/compartido/pruebas/fronteras-arquitectura.test.ts`: AST detector's positive URL fixture is `const householdId = new URL(request.url).searchParams.get("household_id")`; its positive form fixture is `const householdId = new FormData().get("household_id")`. Both are detected. Existing params/searchParams, cookies, headers, explicit household parameters, server-resolved `ContextoAplicacion` negatives, and the production `src/**` scan remain unchanged.
- REFACTOR: seven vehicle use cases, their tests/actions, composition, and temporal fixture now use `contextoFamiliar`/`ContextoFamiliarTemporal`; `supabase/migrations/README.md` points at current `src/nucleo-familiar/**` operational paths; request-scope setup formatting is expanded.
- `openspec/changes/family-app-modularization/tasks.md`: all nine PR 1 implementation rows, including REFACTOR, are checked.
- Focused correction: `npx vitest run src/compartido/pruebas/fronteras-arquitectura.test.ts` — 16/16.
- Architecture checks: AST production roots/call sites scan; `src/nucleo-familiar/**` core→vehicles import search; runtime privileged-credential search (only static denylist literals in `seguridad-servidor.ts`).
- Full: `npm test` — 47 files passed, 1 skipped; 359 passed, 15 skipped.
- Build: `npm run build` — passed.
- Diff vs `bd3812a`: +57/-16 = 73 changed lines, within the 100-line unit budget; no production files changed.

Correction `review-a021806727e8808f`: RED 6/22 alias/destructuring fixtures failed; GREEN/TRIANGULATE 24/24 architecture, 61/61 focused architecture/composition/security, and full `npm test` 359 passed/15 skipped; correction delta +25/-9 = 34 changed lines including this proof, with no production changes.

No design deviation. No unchecked PR 1 implementation rows remain; all 9 are visibly `[x]` in `tasks.md`.
All exact unchecked PR 2–4, definition-of-done, and parent lifecycle rows remain in `openspec/changes/family-app-modularization/tasks.md`; they are outside this PR 1 REFACTOR boundary.

---

## PR 2 — SQL migration work unit (in progress)

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: openspec
applyState: ready
nextRecommended: apply
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
warnings:
  - PR 2 and PR 3 must activate only in one coordinated deployment window.
  - This work unit does not update runtime consumers, fixtures, or the shared Supabase instance.
```
PR strategy: `feature-branch-chain`; current boundary: **PR 2 / atomic migration SQL and source-contract RED test**. It is a 261-line work unit including persisted task/progress evidence, below the 400-line review budget. It depends on PR 1 and is followed by PR 2 isolated integration/preflight/concurrency evidence, then PR 3 consumers and RLS. No branch, commit, push, PR, shared-Supabase mutation, or activation occurred.

### Completed implementation task and persisted checkbox
- [x] Añadir `supabase/migrations/<timestamp>_family_app_modularization.sql` con una única transacción, locks en orden fijo, timeouts configurables y renombrado no destructivo de las cinco tablas.

`tasks.md` was updated immediately and reread: that PR 2 row is visibly `[x]`. Parent-owned activation rows were preserved byte-for-byte.

### Files changed
- `src/compartido/pruebas/migracion-family-app-modularization.test.ts`: RED source-contract tests for transaction, fixed locks, the five names, fail-closed catalog checks, no destructive commands, and no compatibility alias/view.
- `supabase/migrations/20260713000000_family_app_modularization.sql`: one transaction with local timeouts, fixed-order `ACCESS EXCLUSIVE` locks, source/final catalog preconditions, five non-destructive table renames, rewritten and renamed security-definer functions, dependency-name loops, and final RLS/catalog assertions.
- `openspec/changes/family-app-modularization/tasks.md`: one completed PR 2 checkbox.
- `openspec/changes/family-app-modularization/apply-progress.md`: this cumulative evidence.

### TDD Cycle Evidence
| Task | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|
| Atomic migration SQL | `npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` failed 3/3 because the versioned migration did not exist. | Added the migration; focused test passed 3/3. | Applied historical DDL plus the new migration only to a temporary local Supabase workspace, then stopped and removed it. PostgreSQL reported the five final tables and `mv_objects=0` from `pg_class`. `npm test` passed 48 files, skipped 1; 362 passed, 15 skipped. | Kept the cut in one SQL file and used catalog-driven renames for owner-specific constraints, indexes, policies, and triggers; no production consumer or validation harness changes were mixed in. |

### Verification
- `npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` — RED: 3 failed (migration absent); GREEN: 3 passed.
- Temporary isolated local Supabase instance: applied all three historical migrations plus `20260713000000_family_app_modularization.sql`; final catalog output: `fam_hogares,fam_miembros_hogar,fam_roles_plataforma,fam_ve_eventos_vehiculo,fam_ve_vehiculos`; `mv_objects=0`. The temporary workspace was stopped and deleted.
- `npm test` — 48 files passed, 1 skipped; 362 passed, 15 skipped.
- `git diff --check` — passed.

### Deviations and remaining work
No design deviation. The RED test is an executable source contract, not yet the required full PostgreSQL integration harness; therefore the integration/preflight/concurrency/rollback tasks remain unchecked. PR 3 runtime consumers intentionally still target `mv_*` and were not touched.

Exact unchecked PR 2 implementation rows:
- [ ] Crear pruebas de integración en `supabase/validation/` o el harness PostgreSQL existente que apliquen DDL histórico en una base efímera y fallen al exigir `fam_hogares`, `fam_miembros_hogar`, `fam_roles_plataforma`, `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo` con los mismos UUIDs, filas y relaciones. <!-- sdd-owner: implementation -->
- [ ] Crear pruebas de atomicidad observable que fallen si un lector/escritor concurrente ve una mezcla de objetos `mv_*`/`fam_*`, si el orden de locks permite deadlock, o si `lock_timeout`/`statement_timeout` deja renombres parciales en lugar de rollback completo. <!-- sdd-owner: implementation -->
- [ ] Crear pruebas de preflight que fallen ante objetos `fam_*` conflictivos, consumidores externos `mv_*` no clasificados, invariantes rotas, backup no recuperable o dependencias de catálogo no inventariadas. <!-- sdd-owner: implementation -->
- [ ] Añadir casos de rollback/fix-forward que documenten el punto de no retorno y comprueben que la recuperación no borra, reasigna ni abre permisos inciertos. <!-- sdd-owner: implementation -->
- [ ] Actualizar dentro de la migración los cuerpos y nombres de funciones, constraints, índices, triggers y policies al prefijo propietario `fam_*`; verificar propietarios, revocaciones y grants existentes sin tratarlos como objetos renombrables, conservando `household_id`/`p_household_id` y sin crear compatibilidad `mv_*`. <!-- sdd-owner: implementation -->
- [ ] Implementar el preflight y la evidencia operativa en los scripts/SQL existentes bajo `supabase/validation/` y `scripts/`, incluyendo backup restaurable, OID/definiciones, conteos, UUIDs, relaciones, RLS, jobs, webhooks y consumidores externos. <!-- sdd-owner: implementation -->
- [ ] Añadir aserciones dentro y después de la migración para rechazar tablas/objetos productivos `mv_*`, exigir las cinco tablas finales, RLS habilitado y dependencias esenciales completas. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `npm test` y la validación PostgreSQL sobre datos vacíos, datos existentes con histórico y datos inesperados válidos; comparar filas, UUIDs, relaciones, unicidad de matrícula por hogar incluidos inactivos y eventos no huérfanos. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la prueba concurrente de corte con una sesión lectora/escritora bloqueada, un escenario de lock contention y un timeout forzado, demostrando que otros consumidores observan solo el contrato anterior completo o el contrato final completo. <!-- sdd-owner: implementation -->
- [ ] Verificar catálogo `pg_class`, `pg_constraint`, `pg_proc`, `pg_trigger`, `pg_policy`, grants y dependencias para distinguir archivos históricos permitidos de referencias productivas activas. <!-- sdd-owner: implementation -->
- [ ] Ensayar la migración en entorno aislado con fallo antes y después del commit, dejando evidencia del procedimiento y de la decisión rollback/fix-forward. <!-- sdd-owner: implementation -->
- [ ] Hacer la migración determinista, explícita y revisable; parametrizar solo valores operativos que dependan del entorno y documentar el punto de no retorno en `docs/general/persistencia-y-migraciones.md` cuando esa documentación se cree en PR 4. <!-- sdd-owner: implementation -->

Deferred lifecycle actions: confirm backup/traffic/jobs/consumers/lock limits; activate PR 2+PR 3 together; execute complete post-cut evidence; monitor the deployment window. These are parent-owned and unchanged.

---

## PR 2 — continuation: precise `mv_` catalog-prefix guard

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: openspec
applyState: ready
nextRecommended: apply
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
warnings:
  - PR 2 and PR 3 activate only in one coordinated deployment window.
  - This is a source-contract improvement, not PostgreSQL integration evidence.
```
PR strategy: `feature-branch-chain`; boundary: **PR 2 / precise catalog prefix matching**. This continuation preserves the independently verified migration work unit and uses 262 changed lines before this progress evidence, below the 400-line PR budget.

### Completed implementation tasks and persisted checkboxes
No additional task checkbox was completed: this strengthens the completed migration work unit but does not satisfy an unchecked integration, atomicity, preflight, recovery, or catalog-validation criterion. `tasks.md` remains unchanged; its completed migration row remains visibly `[x]` and all other PR 2 rows remain `[ ]`.

### TDD Cycle Evidence
| Work unit | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|
| Precise `mv_` catalog-prefix guard | Changed the source-contract expectation to require `c.relname ~ '^mv_'`; focused Vitest failed 1/3 because the migration used SQL `LIKE 'mv_%'`, where `_` is a wildcard. | Replaced all five owner-object checks with the anchored PostgreSQL regex; focused test passed 3/3. | `npm test` passed 48 files; 362 passed, 15 skipped. The test now fails if the final catalog check reverts to the wildcard form. | Kept the change local to the migration and its source-contract test; no runtime consumers, shared Supabase, aliases/views, or destructive operations changed. |

### Verification and deviations
- `npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` — RED: 1 failed, 2 passed; GREEN: 3 passed.
- `npm test` — 48 files passed, 1 skipped; 362 passed, 15 skipped.
- `git diff --check` — passed.

No design deviation. The `LIKE 'mv_%'` pattern treated `_` as a single-character wildcard, so it could match unrelated `mvX...` names on a shared instance. The anchored regex matches only the literal `mv_` prefix. This remains source-contract evidence; it is not represented as PostgreSQL integration or preflight evidence.

Workload / PR boundary: PR 2 remains below the 400-line budget. Start: verified migration and source-contract test. End: all migration catalog owner-prefix filters use `~ '^mv_'`. Follow-up: the existing unchecked PR 2 integration/preflight/concurrency/recovery work, then PR 3 consumers/RLS. Out of scope: PR 3 runtime consumers and all PR 4 documentation.

---

## Correction `review-da7a7c22062311e6`

- `RELIABILITY-001`: index, policy, and trigger loops now filter through exactly the five renamed owner tables; the final `mv_*` assertion is limited to those owner prefixes, so unrelated public canaries remain untouched.
- `RELIABILITY-002`: the existing migration Vitest embeds executable PostgreSQL evidence for historical DDL, fixed UUID rows/relationships, forced postcondition rollback, a successful cut, and untouched unrelated table/index/policy/trigger names. Execution requires `FAMILY_APP_MIGRATION_TEST_DATABASE_URL` to name a dedicated `family_app_modularization_test_*` database on loopback.
- `RELIABILITY-003`: the RLS postcondition requires `public`, ordinary tables, all five exact target names, and count five.

Strict TDD evidence: after removal of the out-of-scope harness, focused RED failed 1/5 on its stale file dependency; focused GREEN passed 4 with the PostgreSQL case honestly skipped because no isolated URL was supplied. PostgreSQL execution remains for the parent targeted isolated validator and is not represented as observed here. No task checkbox changed because broader PR 2 tasks remain incomplete.

---

## PR 3 — consumer/validation forecast (size exception authorized)

**Maintainer decision:** explicit `size:exception` authorized for the coherent active-contract PR 3 cut. Hard ceiling: **500 authored changed lines total**, including tests, fixtures, tasks, and progress evidence. Product scope remains unchanged; stop before crossing the ceiling.

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
applyState: ready
nextRecommended: apply
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
localApplyResult: blocked
warnings:
  - PR 2 and PR 3 activate only in one coordinated deployment window.
  - PR #30 remains intentionally red alone; main's unrelated 02aa1f9 baseline fix was not merged or rebased.
```

Created the requested local branch `feat/family-app-modularization-pr3-consumers` from exact head `9ffb3362c3e59766171e22043eacd23c14f1013a`. No commit, push, PR, merge, rebase, shared Supabase mutation, production activation, tests, or code/test/fixture edit occurred.

### Workload gate

The smallest *complete active-contract* PR 3 cut cannot stay within the 400 changed-line budget. It must change the runtime/core adapters and their focused tests (at least 31 direct active `mv_*` references), plus the live RLS harness path: `supabase/validation/assertions.sql` has 83 active table references, and the harness/fixtures must apply the final migration and use final names. Even before task/progress evidence, the conservative replacement forecast is **at least 452 authored changed lines**: 112 active runtime/validation lines require delete+add accounting (224), focused runtime-test expectations add at least 62, and 83 RLS assertion replacements add 166. Historical migration tests and historical migration files are deliberately excluded.

Splitting runtime/bootstrap from RLS fixtures would leave the active validation harness executing historical DDL then querying removed `mv_*` tables at the combined schema+consumer head, violating the requested coherent green consumer/test cut. Therefore strict TDD has not begun: writing a partial RED slice would knowingly produce a non-green active contract.

### Completed coherent active-contract cut

Active server consumers now use `fam_miembros_hogar`, `fam_hogares`, `fam_ve_vehiculos`, and `fam_ve_eventos_vehiculo`. The RLS harness applies the three historical migrations followed by `20260713000000_family_app_modularization.sql`; its fixtures, assertions, concurrent last-admin sessions, and final-admin verification use the final tables. Historical migration files/tests retain legitimate `mv_*` references.

Completed persisted tasks: PR 3 RED table expectations; GREEN identity membership consumer; GREEN vehicle repositories/mappers; GREEN bootstrap/preflight operations; GREEN fixtures/cleanup/smoke/RLS harness. `tasks.md` was updated immediately and reread: these five rows are visibly `[x]`; parent-owned rows were untouched.

### TDD Cycle Evidence

| Phase | Evidence |
|---|---|
| RED | Changed focused expectations first; 11/110 failed because consumers still selected `mv_*` and the RLS harness did not require/apply the final migration. |
| GREEN | Updated only active consumers, validation assets, and their expectations; focused suite passed 110/110. |
| TRIANGULATE | `npm test`: 48 files, 373 passed, 16 skipped. `npx tsc --noEmit` failed on unchanged `src/compartido/pruebas/alcance-familiar-por-solicitud.test.ts:14` incompatible type assertion. Isolated RLS preflight passed, but `supabase start` exceeded 600 seconds; its label-identified local runtime was stopped. |
| REFACTOR | Historical migration names remain only for immutable migration-file references; `household_id`, `p_household_id`, and `householdId` remain unchanged; no alias/view or product behavior added. |

### Workload and remaining work

Current diff: **213 additions / 166 deletions = 379 authored changed lines**, within the authorized 500-line exception. `git diff --check` passed; `tsconfig.tsbuildinfo` was restored. No commit, push, PR, merge, rebase, activation, or shared Supabase mutation occurred.

Exact remaining PR 3 implementation rows:
- [ ] Añadir pruebas de integración de repositorios para matrícula única por hogar incluyendo inactivos, FK compuesta, eventos cruzados, kilometraje, baja lógica, coste, año, fechas, estados, valores negativos/límite y vencimientos usando `fam_ve_*` con reloj/zonahoraria inyectados. <!-- sdd-owner: implementation -->
- [ ] Ejecutar `npm test` y la matriz RLS para anónimo, no miembro, `editor`, `admin`, rol de plataforma, acceso cruzado y operaciones de vehículos; incluir prueba concurrente del último administrador. <!-- sdd-owner: implementation -->
- [ ] Verificar bootstrap repetido, identidad ambigua, membresía duplicada, cero/múltiples membresías, UUID inválido y que ningún runtime ordinario obtiene credenciales `service_role`. <!-- sdd-owner: implementation -->
- [ ] Ejecutar smoke end-to-end de alta, listado, desactivación, eventos, costes, kilometraje y vencimientos; comprobar que los datos históricos permanecen accesibles. <!-- sdd-owner: implementation -->
- [ ] Ejecutar búsqueda final en código, configuración activa, scripts, validaciones y catálogo para demostrar que no quedan referencias productivas finales a `mv_*`. <!-- sdd-owner: implementation -->
- [ ] Eliminar duplicaciones y adaptar nombres de módulo/núcleo sin traducir masivamente `household_id`/`householdId` ni introducir dependencias de vehículos en el núcleo. <!-- sdd-owner: implementation -->

---

## PR 3 — bootstrap/security triangulation batch

Forecast before edits: 2 task-checkbox lines plus at most 30 progress lines; safely below the 108-line remaining exception capacity. Actual implementation delta is the persisted checkbox and this cumulative evidence only.

Focused strict-TDD verification (no new production behavior was required): `npx vitest run` over bootstrap CLI/plan/preflight/server, identity provider, and server-security suites passed **43/43**. It covers idempotent bootstrap, conflict/duplicate planning, zero/multiple memberships, invalid UUID input, and the production scan for privileged-key patterns. The matching PR 3 TRIANGULATE row is now visibly `[x]` in `tasks.md`.

RLS startup diagnosis was read-only: `supabase/validation/config.toml` uses deprecated `[inbucket]`; CLI 2.109.1 warned about it, but no retained startup log exists after authorized cleanup, so it is not proven to be the timeout cause. No blind retry was performed. No `mv-rls-validation-*` container remains; the dedicated loopback PostgreSQL container was untouched. The RLS-matrix and smoke rows remain unchecked.

---

## PR 3 — bounded evidence follow-up

Forecast before edits: progress evidence only (under 30 lines), preserving the 500-line ceiling. Read-only diagnosis confirms the available PostgreSQL 17 image and `supabase start` supports `--ignore-health-check`, but that flag would bypass the readiness gate required for RLS evidence; without the deleted startup log it cannot establish a safe corrective retry. No runtime was created.

Focused smoke-layer coverage passed **52/52** across vehicle actions, vehicle use cases, expiry domain behavior, and final-table repositories. It covers create/list/deactivate, events/cost, kilometre updates, expiry, and historical event handling, but is not a real isolated database end-to-end smoke; the E2E checkbox remains unchecked. Classified `mv_*` search found only allowed immutable historical migration references/source-contract evidence and the historical migration filenames consumed by the active harness; no active runtime, fixture, assertion, or concurrency SQL references remain. The catalog-dependent final-search checkbox remains unchecked until an isolated final-schema catalog run succeeds.

No task checkbox changed. `git diff --check` passed; no generated file or isolated Docker resource was created. Deferred lifecycle actions remain parent-owned and unchanged.

---

## PR 3 — RLS evidence and disposable cleanup correction

Forecast before edits: one script line, three focused test expectations, two checkboxes, and concise progress evidence; below the remaining 88-line exception capacity. RED: after changing the expectations, `validate-supabase-rls.test.ts` failed 3/21 because cleanup still invoked `supabase stop --workdir`. GREEN: cleanup now invokes `supabase stop --no-backup --workdir "$workspace"` only after all existing ownership/safe-cleanup guards; focused test passed 21/21 and `npm test` passed 48 files, 373 tests, 16 skipped. The existing fail-closed cleanup test continues to require that a stop failure preserves the workspace.

Authorized diagnostic: `timeout --kill-after=30s 240s bash scripts/validate-supabase-rls.sh` exited 0 in ~31.2s for isolated project `mv-rls-validation-1784461751-5831`. Its log reports successful migration/fixture/RLS matrix, `schema.tables|5-rls-tables|5|PASS`, anonymous/non-member/editor/admin/platform-role/cross-household/vehicle cases, last-admin concurrency, and `SUMMARY|status=PASS|passed=3|failed=0|blocked=0|concurrency=passed`. This supersedes the transient prior timeout; it does not identify a configuration defect.

The RLS matrix and final productive-`mv_*` search rows are now visibly `[x]`: classified source hits are immutable historical migration/source-contract evidence or required historical filenames; successful final-schema migration/catalog assertions plus the five final RLS tables prove no active final `mv_*` owner objects. Diagnostic logs are `/tmp/pr3-rls-diagnostic-43425.log`, `.docker-status.log`, and `.docker-events.log`.

Cleanup proof: the exact project containers, network, and workspace were removed; the dedicated `127.0.0.1:55432` PostgreSQL was untouched. Post-check found one stopped-volume remnant, `supabase_storage_mv-rls-validation-1784461751-5831` (label `mv-rls-validation-1784461751-5831`); destructive removal requires parent authorization and was not performed. Smoke/database E2E, repository-integration, and refactor rows remain unchecked. No commit, push, PR, merge, rebase, activation, or shared database mutation occurred.

---

## PR 3 — final bounded coverage mapping

Forecast before edits: no code or checkbox edit; at most 20 progress lines, remaining below the 64-line ceiling. Focused final-contract coverage passed **66/66** across vehicle/event repositories, use cases, and vehicle/event/expiry domain tests. It proves inactive-plate uniqueness, composite FK/cross-event database constraints through the successful isolated RLS run, mileage/soft-delete/cost/year/date/state/negative validation, historical events, and injected clock values.

The exhaustive repository-integration row remains unchecked: the evidence combines adapter fakes, domain/in-memory tests, and RLS SQL—not one repository integration suite covering every listed criterion with an injected timezone. The database E2E smoke row remains unchecked because no isolated run exercises create/list/deactivate/events/cost/mileage/expiry/history as an end-to-end application flow. Refactor inspection found no safe bounded change needed; the row remains unchecked rather than claiming a no-op refactor. These gaps require the smallest PR 3B boundary: **isolated repository integration plus database E2E smoke evidence**, likely exceeding this PR's remaining budget.

The parent-authorized volume cleanup is now verified: no matching containers, networks, volumes, or workspace remain. No task checkbox changed in this mapping batch.

---

## PR 3A / PR 3B delivery boundary

The maintainer authorized splitting the remaining evidence work rather than increasing the 500-line exception again. PR 3A freezes the coherent consumer/bootstrap/RLS contract and its verified cleanup behavior. PR 3B will start from PR 3A and contain only the unchecked exhaustive repository integration, isolated database E2E smoke, and any evidence-driven bounded refactor. Neither slice activates independently; combined-head validation must overlay current `origin/main` without rewriting PR 2 receipts.

Combined-head validation over `origin/main@02aa1f9` plus PR 2A `eea99df`, PR 2B `9ffb336`, and the exact PR 3A overlay passed `npx tsc --noEmit`, focused Vitest (**115 passed, 11 skipped**) and `npm test` (**48 files passed, 1 skipped; 373 passed, 16 skipped**). The combined tree was `d09b9009090ddff5769ed141c158e30383fc5214`; frozen PR 2 blobs and the main-only family-context fix remained unchanged.

The verifier initially ran `tsc` in the source worktree and modified only tracked `tsconfig.tsbuildinfo`. The parent restored that generated artifact; branch, HEAD, index and authored diff remained unchanged, and the source overlay hash returned to `c3deb325c73a09b7f1bf221b72000d799f31e2cc4971ff9f9f4d274eb4f939b3`. No Docker or database resource was touched during combined-head verification.
