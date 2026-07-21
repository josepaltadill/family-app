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

## PR 2 — continuation: isolated PostgreSQL integration harness (blocked before edit)

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: openspec
applyState: ready
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
nextRecommended: apply
warnings:
  - PR 2 and PR 3 must activate only in one coordinated deployment window.
  - Remote publication is blocked by native-publication-base-required; no commit, push, PR, or shared-Supabase mutation was performed.
```
Selected work unit: **PR 2 / make the existing loopback-only PostgreSQL integration harness deterministic, then demonstrate preservation of historical UUIDs, rows, and relations**. This is the smallest coherent unchecked integration-evidence slice; runtime consumers, preflight, concurrency, rollback/fix-forward, and shared Supabase remain out of scope.

### Strict TDD safety-net result
The existing focused integration file was executed against the supplied dedicated loopback container/database contract before any edit:

```text
FAMILY_APP_MIGRATION_TEST_DATABASE_URL=<loopback dedicated database> \
  npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts
```

Result: source-contract tests passed (4/5), but the PostgreSQL integration test failed before exercising the migration with `duplicate key value violates unique constraint "users_pkey"` while applying the historical fixture SQL. The supplied dedicated database already contained three `public.mv_*` relations, so the test is not isolated/repeatable as currently written.

Per strict TDD safety-net rules, no test, fixture, migration, or runtime code was edited after that pre-existing focused failure. No task checkbox was completed or changed. The next apply batch must first make this test's isolated database lifecycle deterministic (within the existing loopback-only dedicated-container contract), then repeat RED → GREEN → TRIANGULATE before claiming the PR 2 integration checkbox.

### Verification and workload
- `psql` loopback inspection of the named dedicated test database: current database confirmed; 3 existing `public.mv_*` relations detected.
- Focused PostgreSQL test: 4 passed, 1 failed as described above.
- `npm test` was not run because the strict-TDD safety net failed before implementation.
- No files changed by this batch other than this cumulative progress record; no persisted task checkbox update was warranted.
- PR boundary remains under 400 lines because no code/test work was accepted.

No design deviation. Deferred parent lifecycle actions remain byte-for-byte unchanged: backup/traffic/jobs/consumer confirmation, coordinated PR 2+PR 3 activation, complete post-cut evidence, and post-window monitoring.

---

## PR 2 — continuation: authorized dedicated database reset (blocked on missing Auth fixture)

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
authoritativeOpenSpec: { applyState: ready, nextRecommended: apply }
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
localApplyResult: blocked
warnings:
  - The reset was restricted to the explicitly authorized dedicated loopback database.
  - PR 2 and PR 3 still activate only in one coordinated deployment window.
```

The destructive-operation boundary was verified twice before each reset: Docker container `family-app-modularization-pg16` was running with PostgreSQL bound only to `127.0.0.1:55432`; its `POSTGRES_DB` contract and the PostgreSQL catalog both named exactly `family_app_modularization_test_review_da7a7c22062311e6`. No remote host, shared Supabase, staging, production, or other database was queried or modified. The authorized database was dropped and recreated, then verified to contain zero `public` relations. It was reset a second time after the diagnostic test to leave the dedicated database empty.

### Strict TDD evidence
| Work unit | Safety net / RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|
| Deterministic dedicated PostgreSQL integration setup | Before edits, the existing focused integration test was rerun after the authorized clean reset. Its previous duplicate-key failure was removed, but execution failed earlier while historical fixture SQL referenced the absent `auth` schema: `schema "auth" does not exist`. | Not reached; no code or test was edited. | Not reached. | Not reached. |

Focused command executed with a locally constructed, non-logged loopback URL for the exact authorized database:

```text
FAMILY_APP_MIGRATION_TEST_DATABASE_URL=<127.0.0.1 dedicated URL> \
npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts
```

Observed result: 4 source-contract tests passed; 1 PostgreSQL integration test failed at historical DDL application before migration execution. `npm test` was not run because the focused strict-TDD safety net is not green. Per the corrective-scope guard, the missing `auth` schema is a different fixture/environment defect, so no migration, harness, fixture, runtime, or task checkbox was changed.

### Remaining work and blocker
- [ ] Crear pruebas de integración en `supabase/validation/` o el harness PostgreSQL existente que apliquen DDL histórico en una base efímera y fallen al exigir `fam_hogares`, `fam_miembros_hogar`, `fam_roles_plataforma`, `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo` con los mismos UUIDs, filas y relaciones. <!-- sdd-owner: implementation -->

