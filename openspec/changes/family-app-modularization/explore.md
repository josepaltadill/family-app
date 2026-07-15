# Exploración: modularización de la aplicación familiar

## Resumen ejecutivo

El repositorio ya contiene una aplicación Next.js/TypeScript funcional para el módulo de vehículos, autenticación familiar y aislamiento RLS. La frontera actual de persistencia es monolítica: hogares, membresías, roles de plataforma, vehículos y eventos viven bajo `mv_*`. La modularización debe tratarse como una migración de esquema y contrato, no como un simple reemplazo textual.

Recomendación: convertir hogares, membresías, roles de plataforma y acceso familiar en el núcleo de `app-familiar`; convertir vehículos y eventos en `modulo-vehiculos`; migrar los cinco objetos persistentes principales a nombres `fam_*` mediante el corte atómico finalmente elegido. No se debe crear una segunda copia de los datos ni borrar las tablas antiguas sin evidencia de migración y rollback.

## Estado actual verificado

| Área | Hallazgo |
|---|---|
| Persistencia | `supabase/migrations/20260710000000_supabase_persistence_short.sql` crea `mv_households`, `mv_household_members`, `mv_vehiculos` y `mv_eventos_vehiculo`; hay además `mv_platform_roles`. |
| Seguridad | RLS, grants, policies, funciones `security definer`, triggers y FK compuesta dependen de los nombres `mv_*`. El aislamiento se basa en `household_id` resuelto por membresía. |
| Auth/acceso | `ProveedorIdentidadSupabaseServidor` consulta `mv_household_members`, rechaza cero o múltiples membresías y no acepta el hogar desde el cliente. |
| Bootstrap | El bootstrap administrativo y el preflight consultan/escriben directamente `mv_households` y `mv_household_members`; las pruebas de integración también eliminan y verifican esas tablas. |
| Vehículos | `RepositorioVehiculosSupabase` usa `mv_vehiculos`; el repositorio de eventos usa `mv_vehiculos` y `mv_eventos_vehiculo`; los mapeadores y contratos de prueba documentan esos nombres. |
| Validación RLS | `scripts/validate-supabase-rls.sh`, fixtures/assertions y pruebas de `compartido/pruebas` esperan los nombres y archivos de migración `mv_*`. |
| Especificaciones | Las especificaciones canónicas archivadas de vehículos y acceso familiar todavía declaran `mv_*` como contrato vigente. |
| Documentación | No existe actualmente un directorio `docs/`; las reglas operativas están concentradas en `supabase/migrations/README.md`, `openspec/contexto-proyecto.md` y las especificaciones. |
| Aplicación | Las rutas y composición están organizadas bajo `src/modulos/vehiculos`; el dominio de vehículos ya está relativamente encapsulado, pero el proveedor de identidad y el bootstrap están dentro del módulo. |

## Convención candidata de nombres

| Responsabilidad | Nombre propuesto |
|---|---|
| Núcleo familiar | `fam_hogares` |
| Membresías | `fam_miembros_hogar` |
| Rol de plataforma | `fam_roles_plataforma` (confirmar si pertenece al núcleo familiar o a una futura plataforma) |
| Vehículos | `fam_ve_vehiculos` |
| Eventos | `fam_ve_eventos_vehiculo` |
| Funciones RLS | `fam_es_miembro`, `fam_tiene_rol`, `fam_preservar_admin_hogar` |
| Índices, constraints, policies y triggers | Prefijo del objeto propietario, evitando conservar nombres `mv_*` tras el corte |

Las columnas de dominio que ya están en español (`nombre`, `matricula`, `kilometros_actuales`, etc.) pueden conservarse. `household_id` es una decisión pendiente: mantenerlo reduce el alcance de la migración y conserva contratos de aplicación; traducirlo a `hogar_id` mejora coherencia, pero multiplica cambios en SQL, adaptadores, RLS, pruebas y datos. La primera propuesta debería tratarlo como decisión explícita, no como consecuencia automática del cambio de prefijo.

## Impacto de la migración

