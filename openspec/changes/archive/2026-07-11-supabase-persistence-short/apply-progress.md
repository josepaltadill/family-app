# Apply progress — supabase-persistence-short

## Estado

- Cambio aplicado en archivos; `tasks.md` distingue el corte estático completado del bloqueo pendiente para despliegue real.
- Remediación focalizada: invariante PostgreSQL para conservar el último admin, aclaración del límite grants/RLS/server-only y prueba runtime local/efímera convertida en bloqueo de despliegue.
- Remediación pre-commit adicional: recuperación post-aplicación preservando datos, guardia de salud de release, trazabilidad normativa y excepción explícita al presupuesto de 400 líneas.
- Remediación final R2/R4: unicidad de matrícula cerrada como decisión por hogar y monitorización operable con fuentes self-hosted, controles reproducibles, destino de avisos y propietarios de escalado.
- No se ejecutó ninguna conexión, migración ni mutación contra Supabase real.

## Trabajo completado

- Actualizada `20260710000000_supabase_persistence_short.sql` con `mv_preservar_admin_hogar()` endurecida y triggers `mv_*` de actualización/borrado. La función serializa por hogar y rechaza eliminar, degradar o trasladar al último admin; no bloquea el cascade derivado de borrar el propio hogar.
- Actualizado el guardarraíl para explicar que los grants a `authenticated` habilitan el enforcement de RLS, no el acceso directo de producto/navegador; las invariantes críticas viven en PostgreSQL y el acceso sigue siendo server-only hasta decidir el adaptador.
- Actualizado `validation-checklist.md` para convertir las pruebas RLS runtime locales/efímeras en bloqueo explícito antes de cualquier aplicación real.
- Alineadas la especificación normativa y su compañero legible con la invariante del último admin, recuperación ensayable y umbrales operativos.
- Documentado en diseño, checklist y README un release owner responsable, backup restaurable, criterios de fix-forward/rollback y SQL de recuperación preservando datos.
- Cerrada la decisión de producto: la matrícula es única dentro de cada hogar y puede repetirse entre hogares; cualquier cambio global futuro requerirá otra propuesta y migración.
- Convertida la monitorización en bloqueo previo operable: Studio/MCP/logs y dashboard local, filtros y cadencia reproducibles, smoke query read-only, destino de avisos y escalado con release owner, suplente y responsable Supabase/Postgres.
- Corregido el forecast: el diff completo supera 400 líneas por incluir artefactos SDD; se acepta `size:exception` y un único commit para este bundle de aprendizaje porque el payload de implementación sigue pequeño.

## Archivos cambiados

- `supabase/migrations/20260710000000_supabase_persistence_short.sql`
- `supabase/migrations/README.md`
- `openspec/changes/supabase-persistence-short/validation-checklist.md`
- `openspec/changes/supabase-persistence-short/tasks.md`
- `openspec/changes/supabase-persistence-short/apply-progress.md`
- `openspec/changes/supabase-persistence-short/proposal.md`
- `openspec/changes/supabase-persistence-short/spec.md`
- `openspec/changes/supabase-persistence-short/specs/supabase-persistence/spec.md`
- `openspec/changes/supabase-persistence-short/design.md`

## Evidencia de validación

| Comprobación | Resultado |
|---|---|
| Inspección estática SQL | PASS: función `mv_preservar_admin_hogar`, triggers de `update`/`delete`, bloqueo de hogar, rechazo `23514` y `search_path` vacío presentes. |
| Documentación de acceso | PASS: grants/RLS, invariantes PostgreSQL, server-only y bloqueo runtime local/efímero quedan explícitos. |
| Alcance | PASS: la remediación solo modifica SQL y documentación permitidos; no añade adaptador TypeScript, UI, seed, bootstrap ejecutable ni RPC. |
| Runtime local/efímero | PENDIENTE y bloqueante antes de cualquier aplicación real. |
| Mutación real | No realizada; no se conectó ni se ejecutó ninguna migración contra Supabase real. |

### TDD Cycle Evidence

| Unidad | Capa | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| Preservación del último admin | Revisión/contrato SQL | La revisión detectó que un admin autenticado podía eliminar o degradar al último admin | La migración incorpora función y triggers endurecidos que rechazan esas transiciones | También cubre traslado de hogar, concurrencia serializada por hogar y cascade al borrar el hogar | Retornos de trigger explícitos y lógica acotada |
| Grants, RLS y server-only | Documentación | La revisión detectó tensión no explicada entre grants autenticados y acceso server-only | README/checklist explican enforcement RLS, invariantes PostgreSQL y límite de acceso directo | El bloqueo runtime local/efímero evita desplegar solo con evidencia estática | Redacción agrupada para revisión rápida |

No se ejecutó una prueba runtime: no se aplicó la migración ni se mutó una base local, efímera o real durante esta remediación. La prueba RLS runtime local/efímera permanece pendiente y es un bloqueo explícito antes de aplicar a Supabase real.

## Desviaciones y pendientes

- Resuelto: la matriz RLS runtime en base local/efímera se ejecutó y registró en el change separado `supabase-rls-runtime-validation` (archivado en `openspec/changes/archive/2026-07-11-supabase-rls-runtime-validation/`, verify-report PASS, 0 blockers, harness `./scripts/validate-supabase-rls.sh` exit 0, incluida concurrencia del último admin y cascade de borrado de hogar).
- Pendiente bloqueante: asignar operador, verificar/restaurar backup y ensayar fix-forward/rollback antes de aplicar una migración real.
- Si una aplicación real ocurre, faltará capturar evidencia de la línea base y de la ventana inmediata de monitorización; este corte define el procedimiento, pero no puede producir evidencia sin despliegue.
- Riesgo residual: la semántica del trigger y su comportamiento concurrente ya cuentan con evidencia runtime PostgreSQL (ver change archivado arriba), además de la validación estática de este corte.
- Advertencia de contexto: `repo-local`; todos los cambios están dentro de `/home/josep/proyectos/manteniment-vehicles`.
- Estado de implementación: remediación escrita y revisada; la validación RLS runtime bloqueante ya está satisfecha; el despliegue real sigue pendiente de asignar operador/backup/recuperación ensayada.
