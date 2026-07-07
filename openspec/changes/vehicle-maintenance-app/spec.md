# Especificación: aplicación de mantenimiento de vehículos

## Propósito

Definir el comportamiento verificable del MVP de una aplicación privada familiar para registrar vehículos, mantenimientos, averías, costes, kilometraje actual y próximos vencimientos, conservando el histórico aunque un vehículo deje de estar activo.

## Alcance del MVP / primer PR

Incluido:

- Alta y listado de vehículos.
- Desactivación lógica de vehículos.
- Registro manual de mantenimientos y averías.
- Actualización automática del kilometraje actual al registrar eventos con kilometraje más reciente.
- Corrección manual del kilometraje actual, tanto al alza como a la baja.
- Cálculo de vencimiento de mantenimientos recurrentes cuando exista próximo kilometraje o próxima fecha.

Fuera de alcance del MVP:

- Adjuntos de facturas, fotos o documentos.
- OCR de facturas.
- Ingesta de manuales con IA.
- Chat sobre manuales.
- Notificaciones push/email.
- Matriz detallada de permisos por rol.
- Dashboard avanzado.
- Borrado físico de vehículos o eventos.

## Requisitos funcionales

### Requisito: gestión de vehículos

El sistema MUST permitir registrar vehículos familiares con, como mínimo, marca, modelo, año, combustible, matrícula, kilometraje actual, estado, fecha de compra y fecha de alta en la aplicación.

#### Escenario: registrar un vehículo válido

- GIVEN una persona usuaria con acceso a la aplicación familiar
- WHEN registra un vehículo con todos los datos obligatorios válidos
- THEN el vehículo queda disponible en el listado de vehículos
- AND el vehículo conserva su fecha de alta en la aplicación.

#### Escenario: impedir alta incompleta

- GIVEN una persona usuaria con acceso a la aplicación familiar
- WHEN intenta registrar un vehículo sin un dato obligatorio
- THEN el sistema rechaza el alta
- AND informa qué datos deben completarse.

### Requisito: listado de vehículos

El sistema MUST mostrar los vehículos registrados y su información principal, incluyendo matrícula, marca, modelo, estado y kilometraje actual.

#### Escenario: consultar la flota familiar

- GIVEN existen vehículos registrados
- WHEN la persona usuaria abre el listado de vehículos
- THEN ve los vehículos registrados con sus datos principales
- AND puede distinguir vehículos activos e inactivos.

### Requisito: desactivación lógica de vehículos

El sistema MUST permitir desactivar vehículos sin borrarlos físicamente, para conservar su histórico de eventos y costes.

#### Escenario: desactivar un vehículo

- GIVEN existe un vehículo activo con o sin eventos asociados
- WHEN la persona usuaria lo desactiva
- THEN el vehículo cambia a estado inactivo
- AND sus eventos históricos siguen disponibles para consulta.

#### Escenario: conservar histórico tras desactivación

- GIVEN existe un vehículo inactivo con eventos registrados
- WHEN la persona usuaria consulta su histórico
- THEN el sistema muestra sus mantenimientos y averías anteriores.

### Requisito: registro de eventos de vehículo

El sistema MUST permitir registrar manualmente eventos asociados a un vehículo con tipo mantenimiento o avería, descripción, kilometraje, fecha, taller/proveedor, coste, notas y próximos vencimientos opcionales por kilometraje o fecha.

#### Escenario: registrar un mantenimiento

- GIVEN existe un vehículo registrado
- WHEN la persona usuaria añade un mantenimiento con fecha, kilometraje, proveedor, coste y descripción
- THEN el evento queda asociado al vehículo
- AND el histórico del vehículo muestra el mantenimiento registrado.

#### Escenario: registrar una avería

- GIVEN existe un vehículo registrado
- WHEN la persona usuaria añade una avería con fecha, kilometraje, proveedor, coste y descripción
- THEN el evento queda asociado al vehículo
- AND el histórico del vehículo muestra la avería registrada.

#### Escenario: registrar evento con próximos vencimientos opcionales

- GIVEN existe un vehículo registrado
- WHEN la persona usuaria añade un evento con próximo vencimiento por kilómetros, por fecha o ambos
- THEN el sistema conserva esos vencimientos asociados al evento.

