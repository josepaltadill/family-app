# Especificación del módulo de vehículos

## Propósito

Definir el módulo funcional de vehículos como consumidor del núcleo de la aplicación familiar. La modularización MUST conservar el comportamiento verificable del MVP vigente y trasladar su contrato de persistencia al prefijo final `fam_ve_`.

## Requisitos

### Requisito: consumir el contexto familiar sin confiar en el cliente

El módulo MUST recibir del núcleo el contexto familiar resuelto server-side. MUST NOT resolver por sí mismo la identidad ni aceptar un identificador de hogar seleccionado por el cliente como fuente confiable.

#### Escenario: operación con contexto válido

- GIVEN una persona tiene sesión válida y una membresía familiar utilizable
- WHEN ejecuta una operación de vehículos
- THEN el módulo usa el hogar resuelto por el núcleo
- AND no permite sustituirlo mediante URL, formulario, cookie, cabecera o parámetro.

#### Escenario: contexto no disponible

- GIVEN la sesión es inválida, no hay membresía o hay múltiples membresías
- WHEN se solicita una operación del módulo
- THEN la operación falla cerrado
- AND no devuelve ni modifica vehículos o eventos.

### Requisito: establecer las tablas finales del módulo

El módulo MUST utilizar `fam_ve_vehiculos` para vehículos y `fam_ve_eventos_vehiculo` para eventos. Relaciones, índices, restricciones, funciones, triggers, políticas RLS y grants del módulo MUST referenciar el contrato final y MUST NOT dejar referencias productivas a `mv_*`.

#### Escenario: verificar el contrato del módulo

- GIVEN la migración y los consumidores del módulo están actualizados
- WHEN se inspeccionan esquema, código y validaciones productivas
- THEN las tablas del módulo usan los nombres `fam_ve_*`
- AND no queda ninguna referencia productiva final a `mv_*`.

### Requisito: registrar y listar vehículos

El sistema MUST permitir registrar vehículos con marca, modelo, año, combustible, matrícula, kilometraje actual, estado, fecha de compra y fecha de alta. MUST mostrar en el listado la información principal, incluyendo matrícula, marca, modelo, estado y kilometraje actual.

#### Escenario: registrar un vehículo válido

- GIVEN una persona tiene acceso al hogar resuelto
- WHEN registra un vehículo con los datos obligatorios válidos
- THEN el vehículo queda disponible en el listado
- AND conserva su fecha de alta.

#### Escenario: rechazar alta incompleta

- GIVEN una persona intenta registrar un vehículo sin un dato obligatorio
- WHEN envía el alta
- THEN el sistema la rechaza
- AND informa los datos que deben completarse.

#### Escenario: distinguir estados

- GIVEN existen vehículos activos e inactivos
- WHEN se consulta la flota familiar
- THEN el listado muestra ambos estados de forma distinguible.

### Requisito: mantener unicidad y aislamiento de matrícula

La matrícula MUST ser única dentro de cada hogar, incluso cuando el vehículo esté inactivo. La misma matrícula MAY existir en hogares distintos. Vehículos y eventos MUST permanecer aislados por hogar mediante RLS.

#### Escenario: matrícula duplicada en el mismo hogar

- GIVEN un hogar ya tiene un vehículo con una matrícula
- WHEN se intenta registrar otro vehículo con esa matrícula
- THEN el alta se rechaza
- AND el rechazo también ocurre si el primer vehículo está inactivo.

#### Escenario: matrícula igual en hogares distintos

- GIVEN dos hogares distintos
- WHEN cada uno registra un vehículo con la misma matrícula
- THEN ambos registros pueden existir
- AND cada hogar solo puede consultar sus propios registros.

### Requisito: desactivar vehículos sin borrar histórico

El sistema MUST permitir la desactivación lógica de un vehículo y MUST conservar sus datos, eventos, costes e histórico. El módulo MUST NOT implementar borrado físico de vehículos ni eventos.

#### Escenario: desactivar un vehículo

- GIVEN existe un vehículo activo, con o sin eventos
- WHEN una persona autorizada lo desactiva
- THEN cambia a estado inactivo
- AND el registro permanece disponible.

#### Escenario: consultar histórico inactivo

- GIVEN existe un vehículo inactivo con mantenimientos o averías
- WHEN se consulta su histórico
- THEN los eventos anteriores y sus costes siguen disponibles.

### Requisito: registrar eventos de mantenimiento y avería