The next apply batch must resolve the isolated historical Auth-fixture prerequisite without broadening into shared-Supabase or runtime work, then rerun RED → GREEN → TRIANGULATE. `tasks.md` was intentionally unchanged; its PR 2 integration row remains visibly `[ ]`. No design deviation, commit, push, PR, PR activation, or shared-Supabase mutation occurred.

---

## PR 2 — continuation: deterministic isolated PostgreSQL migration evidence

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
authoritativeOpenSpec: { applyState: ready, nextRecommended: apply }
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
localApplyResult: completed-work-unit
warnings:
  - PR 2 and PR 3 still activate only in one coordinated deployment window.
  - The destructive test reset is limited to the authorized dedicated loopback database after URL and connected-catalog validation.
```

Completed the smallest PR 2 integration-evidence slice only. The focused harness now creates the minimal historical Auth fixture (`auth.users` columns consumed by the historical seed plus `auth.uid()` used while creating historical RLS functions), validates the connected database name after connecting, and resets only `public` and `auth` schemas in the already-validated dedicated database. It then applies the historical DDL and fixture unchanged before the atomic migration.

### Completed implementation task and persisted checkbox
- [x] Crear pruebas de integración en `supabase/validation/` o el harness PostgreSQL existente que apliquen DDL histórico en una base efímera y fallen al exigir `fam_hogares`, `fam_miembros_hogar`, `fam_roles_plataforma`, `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo` con los mismos UUIDs, filas y relaciones. <!-- sdd-owner: implementation -->

`tasks.md` was updated immediately and reread. This exact PR 2 integration checkbox is visibly `[x]`; no other implementation or parent-owned checkbox changed.

### TDD Cycle Evidence
| Work unit | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| Minimal isolated Auth prerequisite | Existing focused integration run failed on missing `auth` schema after the authorized empty-database reset. | Adding the fixture path before it existed failed with `ENOENT`; after adding the schema/table it exposed the second historical-DDL requirement, missing `auth.uid()`. | Added only the seed-consumed `auth.users` columns and a stable UUID-returning `auth.uid()`; focused PostgreSQL run passed 5/5. | A second focused run initially failed because the first left schemas behind; the harness now verifies its connected database name and resets only the authorized schemas. Two subsequent focused executions passed 5/5, proving repeatability. Exact vehicle UUID and household-member relationship assertions, plus an exact five-final-table catalog count, passed. | Kept all reset logic inside the focused test harness and the Auth surface minimal; no migration SQL, runtime consumer, shared Supabase, or broad Supabase emulation changed. |

### Files and verification
- `supabase/validation/auth-fixture.sql`: minimal deterministic isolated Auth DDL for the historical migrations and seed.
- `src/compartido/pruebas/migracion-family-app-modularization.test.ts`: loads Auth before historical DDL, fail-closes unless the connected database equals the URL-selected dedicated database, resets only validated test schemas, and verifies five final tables, rows, historical vehicle UUIDs, household-member relationships, rollback, and unrelated `mv_*` objects.
- `openspec/changes/family-app-modularization/tasks.md`: exact integration-evidence row changed to `[x]`.
- `openspec/changes/family-app-modularization/apply-progress.md`: cumulative evidence.
- Before every destructive test reset, Docker/container configuration and PostgreSQL catalog were reverified as `family-app-modularization-pg16`, loopback `127.0.0.1:55432`, and `family_app_modularization_test_review_da7a7c22062311e6`; no other database was modified.
- Focused PostgreSQL test: `npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` — 5/5, run twice after the repeatability change.
- Full suite: `npm test` — 48 files passed, 1 skipped; 363 passed, 16 skipped. The PostgreSQL case was observed, not skipped, in the focused runs.
- `git diff --check` — passed.

### Deviations, workload, and remaining work
No design deviation. The work-unit diff remains below 400 changed lines, including cumulative apply-progress evidence. PR boundary: PR 2 migration SQL and isolated historical preservation evidence; next work must address separate unchecked PR 2 atomicity, preflight, recovery, catalog, and determinism/review work without touching PR 3 consumers.

Exact unchecked PR 2 implementation rows remain:
- [ ] Crear pruebas de atomicidad observable que fallen si un lector/escritor concurrente ve una mezcla de objetos `mv_*`/`fam_*`, si el orden de locks permite deadlock, o si `lock_timeout`/`statement_timeout` deja renombres parciales en lugar de rollback completo. <!-- sdd-owner: implementation -->
- [ ] Crear pruebas de preflight que fallen ante objetos `fam_*` conflictivos, consumidores externos `mv_*` no clasificados, invariantes rotas, backup no recuperable o dependencias de catálogo no inventariadas. <!-- sdd-owner: implementation -->
- [ ] Añadir casos de rollback/fix-forward que documenten el punto de no retorno y comprueben que la recuperación no borra, reasigna ni abre permisos inciertos. <!-- sdd-owner: implementation -->
- [ ] Actualizar dentro de la migración los cuerpos y nombres de funciones, constraints, índices, triggers y policies al prefijo propietario `fam_*`; verificar propietarios, revocaciones y grants existentes sin tratarlos como objetos renombrables, conservando `household_id`/`p_household_id` y sin crear compatibilidad `mv_*`. <!-- sdd-owner: implementation -->
- [ ] Implementar el preflight y la evidencia operativa en los scripts/SQL existentes bajo `supabase/validation/` y `scripts/`, incluyendo backup restaurable, OID/definiciones, conteos, UUIDs, relaciones, RLS, jobs, webhooks y consumidores externos. <!-- sdd-owner: implementation -->
- [ ] Añadir aserciones dentro y después de la migración para rechazar tablas/objetos productivos `mv_*`, exigir las cinco tablas finales, RLS habilitado y dependencias esenciales completas. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la prueba concurrente de corte con una sesión lectora/escritora bloqueada, un escenario de lock contention y un timeout forzado, demostrando que otros consumidores observan solo el contrato anterior completo o el contrato final completo. <!-- sdd-owner: implementation -->
- [ ] Verificar catálogo `pg_class`, `pg_constraint`, `pg_proc`, `pg_trigger`, `pg_policy`, grants y dependencias para distinguir archivos históricos permitidos de referencias productivas activas. <!-- sdd-owner: implementation -->
- [ ] Ensayar la migración en entorno aislado con fallo antes y después del commit, dejando evidencia del procedimiento y de la decisión rollback/fix-forward. <!-- sdd-owner: implementation -->
- [ ] Hacer la migración determinista, explícita y revisable; parametrizar solo valores operativos que dependan del entorno y documentar el punto de no retorno en `docs/general/persistencia-y-migraciones.md` cuando esa documentación se cree en PR 4. <!-- sdd-owner: implementation -->

Deferred lifecycle actions (parent-owned, unchanged): backup/traffic/jobs/consumer confirmation, coordinated PR 2+PR 3 activation, complete post-cut evidence, and post-window monitoring. No commit, push, PR, activation, runtime-consumer change, or shared-Supabase mutation occurred.

---

## Gate correction `review-da7a7c22062311e6`: effective PostgreSQL target guard

### Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
applyState: ready
nextRecommended: parent-lifecycle
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
warnings:
  - The native OpenSpec state remains apply-ready because other PR 2 implementation tasks are unchecked.
  - This completed PR 2B correction must not be treated as completion of the PR 2/PR 3 activation chain.
```

