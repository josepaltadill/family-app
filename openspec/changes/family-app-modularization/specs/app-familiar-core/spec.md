# Especificación del núcleo de la aplicación familiar

## Propósito

Definir el núcleo común de una única aplicación familiar modular: hogares, membresías, roles, contexto seguro y contrato de persistencia compartido. El núcleo debe preservar el comportamiento vigente de autenticación y acceso familiar mientras permite que los módulos consuman contratos comunes sin depender de sus tablas internas.

## Requisitos

### Requisito: delimitar el núcleo familiar

El sistema MUST mantener en el núcleo los hogares, los miembros del hogar, los roles familiares `admin` y `editor`, los roles de plataforma y la resolución server-side del contexto familiar. El núcleo MUST separar estos conceptos de las reglas específicas de vehículos.

#### Escenario: módulo consume contexto familiar

- GIVEN un módulo funcional necesita operar para una persona autenticada
- WHEN solicita el contexto familiar
- THEN recibe el contexto resuelto por el núcleo
- AND no necesita resolver identidad ni consultar directamente tablas de otro módulo.

#### Escenario: roles separados

- GIVEN una persona tiene rol familiar `admin` o `editor`, con o sin rol de plataforma
- WHEN el sistema evalúa su acceso
- THEN evalúa ambos roles de forma independiente
- AND el rol familiar no concede privilegios de plataforma.

### Requisito: resolver identidad y hogar exclusivamente en servidor

El sistema MUST obtener la identidad de la sesión validada por el servidor y MUST resolver desde la membresía utilizable el hogar operativo antes de acceder a datos familiares. El cliente MUST NOT poder elegir ni imponer el hogar mediante URL, formulario, cookie, cabecera o parámetro.

#### Escenario: membresía única válida

- GIVEN una sesión válida y exactamente una membresía familiar utilizable
- WHEN la persona solicita una operación protegida
- THEN el servidor resuelve la membresía y el hogar antes de la operación
- AND la operación utiliza ese contexto.

#### Escenario: valor de hogar enviado por el cliente

- GIVEN una persona autenticada envía un identificador de hogar distinto al resuelto
- WHEN solicita una operación familiar
- THEN el sistema ignora o rechaza el valor no confiable
- AND no cambia el contexto server-side.

### Requisito: fallar cerrado ante contexto no utilizable

El sistema MUST fallar cerrado cuando la sesión no sea válida, no exista membresía utilizable o existan múltiples membresías válidas en este primer corte. No MUST seleccionar un hogar por defecto, por orden accidental de consulta ni por entrada del cliente, y no MUST devolver datos operativos en esos casos.

#### Escenario: sesión ausente o caducada

- GIVEN una sesión ausente, inválida o caducada
- WHEN se solicita una ruta u operación protegida
- THEN el sistema invalida el contexto derivado
- AND no carga datos familiares
- AND dirige a la frontera de autenticación.

#### Escenario: cero membresías

- GIVEN una sesión válida sin membresía familiar utilizable
- WHEN se completa el acceso o se solicita una ruta privada
- THEN el sistema muestra un estado controlado sin acceso
- AND no selecciona un hogar ni devuelve datos operativos.

#### Escenario: múltiples membresías

- GIVEN una sesión válida con dos o más membresías familiares utilizables
- WHEN se resuelve el acceso
- THEN el sistema no selecciona ninguna silenciosamente
- AND mantiene el acceso al panel familiar bloqueado.

### Requisito: conservar bootstrap y la invariante del último administrador

El bootstrap del núcleo MUST ser idempotente, MUST basarse en identidades estables de Auth y MUST abortar ante conflictos sin reasignar, sobrescribir ni borrar datos no previstos. El sistema MUST preservar la existencia de al menos un administrador del hogar.

#### Escenario: bootstrap repetido sin conflicto

- GIVEN el hogar y sus membresías esperadas ya existen y han sido verificadas
- WHEN se ejecuta de nuevo el bootstrap autorizado
- THEN reutiliza las identidades verificadas
- AND no crea duplicados ni modifica datos no previstos.

#### Escenario: conflicto de bootstrap

- GIVEN existe una identidad ambigua, membresía duplicada o pertenencia inesperada
- WHEN se ejecuta el bootstrap
- THEN aborta sin borrar ni reasignar datos
- AND deja constancia del conflicto para resolución operativa.

#### Escenario: intento de eliminar el último administrador

- GIVEN un hogar tiene un único miembro con rol familiar `admin`
- WHEN una operación intenta eliminar o degradar ese último administrador
- THEN el sistema rechaza la operación
- AND el hogar conserva al menos un `admin`.

### Requisito: aplicar aislamiento RLS por hogar

Las operaciones ordinarias MUST ejecutarse con la identidad autenticada del usuario y MUST permanecer sujetas a RLS. El runtime ordinario MUST NOT usar `service_role`. Los datos de un hogar MUST NOT ser visibles ni modificables desde otro hogar.

#### Escenario: miembro accede a su hogar

- GIVEN una persona con membresía válida en un hogar
- WHEN consulta o modifica datos pertenecientes a ese hogar
- THEN RLS permite únicamente lo autorizado por las políticas vigentes.

#### Escenario: intento de acceso cruzado

- GIVEN una persona pertenece a un hogar y conoce el identificador de un registro de otro hogar
- WHEN intenta leerlo o modificarlo
- THEN RLS rechaza la operación
- AND no se expone el registro.