El sistema MUST permitir registrar manualmente eventos de tipo mantenimiento o avería asociados a un vehículo, con descripción, kilometraje, fecha, taller o proveedor, coste, notas y próximos vencimientos opcionales por kilometraje o fecha.

#### Escenario: registrar mantenimiento

- GIVEN existe un vehículo del hogar actual
- WHEN se registra un mantenimiento válido
- THEN el evento queda asociado al vehículo
- AND aparece en su histórico.

#### Escenario: registrar avería

- GIVEN existe un vehículo del hogar actual
- WHEN se registra una avería válida
- THEN el evento queda asociado al vehículo
- AND aparece en su histórico.

#### Escenario: conservar vencimientos opcionales

- GIVEN un evento informa próximo vencimiento por kilometraje, fecha o ambos
- WHEN se guarda el evento
- THEN conserva las condiciones informadas
- AND un evento sin vencimiento se registra sin estado de recurrencia vencida.

### Requisito: actualizar y corregir el kilometraje

El sistema MUST actualizar automáticamente el kilometraje actual del vehículo únicamente cuando un evento tenga un kilometraje superior. MUST conservar el kilometraje del evento tal como fue registrado. MUST permitir corregir manualmente el kilometraje actual tanto al alza como a la baja, sin modificar eventos históricos.

#### Escenario: evento con kilometraje superior

- GIVEN un vehículo tiene 120000 km actuales
- WHEN se registra un evento con 120005 km
- THEN el kilometraje actual pasa a 120005 km
- AND el evento conserva 120005 km.

#### Escenario: evento histórico con kilometraje inferior

- GIVEN un vehículo tiene 120000 km actuales
- WHEN se registra un evento con 118000 km
- THEN el kilometraje actual permanece en 120000 km
- AND el evento se conserva con 118000 km.

#### Escenario: corrección manual al alza o a la baja

- GIVEN un vehículo tiene 120000 km actuales
- WHEN se corrige manualmente a 121000 km o a 119500 km
- THEN el vehículo conserva exactamente el valor corregido
- AND los eventos históricos no se modifican.

### Requisito: evaluar vencimientos recurrentes

El sistema MUST considerar vencido un mantenimiento recurrente cuando llegue primero cualquiera de sus condiciones configuradas: kilometraje objetivo o fecha objetivo. Si solo existe una condición, MUST evaluar únicamente esa condición. Las evaluaciones por fecha MUST usar un reloj y una zona horaria controlados por la aplicación o por la prueba, no la fecha ambiente implícita del proceso.

#### Escenario: vence por kilometraje

- GIVEN un mantenimiento tiene objetivo de 130000 km o fecha 2027-01-01
- AND el vehículo alcanza 130000 km antes de esa fecha
- WHEN se evalúa el vencimiento
- THEN el mantenimiento se considera vencido.

#### Escenario: vence por fecha

- GIVEN un mantenimiento tiene objetivo de 130000 km o fecha 2027-01-01
- AND llega esa fecha antes de alcanzar el kilometraje
- WHEN se evalúa el vencimiento
- THEN el mantenimiento se considera vencido.

#### Escenario: aún no vence

- GIVEN no se ha alcanzado ningún objetivo configurado
- WHEN se evalúa el vencimiento
- THEN el mantenimiento no se considera vencido.

### Requisito: preservar el comportamiento del MVP sin ampliarlo

El módulo MUST conservar las capacidades actuales de alta, listado, baja lógica, eventos, costes, kilometraje y vencimientos. MUST NOT introducir notas, cesta de la compra, OCR, IA, adjuntos, notificaciones, dashboard avanzado, nueva matriz detallada de permisos ni nuevas funcionalidades de producto.

#### Escenario: validar la frontera del módulo

- GIVEN se revisan los casos de uso y persistencia del módulo
- WHEN se comparan con el MVP vigente
- THEN todos los comportamientos existentes siguen verificables
- AND ningún caso de uso fuera de alcance queda implementado como parte de la modularización.

### Requisito: organizar la documentación específica del módulo

La documentación de dominio, casos de uso y persistencia de vehículos MUST residir bajo `docs/modulos/vehiculos/`. Las reglas comunes de acceso, seguridad, migración y operación MUST permanecer referenciadas desde `docs/general/` y no duplicarse como reglas contradictorias.

#### Escenario: localizar una regla de vehículos

- GIVEN una persona necesita revisar el comportamiento o persistencia de vehículos
- WHEN consulta la documentación
- THEN encuentra la regla específica bajo `docs/modulos/vehiculos/`
- AND puede distinguirla de las reglas transversales del núcleo.
