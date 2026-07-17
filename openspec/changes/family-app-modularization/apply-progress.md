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
