# Exploración: persistencia Supabase corta

Cambio: `supabase-persistence-short`
Proyecto: `manteniment-vehicles`
Fecha: 2026-07-10

## Objetivo
Preparar el corte mínimo útil para persistencia Supabase de vehículos y eventos, sin UI y sin ejecutar migraciones.

## Contexto leído
- `openspec/contexto-proyecto.md`
- `openspec/config.yaml`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/diseno.md` sección persistencia Supabase
- `supabase/migrations/README.md`
- `package.json`
- Dominio/puertos relevantes bajo `src/modulos/vehiculos/`

## Estado actual
- PR 1 lógico ya dejó dominio, casos de uso y repositorios en memoria implementados.
- Persistencia Supabase sigue pendiente en tareas 5, 6, 7 y 8 de `vehicle-maintenance-app`.
- `npm test` existe y apunta a `vitest run`; Strict TDD está activo.
- No hay migraciones SQL versionadas todavía, solo guardarraíles en `supabase/migrations/README.md`.
- El cambio nuevo debe ser más corto que PR 2 completo: persistencia mínima, sin UI.

## Restricciones confirmadas
- Supabase compartido: todos los objetos de esta app deben usar prefijo `mv_`.
- No ejecutar migraciones ni operaciones contra Supabase real durante esta fase.
- No acceso browser-side a datos `mv_*`; usar adaptadores de servidor.
- No claves `service_role` ni privilegiadas en cliente.
- Multiusuario requerido.
- Producto inicial: una familia/hogar por instalación, pero el esquema debe permitir multi-hogar futuro sin reconstrucción.

## Modelo existente que condiciona la base de datos
- `Vehiculo`: id, marca, modelo, anio, combustible, matricula, kilometrosActuales, estado, fechaCompra, fechaAltaAplicacion, fechaDesactivacion.
- `EventoVehiculo`: id, vehiculoId, tipo (`mantenimiento`/`averia`), descripcion, kilometros, fecha, proveedor, coste, moneda, notas, vencimiento km/fecha, fechaCreacion.
- Puertos actuales:
  - `RepositorioVehiculos`: `guardar`, `buscarPorId`, `listar`, `existeMatricula`.
  - `RepositorioEventosVehiculo`: `guardar`, `listarPorVehiculo`, `listarConVencimiento`.
  - `UnidadTrabajoVehiculos`: `registrarEventoYActualizarKilometraje({ evento, vehiculoActualizado })` debe evitar confirmar evento si falla la actualización de kilometraje.
  - `ProveedorIdentidad`: actor actual con id y rol (`admin`/`editor`).

## Recomendación de alcance mínimo
Este cambio debería cubrir solo:
1. Migración SQL versionada, no aplicada, para tablas `mv_households`, `mv_household_members`, `mv_vehiculos` y `mv_eventos_vehiculo`.
2. RLS/postura segura inicial compatible con Supabase compartido y multiusuario.
3. Adaptador Supabase server-only y mapeadores mínimos para los puertos existentes.
4. Operación atómica/coordinada para registrar evento y actualizar kilometraje, preferiblemente RPC SQL `mv_registrar_evento_vehiculo` o transacción equivalente ejecutada desde servidor.
5. Tests de mapeadores/contratos sin depender de ejecutar Supabase real, más checklist SQL si no hay harness de BD.

## Decisión técnica propuesta
Agregar `household_id` desde la primera migración:
- `mv_households`: hogar/familia propietario de datos.
- `mv_household_members`: usuarios Supabase Auth asociados a hogares, con rol de app.
- `mv_vehiculos.household_id` obligatorio.
- `mv_eventos_vehiculo.household_id` obligatorio además de `vehiculo_id`, con FK compuesta o validación que impida evento de otro hogar.

Motivo: aunque inicialmente haya un solo hogar, RLS y queries necesitan un límite de tenancy real. Añadirlo después implicaría backfill, cambios de políticas, migraciones de integridad y riesgo de exposición cruzada.

## Ajustes respecto al diseño anterior
- El diseño antiguo sugería unicidad parcial de matrícula activa; las tareas fijan unicidad global incluyendo inactivos. Para multi-hogar, conviene `unique (household_id, matricula)` global dentro del hogar. Si el producto exige que una matrícula no se repita entre hogares, eso sería una decisión de negocio distinta y probablemente innecesaria.
- Las tablas permitidas en `supabase/migrations/README.md` solo mencionan `mv_vehiculos` y `mv_eventos_vehiculo`; para multiusuario seguro conviene actualizar ese guardarraíl para permitir explícitamente `mv_households` y `mv_household_members` en este corte.
- El puerto `ProveedorIdentidad` hoy solo expone actor id/rol; el adaptador Supabase necesitará resolver también `household_id` activo. Puede hacerse ampliando el actor de aplicación o introduciendo un proveedor de contexto de hogar en aplicación.

## Riesgos principales
- RLS mal diseñada en Supabase compartido puede exponer datos entre usuarios/hogares.
- Dos llamadas separadas para evento + kilometraje pueden dejar inconsistencia; preferir RPC/transacción.
- Tests sin Supabase real no verifican políticas RLS en ejecución; hace falta checklist SQL y revisión de riesgo antes de aplicar.
- El corte puede superar 400 líneas si incluye migración, RLS, adaptador completo y tests; mantenerlo en persistencia mínima sin UI.

## Próximo paso recomendado
Continuar con `sdd-propose` para este cambio corto, fijando explícitamente: esquema multiusuario mínimo, RLS inicial, alcance del adaptador server-only y qué se verifica sin ejecutar migraciones.
