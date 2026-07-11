# Apply progress — PR/cut 1 remediation

## Status

**BLOCKED.** Cut 1 remains non-zero and does not authorize deployment. WU-5 sequential matrix now passes in local/ephemeral Supabase; the remaining blocker is WU-7/WU-8 concurrency. Supabase CLI 2.109.1 and Docker are available; the harness was adjusted for the CLI's wildcard local bindings, secret-bearing start output, and explicit PostgreSQL identity.

## Implemented

- Fail-closed rejection of Docker routing/TLS environment variables before tool invocation.
- Active Docker context endpoint verification; only a local Unix socket is accepted before `supabase start`.
- Database-container discovery filtered by project ownership plus DB service label/name, with ambiguity blocked.
- Cleanup preserves the workspace and reports `BLOCKED` when scoped `supabase stop --workdir` fails.
- RLS `WITH CHECK` denials for insert/cross-household update now expect SQLSTATE `42501`; row counts remain for `USING` visibility cases.
- Deterministic fake-tool tests prove Docker routing guards do not run `supabase start`, `docker exec`, or `supabase stop`.
- Fake-tool coverage now also blocks an unavailable Docker daemon after Supabase/version checks, and zero, multiple, or ownership-ambiguous DB candidates before SQL or cleanup mutation.
- Cleanup stop failure preserves the workspace for inspection; failed or ownership-blocked cleanup forces non-zero exit if a future completed main validation would otherwise return zero.
- WU-6 and the PR 1 boundary now describe the sequential matrix as complete while retaining WU-7/WU-8 concurrency as the deployment blocker.
- `supabase start` stdout/stderr is captured in a mode-600 workspace log and is never replayed; `supabase status` is not invoked.
- CLI 2.109.1 wildcard host bindings (`0.0.0.0`/`[::]`) are accepted with an explicit warning only after proving a local Unix Docker endpoint and exact ephemeral-project container ownership. Remote endpoints, external routing inputs, wrong ownership, and ambiguous DB candidates still block.
- Every in-container `psql` invocation now explicitly selects `-U postgres -d postgres`, including both guard identity queries and the migration, fixture, and assertion execution paths. Deterministic fake-Docker coverage verifies all five invocations and preserves secret-capture and cleanup assertions.

## Sequential matrix actually covered

WU-5 is complete. The local/ephemeral runtime matrix covers anon denial; non-member visibility and vehicle denial; editor A vehicle/event visibility and allowed/denied mutations; admin A household, membership, vehicle and event operations; admin B mirror/isolation; membership policies; cross-household `using`/`with check`; FK and check constraints; duplicate plate semantics; last-admin delete/demote/move rejection; allowed changes when a second admin remains; privileged post-negative state checks; and explicit household deletion cascade for members, vehicles and events.

## Validation evidence

| Check | Result |
|---|---|
| Strict TDD RED | PASS — the explicit DB identity assertion failed before implementation because the two guard `psql` invocations omitted `-U postgres -d postgres`. |
| Strict TDD GREEN | PASS — all five fake-Docker `psql` invocations explicitly contain `-U postgres -d postgres`; 7 files, 55 tests pass. |
| `npm test` | PASS — 7 files, 55 tests. |
| `bash -n scripts/validate-supabase-rls.sh` | PASS. |
| `git diff --check` | PASS after the final implementation and progress-note updates. |
| `./scripts/validate-supabase-rls.sh` | PASS/BLOCKED as designed for cut 1: preflight passed, local ephemeral Supabase started with secret output captured, ownership guard passed, migration and fixtures applied, full WU-5 sequential matrix passed, cleanup stopped the owned runtime and removed its workspace; final exit remained `1` because `concurrency=pending`. |

## Residual blockers

- `BLOCKED: concurrency pending` — WU-7/WU-8 are not part of cut 1.
- The explicit PostgreSQL identity fix was exercised against a real local container: guard identity queries passed and SQL execution reached migration, fixtures, and assertions.
- Runtime cleanup succeeded for the final run: the owned ephemeral Supabase project was stopped and no `mv-rls-validation` containers remained active.

Earlier generated runtimes that reached container startup were manually stopped through proven workdirs when ownership could be established. No MCP, remote target, shared Supabase, or product migration mutation occurred.

## WU-5 continuation and cascade schema fix

The remaining sequential cases were added under strict TDD, including admin B isolation, event and membership policy operations, remaining check constraints, last-admin demote/transfer and allowed-second-admin paths, privileged post-negative state checks, and explicit household-delete cascade verification. The harness also now propagates a failed migration/fixture/assertion `psql` step instead of incorrectly reporting a sequential-matrix pass.