### Base de datos y RLS

El cambio afecta a:

- tablas, índices únicos y normales;
- nombres de constraints y FK compuesta evento/vehículo;
- funciones usadas por policies;
- triggers de preservación del último `admin`;
- policies y grants;
- migraciones de unicidad normalizada del hogar y de roles de plataforma;
- harness local de RLS, fixtures, assertions, consultas de smoke y cleanup.

La operación debe conservar UUIDs, filas, relaciones, RLS y la invariante de al menos un `admin`. Un `ALTER TABLE ... RENAME TO ...` puede conservar datos y dependencias internas, pero no basta por sí solo para entregar el contrato final: deben revisarse nombres de objetos, referencias SQL dinámicas y cualquier cliente que consulte por nombre. Conviene que la migración renombre explícitamente índices, constraints, funciones, triggers y policies, o que los recree en una secuencia revisada y verificable.

No se debe usar `drop`, `truncate`, reset global, copia manual de datos ni una migración que asuma que la instancia compartida está vacía. Antes del cambio real se necesita backup restaurable, preflight de conteos/UUIDs y validación RLS local o efímera.

### Adaptadores y runtime

El nombre de tabla está hardcodeado en:

- `RepositorioVehiculosSupabase`;
- `RepositorioEventosSupabase`;
- `ProveedorIdentidadSupabaseServidor`;
- `OperacionesBootstrapPostgres`;
- `bootstrap-preflight.ts` y el runner administrativo;
- mapeadores, comentarios de seguridad y composición server-side.

El cambio debe mantener la resolución server-side de identidad y hogar. El cliente no debe recibir una vía nueva para imponer `hogar_id`/`household_id`, y el runtime ordinario debe seguir sin `service_role`.

### Tests y validación

Hay una superficie amplia de contratos textuales y comportamentales: pruebas unitarias de adaptadores, mapeadores y bootstrap; pruebas de migraciones; integraciones PostgreSQL; pruebas del harness RLS; y validación de concurrencia del último administrador. El inventario debe buscar tanto nombres de tabla como nombres de archivo de migración y mensajes de error.

La migración debe añadir pruebas que demuestren, como mínimo:

1. conservación de filas y UUIDs;
2. conservación de la unicidad de matrícula por hogar, incluyendo inactivos;
3. conservación de FK compuesta y ausencia de eventos huérfanos/cruzados;
4. conservación de RLS por hogar y roles;
5. conservación del trigger de último administrador;
6. bootstrap idempotente con los nombres nuevos;
7. que no queden referencias productivas a `mv_*` al finalizar el corte.

## Límites candidatos

### `app-familiar` / núcleo común

Debe contener:

- contexto de aplicación y resolución server-side de identidad;
- hogares y miembros del hogar;
- roles familiares `admin`/`editor`;
- separación del rol de plataforma, si se conserva en este núcleo;
- políticas de aislamiento por hogar y utilidades RLS comunes;
- bootstrap/preflight de hogares y membresías;
- composición y layout protegidos comunes;
- contratos transversales para módulos, sin importar reglas de vehículos.

No debe contener casos de uso de kilometraje, eventos, vencimientos ni repositorios específicos de vehículos.

### `modulo-vehiculos`

Debe contener:

- dominio de vehículo y evento;
- casos de uso de alta, listado, baja lógica, kilometraje y vencimientos;
- repositorios y mapeadores de `fam_ve_vehiculos`/`fam_ve_eventos_vehiculo`;
- acciones, componentes y rutas de vehículos;
- pruebas de comportamiento del módulo;
- migraciones específicas de sus tablas y sus constraints.

Debe consumir el contexto familiar mediante un puerto estable, no consultar directamente tablas de otros módulos ni resolver por sí mismo la identidad del usuario.

## Organización documental y de OpenSpec

La recomendación es crear:

