# Diseño técnico: aplicación familiar modular con corte atómico `fam_*`

## 1. Decisiones principales

La aplicación se organizará como un **núcleo familiar** y módulos funcionales que consumen su contexto. Vehículos será el primer módulo. El núcleo resolverá sesión, identidad, hogar y roles; el módulo de vehículos no consultará membresías ni aceptará un hogar elegido por el cliente.

El contrato de persistencia se cambiará en una única transacción PostgreSQL mediante renombrados de objetos existentes y actualización controlada de sus dependencias. No se copiarán filas ni se usarán `drop`, `truncate`, reset global o recreaciones destructivas. El despliegue de esquema y consumidores se tratará como una sola unidad de activación, aunque su revisión pueda dividirse en PR encadenadas.

Se conservará el nombre de columna **`household_id`** en este cambio. Se traducen las tablas y los nombres de objetos propietarios al contrato `fam_*`, pero no la clave de partición interna. Esta decisión reduce de forma material el riesgo sobre RLS, FK compuestas, adaptadores, fixtures y rollback sin impedir que el dominio TypeScript use nombres en español o un alias semántico como `hogarId` en una propuesta futura.

| Área | Decisión |
|---|---|
| Núcleo | Hogares, membresías, roles familiares, roles de plataforma, identidad y bootstrap. |
| Vehículos | Dominio, casos de uso, repositorios, mapeadores, acciones y UI de vehículos. |
| Dependencia | `modulos/vehiculos` depende de contratos del núcleo; el núcleo nunca depende de vehículos. |
| Persistencia | Corte transaccional por `ALTER ... RENAME`, sin puente de compatibilidad. |
| Columnas de hogar | Mantener `household_id` y `p_household_id` durante esta modularización. |
| Runtime | Cliente Supabase y contexto se crean en servidor; el módulo recibe ambos ya resueltos. |
| Recuperación | Rollback solo antes de activar escrituras `fam_*`; después, fix-forward. |
| Entrega | PR encadenadas para revisión, pero una única activación coordinada de esquema y código. |

## 2. Arquitectura objetivo

### 2.1 Fronteras y responsabilidades

#### Núcleo familiar

El núcleo es dueño de:

- `ContextoAplicacion`, identidad del actor y rol familiar;
- resolución de sesión y membresía única utilizable;
- fallos `anonimo`, `sin-membresia`, `multiples-membresias`, datos inválidos y error operativo;
- hogares, miembros, roles `admin`/`editor` y roles de plataforma;
- invariante del último administrador;
- bootstrap, preflight y acceso administrativo aislado;
- contratos que permiten a un módulo operar dentro de un hogar resuelto.

El núcleo no importa dominios, repositorios ni componentes de vehículos.

#### Módulo de vehículos

El módulo es dueño de:

- vehículos, eventos, costes, kilometraje, baja lógica y vencimientos;
- puertos y adaptadores de `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo`;
- casos de uso y presentación de vehículos;
- validaciones específicas, incluida matrícula única por hogar y FK compuesta.

El módulo recibe el contexto familiar como una capacidad ya validada. No crea el proveedor de identidad ni consulta `fam_miembros_hogar`.

### 2.2 Estructura TypeScript sugerida

La reorganización debe conservar la arquitectura por capas ya presente y mover solo las responsabilidades mal ubicadas:

```text
src/
  nucleo-familiar/
    dominio/
      rol-familiar.ts
    aplicacion/
      puertos/
        proveedor-identidad.ts
      servicios/
        resolver-acceso-familiar.ts
    adaptadores/
      supabase/
        proveedor-identidad-supabase-servidor.ts
      postgres/
        bootstrap-servidor.ts
        bootstrap-plan.ts
        bootstrap-preflight.ts
        operaciones-bootstrap-postgres.ts
    seguridad/
      seguridad-servidor.ts
  modulos/
    vehiculos/
      dominio/
      aplicacion/
      adaptadores/
        supabase/
          repositorio-vehiculos-supabase.ts
          repositorio-eventos-supabase.ts
          mapeadores-supabase.ts
        sistema/
      interfaz/
        componentes/
        acciones/
        composicion/
          dependencias-servidor.ts
  compartido/
    dominio/
    infraestructura/
      supabase/
  composicion/
    servidor/
      alcance-familiar-por-solicitud.ts
```

Los nombres exactos pueden ajustarse a las convenciones existentes, pero las fronteras no:

```text
app/rutas servidor
       |
       v
composicion/servidor ---> nucleo-familiar/adaptadores
       |                         |
       v                         v
modulos/vehiculos ------> nucleo-familiar/aplicacion (contratos)
       |
       v
modulos/vehiculos/adaptadores

nucleo-familiar -X-> modulos/vehiculos
cliente          -X-> cualquier adaptador Supabase o bootstrap administrativo
```

### 2.3 Contrato de composición

`alcance-familiar-por-solicitud.ts` será `server-only` y realizará, en orden:

1. crear el cliente Supabase SSR con las cookies de la solicitud;
2. construir `ProveedorIdentidadSupabaseServidor` del núcleo;
3. exigir un único `ContextoAplicacion` válido;
4. devolver un alcance inmutable con `{ clienteSupabase, contextoFamiliar }`.

`crearDependenciasVehiculos` dejará de resolver identidad. Recibirá ese alcance y construirá únicamente los repositorios y servicios del módulo. Durante la transición de PR 1 se permite un adaptador interno `ProveedorIdentidadDesdeContexto` cerrado sobre el contexto ya resuelto, solo para satisfacer puertos existentes; ese adaptador no puede consultar Supabase, cookies ni cabeceras, y debe retirarse o quedar encapsulado en la composición del módulo antes de finalizar el cambio. La estructura objetivo revisable es una sola frontera: el núcleo resuelve identidad; vehículos consume contexto.

El contexto seguirá ignorando cualquier `household_id` recibido por URL, formulario, cookie, cabecera o parámetro. Los repositorios recibirán el identificador desde el caso de uso/contexto y RLS volverá a verificarlo con `auth.uid()`.

## 3. Diseño de persistencia final

### 3.1 Tablas

| Objeto anterior | Objeto final | Propietario |
|---|---|---|
| `mv_households` | `fam_hogares` | Núcleo familiar |
| `mv_household_members` | `fam_miembros_hogar` | Núcleo familiar |
| `mv_platform_roles` | `fam_roles_plataforma` | Núcleo familiar |
| `mv_vehiculos` | `fam_ve_vehiculos` | Módulo de vehículos |
| `mv_eventos_vehiculo` | `fam_ve_eventos_vehiculo` | Módulo de vehículos |

Se preservan UUID, filas, defaults, tipos, orden lógico de relaciones, `auth.users`, fechas, costes e histórico. `ALTER TABLE ... RENAME TO` conserva los OID y, por tanto, las FK, datos, RLS y grants asociados al objeto; aun así, todos se inventariarán y validarán de forma explícita.

### 3.2 `household_id` frente a `hogar_id`

#### Alternativa `hogar_id`

Ventajas:

- coherencia lingüística con `fam_hogares`;
- SQL nuevo más fácil de leer para el equipo;
- elimina vocabulario mixto a largo plazo.

Costes y riesgos:

- afecta las cinco tablas o sus relaciones, las funciones RLS, policies, triggers, FK compuesta, índices, bootstrap, adaptadores, mapeadores, fixtures y pruebas;
- amplía el punto de fallo del corte sin aportar comportamiento de producto;
- dificulta una reversión, porque código y esquema deben coordinar también el nombre de columna;
- aumenta mucho el diff y reduce la capacidad de revisar seguridad dentro del presupuesto.

#### Decisión: conservar `household_id`

`household_id` es una clave técnica interna ya probada y no forma parte del nombre público de las tablas. Se conservarán también `p_household_id` en funciones SQL y, inicialmente, `householdId` en contratos TypeScript existentes. Los nombres de tablas, funciones propietarias, policies, triggers, constraints e índices sí adoptarán `fam_*`.

Traducir la columna podrá proponerse después como migración aislada, con valor y riesgo propios. No debe colarse como refactor cosmético en este corte.

### 3.3 Convención de objetos dependientes

Todo nombre productivo propietario debe abandonar `mv_*`. Convención propuesta:

- funciones comunes: `fam_es_miembro_hogar`, `fam_tiene_rol_hogar`, `fam_preservar_admin_hogar`;
- constraints del núcleo: `fam_hogares_*`, `fam_miembros_hogar_*`, `fam_roles_plataforma_*`;
- constraints del módulo: `fam_ve_vehiculos_*`, `fam_ve_eventos_vehiculo_*`;
- índices: prefijo de su tabla propietaria, por ejemplo `fam_ve_vehiculos_household_estado_idx`;
- triggers: prefijo de la tabla propietaria, por ejemplo `fam_miembros_hogar_preservar_admin_delete`;
- policies: prefijo de la tabla propietaria, por ejemplo `fam_ve_vehiculos_select_member`.