### Requisito: establecer el contrato final de persistencia `fam_*`

El contrato final de esta aplicación MUST utilizar exactamente las tablas `fam_hogares`, `fam_miembros_hogar`, `fam_roles_plataforma`, `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo`. Sus dependencias relevantes MUST quedar alineadas con el prefijo de su tabla propietaria, incluyendo relaciones, índices, restricciones, funciones, triggers, políticas RLS y grants. No MUST quedar ninguna referencia productiva final a `mv_*`, incluidos aliases, vistas o tablas de compatibilidad.

#### Escenario: validar nombres finales

- GIVEN el corte de persistencia ha terminado
- WHEN se inspecciona el esquema y los consumidores productivos
- THEN existen las cinco tablas con sus nombres finales
- AND no existen referencias productivas finales a `mv_*`.

#### Escenario: preservar seguridad con nombres nuevos

- GIVEN una operación ordinaria usa el contrato `fam_*`
- WHEN se evalúan sus políticas, funciones, grants y relaciones
- THEN mantienen el aislamiento por hogar y la separación de roles
- AND no dependen de un objeto productivo `mv_*`.

### Requisito: ejecutar un corte atómico y no destructivo

La migración versionada MUST realizar un corte atómico del contrato `mv_*` al contrato `fam_*`, sin puente de compatibilidad. MUST ser no destructiva: no puede depender de `drop`, `truncate`, reinicio global ni recreación destructiva, y MUST preservar identificadores, filas y relaciones si existen datos.

#### Escenario: preflight antes del corte

- GIVEN una instancia Supabase self-hosted compartida
- WHEN se inicia la migración
- THEN se verifica la propiedad de los objetos y la ausencia de consumidores externos no explicados de `mv_*`
- AND se registra una copia recuperable y el estado inicial de filas, UUIDs y relaciones
- AND se aborta ante una dependencia externa no resuelta.

#### Escenario: migrar datos existentes

- GIVEN existen filas, UUIDs, relaciones, eventos, costes o histórico bajo el contrato anterior
- WHEN se ejecuta el corte
- THEN se conservan esos datos y relaciones bajo el contrato final
- AND se conserva la unicidad de matrícula por hogar, incluidos vehículos inactivos.

#### Escenario: validación posterior

- GIVEN el corte ha finalizado
- WHEN se ejecutan las comprobaciones posteriores
- THEN se comparan filas, UUIDs, relaciones, RLS, último administrador y consumidores
- AND el corte solo se acepta si comportamiento y seguridad son equivalentes.

### Requisito: recuperar de forma segura ante un fallo del corte

La operación MUST definir antes de ejecutarse un punto de no retorno y una estrategia verificable de rollback o fix-forward. La recuperación MUST mantener el acceso cerrado antes que ampliar permisos inciertos, evitar borrados o reasignaciones automáticas y dejar constancia del estado y de las acciones realizadas.

#### Escenario: fallo antes del punto de no retorno

- GIVEN falla una validación o paso previo al punto de no retorno
- WHEN se activa la recuperación
- THEN se aborta o revierte de forma controlada
- AND no se pierden ni reasignan datos.

#### Escenario: fallo después del punto de no retorno

- GIVEN ya existen escrituras con el contrato `fam_*` o revertir podría causar incoherencia
- WHEN se activa la recuperación
- THEN se aplica fix-forward para restaurar seguridad y comportamiento
- AND se vuelven a verificar RLS, relaciones y consumidores antes de reabrir el acceso.

### Requisito: organizar documentación y especificaciones por frontera

La documentación MUST separar las reglas transversales en `docs/general/` y las reglas específicas de vehículos en `docs/modulos/vehiculos/`. Las especificaciones canónicas posteriores MUST separar el núcleo en `openspec/specs/app-familiar-core/spec.md` y vehículos en `openspec/specs/modulo-vehiculos/spec.md`, sin reescribir el historial archivado.

#### Escenario: localizar una regla transversal

- GIVEN una persona revisa arquitectura, acceso, seguridad, persistencia u operación común
- WHEN consulta la documentación
- THEN encuentra esa regla bajo `docs/general/`
- AND no necesita reconstruirla desde documentación específica de vehículos.

#### Escenario: conservar historial OpenSpec

- GIVEN existen especificaciones archivadas del MVP
- WHEN se publican las especificaciones canónicas modulares
- THEN el historial archivado permanece sin reescritura
- AND las nuevas especificaciones declaran explícitamente el contrato `fam_*` y el comportamiento heredado.

### Requisito: respetar los límites de producto

Este cambio MUST NOT implementar notas, cesta de la compra ni otros módulos futuros; MUST NOT crear aplicaciones o despliegues independientes; MUST NOT añadir selección multi-hogar, panel general de plataforma, nueva matriz de permisos, OCR, IA, adjuntos, notificaciones ni dashboard avanzado. MUST NOT modificar objetos de otras aplicaciones de la instancia Supabase compartida.

#### Escenario: validar no-regresión de alcance

- GIVEN se revisan los cambios de modularización
- WHEN se comparan con el alcance aprobado
- THEN solo se modifican el núcleo común, el módulo de vehículos, su persistencia, documentación y validación
- AND no aparece ninguna capacidad explícitamente fuera de alcance.