### Requisito: actualización automática del kilometraje

El sistema MUST actualizar automáticamente el kilometraje actual del vehículo cuando se registra un evento con un kilometraje superior al kilometraje actual del vehículo.

#### Escenario: evento con kilometraje más reciente

- GIVEN un vehículo tiene 120000 km actuales
- WHEN se registra un evento del vehículo con 120005 km
- THEN el kilometraje actual del vehículo pasa a ser 120005 km.

#### Escenario: evento histórico con kilometraje anterior

- GIVEN un vehículo tiene 120000 km actuales
- WHEN se registra un evento del vehículo con 118000 km
- THEN el kilometraje actual del vehículo permanece en 120000 km
- AND el evento se conserva con 118000 km.

### Requisito: corrección manual del kilometraje

El sistema MUST permitir corregir manualmente el kilometraje actual de un vehículo tanto al alza como a la baja, para resolver errores de entrada manual o futuras lecturas OCR incorrectas.

#### Escenario: corregir kilometraje al alza

- GIVEN un vehículo tiene 120000 km actuales
- WHEN la persona usuaria corrige manualmente el kilometraje a 121000 km
- THEN el vehículo queda con 121000 km actuales.

#### Escenario: corregir kilometraje a la baja

- GIVEN un vehículo tiene 120000 km actuales por un dato erróneo
- WHEN la persona usuaria corrige manualmente el kilometraje a 119500 km
- THEN el vehículo queda con 119500 km actuales.

### Requisito: vencimiento de mantenimientos recurrentes

El sistema MUST considerar vencido un mantenimiento recurrente cuando llegue primero cualquiera de sus condiciones configuradas: kilometraje objetivo o fecha objetivo.

#### Escenario: vence por kilometraje antes que por fecha

- GIVEN un evento de mantenimiento tiene próximo vencimiento a 130000 km o el 2027-01-01
- AND el vehículo alcanza 130000 km antes del 2027-01-01
- WHEN el sistema evalúa el vencimiento
- THEN el mantenimiento se considera vencido.

#### Escenario: vence por fecha antes que por kilometraje

- GIVEN un evento de mantenimiento tiene próximo vencimiento a 130000 km o el 2027-01-01
- AND llega el 2027-01-01 antes de que el vehículo alcance 130000 km
- WHEN el sistema evalúa el vencimiento
- THEN el mantenimiento se considera vencido.

#### Escenario: no vence si no llegó ninguna condición

- GIVEN un evento de mantenimiento tiene próximo vencimiento a 130000 km o el 2027-01-01
- AND el vehículo tiene menos de 130000 km
- AND la fecha actual es anterior al 2027-01-01
- WHEN el sistema evalúa el vencimiento
- THEN el mantenimiento no se considera vencido.

### Requisito: roles iniciales

El sistema MUST reconocer los roles iniciales `admin` y `editor` como conceptos del dominio, aunque la matriz detallada de permisos quede fuera del MVP.

#### Escenario: rol registrado en el dominio

- GIVEN una persona usuaria pertenece a la aplicación familiar
- WHEN el sistema representa su rol
- THEN el rol es `admin` o `editor`.

## Reglas de negocio y dominio

- El sistema MUST conservar el histórico de vehículos y eventos aunque un vehículo se desactive.
- El sistema MUST usar baja lógica para vehículos; el borrado físico queda fuera del MVP.
- El sistema MUST permitir nuevos vehículos además de la flota inicial de 2 coches y 2 motocicletas.
- El kilometraje de un evento MUST conservarse tal como fue registrado, aunque no actualice el kilometraje actual del vehículo.
- La corrección manual del kilometraje actual MUST poder subir o bajar el valor actual.
- Un mantenimiento con próximo vencimiento por kilometraje y fecha MUST vencer por la condición que ocurra primero.
- Las tablas de persistencia para Supabase MUST usar el prefijo `mv_` cuando exista implementación de base de datos.
- El modelo SHOULD dejar espacio para adjuntos futuros sin exigir adjuntos en el MVP.

## Requisitos no funcionales

### Requisito: uso familiar privado

El sistema MUST estar orientado a uso privado familiar y preparar la incorporación de autenticación sin reescribir el dominio.

