# Tareas de implementación: persistencia Supabase corta

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | >400 líneas en el diff completo; incluye migración y artefactos SDD |
| Implementation payload | Pequeño: una migración SQL y un guardarraíl operativo |
| 400-line budget risk | High por volumen documental, no por expansión funcional |
| Chained PRs recommended | No para este bundle SDD orientado al aprendizaje |
| Suggested split | Excepción aceptada: un único commit; separar cualquier adapter, UI o ampliación posterior |
| Delivery strategy | single-pr con `size:exception` documentada |
| Chain strategy | No aplica |

Decision needed before apply: No; la excepción de tamaño queda aceptada para este bundle.
Chained PRs recommended: No
Chain strategy: No aplica
400-line budget risk: High (artefactos SDD incluidos)

## Límites del corte

- Solo se modifican una migración SQL, `supabase/migrations/README.md` y documentación/checklist de validación dentro de este cambio.
- No crear adaptador TypeScript, UI, seeds, bootstrap ejecutable, RPC, reset ni ejecutar comandos contra Supabase real.
- Todos los objetos propios deben usar el prefijo `mv_`; cualquier excepción debe detener la implementación y pedir revisión.

## Unidad 1 — Migración SQL base y tenancy

**Inicio:** no existe una migración SQL versionada para este corte.
**Fin:** existe un único archivo nuevo bajo `supabase/migrations/` que crea el modelo mínimo de forma transaccional y sin sentencias destructivas.
**Rollback:** eliminar o revertir únicamente el archivo nuevo antes de aplicarlo; no ejecutar rollback contra una base real.

- [x] Crear `supabase/migrations/<timestamp>_supabase_persistence_short.sql` como migración no aplicada, con `begin;`/`commit;`.
- [x] Crear exclusivamente `mv_households`, `mv_household_members`, `mv_vehiculos` y `mv_eventos_vehiculo`, en ese orden de dependencias, usando UUID y `timestamptz` según `design.md`.
- [x] Definir claves primarias, `not null`, defaults y FKs a `auth.users`/hogares; mantener el borrado hogar→membresías explícito y no usar cascada desde vehículos hacia eventos.
- [x] Hacer obligatorio `household_id` en vehículos y eventos y agregar FK compuesta `(household_id, vehiculo_id)` → `(household_id, id)` para impedir eventos cruzados.
- [x] Añadir `unique (household_id, matricula)`, incluyendo vehículos inactivos, y el unique `(household_id, id)` requerido como destino de la FK compuesta.
- [x] Añadir checks para textos no vacíos, año positivo, kilómetros/costes/vencimientos no negativos, estados `activo`/`inactivo`, tipos `mantenimiento`/`averia` y coherencia de `fecha_desactivacion`.
- [x] Crear solo índices propios prefijados `mv_`, incluidos los de membresía, estado, historial por vehículo y vencimientos no nulos.

## Unidad 2 — RLS endurecida y permisos

**Inicio:** las cuatro tablas existen en el SQL sin políticas.
**Fin:** cada tabla tiene RLS, permisos mínimos y políticas por membresía/rol sin vía de autoasignación.
**Rollback:** eliminar en conjunto las sentencias de permisos/policies de la migración aún no aplicada.

- [x] Crear `mv_es_miembro(uuid)` y `mv_tiene_rol(uuid, text[])` como funciones `security definer`, `stable`, con `set search_path = ''`, referencias totalmente cualificadas y sin aceptar un `user_id` arbitrario.
- [x] Fijar propietario seguro de las funciones, revocar `execute` a `public` y concederlo solo a `authenticated`; revisar que la función no exponga datos innecesarios.
- [x] Habilitar RLS en las cuatro tablas y revocar privilegios de `anon`; conceder a `authenticated` únicamente los privilegios respaldados por policies.
- [x] Crear policies con nombres `mv_<tabla>_<operacion>_<alcance>`: lectura por membresía; escritura operativa para `admin`/`editor`; borrado y administración de hogares/membresías solo para `admin`.
- [x] Usar `using` para filas existentes y `with check` para inserciones/actualizaciones, validando siempre el `household_id` resultante.
- [x] No crear policy autenticada de inserción de hogares ni una policy que permita otorgarse el rol `admin` inicial; dejar el bootstrap server-only documentado, no implementado.
- [x] Verificar que no haya policies globalmente permisivas, acceso para `anon`, bypass por identidad suministrada por el cliente ni nombres propios sin `mv_`.

