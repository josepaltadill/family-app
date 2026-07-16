# Apply progress: family-app-modularization

## Status and delivery boundary
```yaml
schemaName: gentle-ai.sdd-status
changeName: family-app-modularization
artifactStore: both
applyState: ready
actionContext: { mode: repo-local, workspaceRoot: /home/josep/proyectos/family-app, allowedEditRoots: [/home/josep/proyectos/family-app] }
nextRecommended: verify
warnings: ["Corrective GREEN rerun: vehicle scope boundary and bootstrap allowlist repaired"]
```
PR 1 / `feature-branch-chain`, GREEN child from `c7bce21`; staged only. No commit, push, SQL, schema, or documentation work.

## Completed implementation tasks
- [x] Añadir pruebas de frontera y composición.
- [x] Mover contratos, roles, contexto, proveedor, resolución, adaptadores y bootstrap al núcleo.
- [x] Crear composición server-only y hacer que vehículos consuma contexto resuelto.

The persisted GREEN boxes remain checked: vehicle cases now take synchronous `ContextoAplicacion` values and never import/call `ProveedorIdentidad`, `resolverAcceso`, or `obtenerContexto`. TRIANGULATE and REFACTOR remain unchecked; parent lifecycle rows are unchanged.

## TDD Cycle Evidence
| Task | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| PR 1 corrective GREEN | 10/10 focused baseline | boundary guard failed on 9 vehicle files | focused 39/39; full suite green | existing denial/context cases | compacted guards without behavioral change |

## Files and verification
- Vehicle composition injects the immutable request context; use cases consume it synchronously. The AST guard rejects identity/resolver contracts from every vehicle path, including `alcance-familiar` imports.
- Bootstrap allowlist and fixtures point only to `src/nucleo-familiar/adaptadores/supabase/operaciones-bootstrap-postgres.ts`.
- Focused: `npx vitest run src/compartido/pruebas/fronteras-arquitectura.test.ts src/compartido/pruebas/alcance-familiar-por-solicitud.test.ts src/modulos/vehiculos/interfaz/composicion/dependencias-servidor.test.ts src/modulos/vehiculos/adaptadores/supabase/seguridad-servidor.test.ts` — 39/39.
- Full: `npm test` — 47 files passed, 1 skipped; 337 passed, 15 skipped.
- Rename-aware staged diff vs `c7bce21`: `+242/-133 = 375`; prior incorrect `+309/-86 = 395` is superseded.

No design deviation. Remaining implementation rows are exact unchecked TRIANGULATE/REFACTOR and later PR 2–4 rows in `tasks.md`. Next: parent lifecycle / verify.