The gate finding was corrected in the PR 2 integration-harness continuation only. The guard no longer trusts `new URL(...).hostname`. It uses the installed `pg-connection-string@2.14.0` `parseIntoClientConfig()` result, validates the effective parsed host and database before constructing `Client`, and constructs `Client` from that validated parsed configuration. It accepts only `127.0.0.1`, `localhost`, or `[::1]` and exactly `family_app_modularization_test_review_da7a7c22062311e6`. It fail-closes before connect/reset on remote query-host override, multi-host, Unix socket, malformed URL, and wrong database values. No reset/query occurs before that validation.

### Completed implementation task and persisted checkbox
The existing PR 2 integration-evidence row remains `[x]` after correction. It was reread in `tasks.md`; no additional implementation row and no parent-owned row changed. The corrected parser-level fail-closed tests and two observed PostgreSQL preservation runs fully support retaining this checkbox.

### TDD Cycle Evidence
| Work unit | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|
| Effective `pg` connection target guard | Added 3 accepted exact-loopback cases plus 6 rejection cases; focused Vitest failed 9/14 because `resolverDestinoDedicado` did not exist. | Implemented the guard with `parseIntoClientConfig`; focused test passed 13/13 with PostgreSQL integration skipped when no URL is supplied. | Two focused executions with the authorized exact loopback URL passed 14/14 each; both exercised reset, historical DDL, rollback, migration, UUID/relationship preservation, and unrelated-object preservation. | Removed the obsolete URL-shape guard from the integration path; `Client` now receives the same validated parser output asserted by tests. |