Se renombrarán también PK implícitas, índices respaldados por `UNIQUE`, FK y checks. No basta con renombrar las tablas: el criterio final busca `mv_*` en `pg_class`, `pg_constraint`, `pg_proc`, `pg_trigger`, `pg_policy`, migraciones nuevas, runtime, scripts y validaciones.

Los nombres históricos de archivos de migración se conservan. Que un archivo histórico contenga `mv_*` no es una referencia productiva final; las búsquedas deben distinguir historial inmutable de objetos/consumidores activos.

## 4. Migración atómica de Supabase

### 4.1 Preflight externo obligatorio

El preflight se ejecuta con conexión administrativa, antes de abrir la transacción de corte, y no modifica datos. Debe producir evidencia fechada de:

- versión y destino exactos de PostgreSQL/Supabase;
- backup restaurable o snapshot y procedimiento de restauración probado;
- existencia, propietario, OID y definición de los cinco objetos `mv_*` esperados;
- ausencia de objetos `fam_*` conflictivos;
- inventario de FK, constraints, índices, triggers, policies, funciones, grants y RLS;
- conteos por tabla, conjunto o hash estable de UUID y relaciones hogar-miembro/vehículo-evento;
- duplicados de nombre de hogar y matrícula por hogar;
- eventos huérfanos o cruzados y membresías inválidas;
- hogares sin administrador;
- dependencias en `pg_depend`, vistas, funciones, jobs, webhooks y consumidores externos conocidos;
- búsqueda en código/configuración desplegada de consumidores de `mv_*`.

Una dependencia externa no clasificada, un objeto final preexistente, una invariante rota o un backup no recuperable bloquea el corte. La migración no intentará “arreglar” automáticamente datos ambiguos.

### 4.2 Transacción de corte

La nueva migración versionada ejecutará una única transacción con timeout y bloqueo controlados:

1. `BEGIN` y `SET LOCAL lock_timeout`/`statement_timeout` apropiados para la ventana.
2. Tomar locks explícitos sobre las cinco tablas en un orden fijo para impedir escrituras durante el corte y evitar deadlocks.
3. Revalidar que los objetos origen/final siguen en el estado esperado.
4. Renombrar tablas con `ALTER TABLE ... RENAME TO`.
5. Actualizar con `CREATE OR REPLACE FUNCTION` los cuerpos que contienen referencias textuales a tablas, usando ya `fam_*`; después renombrar las funciones con `ALTER FUNCTION ... RENAME TO`.
6. Renombrar constraints, índices, triggers y policies mediante sus operaciones `ALTER ... RENAME`; no eliminarlos y recrearlos.
7. Confirmar propietarios, `security definer`, `search_path = ''`, revocaciones y grants. Los privilegios ligados al OID deben persistir, pero se verifican, no se presuponen.
8. Validar dentro de la transacción tablas finales, referencias de catálogo, RLS habilitado, funciones y relaciones esenciales.
9. Rechazar la transacción si permanece un objeto productivo `mv_*` o falta un objeto `fam_*` esperado.
10. `COMMIT` solo tras superar todas las aserciones.

Las funciones SQL actuales se definieron con cuerpo textual `$$ ... $$`; el renombrado de tabla no garantiza que ese texto se actualice. Por eso sus cuerpos se reemplazan explícitamente dentro de la misma transacción. La misma regla aplica al cuerpo PL/pgSQL del trigger del último administrador.

No se introduce vista, alias, tabla duplicada ni función puente. Desde fuera de la transacción, otros consumidores observan el contrato anterior o el final, nunca un estado parcial. Esto se validará con pruebas de concurrencia: un lector/escritor bloqueado durante el corte no debe observar una mezcla de tablas `mv_*` y `fam_*`, y un timeout o lock contention debe provocar rollback completo sin renombres parciales. Esto garantiza atomicidad de esquema, no compatibilidad entre versiones de código: la activación del código debe coordinarse con el commit de la migración.

### 4.3 Validación posterior

Antes de reabrir tráfico, ejecutar:

- comparación pre/post de conteos, UUID y relaciones;
- comprobación de FK, PK, unique, checks e índices, incluida matrícula por hogar para inactivos;
- matriz RLS completa para anónimo, no miembro, `editor`, `admin`, acceso cruzado y roles de plataforma;
- prueba concurrente del último administrador;
- smoke de sesión, cero membresías, múltiples membresías y contexto único;
- bootstrap idempotente y conflicto cerrado;
- altas/listados/baja lógica/eventos/kilometraje/vencimientos;
- inventario de grants y prueba de que el runtime ordinario no usa `service_role`;
- búsqueda final de consumidores productivos y objetos de catálogo `mv_*`.

Los resultados se guardarán como evidencia de despliegue. El tráfico solo se habilita si todas las validaciones pasan y queda activada una observabilidad mínima de release: contador/registro de errores de resolución de contexto, fallos RLS o SQLSTATE de permisos, errores de bootstrap/preflight, latencia de operaciones familiares críticas y umbrales de alerta manual para la ventana posterior al corte. Si esos indicadores superan el umbral acordado, se cierra tráfico y se ejecuta el plan de fix-forward.

### 4.4 Punto de no retorno y recuperación

El punto de no retorno es la primera escritura aceptada por la versión de aplicación que usa `fam_*` después del commit de la migración.

**Antes del punto de no retorno:** mantener tráfico cerrado; si falla la migración, PostgreSQL revierte la transacción. Si el commit ya ocurrió pero no hubo escrituras nuevas, se puede ejecutar una migración inversa previamente ensayada que renombre los mismos objetos y restaure cuerpos de función. No se revierte borrando objetos.

**Después del punto de no retorno:** no desplegar código antiguo ni renombrar de vuelta. Se aplica fix-forward desde una migración preparada y una versión de código compatible con `fam_*`. La prioridad es cerrar acceso o deshabilitar temporalmente operaciones antes que ampliar permisos inciertos.

Toda recuperación debe registrar estado inicial, fallo, decisión, comandos, resultado y nueva validación de RLS/relaciones. Si la restauración desde backup fuese necesaria, se trata como incidente operativo y no como paso normal de la migración.

## 5. Runtime, adaptadores y bootstrap

### 5.1 Proveedor de identidad

`ProveedorIdentidadSupabaseServidor`, `ProveedorIdentidad`, `ContextoAplicacion`, roles y `resolver-acceso-familiar` se moverán desde `modulos/vehiculos` a `nucleo-familiar`. El adaptador consultará `fam_miembros_hogar`, seguirá usando `auth.getUser()`, limitará a dos resultados y fallará cerrado ante errores o cardinalidad distinta de uno.

No se añadirá selección multi-hogar. El rol de plataforma podrá resolverse por un puerto separado cuando exista una capacidad que lo necesite; no se mezclará con el rol familiar ni concederá acceso familiar por sí solo.

### 5.2 Adaptadores Supabase

- Los clientes SSR y tipos técnicos reutilizables permanecen en `compartido/infraestructura/supabase`.
- El adaptador de membresía pertenece al núcleo.
- Los repositorios y mapeadores de vehículos permanecen bajo el módulo y cambian solo a `fam_ve_*`.
- Todos los adaptadores de datos llevan `server-only` donde corresponda y no pueden importarse desde componentes cliente.
- Ningún adaptador ordinario acepta ni lee credenciales administrativas.

### 5.3 Bootstrap y preflight

`bootstrap-servidor`, plan, preflight y `OperacionesBootstrapPostgres` pertenecen al núcleo porque crean/inspeccionan hogares, usuarios y membresías. El preflight puede contar vehículos/eventos para proteger datos durante la transición, pero esa consulta es una dependencia operativa explícita del corte, no una regla de dominio del núcleo. Tras el corte usará las tablas finales.

El único runner administrativo seguirá siendo `scripts/bootstrap-admin.ts`. La allowlist de importación se actualizará a las rutas del núcleo y continuará rechazando imports estáticos, dinámicos o `require()` desde cualquier otro consumidor. No se trasladará `service_role` al runtime; el bootstrap usa exclusivamente la conexión PostgreSQL administrativa del proceso aislado.

## 6. Estrategia de pruebas con TDD estricto

Cada corte de implementación seguirá RED → GREEN → TRIANGULATE → REFACTOR y ejecutará `npm test`. No se aceptará primero un reemplazo global y después pruebas adaptadas para hacerlo pasar.