The first local/ephemeral continuation run exposed a **product migration defect**: `mv_vehiculos.household_id` referenced `mv_households(id)` without `ON DELETE CASCADE`, so explicit household deletion failed with SQLSTATE `23503`. The product migration was then updated so household deletion cascades to vehicles and events. The cascade assertion now deletes the household as authenticated `admin_b`, then resets to privileged inspection for postconditions, proving the externally visible RLS contract as well as FK mechanics.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| WU-5 sequential matrix | `src/compartido/pruebas/validate-supabase-rls.test.ts` + ephemeral Supabase | Unit + runtime integration | PASS — 16 focused tests | PASS — case-contract test failed for missing admin-B/event/membership/integrity/last-admin/cascade IDs | PASS — 17 focused tests after SQL matrix additions | PASS — runtime exercised each added case; discovered cascade failure, then passed after schema fix | Cascade assertion changed to execute household deletion as authenticated `admin_b` |
| Harness SQL failure propagation | `src/compartido/pruebas/validate-supabase-rls.test.ts` | Unit + runtime integration | PASS — 17 focused tests | PASS — harness contract test failed because `run_sql` failures did not return from the sequential phase | PASS — 18 focused tests after explicit returns | PASS — real assertion failure surfaced as `FAIL|sql|sql`, not a false matrix pass | None — stopped on schema defect |

### Continuation validation evidence

| Check | Result |
|---|---|
| Focused `npm test -- src/compartido/pruebas/validate-supabase-rls.test.ts` | PASS — 18 tests after GREEN. |
| `bash -n scripts/validate-supabase-rls.sh` | PASS. |
| `git diff --check` | PASS before the final runtime run. |
| `./scripts/validate-supabase-rls.sh` | PASS/BLOCKED as intended after schema fix: all WU-5 RLS/integrity/last-admin/cascade cases passed, cleanup stopped the owned runtime and no `mv-rls-validation` containers remained. Exit `1` only because concurrency remains pending. |

### Remaining work

- [x] WU-7/WU-8 concurrency and final runtime gate completed in cut 2; their persisted checkboxes are marked in `tasks.md`.

## Cut 2 — last-admin concurrency and final gate

### Status

**PASS.** The harness now exits `0` only after the sequential matrix, two real concurrent last-admin sessions, privileged final-admin verification, and safe cleanup all pass. This validates only the owned local/ephemeral runtime; it does not authorize a real Supabase application.

### Implemented

- Added `supabase/validation/concurrency/setup.sql` plus separate `session-a.sql` and `session-b.sql` files. Both sessions reach a database barrier, then delete different authenticated admins from household A.
- Added bounded `timeout --kill-after=5s 20s docker exec ... psql` processes, independent stdout/stderr capture, exit-code checks, stable `CASE` evidence, and a final privileged assertion that exactly one admin remains.
- Cleanup now refuses to stop the runtime while concurrent session processes are still live.
- Replaced the cut-1 pending-concurrency exit with a PASS gate and documented the full local runtime requirement.
- Updated deterministic shell contracts for the concurrency files, timeout invocation, and full-gate state.

### Persisted task updates

- WU-7: all five concurrency tasks marked `- [x]` in `tasks.md`.
- WU-8: all six final-gate/documentation/triangulation tasks marked `- [x]` in `tasks.md`.

### TDD Cycle Evidence

| Task | Test file | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| WU-7/WU-8 concurrency gate | `src/compartido/pruebas/validate-supabase-rls.test.ts` + local ephemeral Supabase | PASS — focused test failed because `session-a.sql`/`session-b.sql` did not exist | PASS — focused suite: 19 tests; shell syntax passed | PASS — two clean runtime executions passed: both sessions emitted PASS evidence, exactly one admin remained, cleanup succeeded, and exit was 0 | No refactor required; the separate SQL sessions retain clear process boundaries |

### Validation evidence

| Check | Result |
|---|---|
| Focused `npm test -- src/compartido/pruebas/validate-supabase-rls.test.ts` | PASS — 19 tests. |
| `bash -n scripts/validate-supabase-rls.sh` | PASS. |
| `./scripts/validate-supabase-rls.sh` (two clean runs) | PASS — Supabase CLI 2.109.1, Docker 29.3.1; sequential matrix, concurrent sessions, final one-admin assertion, and cleanup passed; exit 0. |
| `npm test` | PASS — 7 files, 58 tests. |
| `git diff --check` | PASS. |
| Migration functional diff | PASS — no diff for `supabase/migrations/20260710000000_supabase_persistence_short.sql`. |

### Workload / PR boundary

- PR 2 only: concurrency files, harness final gate, deterministic test contract, runtime guide, and SDD evidence. Current code/documentation diff is 88 insertions and 28 deletions plus the new concurrency files, below the 400-line review budget.
- No commit, push, PR, or review transaction was created.

### Remaining work

The following persisted closure criteria remain unchecked and belong to verification/closure, not this implementation cut:

- [ ] `git diff` confirma que la migración funcional no fue modificada y no se añadieron adaptador TypeScript, UI, MCP, credenciales o seeds permanentes.
- [ ] Cada work unit tiene evidencia de inicio, finalización, verificación y rollback.
- [ ] La ejecución nunca muta antes del preflight y la guarda de destino.
- [ ] PR 1 no se considera autorización de despliegue; PR 2 debe pasar concurrencia antes de código cero.
- [ ] Cualquier defecto de esquema descubierto abre una decisión/cambio separado; no se corrige silenciosamente en este harness.

### Structured status consumed

- Authoritative native status: `changeName=supabase-rls-runtime-validation`, `artifactStore=openspec`, `dependencies.apply=ready`, `nextRecommended=apply`.
- `actionContext.allowedEditRoots=/home/josep/proyectos/manteniment-vehicles`; all edits stayed inside it. No action-context warnings.
