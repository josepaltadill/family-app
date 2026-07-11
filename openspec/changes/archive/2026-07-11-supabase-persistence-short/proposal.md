# Propuesta: persistencia Supabase corta

Este cambio prepara el primer corte seguro de persistencia Supabase para vehículos y eventos: solo diseño de migración SQL, RLS, guardarraíles y checklist de validación. No incluye UI, no implementa el adaptador TypeScript de Supabase y no aplica migraciones contra la base real.

## Problema

La app ya tiene dominio y repositorios en memoria, pero todavía no existe una base Supabase versionada para datos reales. La instancia Supabase es compartida y contiene tablas ajenas, así que cualquier migración sin prefijo, límites de tenancy o RLS puede provocar exposición cruzada o daño operacional.

## Objetivos

- Definir una migración SQL versionada para los objetos mínimos con prefijo `mv_`.
- Incorporar multiusuario desde el inicio con límite explícito por `household_id`.
- Proteger las tablas con RLS y políticas conservadoras antes de cualquier aplicación real.
- Actualizar guardarraíles/checklist para revisar SQL sin mutar la base real.
- Mantener pequeño el payload de implementación y declarar con transparencia que el bundle completo supera 400 líneas porque incluye los artefactos SDD necesarios para revisión.

## No objetivos

- No implementar adaptadores TypeScript, clientes Supabase ni mapeadores de dominio.
- No crear UI ni flujos de gestión de hogares.
- No ejecutar migraciones, seeds, resets ni limpiezas contra Supabase real.
- No crear tablas futuras de adjuntos, OCR, IA, manuales, recordatorios o notificaciones.
- No resolver todavía multi-hogar seleccionable en producto; solo dejar el esquema preparado.

## Alcance del primer corte

1. Crear una migración SQL no aplicada con:
   - `mv_households`
   - `mv_household_members`
   - `mv_vehiculos`
   - `mv_eventos_vehiculo`
2. Añadir `household_id` obligatorio en vehículos y eventos.
3. Definir constraints de integridad para matrícula, estados, tipos, kilómetros, costes y relación evento-vehículo dentro del mismo hogar.
4. Definir RLS para que los usuarios autenticados solo accedan a datos de hogares donde son miembros.
5. Revisar/actualizar `supabase/migrations/README.md` para permitir explícitamente las nuevas tablas `mv_households` y `mv_household_members`.
6. Añadir checklist de validación estática/manual para SQL y RLS sin conexión a Supabase real.

## Reglas de negocio y seguridad

- Todos los objetos propios de la app deben empezar por `mv_`.
- La instalación arranca con un hogar/familia, pero el modelo debe permitir más hogares después sin reconstruir tablas.
- Todo dato operativo de vehículo o evento pertenece a exactamente un `household_id`.
- Un usuario solo puede acceder a hogares donde existe membresía en `mv_household_members`.
- La matrícula debe ser única dentro del hogar, incluyendo vehículos inactivos: `unique (household_id, matricula)`.
- Los eventos deben referenciar un vehículo del mismo hogar; no se permiten eventos cruzando hogares.
- Kilometrajes y costes no pueden ser negativos.
- No se debe exponer acceso browser-side directo a tablas `mv_*`.
- No se deben guardar claves `service_role` ni privilegiadas en cliente.
- Las migraciones reales requieren revisión y autorización explícita antes de ejecutarse.

## Criterios de aceptación

- [x] Existe una migración SQL versionada en `supabase/migrations/` y no fue aplicada contra la base real.
- [x] La migración crea solo objetos con prefijo `mv_`.
- [x] Las cuatro tablas mínimas están modeladas: `mv_households`, `mv_household_members`, `mv_vehiculos`, `mv_eventos_vehiculo`.
- [x] `mv_vehiculos` y `mv_eventos_vehiculo` tienen `household_id` obligatorio.
- [x] La integridad impide que un evento referencie un vehículo de otro hogar.
- [x] RLS queda activado en las tablas `mv_*` con políticas basadas en membresía de hogar.
- [x] El checklist documenta cómo revisar SQL/RLS sin mutar Supabase real.
- [x] El guardarraíl de migraciones reconoce las tablas de hogar/membresía como parte del corte permitido.
- [x] No se agregan archivos de adapter TypeScript ni código de UI.

## Validación esperada

Como este corte no debe mutar la base real, la evidencia aceptable es:

- Revisión estática del SQL versionado.
- Verificación manual del checklist de guardarraíles.
- Confirmación de que no hay comandos peligrosos globales (`drop schema`, `drop database`, `cascade`, resets globales).
- Confirmación de que RLS está habilitado antes de considerar una aplicación real.
- Si se agrega tooling local en fases posteriores, podrá ejecutarse contra una base local/efímera, no contra la instancia compartida.

## Riesgos

- RLS incorrecta podría exponer datos entre hogares.
- La duplicación de `household_id` en eventos exige constraints cuidadosos para evitar inconsistencias.
- La matrícula es única por hogar en este corte y puede repetirse en hogares distintos. Una futura exigencia de unicidad entre hogares sería un cambio de negocio nuevo, fuera de este alcance, y requeriría su propia propuesta y migración revisada.
- Sin ejecución local de Supabase, la validación inicial no prueba políticas en runtime.
- El corte puede crecer si se mezcla con adapter TypeScript; eso queda fuera de alcance para proteger el payload de implementación.
- El diff completo supera 400 líneas por incluir propuesta, especificaciones, diseño, tareas y evidencia. Se acepta una excepción de tamaño para este bundle SDD orientado al aprendizaje y se mantiene en un único commit; una ampliación con código de aplicación debe separarse.

## Recuperación

Antes de aplicar la migración real, el operador responsable debe ensayar en un entorno local/efímero el procedimiento documentado de backup, rollback preservando datos y fix-forward. Después de una aplicación real, no se borrarán tablas ni datos como respuesta automática: se decidirá entre pausar/fix-forward o rollback según integridad de datos, exposición RLS y capacidad de restauración verificada.

## Decisiones de producto cerradas

- La matrícula es única por hogar mediante `(household_id, matricula)`; puede repetirse en hogares distintos.
- La primera migración incluye los roles `admin` y `editor`.
- El esquema permite que un usuario pertenezca a varios hogares, aunque la UI todavía no exponga selección multi-hogar.

## Próxima fase recomendada

Continuar con `sdd-spec` para convertir esta propuesta en requisitos verificables de migración, RLS y validación sin implementación de adapter TypeScript.