| Superficie | RED | GREEN y triangulación |
|---|---|---|
| Frontera de imports | Prueba que exige que identidad/bootstrap estén en núcleo, que núcleo no importe vehículos y que cliente no importe adaptadores. | Mover contratos/adaptadores; añadir caso de import dinámico/alias reconocido cuando aplique. |
| Composición | Prueba que demuestra una sola resolución de contexto y que vehículos recibe el alcance ya validado. | Separar composición de solicitud y módulo; triangular anónimo, cero y múltiples membresías. |
| Adaptadores | Expectativas de tablas `fam_miembros_hogar` y `fam_ve_*` fallan inicialmente. | Cambiar constantes/consultas; triangular errores RLS, UUID inválido y filtros por hogar. |
| Bootstrap | Pruebas de SQL parametrizado y rutas finales fallan con `mv_*`. | Cambiar consultas y allowlist; triangular idempotencia, rol conflictivo y nombre normalizado. |
| Migración SQL | Prueba sobre una base con datos `mv_*` exige objetos `fam_*`, mismos UUID/relaciones, cero objetos activos `mv_*` y atomicidad observable ante concurrencia, locks y timeouts. | Implementar renombrado transaccional; triangular datos vacíos, datos inesperados válidos, objeto final conflictivo, lector/escritor concurrente bloqueado y rollback completo ante timeout. |
| RLS | Harness final apunta a `fam_*` y falla antes del corte. | Actualizar fixtures/aserciones; ejecutar matriz secuencial y concurrencia del último admin. |
| Integridad de módulo | Pruebas de matrícula, FK compuesta, baja lógica, kilometraje, coste, fechas, estado y campos obligatorios sobre contrato final. | Confirmar equivalencia; triangular matrícula inactiva, evento cruzado entre hogares, valores negativos o límite, fechas inválidas y reloj/zonahoraria inyectados para vencimientos. |
| Documentación/specs | Check de enlaces, ubicaciones y referencias productivas finales. | Crear estructura documental y sincronizar specs; excluir archivos históricos de la regla de cero `mv_*`. |

Para probar la migración sin tocar el esquema compartido real, el test de integración debe levantar/restaurar un PostgreSQL efímero o usar tablas/esquema de prueba aislados con el mismo DDL. Debe aplicar primero las migraciones históricas y después la nueva migración, no adaptar el SQL mediante reemplazos textuales que oculten dependencias.

La prueba de “cero `mv_*`” tendrá allowlist mínima para archivos históricos, archivos de esta propia migración y documentación histórica. Runtime, nueva documentación operativa, validaciones activas y catálogo posterior no tendrán excepciones.

## 7. Documentación orientada a carga cognitiva

```text
docs/
  general/
    README.md
    arquitectura.md
    acceso-y-seguridad.md
    persistencia-y-migraciones.md
    despliegue-y-recuperacion.md
  modulos/
    vehiculos/
      README.md
      dominio-y-casos-de-uso.md
      persistencia.md
```

`docs/general/README.md` será la entrada: qué es la aplicación, mapa núcleo/módulos, camino rápido para desarrollo y enlaces. Cada documento abrirá con decisiones y checklist verificable; el contexto y casos límite irán después.

La documentación de vehículos enlazará las reglas comunes en lugar de duplicar RLS, bootstrap o recuperación. `supabase/migrations/README.md` puede quedar como guía ejecutable corta que enlace a `docs/general/persistencia-y-migraciones.md`; no debe mantener una segunda política operativa contradictoria.

Al sincronizar/archivar, se publicarán:

- `openspec/specs/app-familiar-core/spec.md`;
- `openspec/specs/modulo-vehiculos/spec.md`.

Las specs canónicas anteriores y archivos archivados permanecen inmutables como historial.

## 8. Archivos y áreas de cambio previstos

| Área | Cambio |
|---|---|
| `src/nucleo-familiar/**` | Extraer contratos, servicios, identidad, bootstrap, preflight y guardas de seguridad. |
| `src/composicion/servidor/**` | Crear alcance por solicitud y resolver contexto una sola vez. |
| `src/modulos/vehiculos/**` | Eliminar responsabilidades del núcleo; actualizar imports y tablas `fam_ve_*`. |
| `scripts/bootstrap-admin.ts` | Importar bootstrap desde núcleo y conservar aislamiento administrativo. |
| `supabase/migrations/<nueva>_family_app_modularization.sql` | Ejecutar el corte atómico no destructivo. |
| `supabase/validation/**` y `scripts/validate-supabase-rls.sh` | Validar contrato final, integridad, RLS y concurrencia. |
| `src/compartido/pruebas/**` | Actualizar contratos del harness y búsquedas de seguridad. |
| `docs/general/**` | Arquitectura, acceso, migración y recuperación comunes. |
| `docs/modulos/vehiculos/**` | Dominio y persistencia específica. |
| `openspec/specs/**` | Sincronización canónica durante archivo, no durante apply inicial. |

