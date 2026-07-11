# Propuesta: aplicación de mantenimiento de vehículos

## Problema

El usuario necesita una aplicación privada familiar para gestionar el histórico de mantenimientos, averías, costes y próximos vencimientos de varios vehículos.

El proyecto también servirá para aprender buenas prácticas de programación, por lo que la implementación debe priorizar un modelo de dominio claro, PRs pequeños, tests y decisiones arquitectónicas explícitas.

## Usuarios

- Administradores de la familia
- Editores de la familia

Roles iniciales:

- `admin`
- `editor`

Los permisos concretos se definirán más adelante.

## Flota inicial

La app empieza con:

- 2 coches
- 2 motos

El sistema debe permitir dar de alta nuevos vehículos y desactivar vehículos que ya no se posean.

Los vehículos no deben borrarse físicamente, porque el histórico debe conservarse.

## Datos del vehículo

Cada vehículo debe guardar como mínimo:

- marca
- modelo
- año
- combustible
- matrícula
- kilómetros actuales
- estado
- fecha de compra
- fecha de alta en la aplicación

Los kilómetros actuales pueden actualizarse manualmente por el usuario o automáticamente cuando se registre una avería/mantenimiento con un kilometraje más reciente.

También debe poder corregirse el kilometraje si hubo una entrada manual incorrecta o una lectura OCR errónea futura.

## Mantenimientos y averías

El MVP debe permitir registrar eventos de vehículo como:

- mantenimiento
- avería

Cada evento debe guardar como mínimo:

- vehículo
- tipo: mantenimiento o avería
- descripción
- kilometraje
- fecha
- taller/proveedor
- coste
- notas
- próximo vencimiento por kilómetros, opcional
- próximo vencimiento por fecha, opcional

Ejemplo de mantenimiento:

- Cambio de aceite + filtro de aceite + filtro de aire
- 120000 km
- Taller X
- 300 EUR
- Próximo vencimiento: 130000 km o 1 año

Ejemplo de avería:

- Cambio de bombilla de piloto trasero
- 120005 km
- Taller X
- 50 EUR

## Recurrencia y avisos

Un mantenimiento recurrente debe considerarse vencido cuando llegue antes cualquiera de estas condiciones:

- el kilometraje objetivo
- la fecha objetivo

La app también debe soportar en el futuro un aviso por vehículo cuando pasen X días desde la última actualización de kilómetros.

## Adjuntos, OCR e IA

El modelo debe dejar espacio para adjuntos futuros, como fotos de facturas o documentos.

Capacidades futuras posibles:

- adjuntar fotos de facturas a eventos
- extraer datos de facturas mediante OCR
- subir manuales de mantenimiento en PDF por vehículo
- extraer próximos mantenimientos desde manuales con IA
- consultar los manuales mediante un chat tipo asistente

Estas funciones quedan fuera del primer MVP, pero el diseño inicial no debe bloquearlas.

## Acceso y despliegue

La app debe poder usarse desde ordenador y móvil.

Habrá autenticación porque la usará la familia, pero el primer PR puede empezar sin autenticación real si la arquitectura queda preparada para incorporarla después sin reescribir el dominio.

Destino de despliegue:

- VPS gestionado con Dokploy
- Supabase self-hosted compartido

Como ese Supabase compartido usa un único proyecto, las tablas de esta app deben usar el prefijo:

- `mv_`

## Alcance del MVP / primer PR

El primer corte útil debe incluir:

1. Alta y listado de vehículos.
2. Baja lógica / desactivación de vehículos.
3. Entrada manual de mantenimientos y averías.
4. Actualización automática de kilómetros al registrar eventos.
5. Corrección manual de kilómetros cuando sea necesario.

Fuera del primer PR:

- OCR
- ingesta de manuales con IA
- chat sobre manuales
- notificaciones push/email
- matriz detallada de permisos por rol
- dashboard avanzado

## Decisiones pendientes

1. Stack principal de la aplicación.
2. Cómo separar dominio, persistencia, interfaz y autenticación futura.
3. Qué nivel de tests exigiremos desde el primer PR.
4. Cómo modelar adjuntos futuros sin implementarlos todavía.