### Verification
- Focused RED: `npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` — 9 failed, 4 passed, 1 skipped; failure was the absent resolver.
- Focused GREEN/refactor: same command — 13 passed, 1 skipped.
- Authorized observed PostgreSQL evidence (twice): `FAMILY_APP_MIGRATION_TEST_DATABASE_URL=<exact local authorized URL> npx vitest run src/compartido/pruebas/migracion-family-app-modularization.test.ts` — 14/14 each run. The URL was constructed locally and not persisted/logged; Docker binding was `127.0.0.1:55432` and database was exactly `family_app_modularization_test_review_da7a7c22062311e6`.
- `npm test` — 48 files passed, 1 skipped; 372 passed, 16 skipped.
- `git diff --check` — passed.

### Workload / PR boundary
Approved `feature-branch-chain`: `eea99df` remains **PR 2A**. This integration-harness continuation is **PR 2B** and has a prospective delta from `eea99df` of **+264/-10 = 274 changed lines**, including the 17-line untracked `supabase/validation/auth-fixture.sql` and cumulative OpenSpec evidence. It is below 400 lines. This is not a claim that the complete PR 2 chain is a single under-budget PR. No branch, commit, push, PR, runtime consumer, PR 3 work, shared Supabase, staging, production, or activation changed.

### Remaining implementation tasks
- [ ] Crear pruebas de atomicidad observable que fallen si un lector/escritor concurrente ve una mezcla de objetos `mv_*`/`fam_*`, si el orden de locks permite deadlock, o si `lock_timeout`/`statement_timeout` deja renombres parciales en lugar de rollback completo. <!-- sdd-owner: implementation -->
- [ ] Crear pruebas de preflight que fallen ante objetos `fam_*` conflictivos, consumidores externos `mv_*` no clasificados, invariantes rotas, backup no recuperable o dependencias de catálogo no inventariadas. <!-- sdd-owner: implementation -->
- [ ] Añadir casos de rollback/fix-forward que documenten el punto de no retorno y comprueben que la recuperación no borra, reasigna ni abre permisos inciertos. <!-- sdd-owner: implementation -->
- [ ] Actualizar dentro de la migración los cuerpos y nombres de funciones, constraints, índices, triggers y policies al prefijo propietario `fam_*`; verificar propietarios, revocaciones y grants existentes sin tratarlos como objetos renombrables, conservando `household_id`/`p_household_id` y sin crear compatibilidad `mv_*`. <!-- sdd-owner: implementation -->
- [ ] Implementar el preflight y la evidencia operativa en los scripts/SQL existentes bajo `supabase/validation/` y `scripts/`, incluyendo backup restaurable, OID/definiciones, conteos, UUIDs, relaciones, RLS, jobs, webhooks y consumidores externos. <!-- sdd-owner: implementation -->
- [ ] Añadir aserciones dentro y después de la migración para rechazar tablas/objetos productivos `mv_*`, exigir las cinco tablas finales, RLS habilitado y dependencias esenciales completas. <!-- sdd-owner: implementation -->
- [ ] Ejecutar la prueba concurrente de corte con una sesión lectora/escritora bloqueada, un escenario de lock contention y un timeout forzado, demostrando que otros consumidores observan solo el contrato anterior completo o el contrato final completo. <!-- sdd-owner: implementation -->
- [ ] Verificar catálogo `pg_class`, `pg_constraint`, `pg_proc`, `pg_trigger`, `pg_policy`, grants y dependencias para distinguir archivos históricos permitidos de referencias productivas activas. <!-- sdd-owner: implementation -->
- [ ] Ensayar la migración en entorno aislado con fallo antes y después del commit, dejando evidencia del procedimiento y de la decisión rollback/fix-forward. <!-- sdd-owner: implementation -->
- [ ] Hacer la migración determinista, explícita y revisable; parametrizar solo valores operativos que dependan del entorno y documentar el punto de no retorno en `docs/general/persistencia-y-migraciones.md` cuando esa documentación se cree en PR 4. <!-- sdd-owner: implementation -->

Deferred lifecycle actions remain parent-owned and unchanged.

---

## Ordinary-review correction `review-c3213ff3c6afbb4a`