Los movimientos deben preservar historial con renames cuando sea posible. No se mezclarán cambios funcionales ni traducciones masivas de identificadores sin relación con la frontera.

## 9. Plan de entrega y carga de revisión

### Pronóstico

- **Líneas estimadas:** claramente más de 400 entre SQL, harness RLS, movimientos TypeScript, pruebas y documentación.
- **Riesgo del presupuesto de 400 líneas:** alto.
- **PR encadenadas recomendadas:** sí.
- **Decisión necesaria antes de apply:** sí; elegir estrategia de cadena y aceptar que el corte esquema/código se activa como una sola release.

### Cortes de revisión propuestos

1. **Frontera del núcleo y composición**, sin cambiar nombres de persistencia: mover identidad/bootstrap y hacer que vehículos consuma contexto. Pruebas de imports y composición.
2. **Contrato de migración y evidencia**, con tests RED y migración transaccional `fam_*`: inventario, preflight, SQL, preservación de IDs/relaciones y nombres de catálogo. Por su densidad de seguridad puede requerir una excepción documentada al límite de 400 líneas; dividir el SQL solo para reducir el contador sería peor diseño.
3. **Consumidores y validación runtime `fam_*`**: adaptadores, bootstrap, fixtures, harness RLS, concurrencia y búsqueda de referencias activas.
4. **Documentación y sincronización OpenSpec**: estructura `docs/`, guías y specs canónicas al archivar.

Los cortes 2 y 3 pueden revisarse por separado, pero no son desplegables de forma independiente. Deben encadenarse en una rama de integración o mantenerse sin despliegue hasta que el conjunto esté verificado. El gate de release exige backup, preflight, migración, despliegue de consumidores y validación post-corte en la ventana coordinada.

Por afectar RLS, migración y recuperación, la revisión de implementación debe priorizar riesgo, fiabilidad y resiliencia; no basta una revisión de legibilidad.

## 10. Restricciones y preguntas que las tareas deben preservar

### Restricciones cerradas

- Mantener `household_id`/`householdId` en este cambio.
- No crear puente, alias o vista `mv_*`.
- No usar `drop`, `truncate`, reset global ni copia destructiva.
- No tocar objetos de otras aplicaciones del Supabase compartido.
- No activar código antiguo contra esquema nuevo ni código nuevo contra esquema antiguo.
- No usar `service_role` en runtime ordinario.
- No cambiar la matriz `admin`/`editor`, selección multi-hogar ni comportamiento MVP.
- No reescribir migraciones o specs archivadas.
- No aceptar el corte sin evidencia de RLS, IDs, relaciones y último administrador.

### Confirmaciones operativas pendientes antes de ejecutar, no antes de planificar tareas

- Identificar el mecanismo real de backup/snapshot y demostrar restauración en el entorno self-hosted.
- Confirmar cómo se pausa el tráfico y se evita que jobs externos escriban durante la ventana.
- Inventariar consumidores externos de `mv_*`; cualquier consumidor no explicado bloquea el corte.
- Elegir estrategia de PR encadenadas y registrar la excepción de tamaño si el corte SQL coherente supera 400 líneas.
- Fijar timeouts y ventana según volumen/locks observados en el preflight, no con valores arbitrarios en diseño.

## 11. Criterios de aceptación del diseño

- El núcleo puede resolver un contexto familiar sin importar vehículos.
- Vehículos opera solo con contexto server-side recibido.
- Las cinco tablas finales existen con los nombres aprobados y conservan datos/relaciones.
- Todos los objetos activos propietarios usan prefijos `fam_*`; no quedan consumidores productivos `mv_*`.
- `household_id` permanece estable y su conservación está cubierta por pruebas.
- La migración es transaccional, no destructiva, bloqueante ante ambigüedad y recuperable.
- RLS, grants, roles separados, bootstrap y último administrador conservan su comportamiento.
- La documentación distingue reglas generales y específicas sin duplicación contradictoria.
- El plan de tareas aplica TDD estricto y protege la carga de revisión.
