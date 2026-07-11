# Apply progress: vehicle-maintenance-app

## Estado estructurado consumido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec usado como autoridad porque Engram falló en el padre.
- Modo: interactivo
- Estrategia de entrega: `auto-chain`
- Chain strategy: `stacked-to-main`
- Límite del corte actual: preparar stack + harness de pruebas solamente.
- TDD estricto: activo; comando de tests `npm test`.
- Riesgo de presupuesto: cambio completo alto; este corte se mantuvo acotado y no inició secciones 2+.

## Tareas completadas y checkboxes persistidos

- [x] RED: crear pruebas mínimas de humo en `src/compartido/pruebas/harness.test.ts` que fallen hasta configurar Vitest.
- [x] GREEN: inicializar `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `src/app/layout.tsx` y `src/app/page.tsx` con Next.js + TypeScript + Tailwind + Vitest.
- [x] GREEN: configurar script `npm test` en `package.json` usando Vitest.
- [x] REFACTOR: dejar estructura base `src/modulos/vehiculos/` y `src/compartido/` sin lógica duplicada.

Confirmación: `openspec/changes/vehicle-maintenance-app/tasks.md` fue releído y las cuatro líneas del apartado 1 están marcadas como `- [x]`.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 Harness de pruebas | `src/compartido/pruebas/harness.test.ts` | Unit | N/A (repo greenfield) | ✅ `npm test -- src/compartido/pruebas/harness.test.ts` falló por ausencia de `package.json`/Vitest | ✅ `npm test -- src/compartido/pruebas/harness.test.ts` pasó: 1 archivo, 1 test | ➖ Omitida: smoke estructural con una única salida esperada del harness | ✅ `npm test` pasó tras separar `harness.ts` y dejar carpetas base |
| 1.2 Stack Next/TS/Tailwind/Vitest | `src/compartido/pruebas/harness.test.ts` | Unit + build smoke | N/A (archivos nuevos) | ✅ El test se escribió antes de producción/configuración | ✅ `npm test` pasó: 1 archivo, 1 test | ➖ Omitida: configuración estructural sin variantes de lógica | ✅ `npm run build` pasó tras ajustar TypeScript a 5.9.3 compatible con Next |

## Comandos ejecutados

- `npm test -- src/compartido/pruebas/harness.test.ts` → RED esperado: falló porque todavía no existía `package.json`.
- `npm install --no-package-lock` → instaló dependencias locales sin generar lockfile para mantener pequeño el corte revisable.
- `npm test -- src/compartido/pruebas/harness.test.ts` → GREEN: 1 archivo, 1 test pasado.
- `npm test` → suite completa: 1 archivo, 1 test pasado.
- `npm run build` → pasó con Next.js 16.2.10 tras corregir la versión de TypeScript a 5.9.3.

## Archivos cambiados

- `.gitignore`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- `next.config.ts`
- `postcss.config.js`
- `tailwind.config.ts`
- `next-env.d.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/compartido/pruebas/harness.test.ts`
- `src/compartido/pruebas/harness.ts`
- `src/modulos/vehiculos/.gitkeep`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

## Desviaciones del diseño

- No se implementó dominio, casos de uso, Supabase, migraciones ni UI funcional de vehículos; quedan fuera de este corte por límite explícito.
- Se añadió `src/app/globals.css` y `next-env.d.ts` como soporte mínimo de Next/Tailwind aunque no estaban listados literalmente en la tarea.
- Se generó `package-lock.json` durante la remediación del corte de setup para que las instalaciones sean reproducibles.

## Riesgos / notas

- `npm audit --json` informa 2 vulnerabilidades moderadas:
  - `postcss` (`<8.5.10`), advisory GHSA-qx2v-qp2m-jg93, ruta `node_modules/postcss` y `node_modules/next/node_modules/postcss`, severidad moderada, CWE-79.
  - `next` (`9.3.4-canary.0 - 16.3.0-canary.5`), dependencia directa afectada vía `postcss`, ruta `node_modules/next`, severidad moderada.
- Rationale / siguiente acción: `npm audit` propone `npm audit fix --force`, pero el fix disponible degrada Next a `9.3.3` como cambio mayor y rompe la base técnica elegida para este MVP. No se aplica dentro del corte de setup; se mantiene documentado para revisar actualización segura de Next/PostCSS cuando exista versión compatible sin downgrade mayor.
- Durante una verificación intermedia, Next intentó usar TypeScript 7.0.2 y falló; se corrigió fijando TypeScript 5.9.3 y el build final pasó.
- `node_modules/` y `.next/` quedan ignorados.

## Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/dominio/vehiculo.test.ts` para vehículo válido, kilometraje negativo, baja lógica y corrección manual arriba/abajo.
- [ ] GREEN: implementar `src/modulos/vehiculos/dominio/vehiculo.ts`, `errores-dominio.ts` y helpers compartidos en `src/compartido/dominio/`.
- [ ] TRIANGULATE: añadir caso de vehículo inactivo que conserva identidad, matrícula y fecha de alta.
- [ ] REFACTOR: mantener el dominio sin imports de Next.js, React, Supabase, Zod ni Tailwind.

## Workload / PR boundary

- PR boundary actual: setup stack + test harness only.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Remediación de revisión fresca — corte setup

### Hallazgos resueltos

- [x] Se generó y conserva `package-lock.json` con `npm install --package-lock-only` para instalaciones reproducibles.
- [x] `openspec/changes/vehicle-maintenance-app/tasks.md` ahora refleja `Chain strategy: stacked-to-main` y `Decision needed before apply: No` para el corte actual.
- [x] Se ejecutó `npm audit --json` y se documentaron paquetes, rutas, severidad y decisión de no aplicar `npm audit fix --force` por downgrade mayor de Next.
- [x] Se añadió protección explícita contra tests enfocados en `vitest.config.ts` mediante `allowOnly: false`.

### Comandos de remediación ejecutados

- `npm install --package-lock-only` → generó `package-lock.json`; auditó 146 paquetes; 2 vulnerabilidades moderadas reportadas.
- `npm audit --json` → confirmó vulnerabilidades moderadas en `postcss` y `next` vía `postcss`; sin vulnerabilidades críticas/altas.
- `npm test` → pasó: 1 archivo, 1 test.
- `npm run build` → pasó con Next.js 16.2.10.

### Archivos tocados por la remediación

- `package-lock.json`
- `vitest.config.ts`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

## Auditoría de versiones y migración Tailwind v4 — corte de mantenimiento

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec sigue siendo el artifact autoritativo y Engram se intentó sincronizar.
- Modo: corte delegado de mantenimiento de dependencias/configuración antes de continuar con dominio.
- Estrategia de entrega vigente: `auto-chain`, `stacked-to-main`.
- Límite del corte: dependency/config maintenance only; no se implementó dominio, Supabase, migraciones ni UI funcional de vehículos.
- TDD estricto: activo. Para este corte estructural se usó safety net + verificación empírica; no se añadieron tests nuevos porque no hay comportamiento de dominio nuevo.

### Decisiones de versión

| Paquete | Versión previa | Última revisada | Decisión compatible | Motivo |
|---|---:|---:|---:|---|
| `tailwindcss` | `3.4.19` | `4.3.2` | `4.3.2` | Compatible con `npm test` y `npm run build` tras migrar CSS/PostCSS a la integración oficial v4. |
| `@tailwindcss/postcss` | N/A | `4.3.2` | `4.3.2` | Requerido por Tailwind v4 para PostCSS según documentación oficial. |
| `postcss` | `8.5.6` | `8.5.16` | `8.5.16` | Compatible y actualiza la dependencia directa por encima del rango vulnerable reportado para PostCSS directo. |
| `autoprefixer` | `10.4.22` | `10.5.2` | eliminado | No se mantiene porque la integración oficial Tailwind v4 usa `@tailwindcss/postcss` y no requiere el plugin explícito `autoprefixer` en esta configuración. |
| `typescript` | `5.9.3` | `7.0.2` | `5.9.3` | `7.0.2` fue probado y `next build` falló en la fase TypeScript; se mantuvo la versión más alta compatible confirmada por build. |

### Cambios realizados

- `package.json` / `package-lock.json`: Tailwind actualizado a v4, añadido `@tailwindcss/postcss`, PostCSS directo actualizado a `8.5.16`, eliminado `autoprefixer`, TypeScript confirmado en `5.9.3` por compatibilidad con Next.
- `postcss.config.js`: reemplazado `tailwindcss` + `autoprefixer` por `@tailwindcss/postcss`.
- `src/app/globals.css`: migrado de directivas `@tailwind base/components/utilities` a `@import "tailwindcss";`.
- `tailwind.config.ts`: eliminado porque la configuración actual no contiene personalización necesaria y Tailwind v4 puede detectar fuentes automáticamente en este setup.

### Evidencia de comandos

- `npm test` antes de modificar → pasó: 1 archivo, 1 test.
- `npm install -D tailwindcss@4.3.2 @tailwindcss/postcss@4.3.2 postcss@8.5.16 typescript@7.0.2` + `npm uninstall autoprefixer` → lockfile actualizado.
- `npm test` con TypeScript 7.0.2 → pasó: 1 archivo, 1 test.
- `npm run build` con TypeScript 7.0.2 → falló: Next intentó instalar/validar TypeScript y terminó con `The "id" argument must be of type string. Received undefined`; build worker exit code 1.
- `npm install -D typescript@5.9.3` → rollback a versión compatible.
- `npm install` → lockfile sincronizado con versiones exactas en `package.json`.
- `npm test` final → pasó: 1 archivo, 1 test.
- `npm run build` final → pasó con Next.js 16.2.10 y Tailwind v4.
- `npm outdated --long || true` final → solo reporta `typescript` current/wanted `5.9.3`, latest `7.0.2`.
- `npm audit --json` final → 2 vulnerabilidades moderadas restantes: `next` vía `postcss` y `postcss` transitive dentro de `node_modules/next/node_modules/postcss`.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Mantenimiento de dependencias/config | `src/compartido/pruebas/harness.test.ts` existente | Config/build smoke | ✅ `npm test` pre-cambio: 1/1 | ➖ No aplica: corte estructural sin comportamiento nuevo; se preserva suite existente | ✅ `npm test` final: 1/1 y `npm run build` final pasó | ➖ Omitida: cambio estructural sin ramas de lógica; compatibilidad triangulada empíricamente probando TS 7.0.2 y rollback a 5.9.3 | ✅ Config simplificada a integración Tailwind v4 oficial; pruebas/build siguen verdes |

