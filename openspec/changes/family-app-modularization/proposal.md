# Propuesta: modularizar la aplicación familiar

## Decisión

Evolucionar el producto desde una aplicación centrada en vehículos hacia una única **aplicación familiar modular**. El acceso, los hogares, sus miembros y los roles de plataforma formarán el núcleo común; la gestión de vehículos será el primer módulo funcional.

El cambio realizará un **corte atómico** del contrato de persistencia `mv_*` al contrato `fam_*`. No se mantendrá un puente de compatibilidad ni quedarán objetos `mv_*` como contrato final. El corte deberá ejecutarse mediante una migración controlada que preserve comportamiento, relaciones y seguridad, sin asumir que la instancia Supabase compartida está vacía.

## Motivación

La aplicación debe poder incorporar capacidades familiares —por ejemplo, notas o cesta de la compra— sin convertir cada una en una aplicación independiente ni duplicar autenticación, hogares, membresías y reglas de acceso.

La estructura actual mezcla responsabilidades comunes de la familia con responsabilidades propias de vehículos bajo nombres `mv_*`. Esto dificulta explicar los límites del producto, reutilizar el contexto familiar y reconocer en la instancia Supabase compartida qué objetos pertenecen a la aplicación familiar y a cada módulo.

## Resultado esperado

Tras el cambio:

- existirá una sola aplicación familiar con un núcleo común y módulos funcionales diferenciados;
- el módulo de vehículos conservará el comportamiento vigente del MVP;
- la autenticación y el acceso familiar conservarán sus reglas actuales;
- todos los objetos de persistencia de esta aplicación utilizarán el prefijo `fam_`, con un subprefijo de módulo cuando corresponda;
- la documentación y las especificaciones distinguirán claramente entre reglas generales y reglas del módulo de vehículos;
- la arquitectura permitirá añadir módulos futuros sin duplicar el núcleo familiar ni acoplarlos al dominio de vehículos.

## Alcance

### Núcleo de la aplicación familiar

El núcleo común incluirá:

- hogares y miembros del hogar;
- resolución de identidad y contexto familiar en servidor;
- roles familiares `admin` y `editor`;
- roles de plataforma, preservando su comportamiento actual y separándolos de los roles familiares;
- reglas transversales de autenticación, autorización y aislamiento por hogar;
- bootstrap y comprobaciones previas relacionadas con hogares, membresías y roles;
- contratos comunes que los módulos consuman sin depender de detalles de persistencia internos.

Su contrato de tablas será:

- `fam_hogares`;
- `fam_miembros_hogar`;
- `fam_roles_plataforma`.

### Módulo de vehículos

El módulo conservará:

- alta, listado y desactivación lógica de vehículos;
- registro e histórico de mantenimientos y averías;
- actualización automática y corrección manual del kilometraje;
- cálculo de próximos vencimientos;
- unicidad de matrícula por hogar, incluso para vehículos inactivos;
- conservación de relaciones, eventos, costes e histórico.

Su contrato de tablas será:

- `fam_ve_vehiculos`;
- `fam_ve_eventos_vehiculo`.

El módulo consumirá el contexto familiar proporcionado por el núcleo. No resolverá por sí mismo la identidad ni aceptará del cliente un identificador de hogar como fuente confiable.

### Persistencia y corte atómico

El cambio incluirá una migración versionada y controlada desde los objetos `mv_*` actuales hacia los objetos `fam_*` definidos. El corte deberá abarcar tablas y todas sus dependencias relevantes: relaciones, índices, restricciones, funciones, triggers, políticas RLS, grants, bootstrap, validaciones y consumidores de aplicación.

Aunque la aplicación no está desplegada y no contiene datos de producción, la migración:

- no podrá depender de `drop`, `truncate`, reinicios globales ni recreaciones destructivas;
- deberá preservar identificadores, filas y relaciones si existiesen datos inesperados;
- deberá comprobar antes del corte que no existen consumidores externos de `mv_*` en la instancia compartida;
- deberá finalizar sin referencias productivas a `mv_*`;
- deberá disponer de una estrategia verificable de rollback o, cuando revertir resulte menos seguro, de fix-forward.

La secuencia técnica exacta, incluido el tratamiento de nombres internos como columnas, restricciones y funciones, se definirá en diseño sin alterar el contrato de tablas aprobado ni ampliar el alcance funcional.

### Documentación y especificaciones

La documentación se organizará en:

- `docs/general/` para arquitectura, acceso, seguridad, persistencia y operación comunes;
- `docs/modulos/vehiculos/` para dominio, casos de uso y persistencia específicos de vehículos.

Las nuevas especificaciones canónicas se separarán en:

- `openspec/specs/app-familiar-core/spec.md`;
- `openspec/specs/modulo-vehiculos/spec.md`.

Las especificaciones vigentes de vehículos y acceso familiar servirán como fuente del comportamiento que debe conservarse. Su historial archivado no se reescribirá.

## Comportamiento que debe preservarse

La modularización no cambia las capacidades de producto del MVP ni las reglas de acceso. En particular:

- una sesión válida se resuelve exclusivamente en servidor;
- el cliente no puede elegir ni imponer el hogar;
- cero membresías y múltiples membresías fallan de forma controlada;
- RLS mantiene el aislamiento entre hogares;
- el runtime ordinario no usa `service_role`;
- los roles familiares y de plataforma continúan separados;
- se preserva la invariante del último administrador del hogar;
- el bootstrap continúa siendo idempotente y falla cerrado ante conflictos;
- los vehículos, eventos, kilometraje, vencimientos y baja lógica mantienen sus reglas actuales.