Corrected the two severe preservation-harness findings without changing migration SQL, runtime consumers, PR 3, or shared Supabase:

- Target validation now uses the effective `pg-connection-string` result and requires an exact authorized host, database, and port `55432`; a different loopback port fails before connection/reset. Test vectors use non-secret placeholder credentials and case labels never render URLs.
- The deterministic historical fixture now includes one platform `superadmin` role and one vehicle event. Post-migration assertions require their exact row/UUID values and prove the event still references the expected vehicle and household.
- The post-connect `current_database()` check remains immediately before the schema reset. The exact integration task remains `[x]` after observed preservation evidence.

Strict TDD evidence: wrong-port RED failed because the previous guard accepted `127.0.0.1:55433`. A dedicated PostgreSQL RED without the new historical fixture produced `platform_role_ok=false` and `vehicle_event_relationship_ok=false`. Restoring the minimal fixture produced two consecutive focused GREEN runs, each 15/15.

The target was reverified as container `family-app-modularization-pg16`, binding `127.0.0.1:55432`, and database `family_app_modularization_test_review_da7a7c22062311e6`. Validation used a random ephemeral login and secret that were neither printed nor persisted. The temporary role owned only the dedicated database during each run; membership needed by historical `OWNER TO postgres` statements existed only for the test window. Guaranteed cleanup removed the role, restored database owner `postgres`, preserved the original null database ACL, and recreated the empty `public` schema. Final cleanup proof was `role absent=true`, `owner restored=postgres`, `database ACL=<null>`.

Validation: focused PostgreSQL test 15/15 twice after RED; `npm test` 48 passed/1 skipped with 373 passed/16 skipped; `git diff --check` passed. Correction delta is 65 changed lines relative to the frozen candidate, within the 137-line correction budget.

Remaining warnings: ordinary `npm test` intentionally skips the database-backed case without its dedicated URL; PR 2/PR 3 still require coordinated activation; all other unchecked PR 2 tasks and parent lifecycle gates remain unchanged.

---

## PR2B-v2 — reconstrucción local aprobada y evidencia sincronizada

**Alcance de esta entrada:** sincronización documental posterior al ciclo local aprobado; no se modificaron código, paquetes, CI, índice, rama, commits, reseñas ni servicios, y esta fase no ejecutó pruebas.

- **Rama y procedencia:** `test/family-app-modularization-pr2-integration-v2`; base PR2A `eea99df`; PR2B original `9ffb336` se aplicó con `cherry-pick -n` y produjo inicialmente el árbol idéntico. La adaptación posterior se limitó al harness de migración.
- **Sustitución explícita y limitada:** para la verificación actual, sustituye la referencia operativa a PostgreSQL 16 independiente persistente en `127.0.0.1:55432` por Supabase local completo con PostgreSQL 17 en `127.0.0.1:54322`. No sustituye la evidencia histórica ni las garantías de destino dedicado.
- **Destino y aislamiento:** base exacta `family_app_modularization_test_review_da7a7c22062311e6`; el harness sigue rechazando `postgres` u otra base, host remoto u override por query, puerto incorrecto y socket Unix. La recreación de `public` concede `USAGE, CREATE` al rol administrado `postgres`, requisito de `ALTER FUNCTION ... OWNER TO postgres` histórico.
- **TDD recibido:** RED1 14/15 por contrato anterior de 55432; RED2 14/15 por requisito temporal de `SET ROLE postgres`; RED3 14/15 por `permission denied for schema public`; GREEN 15/15. La evidencia aprobada cubre rollback, preservación de datos, postcondiciones y objetos `mv_*` ajenos.
- **Limpieza aprobada:** se crearon rol y base temporales exactos dentro de Supabase local mediante `supabase_admin`; no se tocaron esquemas del `postgres` principal. El intento parcial de crear el rol se revirtió de inmediato. La limpieza final eliminó ambos recursos y verificó `database=0`, `role=0`, sin residuos.
- **Presupuesto PR2B-v2:** pronóstico antes de esta sincronización `+301/-11 = 312` líneas frente a PR2A; actual final `+315/-11 = 326` con tracked, staged y untracked incluidos, límite `<=400`.
- **Pendiente:** validación/revisión combinada sobre `main` y commit siguen siendo acciones del responsable; ninguna checkbox se marca solo por esta reconstrucción. Las tareas de implementación no completadas y las acciones parent-owned permanecen exactamente como están en `tasks.md`.