#### Escenario: arquitectura preparada para autenticación futura

- GIVEN el MVP puede empezar sin autenticación real
- WHEN se diseñe el dominio y los casos de uso
- THEN las reglas principales de vehículos y eventos no dependen de una solución concreta de autenticación.

### Requisito: uso desde ordenador y móvil

El sistema SHOULD poder utilizarse desde ordenador y móvil.

#### Escenario: consultar desde distintos dispositivos

- GIVEN una persona usuaria accede desde un ordenador o móvil compatible
- WHEN consulta vehículos o registra eventos
- THEN las funciones del MVP siguen siendo utilizables.

### Requisito: despliegue previsto

El sistema SHOULD ser compatible con despliegue en VPS gestionado con Dokploy y Supabase self-hosted compartido.

#### Escenario: persistencia con Supabase compartido

- GIVEN la aplicación usa Supabase self-hosted compartido
- WHEN se definan tablas de persistencia
- THEN sus nombres usan el prefijo `mv_` para evitar colisiones con otras aplicaciones.

### Requisito: verificabilidad del MVP

El sistema MUST permitir validar los comportamientos críticos del MVP mediante pruebas o criterios de aceptación reproducibles.

#### Escenario: validar actualización de kilometraje

- GIVEN existen pruebas o validaciones de dominio
- WHEN se registra un evento con kilometraje superior al actual
- THEN la evidencia verifica que el kilometraje actual del vehículo se actualiza.

## Criterios de aceptación del MVP

- Se puede registrar al menos un coche o motocicleta con los datos obligatorios.
- Se puede listar la flota y distinguir vehículos activos e inactivos.
- Se puede desactivar un vehículo sin perder su histórico.
- Se puede registrar un mantenimiento asociado a un vehículo.
- Se puede registrar una avería asociada a un vehículo.
- Registrar un evento con kilometraje superior actualiza el kilometraje actual del vehículo.
- Registrar un evento histórico con kilometraje inferior no reduce automáticamente el kilometraje actual.
- La persona usuaria puede corregir manualmente el kilometraje actual hacia arriba o hacia abajo.
- Un mantenimiento recurrente vence cuando llega el kilometraje objetivo o la fecha objetivo, lo que ocurra primero.
- El MVP no implementa OCR, IA, adjuntos, notificaciones ni dashboard avanzado.

## Casos límite

- Vehículo sin eventos: MUST aparecer en el listado si fue registrado.
- Vehículo inactivo: MUST conservar eventos y datos principales.
- Evento con kilometraje inferior al actual: MUST guardarse sin modificar el kilometraje actual.
- Corrección manual por debajo del último evento registrado: MUST permitirse para corregir errores, sin modificar automáticamente los eventos históricos.
- Evento con un solo próximo vencimiento: MUST evaluarse únicamente contra la condición informada.
- Evento sin próximo vencimiento: MUST quedar registrado sin estado de recurrencia vencida.
- Coste no informado o coste cero: MAY permitirse si el producto decide registrar eventos sin coste; si se exige coste, el sistema MUST rechazar valores inválidos de forma explícita.
- Matrícula duplicada: SHOULD evitarse para vehículos activos, salvo decisión explícita posterior para casos excepcionales.

## Compatibilidad futura

El MVP no MUST implementar adjuntos, OCR, manuales PDF ni IA, pero el modelo SHOULD evitar decisiones que impidan añadir posteriormente:

- adjuntos de fotos o facturas a eventos;
- extracción OCR de datos de facturas;
- manuales PDF asociados a vehículos;
- extracción asistida por IA de mantenimientos desde manuales;
- chat de consulta sobre manuales.

## Suposiciones y riesgos de especificación

- La propuesta no incluye una sección formal de `Capabilities`; esta especificación infiere un único dominio inicial de `vehículos` que agrupa vehículos, eventos, kilometraje y vencimientos.
- La matriz detallada de permisos por rol queda pendiente; por ahora solo se especifica la existencia conceptual de `admin` y `editor`.
- El stack todavía no está definido; los requisitos evitan imponer framework o implementación concreta.
- La regla exacta de coste obligatorio/opcional requiere decisión de producto antes de implementación si el formulario necesita validación estricta.