## Fuera de alcance

Este cambio no incluye:

- implementar notas, cesta de la compra u otros módulos futuros;
- convertir los módulos en aplicaciones o despliegues independientes;
- añadir selección multi-hogar, panel general de plataforma o nuevas capacidades de administración;
- redefinir la matriz de permisos de `admin` y `editor`;
- cambiar las funcionalidades del MVP de vehículos;
- añadir OCR, IA, adjuntos, notificaciones o dashboard avanzado;
- modificar objetos de otras aplicaciones alojadas en la instancia Supabase compartida;
- mantener indefinidamente aliases, vistas o tablas de compatibilidad `mv_*`.

## Áreas afectadas

| Área | Impacto esperado |
|---|---|
| Modelo de producto | Nueva frontera entre núcleo familiar y módulo de vehículos. |
| Supabase | Renombrado/migración del contrato, RLS, funciones, triggers, grants, índices y restricciones. |
| Autenticación y acceso | Cambio de dependencias de persistencia sin alterar reglas de acceso. |
| Bootstrap y operación | Actualización de preflight, preparación idempotente y procedimientos de recuperación. |
| Aplicación | Adaptadores y composición alineados con el núcleo y el módulo. |
| Validación | Actualización de pruebas, fixtures, harness RLS y comprobaciones de migración. |
| Documentación/OpenSpec | Separación de contenido general y específico del módulo. |

## Riesgos y mitigaciones

| Riesgo | Mitigación requerida |
|---|---|
| Pérdida o alteración de datos por tratar el corte como una recreación | Migración no destructiva, preflight, copia recuperable y comparación de filas, UUID y relaciones. |
| RLS incompleta o debilitada por un renombrado parcial | Verificación explícita de políticas, funciones, grants y aislamiento entre hogares antes de aceptar el corte. |
| Referencias ocultas a `mv_*` | Inventario de consumidores y validación final que rechace referencias productivas restantes. |
| Afectar otra aplicación en Supabase compartido | Preflight de propiedad y consumidores; abortar ante dependencias externas no explicadas. |
| Acoplar el núcleo al dominio de vehículos | Contratos comunes sin tipos, reglas ni repositorios específicos de vehículos. |
| Reorganización amplia difícil de revisar | Dividir la ejecución en cortes revisables definidos en tareas, respetando el presupuesto de 400 líneas cuando sea viable. |
| Rollback inseguro después del corte de código y esquema | Definir punto de no retorno, condiciones de rollback y alternativa fix-forward antes de ejecutar la migración. |
| Deriva funcional durante una reorganización técnica | Usar las especificaciones vigentes como baseline y exigir evidencia de regresión para vehículos y acceso familiar. |

## Estrategia de rollback y recuperación

El diseño deberá establecer un procedimiento coordinado para código y esquema. Antes del corte se exigirá una copia recuperable y evidencia del estado inicial. Si el fallo ocurre antes del punto de no retorno, podrá abortarse o revertirse el renombrado de forma controlada. Si ya existen escrituras con el contrato nuevo o una reversión pudiera introducir pérdida o incoherencia, se priorizará un fix-forward que restaure seguridad y comportamiento.

En todos los casos, la recuperación deberá:

- mantener el acceso cerrado antes que ampliar permisos inciertos;
- evitar borrados o reasignaciones automáticas;
- verificar de nuevo RLS, relaciones y consumidores;
- dejar constancia del estado y de las acciones aplicadas.

## Criterios de éxito de la propuesta

La propuesta se considerará satisfecha cuando las fases posteriores demuestren que:

1. El producto se describe y organiza como una aplicación familiar modular, no como aplicaciones independientes.
2. El núcleo común contiene hogares, miembros, roles familiares, roles de plataforma y resolución segura del contexto familiar.
3. Vehículos queda delimitado como módulo consumidor del núcleo.
4. El contrato final utiliza `fam_hogares`, `fam_miembros_hogar`, `fam_roles_plataforma`, `fam_ve_vehiculos` y `fam_ve_eventos_vehiculo` sin referencias productivas finales a `mv_*`.
5. El corte es atómico para los consumidores y se ejecuta mediante una migración controlada, no destructiva y recuperable.
6. Se conserva todo el comportamiento verificable del MVP de vehículos y del acceso familiar, incluido RLS y el fallo cerrado.
7. La documentación queda separada entre `docs/general/` y `docs/modulos/vehiculos/`.
8. Las especificaciones canónicas quedan separadas entre `app-familiar-core` y `modulo-vehiculos` sin reescribir el historial archivado.
9. No se incorporan funcionalidades de nuevos módulos ni cambios de producto ajenos a la modularización.

## Decisiones confirmadas

- Se realizará un corte atómico porque la aplicación no está desplegada y no tiene datos de producción.
- Supabase es compartido y requiere prefijos inequívocos por aplicación y módulo.
- Los nombres de tablas y la documentación técnica serán en español.
- Los roles de plataforma se incorporan ahora al núcleo mediante `fam_roles_plataforma`, preservando el comportamiento existente.
- No quedará ningún contrato final `mv_*`.

## Siguiente paso

Crear las especificaciones de `app-familiar-core` y `modulo-vehiculos`, derivando requisitos verificables de esta propuesta y de las especificaciones canónicas vigentes, sin ampliar el alcance funcional.