# Contexto del proyecto: family-app

## Resumen

Aplicación privada familiar para gestionar vehículos, mantenimientos, averías, costes, kilometraje y próximos vencimientos.

## Estado actual

- Repositorio greenfield.
- No hay stack de aplicación definido todavía.
- Git no está inicializado en este directorio.
- Existe una propuesta inicial en `openspec/changes/vehicle-maintenance-app/propuesta.md`.

## Convenciones obligatorias

- Artefactos técnicos en español por decisión explícita del usuario.
- Documentación, comentarios, clases, funciones, variables y configuración generada en español.
- Tablas de Supabase con prefijo `mv_`.

## SDD

- Modo de ejecución: interactivo.
- Almacén de artefactos: OpenSpec y Engram cuando esté disponible.
- Estrategia de PR: auto-forecast.
- Presupuesto de revisión: 400 líneas cambiadas.
- TDD estricto: activo.
- Comando de tests configurado: `npm test`.

## Riesgos conocidos

- Engram no responde durante esta inicialización; OpenSpec queda como persistencia disponible.
- El comando `npm test` está configurado, pero todavía no existe `package.json`; deberá verificarse cuando se elija el stack.