## Unidad 3 — Guardarraíles de migraciones

**Inicio:** `supabase/migrations/README.md` no refleja aún las cuatro tablas del corte.
**Fin:** el guardarraíl permite explícitamente el esquema nuevo y bloquea mutaciones peligrosas o ajenas.
**Rollback:** revertir solo la modificación documental de `supabase/migrations/README.md`.

- [x] Actualizar `supabase/migrations/README.md` para permitir explícitamente `mv_households`, `mv_household_members`, `mv_vehiculos` y `mv_eventos_vehiculo`.
- [x] Documentar allí la unicidad `(household_id, matricula)`, `household_id` obligatorio y la FK compuesta evento/vehículo.
- [x] Documentar roles `admin`/`editor`, bootstrap server-only y las funciones RLS `security definer` endurecidas.
- [x] Mantener explícitamente prohibidos `drop schema`, `drop database`, resets globales, seeds no autorizados, `cascade` destructivo y modificación/eliminación de tablas públicas ajenas.
- [x] Mantener la prohibición de ejecutar migraciones reales sin revisión y autorización explícitas, y de usar `service_role` en cliente.

## Unidad 4 — Validación estática y no mutación

**Inicio:** migración y guardarraíl escritos, pero sin evidencia de revisión.
**Fin:** el cambio contiene un checklist ejecutable por revisión humana y evidencia de que no se mutó la base real.
**Rollback:** corregir la documentación/checklist; no ejecutar comandos de compensación contra Supabase.

- [x] Añadir en `openspec/changes/supabase-persistence-short/` un checklist de validación (o incorporarlo al guardarraíl) que cubra tablas, prefijos, constraints, índices, FKs, checks, RLS, `with check`, permisos y `search_path`.
- [x] Ejecutar únicamente inspección estática del SQL y del diff; confirmar ausencia de `drop schema`, `drop database`, resets, `supabase db push`, `supabase migration up`, `supabase db reset` y `psql` contra la instancia compartida.
- [x] **RED:** marcar como fallida la checklist si falta cualquiera de las cuatro tablas, `household_id` obligatorio, unicidad por hogar, FK compuesta o RLS completa.
- [x] **GREEN:** completar la checklist después de revisar manualmente cada constraint, policy y permiso contra `design.md` y `specs/supabase-persistence/spec.md`.
- [x] **TRIANGULATE:** comprobar que el diff no contiene `.ts` de Supabase, UI, seeds, bootstrap ejecutable ni cambios fuera del alcance; comprobar además que todos los objetos propios comienzan por `mv_`.
- [x] Registrar explícitamente que la validación estática no sustituye una prueba RLS runtime local/efímera antes de una aplicación real.
- [x] Confirmar que el diff completo supera 400 líneas porque incluye los artefactos SDD. Registrar `size:exception` y aceptar un único commit para este bundle orientado al aprendizaje; mantener pequeño el payload de implementación y separar cualquier crecimiento funcional.

## Unidad 5 — Preparación operativa posterior a una aplicación real

- [x] Documentar un camino ensayable de fix-forward/rollback que preserve datos, con backup verificable, criterios de decisión y operador responsable.
- [x] Documentar ventana inmediata de observación para errores DB/RLS y latencia, con escalado >1% investigación, >2% emergencia y >5% all-hands.
- [ ] Antes de una aplicación real, asignar operador, registrar backup restaurable y ensayar recuperación en local/efímero.
- [ ] Tras una aplicación real, registrar métricas y decisiones de la ventana inmediata; este punto no se ejecuta en el corte estático.

## Criterio de terminado del corte estático

- [x] La migración SQL existe, es versionada, no fue aplicada y crea solo los cuatro objetos permitidos.
- [x] RLS y permisos quedan definidos estáticamente para aislamiento por hogar, sin afirmar validación runtime.
- [x] El README/guardarraíl y el checklist reflejan las mismas reglas que la migración.
- [x] La evidencia de validación no incluye conexión ni mutación de Supabase real.
- [x] No hay adapter TypeScript ni UI en el diff.

## Bloqueo antes de despliegue real

- [ ] Ejecutar validación runtime en una base local/efímera para anónimo, no miembro, editor, admin, escrituras cruzadas, conservación del último admin, concurrencia básica y borrado de hogar. Este punto queda fuera de este corte y bloquea aplicar la migración en Supabase real.