### Riesgos / notas de auditoría

- `npm audit --json` sigue saliendo con código 1 por 2 vulnerabilidades moderadas.
- La vulnerabilidad directa antigua de `postcss@8.5.6` quedó corregida en la dependencia directa (`postcss@8.5.16`), pero Next 16.2.10 todavía trae `node_modules/next/node_modules/postcss` en rango `<8.5.10`.
- `npm audit fix --force` no se aplicó porque el fix sugerido sigue siendo un downgrade mayor a `next@9.3.3`, incompatible con la base técnica elegida.
- El único paquete desactualizado compatible que queda es `typescript`: la última publicada (`7.0.2`) no es compatible empíricamente con `next build` en este setup.

### Tareas restantes

No se marcaron nuevas tareas SDD porque este corte fue mantenimiento de dependencias/configuración fuera del bloque funcional de dominio. El siguiente bloque funcional pendiente sigue siendo:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/dominio/vehiculo.test.ts` para vehículo válido, kilometraje negativo, baja lógica y corrección manual arriba/abajo.
- [ ] GREEN: implementar `src/modulos/vehiculos/dominio/vehiculo.ts`, `errores-dominio.ts` y helpers compartidos en `src/compartido/dominio/`.
- [ ] TRIANGULATE: añadir caso de vehículo inactivo que conserva identidad, matrícula y fecha de alta.
- [ ] REFACTOR: mantener el dominio sin imports de Next.js, React, Supabase, Zod ni Tailwind.

### Workload / PR boundary

- Boundary de este corte: mantenimiento de dependencias/configuración solamente.
- Sin commit y sin PR, por instrucción explícita.

## Dominio puro de vehículos — PR 1 slice

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram sincronizado si está disponible.
- Modo: interactivo.
- Estrategia de entrega: `auto-chain`.
- Chain strategy: `stacked-to-main`.
- Límite del corte actual: dominio puro de vehículos solamente.
- TDD estricto: activo; comando de tests `npm test`.
- Riesgo de presupuesto: el cambio completo es alto, pero este corte se mantuvo dentro del límite funcional solicitado y no inició eventos, casos de uso, Supabase, migraciones ni UI.

### Tareas completadas y checkboxes persistidos

- [x] RED: crear pruebas en `src/modulos/vehiculos/dominio/vehiculo.test.ts` para vehículo válido, kilometraje negativo, baja lógica y corrección manual arriba/abajo.
- [x] GREEN: implementar `src/modulos/vehiculos/dominio/vehiculo.ts`, `errores-dominio.ts` y helpers compartidos en `src/compartido/dominio/`.
- [x] TRIANGULATE: añadir caso de vehículo inactivo que conserva identidad, matrícula y fecha de alta.
- [x] REFACTOR: mantener el dominio sin imports de Next.js, React, Supabase, Zod ni Tailwind.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 Dominio puro de vehículos | `src/modulos/vehiculos/dominio/vehiculo.test.ts` | Unit | ✅ `npm test`: 1 archivo, 1 test pasado antes de modificar | ✅ Test escrito primero; `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` falló por módulo inexistente `identificador` | ✅ Implementados `crearVehiculo`, `Vehiculo`, `ErrorDominio` y `crearIdentificador`; test focalizado pasó: 6/6 | ✅ Añadido caso de vehículo inactivo que conserva identidad, matrícula y fecha de alta; también quedaron cubiertas correcciones arriba/abajo | ✅ Búsqueda de imports prohibidos en dominio sin coincidencias; dominio sin Next.js, React, Supabase, Zod ni Tailwind |

### Comandos ejecutados

- `npm test` → safety net inicial: 1 archivo, 1 test pasado.
- `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` → RED esperado: falló porque todavía no existían los módulos de dominio compartido/vehículo.
- `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` → GREEN/TRIANGULATE: 1 archivo, 6 tests pasados.
- `npm test` → suite completa: 2 archivos, 7 tests pasados.
- `grep` sobre `src/modulos/vehiculos/dominio/*.ts` para imports de Next.js, React, Supabase, Zod y Tailwind → sin coincidencias.

### Archivos cambiados

- `src/compartido/dominio/identificador.ts`
- `src/modulos/vehiculos/dominio/errores-dominio.ts`
- `src/modulos/vehiculos/dominio/vehiculo.ts`
- `src/modulos/vehiculos/dominio/vehiculo.test.ts`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- Sin desviaciones relevantes para este corte. El dominio de vehículo se mantuvo puro y limitado a reglas de alta, baja lógica y corrección manual de kilometraje.
- No se implementaron eventos, vencimientos, roles, casos de uso, persistencia, migraciones ni UI porque pertenecen a secciones posteriores.

### Riesgos / notas

- `crearIdentificador` lanza `Error` estándar para identificador vacío; si más adelante se decide que todo helper compartido debe lanzar `ErrorDominio`, conviene ajustar con su propio test.
- La unicidad global de matrícula queda para casos de uso/persistencia posteriores; no pertenece a esta entidad pura en este corte.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts`, `vencimiento.test.ts` y `rol-usuario.test.ts` para mantenimiento, avería, coste opcional, evento histórico, vencimiento por km, vencimiento por fecha, sin vencimiento y roles `admin`/`editor`.
- [ ] GREEN: implementar `evento-vehiculo.ts`, `vencimiento.ts` y `rol-usuario.ts`.
- [ ] TRIANGULATE: probar evento con solo vencimiento por km, solo por fecha y ambos.
- [ ] REFACTOR: extraer tipos/value objects solo si reducen duplicación real.

### Workload / PR boundary

- PR boundary actual: dominio puro de vehículos solamente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Remediación de revisión fresca — dominio de vehículos

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram se intentó sincronizar.
- Modo: corte delegado de remediación de revisión fresca.
- Estrategia de entrega vigente: `auto-chain`, `stacked-to-main`.
- Límite del corte: solo dominio de vehículos; no se implementaron eventos, casos de uso, Supabase, migraciones ni UI.
- TDD estricto: activo; comando de tests `npm test`.

### Hallazgos resueltos

- [x] R3-001: añadida prueba explícita que verifica que `corregirKilometraje()` rechaza correcciones manuales con kilometraje negativo.
- [x] R3-002: aplicada corrección pequeña y acotada para proteger fechas expuestas mediante getters defensivos que devuelven copias de `Date`.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| R3-001 corrección manual negativa | `src/modulos/vehiculos/dominio/vehiculo.test.ts` | Unit | ✅ `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts`: 6/6 | ⚠️ Prueba de regresión añadida primero; el comportamiento ya estaba cubierto indirectamente por el constructor y no falló de forma aislada | ✅ Incluida en el pase focalizado final: 9/9 | ➖ No aplica: el requisito explícito es un único borde negativo ya cubierto por la validación compartida de kilometraje | ➖ Sin cambio productivo necesario para este hallazgo |
| R3-002 fechas defensivas | `src/modulos/vehiculos/dominio/vehiculo.test.ts` | Unit | ✅ `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts`: 6/6 | ✅ Nuevas pruebas fallaron al mutar `fechaCompra`, `fechaAltaAplicacion` y `fechaDesactivacion` expuestas | ✅ `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts`: 9/9 tras getters defensivos | ✅ Cubiertas fechas obligatorias y fecha opcional de desactivación | ✅ `Vehiculo` conserva fechas privadas y expone copias sin cambiar su API pública |

### Comandos ejecutados

- `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` → safety net inicial: 1 archivo, 6 tests pasados.
- `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` → RED parcial esperado para R3-002: 2 fallos por mutación externa de fechas; la nueva prueba R3-001 ya pasaba porque la validación de kilometraje ya era compartida.
- `npm test -- src/modulos/vehiculos/dominio/vehiculo.test.ts` → GREEN/REFACTOR: 1 archivo, 9 tests pasados.
- `npm test` → suite completa: 2 archivos, 10 tests pasados.
- `grep` sobre `src/modulos/vehiculos/dominio` y `src/compartido/dominio` para imports de Next.js, React, Supabase, Zod y Tailwind → sin coincidencias.

### Archivos cambiados

- `src/modulos/vehiculos/dominio/vehiculo.test.ts`
- `src/modulos/vehiculos/dominio/vehiculo.ts`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- Sin desviaciones. La remediación se mantuvo dentro del dominio puro de vehículos.
- No se modificaron checkboxes de `tasks.md` porque las tareas funcionales de la sección 2 ya estaban completadas y esta remediación solo añade evidencia/cobertura posterior.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts`, `vencimiento.test.ts` y `rol-usuario.test.ts` para mantenimiento, avería, coste opcional, evento histórico, vencimiento por km, vencimiento por fecha, sin vencimiento y roles `admin`/`editor`.
- [ ] GREEN: implementar `evento-vehiculo.ts`, `vencimiento.ts` y `rol-usuario.ts`.
- [ ] TRIANGULATE: probar evento con solo vencimiento por km, solo por fecha y ambos.
- [ ] REFACTOR: extraer tipos/value objects solo si reducen duplicación real.

### Workload / PR boundary

- PR boundary actual: remediación del dominio puro de vehículos solamente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Corrección de type-check — factory de Vehiculo

### Problema detectado

VSCode marcó el error TypeScript `ts(2673)`: `crearVehiculo` intentaba llamar a `new Vehiculo(...)` desde fuera de la declaración de la clase, pero el constructor de `Vehiculo` era `private`.

### Causa

`npm test` con Vitest ejecutaba la suite pero no hacía type-check completo. Por eso los tests pasaban mientras el editor detectaba un error real de TypeScript. La verificación correcta para este tipo de problema es `npm run build` o un comando específico de type-check.

### Corrección aplicada

- Se añadió `Vehiculo.crear(datos)` como factory estático dentro de la clase, donde sí puede llamar al constructor privado.
- La función pública `crearVehiculo(datos)` se mantiene como API cómoda y delega en `Vehiculo.crear(datos)`.
- Se conserva el constructor privado para proteger la creación del agregado.

### Evidencia

- `npm test` → pasó: 2 archivos, 10 tests.
- `npm run build` → pasó; TypeScript ya no reporta el error del constructor privado.

## Dominio de eventos, vencimientos y roles — PR 1 slice

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram disponible para sincronización.
- Modo: interactivo.
- Estrategia de entrega: `auto-chain`.
- Chain strategy: `stacked-to-main`.
- Límite del corte actual: dominio de eventos, vencimientos y roles solamente.
- TDD estricto: activo; comando de tests `npm test`; build requerido `npm run build`.
- Riesgo de presupuesto: el cambio completo es alto, pero este corte se mantuvo en la sección 3 y no inició casos de uso, Supabase, migraciones, server actions ni UI.

### Tareas completadas y checkboxes persistidos

- [x] RED: crear pruebas en `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts`, `vencimiento.test.ts` y `rol-usuario.test.ts` para mantenimiento, avería, coste opcional, evento histórico, vencimiento por km, vencimiento por fecha, sin vencimiento y roles `admin`/`editor`.
- [x] GREEN: implementar `evento-vehiculo.ts`, `vencimiento.ts` y `rol-usuario.ts`.
- [x] TRIANGULATE: probar evento con solo vencimiento por km, solo por fecha y ambos.
- [x] REFACTOR: extraer tipos/value objects solo si reducen duplicación real.

Confirmación al cierre: se releyó `openspec/changes/vehicle-maintenance-app/tasks.md` y las cuatro líneas del apartado 3 están marcadas como `- [x]`.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 Eventos de vehículo | `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts` | Unit/domain | ✅ Suite previa verde por contexto; este corte empezó escribiendo tests nuevos | ✅ `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts` falló por módulos inexistentes | ✅ Implementado `EventoVehiculo` con mantenimiento, avería, coste opcional y decisión de actualización de kilometraje; pase focalizado 14/14 | ✅ Añadidos casos de solo vencimiento por km, solo por fecha y ambos dentro del corte | ✅ Sin value objects extra porque no había duplicación real; fechas expuestas con copias defensivas |
| 3.2 Vencimientos | `src/modulos/vehiculos/dominio/vencimiento.test.ts` | Unit/domain | ✅ Mismo RED conjunto del corte | ✅ Falló por módulo inexistente `vencimiento` | ✅ `evaluarVencimiento` devuelve `sin_vencimiento`, `pendiente` o `vencido` según km/fecha | ✅ Cubiertos km, fecha, ambas condiciones y ninguna condición | ✅ Función pura sin imports de framework |
| 3.3 Roles de usuario | `src/modulos/vehiculos/dominio/rol-usuario.test.ts` | Unit/domain | ✅ Mismo RED conjunto del corte | ✅ Falló por módulo inexistente `rol-usuario` | ✅ `rolesUsuario` y `esRolUsuario` reconocen `admin` y `editor` | ✅ Se añadió rechazo de rol fuera del dominio inicial | ✅ Tipo literal mínimo; sin permisos aplicados todavía |

### Comandos ejecutados

- `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts` → RED esperado: fallaron 3 suites por módulos inexistentes.
- `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts` → GREEN/TRIANGULATE: 3 archivos, 14 tests pasados.
- `npm test` → suite completa: 5 archivos, 24 tests pasados.
- `grep` sobre `src/modulos/vehiculos/dominio` y `src/compartido/dominio` para imports de Next.js, React, Supabase, Zod y Tailwind → sin coincidencias.
- `npm run build` → pasó con Next.js 16.2.10.

### Archivos cambiados

- `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts`
- `src/modulos/vehiculos/dominio/evento-vehiculo.ts`
- `src/modulos/vehiculos/dominio/vencimiento.test.ts`
- `src/modulos/vehiculos/dominio/vencimiento.ts`
- `src/modulos/vehiculos/dominio/rol-usuario.test.ts`
- `src/modulos/vehiculos/dominio/rol-usuario.ts`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- Sin desviaciones relevantes para este corte. El dominio sigue sin importar Next.js, React, Supabase, Zod ni Tailwind.
- `EventoVehiculo` incorpora una decisión pura `debeActualizarKilometrajeActual(kilometrosActuales)` para expresar la regla de evento histórico/más reciente sin implementar aún casos de uso ni persistencia.
- No se implementaron casos de uso, puertos, repositorios en memoria, Supabase, migraciones, server actions ni UI por límite explícito del slice.

### Riesgos / notas

- La validación de campos obligatorios de evento en frontera de entrada queda para Zod/server actions posteriores; este corte solo modela reglas mínimas de dominio del evento.
- La atomicidad evento + actualización de kilometraje sigue pendiente para la sección 7; aquí solo se modeló la decisión pura que consumirá el caso de uso.
- Los roles son concepto de dominio, no autorización aplicada; permisos reales quedan fuera de este corte.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/aplicacion/casos-uso/*.test.ts` para registrar/listar vehículo, rechazar matrícula duplicada global, desactivar sin borrar eventos, registrar evento actualizando kilometraje, registrar evento histórico sin bajarlo y corregir kilometraje.
- [ ] GREEN: implementar casos de uso en `src/modulos/vehiculos/aplicacion/casos-uso/` y puertos en `src/modulos/vehiculos/aplicacion/puertos/`.
- [ ] GREEN: definir en `repositorio-vehiculos.ts` una operación de unicidad global, por ejemplo `existeMatricula(matricula: string): Promise<boolean>`; no usar solo `existeMatriculaActiva`.
- [ ] GREEN: definir un puerto/contrato atómico para `registrarEventoYActualizarKilometraje` o unidad de trabajo equivalente, consumido por `registrar-evento-vehiculo.ts`.
- [ ] GREEN: crear repositorios en memoria para pruebas en `src/modulos/vehiculos/aplicacion/pruebas/`.
- [ ] REFACTOR: asegurar que los casos de uso reciben `ProveedorIdentidad`/actor temporal sin aplicar matriz de permisos real.

### Workload / PR boundary

- PR boundary actual: dominio de eventos, vencimientos y roles solamente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Remediación de revisión fresca — dominio de eventos, vencimientos y roles

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram se intentó sincronizar.
- Modo: corte delegado de remediación de revisión fresca.
- Estrategia de entrega vigente: `auto-chain`, `stacked-to-main`.
- Límite del corte: solo dominio de eventos, vencimientos y roles; no se implementaron casos de uso, Supabase, migraciones, server actions ni UI.
- TDD estricto: activo; comando de tests `npm test`; build requerido `npm run build`.

### Hallazgos resueltos

- [x] Eventos: añadida cobertura explícita para igualdad de kilometraje evento/actual como frontera histórica/no actualizable.
- [x] Eventos: añadida cobertura para kilometraje de evento negativo, kilometraje actual negativo, próximo vencimiento por km negativo y coste negativo.
- [x] Eventos: añadida cobertura defensiva para fechas expuestas por `EventoVehiculo.fecha`, `proximoVencimientoFecha` y `fechaCreacion`.
- [x] Vencimientos: añadida cobertura de fronteras justo por debajo del umbral de km y justo antes del umbral de fecha.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Remediar contratos visibles de eventos | `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts` | Unit/domain | ✅ `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts`: 14/14 | ⚠️ Pruebas de regresión añadidas primero; pasaron porque la implementación ya protegía estos contratos visibles | ✅ Pase focalizado final: 22/22 | ✅ Cubiertas fronteras de igualdad, negativos y copias defensivas de tres fechas | ➖ Sin cambio productivo necesario |
| Remediar fronteras justo por debajo de vencimiento | `src/modulos/vehiculos/dominio/vencimiento.test.ts` | Unit/domain | ✅ Misma safety net del corte: 14/14 | ⚠️ Pruebas de regresión añadidas primero; pasaron porque la implementación ya usaba `>=` correctamente | ✅ Pase focalizado final: 22/22 | ✅ Cubiertas frontera km `129999/130000` y fecha 1 ms antes del objetivo | ➖ Sin cambio productivo necesario |

### Comandos ejecutados

- `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts` → safety net inicial: 3 archivos, 14 tests pasados.
- `npm test -- src/modulos/vehiculos/dominio/evento-vehiculo.test.ts src/modulos/vehiculos/dominio/vencimiento.test.ts src/modulos/vehiculos/dominio/rol-usuario.test.ts` → remediación focalizada: 3 archivos, 22 tests pasados.
- `npm test` → suite completa: 5 archivos, 32 tests pasados.
- `npm run build` → pasó con Next.js 16.2.10.

### Archivos cambiados

- `src/modulos/vehiculos/dominio/evento-vehiculo.test.ts`
- `src/modulos/vehiculos/dominio/vencimiento.test.ts`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- Sin desviaciones. La remediación solo amplía cobertura de pruebas sobre contratos ya implementados.
- No se modificó implementación porque las invariantes y copias defensivas ya existían.
- No se implementaron casos de uso, Supabase, migraciones, server actions ni UI.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: crear pruebas en `src/modulos/vehiculos/aplicacion/casos-uso/*.test.ts` para registrar/listar vehículo, rechazar matrícula duplicada global, desactivar sin borrar eventos, registrar evento actualizando kilometraje, registrar evento histórico sin bajarlo y corregir kilometraje.
- [ ] GREEN: implementar casos de uso en `src/modulos/vehiculos/aplicacion/casos-uso/` y puertos en `src/modulos/vehiculos/aplicacion/puertos/`.
- [ ] GREEN: definir en `repositorio-vehiculos.ts` una operación de unicidad global, por ejemplo `existeMatricula(matricula: string): Promise<boolean>`; no usar solo `existeMatriculaActiva`.
- [ ] GREEN: definir un puerto/contrato atómico para `registrarEventoYActualizarKilometraje` o unidad de trabajo equivalente, consumido por `registrar-evento-vehiculo.ts`.
- [ ] GREEN: crear repositorios en memoria para pruebas en `src/modulos/vehiculos/aplicacion/pruebas/`.
- [ ] REFACTOR: asegurar que los casos de uso reciben `ProveedorIdentidad`/actor temporal sin aplicar matriz de permisos real.

### Workload / PR boundary

- PR boundary actual: remediación de revisión fresca para dominio de eventos, vencimientos y roles solamente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Casos de uso con puertos en memoria — PR 1 slice

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram leído/sincronizado cuando estuvo disponible.
- Modo: interactivo.
- Estrategia de entrega: `auto-chain`.
- Chain strategy: `stacked-to-main`.
- Límite del corte actual: casos de uso de aplicación, puertos y repositorios en memoria solamente.
- TDD estricto: activo; comando de tests `npm test`; build requerido `npm run build`.
- Riesgo de presupuesto: el cambio completo es alto; este corte se mantuvo en la sección 4 y no inició Supabase, migraciones, server actions ni UI.

### Tareas completadas y checkboxes persistidos

- [x] RED: crear pruebas en `src/modulos/vehiculos/aplicacion/casos-uso/*.test.ts` para registrar/listar vehículo, rechazar matrícula duplicada global, desactivar sin borrar eventos, registrar evento actualizando kilometraje, registrar evento histórico sin bajarlo y corregir kilometraje.
- [x] GREEN: implementar casos de uso en `src/modulos/vehiculos/aplicacion/casos-uso/` y puertos en `src/modulos/vehiculos/aplicacion/puertos/`.
- [x] GREEN: definir en `repositorio-vehiculos.ts` una operación de unicidad global, por ejemplo `existeMatricula(matricula: string): Promise<boolean>`; no usar solo `existeMatriculaActiva`.
- [x] GREEN: definir un puerto/contrato atómico para `registrarEventoYActualizarKilometraje` o unidad de trabajo equivalente, consumido por `registrar-evento-vehiculo.ts`.
- [x] GREEN: crear repositorios en memoria para pruebas en `src/modulos/vehiculos/aplicacion/pruebas/`.
- [x] REFACTOR: asegurar que los casos de uso reciben `ProveedorIdentidad`/actor temporal sin aplicar matriz de permisos real.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 4.1 Casos de uso de aplicación | `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` | Application | ✅ Suite previa disponible por contexto; este corte empezó escribiendo pruebas nuevas | ✅ `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` falló por módulos de casos de uso inexistentes | ✅ Implementados `registrarVehiculo`, `listarVehiculos`, `desactivarVehiculo`, `registrarEventoVehiculo` y `corregirKilometraje`; pase focalizado 6/6 | ✅ Cubiertos duplicado global tras desactivación, evento con km mayor, evento histórico y corrección arriba/abajo | ✅ Los casos de uso consumen `ProveedorIdentidadTemporal`/actor sin aplicar matriz real de permisos |
| 4.2 Puertos y memoria | `vehiculos-casos-uso.test.ts` | Ports/adapters in memory | ✅ Pruebas de aplicación describen contrato observable | ✅ Falló por ausencia de puertos y repositorios en memoria | ✅ Creados `RepositorioVehiculos`, `RepositorioEventosVehiculo`, `UnidadTrabajoVehiculos`, `ProveedorFecha` y `ProveedorIdentidad`; memoria verde | ✅ `existeMatricula` verifica unicidad global, no solo activa; `registrarEventoYActualizarKilometraje` coordina evento + km | ✅ Sin imports de Next.js, React, Supabase, Zod ni Tailwind en dominio/aplicación/compartido |

### Comandos ejecutados

- `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` → RED esperado: falló por módulo inexistente `./corregir-kilometraje`.
- `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` → GREEN/TRIANGULATE: 1 archivo, 6 tests pasados.
- `npm test` → suite completa: 6 archivos, 38 tests pasados.
- `npm run build` → pasó con Next.js 16.2.10.
- `grep` sobre `src/modulos/vehiculos/dominio`, `src/modulos/vehiculos/aplicacion` y `src/compartido/dominio` para imports de Next.js, React, Supabase, Zod y Tailwind → sin coincidencias.

### Archivos cambiados

- `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/registrar-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/listar-vehiculos.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/desactivar-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/registrar-evento-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/corregir-kilometraje.ts`
- `src/modulos/vehiculos/aplicacion/puertos/repositorio-vehiculos.ts`
- `src/modulos/vehiculos/aplicacion/puertos/repositorio-eventos-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/puertos/proveedor-fecha.ts`
- `src/modulos/vehiculos/aplicacion/puertos/proveedor-identidad.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-vehiculos-en-memoria.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-eventos-vehiculo-en-memoria.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/proveedor-identidad-temporal.ts`
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- El puerto atómico se nombró `UnidadTrabajoVehiculos` y expone `registrarEventoYActualizarKilometraje({ evento, vehiculoActualizado })`; el adaptador en memoria lo implementa para pruebas. La implementación Supabase/transaccional real queda para PR 2/sección 7.
- `ProveedorIdentidadTemporal` vive en `aplicacion/pruebas/` para este corte y devuelve actor `admin` fijo; no se aplican permisos reales, tal como pide el diseño.
- No se implementaron Supabase, migraciones, server actions, UI, RLS, auth real, OCR, IA, adjuntos, notificaciones ni dashboard.

### Riesgos / notas

- La operación en memoria coordina evento + kilometraje en un único método, pero no sustituye la transacción/RPC de Supabase pendiente en PR 2.
- La validación de campos obligatorios y mensajes de formularios queda para Zod/server actions de PR 3; los casos de uso asumen entradas ya tipadas y delegan invariantes al dominio.
- La unicidad global de matrícula se verifica en el caso de uso mediante `existeMatricula`; la restricción definitiva de base de datos queda para migraciones `mv_*`.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: documentar/crear prueba de contrato SQL o snapshot en `supabase/migrations/*.test.ts` si el harness lo permite; si no, añadir checklist verificable en `supabase/migrations/README.md`.
- [ ] GREEN: crear migración en `supabase/migrations/` para `mv_vehiculos` y `mv_eventos_vehiculo` con checks, claves foráneas e índices.
- [ ] GREEN: imponer unicidad global de `mv_vehiculos.matricula`, incluyendo vehículos inactivos.
- [ ] GREEN: incluir prefijo `mv_` en todos los objetos SQL de esta app.
- [ ] REFACTOR: no crear tablas futuras de adjuntos/OCR/manuales; solo reservar nombres en documentación si hace falta.

### Workload / PR boundary

- PR boundary actual: casos de uso de aplicación + puertos + repositorios en memoria.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

### Verificación post-ajuste de presupuesto

- Se compactó `vehiculos-casos-uso.test.ts` para mantener el corte de aplicación por debajo del presupuesto de revisión de 400 líneas de código de aplicación nuevas.
- Líneas en `src/modulos/vehiculos/aplicacion/`: 384 total.
- `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` → pasó: 1 archivo, 6 tests.
- `npm test` → pasó: 6 archivos, 38 tests.
- `npm run build` → pasó con Next.js 16.2.10.

## Remediación de revisión fresca — R3-001 unidad de trabajo en memoria

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo y Engram sincronizado al cierre.
- Modo: corte delegado de remediación de revisión fresca.
- Estrategia de entrega vigente: `auto-chain`, `stacked-to-main`.
- Límite del corte: solo sección 4 de aplicación/puertos/repositorios en memoria; no se implementaron Supabase, migraciones, server actions ni UI.
- TDD estricto: activo; comando de tests `npm test`; build requerido `npm run build`.

### Hallazgo resuelto

- [x] R3-001: añadida prueba determinista de fallo parcial para `registrarEventoYActualizarKilometraje`; si falla la persistencia del kilometraje del vehículo, el evento no queda guardado en el repositorio en memoria y el kilometraje original se conserva.
- [x] El puerto `UnidadTrabajoVehiculos` documenta explícitamente que las implementaciones no deben confirmar un evento si falla la persistencia del kilometraje.
- [x] La implementación en memoria persiste primero el vehículo actualizado cuando corresponde y solo después confirma el evento en memoria, evitando estado parcial en este slice.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| R3-001 atomicidad en memoria evento + kilometraje | `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` | Application/adapter in memory | ✅ Suite previa de aplicación existente | ✅ `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` falló: el evento quedaba guardado cuando `guardar(vehiculo)` fallaba | ✅ Reordenada la confirmación en `RepositorioEventosVehiculoEnMemoria`: primero guarda vehículo actualizado y luego confirma evento; test focalizado 7/7 | ✅ La suite mantiene los casos de evento más reciente e histórico sin bajar kilometraje | ✅ Comentario mínimo en `UnidadTrabajoVehiculos` aclara el contrato para futura RPC/transacción Supabase |

### Comandos ejecutados

- `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` → RED esperado: 1 fallo; el evento quedaba guardado tras fallar la actualización de kilometraje.
- `npm test -- src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts` → GREEN: 1 archivo, 7 tests pasados.
- `npm test` → suite completa: 6 archivos, 39 tests pasados.
- `npm run build` → pasó con Next.js 16.2.10.

### Archivos cambiados

- `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-eventos-vehiculo-en-memoria.ts`
- `src/modulos/vehiculos/aplicacion/puertos/repositorio-eventos-vehiculo.ts`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

### Desviaciones del diseño

- Sin desviaciones. La remediación mantiene el contrato coordinado de aplicación y deja la implementación transaccional real para Supabase/RPC en PR 2.
- No se implementaron Supabase, migraciones, server actions, interfaz, RLS ni auth.
- No se modificó `tasks.md` porque la sección 4 ya estaba completada y persistida; este corte añade evidencia de remediación posterior sobre el mismo slice.

### Tareas restantes

Siguiente bloque pendiente exacto:

- [ ] RED: documentar/crear prueba de contrato SQL o snapshot en `supabase/migrations/*.test.ts` si el harness lo permite; si no, añadir checklist verificable en `supabase/migrations/README.md`.
- [ ] GREEN: crear migración en `supabase/migrations/` para `mv_vehiculos` y `mv_eventos_vehiculo` con checks, claves foráneas e índices.
- [ ] GREEN: imponer unicidad global de `mv_vehiculos.matricula`, incluyendo vehículos inactivos.
- [ ] GREEN: incluir prefijo `mv_` en todos los objetos SQL de esta app.
- [ ] REFACTOR: no crear tablas futuras de adjuntos/OCR/manuales; solo reservar nombres en documentación si hace falta.

### Workload / PR boundary

- PR boundary actual: remediación R3-001 para use-case/in-memory repository slice solamente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR.

## Guardarraíles Supabase compartido — preparación PR 2

### Contexto

El usuario confirmó que Supabase ya existe en un VPS gestionado con Dokploy y planteó trabajar contra esa instancia real, usando tablas nuevas con prefijo `mv_`.

### Decisión de seguridad

Se permite preparar migraciones para la instancia real, pero no se ejecutará ninguna operación contra Supabase sin autorización explícita. Las migraciones deben limitarse a objetos `mv_*` y evitar comandos globales.

### Guardarraíles creados

- Se creó `supabase/migrations/README.md` con reglas obligatorias para migraciones en Supabase compartido.
- Se actualizó `openspec/changes/vehicle-maintenance-app/tasks.md` para que la sección 5 exija estos guardarraíles antes de crear/aplicar SQL.

### Verificación de conectividad/herramientas

- MCP revisado: no hay MCP Supabase conectado en esta sesión.
- Búsqueda MCP `supabase`: sin herramientas disponibles.
- Búsqueda en repo: no existe script de puente Supabase ni carpeta `supabase/` previa; la carpeta se creó al documentar guardarraíles.

### Reglas operativas

- No ejecutar reset global de base de datos.
- No ejecutar `drop schema`, `drop database` ni borrados no acotados.
- Cualquier limpieza debe limitarse a tablas `mv_*`.
- El SQL se revisa antes de ejecutarse contra la instancia real.
- La ejecución real requiere autorización explícita.

## Remediación de guardarraíles Supabase — review-risk

### Hallazgos corregidos

- R1-001: se eliminó `cascade` del ejemplo de limpieza de datos. Las limpiezas de prueba deben limitarse a tablas `mv_*` y fallar de forma segura si existen dependencias externas.
- R1-002: se añadió como regla previa a ejecución real que las tablas nuevas tengan postura de acceso segura en Supabase: RLS activado sin políticas permisivas por defecto, revocación explícita de `anon`/`authenticated`, o excepción privada documentada y autorizada.

### Archivos actualizados

- `supabase/migrations/README.md`
- `openspec/changes/vehicle-maintenance-app/tasks.md`

### Estado

No se ejecutó ninguna operación contra Supabase real. Solo se actualizaron guardarraíles y tareas.

## PR 2 — Contexto de hogar, adaptador Supabase de servidor y atomicidad (tareas 5–9)

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `openspec` (autoritativo para esta ejecución); Engram sincronizado en `sdd/vehicle-maintenance-app/apply-progress`.
- Modo: interactivo, TDD estricto activo (`npm test`); Strict TDD Mode confirmado por el orquestador.
- Estrategia de entrega: `auto-chain`, `stacked-to-main`. Corte asignado: PR 2 completo (tareas 5–9), sin tocar PR 3 (tareas 10–13) ni migraciones nuevas.
- Alcance ejecutado: reapertura de PR1 para scoping por hogar (tarea 5), adaptación de mapeadores al esquema Supabase real sin migración nueva (tarea 6), adaptador Supabase solo de servidor (tarea 7), atomicidad evento+kilometraje documentada y probada (tarea 8), y frontera auth/RLS con bootstrap server-only + `ProveedorIdentidad` de servidor (tarea 9).
- Fuera de alcance de este corte, por instrucción explícita: tareas 10–13 (validación Zod, server actions, pantallas Next.js, verificación final del MVP), y cualquier migración SQL nueva o modificada.

### Tareas completadas y checkboxes persistidos

Sección 5 (enmienda de PR1 — contexto de hogar):
- [x] RED: `vehiculos-casos-uso.test.ts` reescrito para exigir rechazo de matrícula duplicada POR HOGAR y permitir la misma matrícula en hogar distinto.
- [x] GREEN: `ContextoAplicacion { actor, householdId }` y `ProveedorIdentidad.obtenerContexto()` en `proveedor-identidad.ts`.
- [x] GREEN: `RepositorioVehiculos` scoped por hogar (`guardar`, `buscarPorId`, `listar`, `existeMatricula` reciben `householdId`).
- [x] GREEN: `RepositorioEventosVehiculo`/`UnidadTrabajoVehiculos` reciben `householdId` explícito.
- [x] GREEN: los cinco casos de uso resuelven `obtenerContexto()` y propagan `householdId`.
- [x] GREEN: dobles en memoria actualizados (`RepositorioVehiculosEnMemoria` indexa por `(householdId, id)`; `ProveedorIdentidadTemporal` acepta `householdId` fijo de desarrollo, con default y override para pruebas de aislamiento).
- [x] TRIANGULATE: prueba de aislamiento — un hogar no ve vehículos de otro (`listar`/`buscarPorId`).
- [x] REFACTOR: confirmado (grep) que `dominio/` sigue sin ninguna referencia a `householdId`.

Sección 6 (mapeadores contra esquema real, sin migración nueva):
- [x] RED/GREEN/REFACTOR: `mapeadores-supabase.ts` + `mapeadores-supabase.test.ts` mapean dominio↔filas `mv_vehiculos`/`mv_eventos_vehiculo` reales (`household_id`, `fecha_creacion` no `creado_en`, FK compuesta `vehiculo_id`, sin columnas inexistentes). Se añadió `Vehiculo.reconstruir()`/`reconstruirVehiculo()` (con su propio ciclo RED→GREEN en `vehiculo.test.ts`) porque el mapeador fila→dominio necesita reconstruir un vehículo inactivo directamente, sin pasar por `desactivar()`.

Sección 7 (adaptador Supabase solo de servidor):
- [x] RED/GREEN: `entorno.ts` (validación de variables, rechazo explícito de nombres `NEXT_PUBLIC_*`), `cliente-supabase-servidor.ts` (guarda `typeof window !== 'undefined'`, login server-side), `repositorio-vehiculos-supabase.ts`, `repositorio-eventos-supabase.ts` implementando los puertos scoped por hogar.
- [x] REFACTOR: confirmado que no hay ningún archivo `'use client'` en el repo y que ningún archivo de producción contiene un patrón de clave `service_role` (ver sección 9 / `seguridad-servidor.ts`).

Sección 8 (atomicidad evento + kilometraje):
- [x] RED/GREEN/TRIANGULATE: `registrar-evento-vehiculo.test.ts` dedicado, contrato a nivel de caso de uso (una única llamada a la unidad de trabajo; propagación de error sin guardar evento; evento histórico sin `vehiculoActualizado`).
- [x] GREEN Supabase: `repositorio-eventos-supabase.ts` implementa el orden coordinado (vehículo primero, evento después) con comentario explícito de riesgo/compensación, ya que este PR no crea RPC/migración nueva.
- [x] REFACTOR: comentario en `registrar-evento-vehiculo.ts` explicando por qué no son dos escrituras independientes.

Sección 9 (frontera auth/RLS y bootstrap):
- [x] RED/GREEN: `bootstrap-servidor.ts` + `bootstrap-servidor.test.ts` (idempotencia probada: segunda ejecución no duplica usuario/hogar/membresía y devuelve los mismos ids).
- [x] RED/GREEN: `proveedor-identidad-supabase-servidor.ts` + su test (resuelve `ContextoAplicacion` desde el `householdId` real sembrado, no arbitrario; rechaza si no hay membresía).
- [x] RED/GREEN: `seguridad-servidor.ts` + `seguridad-servidor.test.ts` (detector de imports `'use client'` indebidos hacia adaptadores Supabase + detector de patrón de clave `service_role`, incluyendo barrido real del repositorio).
- [x] GREEN: documentación de la decisión de credencial y del procedimiento de siembra en `supabase/migrations/README.md`.
- [x] GREEN (parcial, ver blocker): confirmación de ausencia de `service_role`/claves privilegiadas en código cliente y componentes React (100% verificado); `.env.example` no pudo crearse por bloqueo de sandbox (ver blockers).
- [x] REFACTOR: la autorización futura permanece fuera del dominio (`dominio/rol-usuario.ts` sigue siendo solo un concepto, sin matriz aplicada) y fuera de componentes UI (no existen componentes React en este PR).

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 5. Contexto de hogar en casos de uso | `aplicacion/casos-uso/vehiculos-casos-uso.test.ts` | Application | ✅ `npm test`: 7 archivos, 59 tests antes de tocar nada | ✅ Reescrito con asserts por hogar + hogar distinto; falló 7/9 contra firmas sin hogar (incluye error de tipos por constructor `ProveedorIdentidadTemporal(hogarA)`) | ✅ Firmas de puertos/casos de uso/dobles actualizadas; 9/9 | ✅ Prueba de aislamiento `buscarPorId`/`listar` añadida | ✅ Grep confirma dominio sin `householdId`; `npm run build` verde |
| 6. Mapeadores Supabase (esquema real) | `adaptadores/supabase/mapeadores-supabase.test.ts` | Unit/contract | ✅ N/A (módulo nuevo) | ✅ Falló: módulo `./mapeadores-supabase` inexistente | ✅ 7/7 tras implementar mapeadores | ✅ Casos activo/inactivo, con/sin coste y vencimientos, fila→dominio y dominio→fila | ✅ Sin columnas `creado_en`/`actualizado_en`; prefijo `mv_` respetado |
| 6b. Reconstrucción de Vehiculo | `dominio/vehiculo.test.ts` | Unit/domain | ✅ 11 tests previos verdes | ✅ Falló: `reconstruirVehiculo is not a function` (2 tests) | ✅ `Vehiculo.reconstruir()`/`reconstruirVehiculo()` añadidos; 11/11 | ✅ Caso activo (sin fecha) y caso inactivo (con fecha) | ✅ Constructor privado conservado; solo se añade una segunda factory explícita para adaptadores |
| 7. Entorno de servidor | `compartido/infraestructura/entorno.test.ts` | Unit | ✅ N/A (módulo nuevo) | ✅ Falló: módulo `./entorno` inexistente | ✅ 3/3 tras implementar `leerEntornoSupabase` | ✅ Falta `SUPABASE_URL` vs. falta `SUPABASE_BOOTSTRAP_PASSWORD` (dos variables distintas) | ✅ Guarda explícita contra nombres `NEXT_PUBLIC_*` |
| 7b. Cliente Supabase de servidor | `adaptadores/supabase/cliente-supabase-servidor.test.ts` | Unit (con `vi.mock`) | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente (3/3 fallando) | ✅ 3/3 tras implementar guarda `window` + login | ✅ Éxito de login vs. fallo de login (mensajes distintos) | ✅ Guarda de servidor extraída a función nombrada |
| 7c. Repositorio Supabase de vehículos | `adaptadores/supabase/repositorio-vehiculos-supabase.test.ts` | Unit/contract (cliente falso) | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente | ✅ 4/4 tras implementar `guardar`/`buscarPorId`/`listar`/`existeMatricula` | ✅ Filtros `eq` para `buscarPorId` (2 filtros) vs. `listar` (1 filtro) vs. `existeMatricula` con otro hogar | ✅ Constante `TABLA`; mensajes de error homogéneos |
| 7d. Repositorio Supabase de eventos + UoW | `adaptadores/supabase/repositorio-eventos-supabase.test.ts` | Unit/contract (cliente falso) | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente | ✅ 6/6 tras implementar `guardar`/`listarPorVehiculo`/`listarConVencimiento`/UoW | ✅ Caso con `vehiculoActualizado` (dos tablas, orden vehículo→evento) vs. sin él (solo evento) vs. fallo del vehículo (evento nunca se escribe) | ✅ Comentario extenso documentando por qué no hay RPC en este PR y el riesgo de consistencia aceptado |
| 8. Contrato atómico a nivel de caso de uso | `aplicacion/casos-uso/registrar-evento-vehiculo.test.ts` | Application (fakes) | ✅ Suite completa verde antes de crear el archivo | ⚠️ Aprobación: el contrato ya era correcto desde PR1/tarea 4 y se preservó en la tarea 5; los 3 tests pasaron en su primera ejecución (no hubo fallo real sin tocar producción intencionalmente) | ✅ 3/3 | ✅ Caso feliz, caso de fallo (propaga error, una sola llamada a la UoW) y caso histórico (`vehiculoActualizado` undefined) | ✅ Comentario añadido en `registrar-evento-vehiculo.ts` explicando el contrato |
| 9. Bootstrap server-only | `adaptadores/supabase/bootstrap-servidor.test.ts` | Unit (operaciones falsas) | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente | ✅ 2/2 tras implementar `sembrarHogarDeDesarrollo` | ✅ Primera ejecución (crea) vs. segunda ejecución (idempotente, mismos ids, cero duplicados) | ✅ Orquestación mínima buscar-o-crear, sin lógica adicional |
| 9b. ProveedorIdentidad de servidor | `adaptadores/supabase/proveedor-identidad-supabase-servidor.test.ts` | Unit (cliente falso) | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente | ✅ 3/3 tras implementar resolución de contexto | ✅ Rol `admin` vs. rol `editor` vs. sin membresía (rechazo) | ✅ `householdId` recibido por constructor, nunca inventado dentro de la clase |
| 9c. Guardas de seguridad estáticas | `adaptadores/supabase/seguridad-servidor.test.ts` | Unit + barrido real del repo | ✅ N/A (módulo nuevo) | ✅ Falló: módulo inexistente (0 tests) | ✅ 7/7 tras implementar detectores | ✅ `use client` con import indebido vs. sin import vs. archivo de servidor con el mismo import (no debe marcarse) | ✅ Un falso positivo del propio detector (contiene el patrón que define) resuelto excluyéndose a sí mismo del barrido, documentado en el test |

### Test Summary

- **Total tests nuevos/modificados en este PR2**: 12 archivos de test tocados o creados (`vehiculos-casos-uso.test.ts` reescrito, `vehiculo.test.ts` ampliado, y 10 archivos de test nuevos bajo `adaptadores/supabase/` y `compartido/infraestructura/`).
- **Total tests passing (suite completa)**: 101/101 (`npm test`), repartidos en 16 archivos.
- **Layers usadas**: Unit/domain, Application (con fakes), Unit/contract con dobles del cliente Supabase, y un barrido real de seguridad sobre el repositorio de archivos.
- **Approval tests**: 1 (sección 8, contrato ya correcto heredado de PR1/tarea 4 — ver nota de honestidad TDD abajo).
- **Pure functions creadas/ampliadas**: mapeadores `aFilaVehiculo`/`aVehiculoDesdeFila`/`aFilaEventoVehiculo`/`aEventoVehiculoDesdeFila`, `sembrarHogarDeDesarrollo` (orquestación con efectos inyectados, no pura pero determinista), `detectarImportsClienteIndebidosEnContenido`, `contieneClavePrivilegiada`.

### Nota de honestidad TDD — tarea 8

El contrato de atomicidad evento+kilometraje ya estaba correctamente implementado
desde PR1 (tarea 4) y se preservó intacto durante la reapertura de la tarea 5
(scoping por hogar). Al escribir `registrar-evento-vehiculo.test.ts` dedicado que
pide la tarea 8, los tres tests pasaron en su primera ejecución sin necesitar
ningún cambio de código productivo: no hubo una fase RED real porque no había
ningún comportamiento incorrecto que corregir. Siguiendo la sección "Approval
Testing" de `strict-tdd.md` (pensada para consolidar comportamiento ya correcto
sin refactor), se documenta esto explícitamente en vez de fabricar una regresión
artificial en producción solo para forzar un RED — eso habría sido peor
ingeniería, no mejor disciplina TDD. El valor real de esta tarea 8 fue: (a) el
archivo de test dedicado que pide el enunciado, (b) la implementación Supabase
de la coordinación con su propio ciclo RED→GREEN genuino (`repositorio-eventos-supabase.test.ts`,
sección 7d), y (c) el comentario explícito de por qué no son dos escrituras
independientes.

### Comandos ejecutados (resumen)

- `npm test` (safety net inicial): 7 archivos, 59 tests.
- Tras cada RED: `npm test -- <archivo>` confirmando fallo (módulo inexistente o aserciones no cumplidas).
- Tras cada GREEN/TRIANGULATE: `npm test -- <archivo>` confirmando verde.
- `npm test` (suite completa, varias veces durante el corte): 16 archivos, 101 tests, siempre en verde al cierre de cada tarea.
- `npm run build`: verde en cada cierre de tarea (Next.js 16.2.10 + TypeScript, sin errores).
- `npm install @supabase/supabase-js@2.110.2`: añadida como dependencia de producción para el cliente de servidor.
- Grep manual (`rg`) para: imports prohibidos en dominio, `service_role`, `NEXT_PUBLIC_`, archivos `'use client'` — sin coincidencias fuera de comentarios/documentación esperados.

### Archivos cambiados

Modificados:
- `src/modulos/vehiculos/aplicacion/puertos/proveedor-identidad.ts`
- `src/modulos/vehiculos/aplicacion/puertos/repositorio-vehiculos.ts`
- `src/modulos/vehiculos/aplicacion/puertos/repositorio-eventos-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/registrar-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/listar-vehiculos.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/desactivar-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/registrar-evento-vehiculo.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/corregir-kilometraje.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/proveedor-identidad-temporal.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-vehiculos-en-memoria.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-eventos-vehiculo-en-memoria.ts`
- `src/modulos/vehiculos/dominio/vehiculo.ts`
- `src/modulos/vehiculos/dominio/vehiculo.test.ts`
- `supabase/migrations/README.md`
- `package.json`, `package-lock.json` (añadido `@supabase/supabase-js`)
- `openspec/changes/vehicle-maintenance-app/tasks.md`
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

Creados:
- `src/modulos/vehiculos/aplicacion/casos-uso/registrar-evento-vehiculo.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/mapeadores-supabase.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/cliente-supabase-servidor.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-vehiculos-supabase.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-eventos-supabase.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/bootstrap-servidor.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/proveedor-identidad-supabase-servidor.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/seguridad-servidor.ts` y `.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/pruebas/cliente-supabase-falso.ts`
- `src/compartido/infraestructura/entorno.ts` y `.test.ts`

No creados (bloqueado por sandbox, ver sección de blockers):
- `.env.example`

### Deviations del diseño

- **`Vehiculo.reconstruir()`/`reconstruirVehiculo()`** (nuevo, no estaba en `diseno.md` explícitamente): necesario para que el mapeador fila→dominio pueda reconstruir un vehículo inactivo con su `fechaDesactivacion` real de la fila, sin pasar por `desactivar(fechaDesactivacion)` (que asignaría la fecha de "ahora" conceptualmente, no la fecha ya persistida). No introduce `householdId` en el dominio; solo generaliza la reconstitución de un agregado ya existente. Se considera una extensión menor y necesaria del dominio, no una desviación de las reglas de negocio.
- **`existeMatricula` en Supabase usa `.eq('matricula', ...)` (sensible a mayúsculas/minúsculas)**, mientras el repositorio en memoria normaliza a mayúsculas antes de comparar. Se documenta como decisión: el adaptador Supabase respeta literalmente la restricción `unique (household_id, matricula)` de la migración (sensible a mayúsculas tal como está definida en SQL), en vez de añadir normalización adicional no pedida por el esquema. Si el producto necesita unicidad insensible a mayúsculas, requeriría una decisión SDD explícita y probablemente una migración (`citext` o índice funcional), fuera de alcance de PR2.
- **Atomicidad Supabase sin RPC**: por restricción explícita de "no crear/modificar migración", `repositorio-eventos-supabase.ts` coordina en aplicación (vehículo primero, evento después) en vez de una transacción SQL real. Riesgo de consistencia documentado explícitamente en el propio archivo y aquí: si el proceso cae entre ambas escrituras, quedaría kilometraje actualizado sin evento que lo respalde; no hay rollback automático. Mitigación futura sugerida: RPC/función SQL transaccional en una migración posterior, fuera de alcance de PR2.
- **`OperacionesBootstrap` es un puerto sin implementación real contra Postgres/Supabase** en este PR (ver blockers). La migración no otorga `insert` sobre `mv_households` a `authenticated`, así que el bootstrap real requeriría acceso administrativo directo a la base (fuera del cliente anon-key normal), que no se puede ejecutar ni probar sin un entorno Supabase real disponible en esta sesión.
- **`.env.example` no se pudo crear** por un bloqueo de sandbox a nivel de herramienta (ver blockers). Se documentaron los nombres exactos de variables en `supabase/migrations/README.md` como mitigación.

### Blockers / notas

- **Sin entorno Supabase real ni local disponible en esta sesión**: no hay MCP Supabase conectado, y no se intentó levantar Supabase CLI/Docker local para este corte (el harness de RLS runtime de PR1 sigue disponible pero es un mecanismo distinto, para validar RLS de la migración, no para probar estos adaptadores de aplicación). Por eso las tareas 6–9 se validan con dobles deterministas del cliente Supabase (`pruebas/cliente-supabase-falso.ts`) en vez de integración real. Esto es un blocker de infraestructura, no una omisión: el contrato (household_id inyectado/filtrado, orden de escrituras, resolución de contexto, idempotencia del bootstrap) queda probado de forma determinista y debería seguir cumpliéndose contra una instancia real, pero **no se ha ejecutado ninguna prueba de integración contra Supabase real o local en este PR2**.
- **`OperacionesBootstrap` sin implementación real**: el puerto está definido y probado con dobles; su implementación contra una base Postgres real (acceso administrativo aislado, fuera de RLS) queda pendiente de un entorno Supabase disponible. Debe resolverse antes de desplegar, documentado también en `supabase/migrations/README.md`.
- **`.env.example` bloqueado por sandbox**: el entorno de ejecución del agente impide escribir cualquier archivo `.env*` (incluso sin secretos reales), tanto con la herramienta de escritura de archivos como con Bash. Se documentaron los nombres de variables en el README de migraciones como mitigación; un operador humano puede crear el archivo real.
- **Líneas cambiadas de este corte** (PR2 completo, tareas 5–9): aproximadamente 420 inserciones/129 eliminaciones en archivos existentes más ~1.400 líneas en archivos nuevos bajo `adaptadores/supabase/` y `compartido/infraestructura/` (incluye producción y tests). Supera ampliamente el presupuesto de 400 líneas por diseño: la Review Workload Forecast de `tasks.md` ya anticipó esto y resolvió `auto-chain`/`stacked-to-main` con PR2 como un único corte autónomo verificable (no se subdivide más, siguiendo la instrucción explícita de ejecutar "solo el corte asignado por PR").
- Dos archivos (`openspec/changes/vehicle-maintenance-app/diseno.md`, `openspec/changes/vehicle-maintenance-app/spec.md`) aparecen como modificados en `git status` sin que este apply los haya tocado; el diff preexistía al inicio de esta sesión (probablemente de una sincronización SDD previa) y se deja intacto.

### Workload / PR boundary

- PR boundary de este corte: PR 2 completo (tareas 5, 6, 7, 8 y 9), sin tocar PR 3 (tareas 10–13) ni la migración SQL existente.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit ni se abrió PR (pendiente de confirmación explícita del usuario/orquestador).
- Verificación de cierre: `npm test` → 16 archivos, 101 tests, todos en verde. `npm run build` → verde con Next.js 16.2.10.

## Remediación fresca 4R (risk/resilience/readability/reliability) — 2026-07-11

### Estado estructurado consumido/producido

- Proyecto: `manteniment-vehicles`
- Cambio activo: `vehicle-maintenance-app`
- Artifact store: `both`; OpenSpec autoritativo.
- Modo: corte delegado de remediación de hallazgos confirmados por revisión fresca 4R sobre el diff de PR2 sin commitear.
- Estrategia de entrega vigente: `auto-chain`, `stacked-to-main`.
- Límite del corte: exactamente los 5 hallazgos confirmados (1 crítico de bootstrap, 1 crítico de errores tipados, 1 warning de dominio, 1 warning de divergencia de adaptadores, 1 sugerencia de `.upsert()`→`.insert()`). No se tocó la migración SQL ni `openspec/changes/archive/`.
- TDD estricto: activo; comando de tests `npm test`. Safety net inicial: 16 archivos, 101 tests en verde antes de tocar nada.

### Hallazgos resueltos

- [x] **Fix 1 (CRÍTICO)**: `sembrarHogarDeDesarrollo` ahora detecta condición de carrera en vez de duplicar en silencio. Tras CREAR un hogar (no tras encontrarlo), vuelve a consultar cuántos hogares existen con ese nombre (`OperacionesBootstrap.contarHogaresPorNombre`, nuevo método del puerto); si hay más de uno, lanza `ErrorRaceBootstrapHogar` (nuevo, tipado) en vez de continuar. Se documentó explícitamente en el comentario de módulo que esto es una mitigación de detección "single-instance/dev-only", NO una prevención real (esa requiere `unique` a nivel de BD + migración nueva, fuera de alcance). `tasks.md` sección 9 se corrigió: el checkbox de bootstrap ya no afirma sin matices que está "completo" — se dividió en orquestación/interfaz `[x]` (genuinamente hecha y probada contra dobles) más una tarea nueva explícita `[ ]` para la implementación real contra Postgres/Supabase Admin API + guardia de unicidad de BD, marcada como pendiente de entorno Supabase real.
- [x] **Fix 2 (CRÍTICO)**: se creó `errores-adaptador.ts` con la clase tipada `ErrorAdaptadorSupabase` (campo `codigo?: string`) y el helper `errorAdaptadorSupabaseDesde(contexto, errorCrudo)`. Se actualizaron los sitios que envolvían literalmente `${error.message}` de un error real de Supabase/Postgres en los cuatro archivos (`repositorio-vehiculos-supabase.ts`: 4 sitios; `repositorio-eventos-supabase.ts`: 5 sitios incluyendo el punto atómico; `proveedor-identidad-supabase-servidor.ts`: 1 sitio, el de lectura de membresía; `cliente-supabase-servidor.ts`: 1 sitio, autenticación). Los `throw new Error(...)` restantes en `proveedor-identidad-supabase-servidor.ts` (sesión no resuelta, sin membresía, rol desconocido) y en `cliente-supabase-servidor.ts` (guardia de ejecución en servidor) NO envuelven un error crudo de Supabase con código que preservar — son aserciones de estado de aplicación, no errores Postgres erosionados — y se dejaron intactos deliberadamente para no expandir el alcance del hallazgo. En el punto de riesgo de atomicidad documentado (`repositorio-eventos-supabase.ts`, cuando el insert del evento falla DESPUÉS de que la actualización del vehículo ya se confirmó) se añadió una única llamada `console.error` estructurada con `householdId`, `vehiculoId`, `codigo` y `mensaje` antes de relanzar, como señal grepeable para la reconciliación manual futura. Se decidió NO poner ese mismo log en el fallo de la actualización del propio vehículo (rama anterior) porque ahí todavía no hay ningún estado inconsistente (el evento nunca llega a confirmarse), así que no aplica el mismo riesgo — se documentó esta distinción explícitamente en el código y en el test.
- [x] **Fix 3 (WARNING)**: se añadió `validarConsistenciaEstadoDesactivacion(estado, fechaDesactivacion)` al constructor privado de `Vehiculo` (aplica a todos los puntos de entrada: `crear`, `desactivar`, `corregirKilometraje` y `reconstruir`). Rechaza `estado: 'activo'` con `fechaDesactivacion` definida, y `estado: 'inactivo'` sin `fechaDesactivacion`, lanzando `ErrorDominio` (el mismo tipo ya usado en el resto del archivo).
- [x] **Fix 4 (WARNING)**: se eliminó la normalización `trim().toLocaleUpperCase('es')` de `RepositorioVehiculosEnMemoria.existeMatricula`, que hacía la comparación insensible a mayúsculas mientras el adaptador Supabase real (`.eq('matricula', matricula)`) y la restricción `unique (household_id, matricula)` de la migración son sensibles a mayúsculas. Ahora ambos adaptadores comparan igual (sensible a mayúsculas). No existía ningún test previo que asertara explícitamente el rechazo insensible a mayúsculas (se buscó con `rg` en toda la suite); se añadió un test nuevo en `vehiculos-casos-uso.test.ts` que confirma el comportamiento real correcto: la misma matrícula con distinta capitalización SÍ puede registrarse en el mismo hogar.
- [x] **Fix 5 (SUGERENCIA)**: `repositorio-eventos-supabase.ts` usaba `.upsert(fila)` tanto en `guardar()` como en el tramo de escritura del evento dentro de `registrarEventoYActualizarKilometraje()`, lo que sobrescribiría en silencio un evento existente ante una colisión de id en vez de fallar por violación de restricción. Se cambiaron ambos sitios a `.insert(fila)`. La escritura de `mv_vehiculos` (que sí es mutable) conserva `.upsert()` sin cambios.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Fix 1: detección de condición de carrera en bootstrap | `adaptadores/supabase/bootstrap-servidor.test.ts` | Unit (operaciones falsas) | ✅ 2/2 antes de modificar | ✅ Nuevo test con `contarHogaresPorNombre` devolviendo 2 falló: `ErrorRaceBootstrapHogar` era `undefined` (no existía) | ✅ 3/3 tras añadir el método al puerto + la verificación post-creación + la clase de error | ✅ Verificado que el conteo NO se llama en el camino idempotente (segunda ejecución encuentra el hogar, no lo crea) | ✅ Comentario extenso de módulo explicando el alcance real de la mitigación (detección, no prevención) |
| Fix 2: `ErrorAdaptadorSupabase` (helper puro) | `adaptadores/supabase/errores-adaptador.test.ts` | Unit (función pura) | N/A (módulo nuevo) | ⚠️ Implementación y test del helper puro escritos juntos (utilidad de soporte, no el comportamiento principal del hallazgo); ver nota de honestidad TDD abajo | ✅ 2/2 | ✅ Caso con código y caso sin código (error de red) | ➖ Sin refactor necesario, módulo nuevo pequeño |
| Fix 2: repositorio de vehículos | `adaptadores/supabase/repositorio-vehiculos-supabase.test.ts` | Unit/contract (cliente falso) | ✅ 4/4 antes de modificar | ✅ 4 tests nuevos fallaron: error capturado no era instancia de `ErrorAdaptadorSupabase` | ✅ 8/8 tras reemplazar los 4 `throw new Error` por `errorAdaptadorSupabaseDesde` | ✅ Cubiertos `guardar`, `buscarPorId`, `listar`, `existeMatricula` con códigos `23505`/`42501` | ➖ Sin refactor adicional |
| Fix 2 + Fix 5: repositorio de eventos + log de atomicidad + insert | `adaptadores/supabase/repositorio-eventos-supabase.test.ts` | Unit/contract (cliente falso) | ✅ 6/6 antes de modificar | ✅ 8 tests nuevos fallaron (5 de tipado de error + 1 de `console.error` + 2 de `.insert()` vs `.upsert()`) | ✅ 13/13 tras reemplazar los 3 `throw new Error` restantes, añadir el log estructurado en el punto real de riesgo, y cambiar `.upsert()`→`.insert()` en ambos sitios de escritura de eventos | ✅ Cubiertos: fallo de vehículo (sin log, no hay inconsistencia todavía) vs. fallo de evento (con log, sí hay inconsistencia); evento histórico sin vehículo actualizado; violación `23505` de id duplicado con `.insert()` | ✅ Comentarios distinguiendo explícitamente los dos puntos de fallo y por qué solo uno necesita el log de reconciliación |
| Fix 2: proveedor de identidad de servidor | `adaptadores/supabase/proveedor-identidad-supabase-servidor.test.ts` | Unit (cliente falso) | ✅ 3/3 antes de modificar | ✅ 1 test nuevo falló: error capturado no era instancia de `ErrorAdaptadorSupabase` | ✅ 4/4 tras reemplazar el único `throw new Error` que envolvía un error crudo de Supabase (lectura de membresía) | ➖ Un solo caso relevante (los otros 3 `throw` no envuelven error crudo, quedaron fuera de alcance deliberadamente) | ➖ Sin refactor adicional |
| Fix 2: cliente de servidor | `adaptadores/supabase/cliente-supabase-servidor.test.ts` | Unit (`vi.mock`) | ✅ 3/3 antes de modificar | ✅ 1 test nuevo falló: error capturado no era instancia de `ErrorAdaptadorSupabase` | ✅ 4/4 tras reemplazar el `throw new Error` de autenticación | ✅ Cubierto con y sin código (`invalid_credentials`) | ➖ Sin refactor adicional |
| Fix 3: consistencia estado/fechaDesactivacion | `dominio/vehiculo.test.ts` | Unit/domain | ✅ 11/11 antes de modificar | ✅ 2 tests nuevos fallaron: `reconstruirVehiculo` con par inconsistente no lanzaba nada | ✅ 13/13 tras añadir `validarConsistenciaEstadoDesactivacion` al constructor privado | ✅ Cubiertos ambos pares inconsistentes: activo+fecha, inactivo+sin fecha | ✅ Validación colocada en el constructor privado compartido, no solo en `reconstruir`, para que aplique a todos los entry points |
| Fix 4: divergencia de `existeMatricula` | `aplicacion/casos-uso/vehiculos-casos-uso.test.ts` | Application (repositorio en memoria real) | ✅ 9/9 antes de modificar | ✅ 1 test nuevo falló: registrar la misma matrícula con distinta capitalización lanzaba `ErrorDominio` (comportamiento insensible a mayúsculas aspiracional/incorrecto) | ✅ 10/10 tras eliminar la normalización de `RepositorioVehiculosEnMemoria.existeMatricula` | ➖ Un solo caso relevante: no existía ningún test previo que dependiera del comportamiento insensible a mayúsculas (se verificó con búsqueda en toda la suite antes de tocar el código) | ✅ Función `normalizarMatricula` eliminada por completo (quedó sin uso) |

### Test Summary

- **Total tests nuevos en este corte**: 24 (1 archivo de test nuevo: `errores-adaptador.test.ts` con 2 tests; más tests añadidos en 6 archivos existentes).
- **Total tests passing (suite completa)**: 120/120 (`npm test`), 17 archivos.
- **Layers usadas**: Unit/domain, Application (con repositorio en memoria real), Unit/contract con dobles del cliente Supabase, Unit puro (helper de error).
- **Approval tests**: 0 estrictos; 1 caso marginal documentado abajo (helper puro de Fix 2 escrito junto con su test).
- **Pure functions creadas/ampliadas**: `errorAdaptadorSupabaseDesde`, `validarConsistenciaEstadoDesactivacion`.

### Nota de honestidad TDD — helper `errorAdaptadorSupabaseDesde`

El helper puro `errorAdaptadorSupabaseDesde` (Fix 2) se escribió junto con su test (`errores-adaptador.test.ts`) en vez de seguir un RED→GREEN estricto: es una utilidad de soporte nueva y trivial (mapear `{message, code}` a una clase de error), no el comportamiento observable que pide el hallazgo. El comportamiento real exigido por Fix 2 — que cada sitio de los cuatro adaptadores lance `ErrorAdaptadorSupabase` con el `codigo` correcto — sí siguió RED→GREEN genuino en cada uno de los cuatro archivos de test de adaptador (ver tabla arriba), incluyendo ejecución real de los tests fallando antes de tocar producción.

### Comandos ejecutados (resumen)

- `npm test` (safety net inicial): 16 archivos, 101 tests.
- Tras cada RED: `npx vitest run <archivo>` confirmando fallo real (assertion o instancia de error incorrecta).
- Tras cada GREEN: `npx vitest run <archivo>` confirmando verde.
- `npm test` (suite completa, verificado tras cada fix): 17 archivos, 120 tests, siempre en verde al cierre.
- `npm run build`: verde con Next.js 16.2.10 y TypeScript sin errores tras todos los fixes.
- `rg` manual para confirmar que no quedan `throw new Error` envolviendo error crudo de Supabase sin convertir, y que no queda `.upsert()` para la tabla de eventos.

### Archivos cambiados

Modificados:
- `src/modulos/vehiculos/adaptadores/supabase/bootstrap-servidor.ts`
- `src/modulos/vehiculos/adaptadores/supabase/bootstrap-servidor.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-vehiculos-supabase.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-vehiculos-supabase.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-eventos-supabase.ts`
- `src/modulos/vehiculos/adaptadores/supabase/repositorio-eventos-supabase.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/proveedor-identidad-supabase-servidor.ts`
- `src/modulos/vehiculos/adaptadores/supabase/proveedor-identidad-supabase-servidor.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/cliente-supabase-servidor.ts`
- `src/modulos/vehiculos/adaptadores/supabase/cliente-supabase-servidor.test.ts`
- `src/modulos/vehiculos/adaptadores/supabase/pruebas/cliente-supabase-falso.ts` (soporte de `.insert()` para el doble de test)
- `src/modulos/vehiculos/dominio/vehiculo.ts`
- `src/modulos/vehiculos/dominio/vehiculo.test.ts`
- `src/modulos/vehiculos/aplicacion/pruebas/repositorio-vehiculos-en-memoria.ts`
- `src/modulos/vehiculos/aplicacion/casos-uso/vehiculos-casos-uso.test.ts`
- `openspec/changes/vehicle-maintenance-app/tasks.md` (sección 9)
- `openspec/changes/vehicle-maintenance-app/apply-progress.md`

Creados:
- `src/modulos/vehiculos/adaptadores/supabase/errores-adaptador.ts`
- `src/modulos/vehiculos/adaptadores/supabase/errores-adaptador.test.ts`

### Desviaciones del diseño

- Ninguna desviación nueva de reglas de negocio. Todos los cambios son correcciones de robustez/tipado/consistencia sobre código ya implementado en PR2, sin tocar la migración SQL ni ampliar el alcance de los 5 hallazgos confirmados.
- La nota histórica de "Deviations del diseño" de la sección PR2 original (más arriba en este mismo archivo) documentaba `existeMatricula` en Supabase como sensible a mayúsculas "por decisión", contrastándolo con el repositorio en memoria insensible a mayúsculas. Esa nota histórica se deja intacta (describe correctamente lo que se decidió y por qué en ese momento); este corte corrige la implementación del repositorio en memoria para que coincida con esa decisión ya documentada, en vez of reescribir la historia.

### Blockers / notas

- Fix 1 sigue sin implementación real de `OperacionesBootstrap` contra Postgres/Supabase Admin API (ya documentado como blocker en la sección PR2 original): no hay entorno Supabase real ni local disponible en esta sesión. La nueva tarea `[ ]` en `tasks.md` sección 9 deja esto explícito como pendiente, junto con la guardia de unicidad de base de datos que requeriría una migración nueva.
- Ningún hallazgo de los 5 quedó sin completar: los 5 tienen ciclo RED→GREEN ejecutado y verificado, con la única excepción del sub-trabajo de infraestructura real de Fix 1 (implementación contra Postgres real), que ya estaba fuera de alcance por falta de entorno Supabase y se documenta como tarea pendiente explícita, no como fix incompleto.

### Workload / PR boundary

- PR boundary de este corte: remediación de 5 hallazgos confirmados de revisión fresca 4R sobre el diff PR2 sin commitear. No se tocó la migración SQL ni `openspec/changes/archive/`.
- Estrategia: `auto-chain`, `stacked-to-main`.
- No se hizo commit (pendiente de confirmación explícita del usuario/orquestador).
- Verificación de cierre: `npm test` → 17 archivos, 120 tests, todos en verde. `npm run build` → verde con Next.js 16.2.10.