```text
docs/
  general/
    arquitectura.md
    acceso-y-seguridad.md
    persistencia-y-migraciones.md
    despliegue-y-operacion.md
  modulos/
    vehiculos/
      README.md
      dominio-y-casos-de-uso.md
      persistencia.md
openspec/specs/
  app-familiar-core/spec.md
  modulo-vehiculos/spec.md
  (mantener specs de capacidades transversales separadas cuando corresponda)
```

`docs/general/` debe explicar la aplicación familiar como producto y sus reglas transversales; `docs/modulos/vehiculos/` debe explicar solo el módulo. La guía de migraciones Supabase puede moverse o dividirse en una guía general y una sección específica de persistencia, evitando duplicar reglas de seguridad.

Las especificaciones archivadas deben permanecer inmutables como historial del MVP. Después de aprobar la propuesta, las nuevas specs canónicas deben sustituir explícitamente el contrato `mv_*` por `fam_*`, enlazar la estrategia de migración y declarar qué comportamiento heredado se conserva. No conviene mezclar en una única spec el núcleo familiar y todos los módulos futuros.

## Secuenciación y cortes probables

1. **Contrato y mapa de dependencias:** fijar nombres definitivos, decidir `household_id` frente a `hogar_id`, clasificar `mv_platform_roles` y definir compatibilidad.
2. **Núcleo familiar:** extraer interfaces/servicios comunes y documentación general sin cambiar comportamiento.
3. **Migración de esquema:** aplicar migración versionada de objetos `mv_*` a `fam_*`, con preflight, backup y rollback/fix-forward documentados.
4. **Adaptadores y bootstrap:** cambiar clientes server-side, preflight, bootstrap y tests al contrato nuevo.
5. **Módulo de vehículos:** mover o ajustar la composición/rutas/documentación manteniendo los casos de uso existentes.
6. **Verificación y retirada:** ejecutar pruebas, harness RLS y smoke; retirar compatibilidad antigua solo cuando no existan consumidores `mv_*`.

Para mantener el presupuesto de revisión de 400 líneas, la migración SQL y sus pruebas de seguridad deberían ser un PR/corte separado de la reorganización de TypeScript y documentación. Si se necesita compatibilidad temporal, un corte adicional debe contener únicamente el puente y su telemetría/criterio de retirada.

## Riesgos y decisiones pendientes

- **Pérdida o duplicación de datos:** el riesgo principal es tratar un rename como recreación. Requiere backup, conteos, UUIDs y verificación post-migración.
- **RLS debilitado por renombre parcial:** una tabla renombrada con policy, función o grant incorrecto puede bloquear todo o abrir acceso cruzado. Es bloqueo crítico.
- **Consumidores invisibles en Supabase compartido:** debe confirmarse que ninguna otra aplicación usa los objetos `mv_*`; el proyecto Supabase es compartido aunque los prefijos pretendan aislar aplicaciones.
- **Rollback no simétrico:** renombrar de vuelta puede no ser suficiente si ya se desplegó código nuevo o se crearon objetos nuevos. Se debe preferir una estrategia de corte y rollback explícita.
- **Compatibilidad de nombres de migración:** los archivos históricos no deben renombrarse; las nuevas migraciones deben ser aditivas/versionadas y sus pruebas deben apuntar al contrato nuevo.
- **Dependencia de esquema interno Auth:** `auth.users` no se renombra, pero el bootstrap depende de su estructura interna; no ampliar ese riesgo durante la modularización.
- **Traducción de columnas:** cambiar `household_id` a `hogar_id` es una decisión de alcance con alto impacto y no debe quedar implícita.
- **Clasificación de plataforma:** `fam_roles_plataforma` puede pertenecer al núcleo familiar ahora o reservarse para una futura capa de plataforma; debe resolverse antes del diseño.

## Próximo paso recomendado

Pasar a propuesta únicamente después de resolver estas decisiones de producto/arquitectura: estrategia de compatibilidad (corte atómico o puente temporal), nombre de columnas compartidas, alcance de `fam_roles_plataforma` y confirmación de que los objetos `mv_*` no tienen consumidores externos. La propuesta debe preservar explícitamente todo el comportamiento del MVP y del acceso familiar archivado.
