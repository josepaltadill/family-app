# Contexto del proyecto: family-app

## Resumen

Aplicación privada familiar para gestionar vehículos, mantenimientos, averías, costes, kilometraje y próximos vencimientos.

## Estado actual

- El repositorio Git está inicializado y contiene una aplicación existente.
- La aplicación usa Node.js, npm, TypeScript 5.9, Next.js 16 con App Router y React 19.
- La persistencia usa Supabase/PostgreSQL; Zod 4 valida datos y Tailwind CSS 4 proporciona estilos.
- El código actual está organizado bajo `src/app`, `src/compartido` y `src/modulos`.
- El cambio activo es `openspec/changes/family-app-modularization/`.
- La persistencia productiva actual todavía usa objetos `mv_*`.
- El contrato objetivo del cambio activo usa `fam_*` para el núcleo y `fam_ve_*` para vehículos; no se considera aplicado hasta ejecutar y verificar el cambio.

## Pruebas y calidad

- Runner: Vitest 4, con Testing Library disponible.
- Comando: `npm test` (`vitest run`).
- Entorno predeterminado: Node.
- Descubrimiento: `src/**/*.test.ts` y `src/**/*.test.tsx`.
- TDD estricto: activo.

## Convenciones obligatorias

- Artefactos técnicos en español por decisión explícita del usuario.
- Documentación, comentarios, clases, funciones, variables y configuración generada en español.
- Alias de importación TypeScript: `@/*` apunta a `./src/*`.
- Mantener separadas las capas de dominio, aplicación, infraestructura e interfaz durante la modularización.
- Distinguir siempre el estado actual `mv_*` del contrato final `fam_*`/`fam_ve_*` definido por el cambio activo.

## SDD

- Modo de ejecución: interactivo.
- Almacén de artefactos: OpenSpec autoritativo con reflejo en Engram (`both`).
- Estrategia de PR: auto-forecast.
- Presupuesto de revisión: 400 líneas cambiadas.
- Cambio activo: `family-app-modularization`.

## Riesgos conocidos

- El corte de persistencia afecta tablas, relaciones, índices, restricciones, funciones, triggers, políticas RLS, grants y consumidores de código; debe mantenerse coordinado y no destructivo según los artefactos del cambio activo.
- Las especificaciones históricas conservan referencias `mv_*`; no deben confundirse con el contrato objetivo del cambio activo ni reescribirse como parte de esta inicialización.
