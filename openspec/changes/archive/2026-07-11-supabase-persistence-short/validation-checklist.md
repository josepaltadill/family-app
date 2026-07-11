# Validación estática de la migración

Esta evidencia revisa archivos; no autoriza ni sustituye una prueba RLS runtime local/efímera. Esa prueba es un bloqueo de despliegue y debe pasar antes de aplicar la migración a cualquier Supabase real.

## RED — contrato incompleto antes de implementar

- [x] La revisión inicial fallaba: no existía migración, por lo que faltaban las cuatro tablas, `household_id` obligatorio, unicidad por hogar, FK compuesta y RLS completa.

## GREEN — revisión posterior

- [x] Existe una única migración versionada que crea exactamente `mv_households`, `mv_household_members`, `mv_vehiculos` y `mv_eventos_vehiculo`.
- [x] Vehículos y eventos tienen `household_id uuid not null`; eventos usan la FK compuesta hacia `(household_id, id)` de vehículos.
- [x] La matrícula es única por `(household_id, matricula)`, incluyendo inactivos; checks cubren textos, año, kilómetros, costes, estados, tipo y desactivación.
- [x] Todos los objetos propios (tablas, constraints, índices, funciones y policies) usan el prefijo `mv_`.
- [x] RLS está habilitada en las cuatro tablas; `anon` queda revocado y `authenticated` recibe solo privilegios con policies correspondientes.
- [x] Las policies usan `using` y `with check` cuando aplican; las funciones son `security definer`, con `set search_path = ''`, objetos cualificados y sin `user_id` del cliente. Las funciones de consulta RLS son además `stable`.
- [x] `mv_preservar_admin_hogar()` y sus triggers `mv_*` de `update`/`delete` rechazan quitar al último admin mediante una membresía normal; el bloqueo por hogar serializa eliminaciones concurrentes y el borrado en cascada del propio hogar sigue permitido.
- [x] No hay inserción autenticada de hogares ni bootstrap de admin ejecutable; el bootstrap queda server-only.
- [x] Los grants directos a `authenticated` existen únicamente para que RLS sea aplicable bajo ese rol Supabase. Las invariantes críticas permanecen en PostgreSQL y el acceso directo desde producto/navegador queda fuera de alcance hasta decidir el adaptador futuro.

## TRIANGULATE — límites y seguridad

- [x] La inspección estática no encontró `drop schema`, `drop database`, `supabase db push`, `supabase migration up`, `supabase db reset`, resets, seeds, `psql` contra la instancia compartida ni `cascade` destructivo.
- [x] El diff no contiene adaptador TypeScript, UI, seed ni cambios fuera de la migración, guardarraíl y evidencia del cambio.
- [x] No se conectó ni mutó una base Supabase real.
- [x] El diff completo supera 400 líneas al contar los artefactos SDD. Se registra `size:exception` para mantener este bundle de aprendizaje en un único commit; el payload de implementación sigue acotado y cualquier crecimiento funcional debe separarse.

## Runbook ensayable antes de una aplicación real

Responsable: el release owner autorizado, identificado por nombre en el registro de despliegue.

- [ ] Registrar un backup restaurable (snapshot/PITR o export equivalente), su identificador, hora y retención; demostrar una restauración en local/efímero.
- [ ] Ensayar fix-forward SQL aditivo y rollback/restauración con una copia representativa. Los scripts no pueden truncar, borrar ni aplicar cascadas sobre datos inciertos.
- [ ] Documentar el punto de decisión: fix-forward si datos e aislamiento siguen íntegros y la corrección revisada cabe en la ventana; rollback/restauración si integridad o aislamiento no pueden garantizarse o la corrección no es segura a tiempo.
- [ ] Preparar la pausa de escrituras y registrar operador, comandos revisados, timestamps y resultado. No improvisar SQL de producción.

## Guardia de salud después de aplicar

Esta sección es un bloqueo previo al despliegue: no aplicar a Supabase real hasta que cada elemento tenga responsable, fuente y destino verificables.

- [ ] Registrar hora UTC, release owner, suplente, responsable Supabase/Postgres y el canal operativo o contacto on-call existente que todos vigilarán; no se exige contratar un servicio externo.
- [ ] Registrar las rutas exactas a Supabase Studio Logs Explorer (Postgres y API) y al dashboard de latencia disponible. MCP Supabase es una alternativa read-only para consultar esos mismos logs cuando esté conectado.
- [ ] Guardar la línea base de 30 minutos: total de solicitudes DB/API, errores, tasa de error, p95/p99 y porcentaje fuera del SLO. Si la instalación no ofrece denominador o percentiles reproducibles, mantener el despliegue bloqueado hasta documentar una vista equivalente.
- [ ] Preparar los filtros reproducibles para consultas `mv_*`, `permission denied`, `row-level security`, `violates check constraint`, `duplicate key`, `foreign key`, `deadlock` y `canceling statement`; registrar intervalo UTC, filtro, total y resultado.
- [ ] Preparar en Studio SQL Editor el smoke query read-only de `design.md`/`supabase/migrations/README.md` para cruces u orfandad de eventos, matrículas duplicadas por hogar y hogares sin admin; los tres contadores deben ser `0`.
- [ ] Abrir observación al finalizar, repetir controles cada 5 minutos durante 30 minutos y a los 60 y 120 minutos, y registrar timestamp UTC, fuente, consulta/filtro, resultado y responsable.
- [ ] Aplicar escalado a errores o solicitudes fuera de SLO: **>1%** release owner investiga/detiene ampliación; **>2%** avisa a suplente y responsable Supabase/Postgres, activa emergencia y prepara recuperación; **>5%** avisa al equipo responsable por el destino registrado y congela escrituras/despliegues.
- [ ] Tratar cualquier contador no cero, acceso cruzado entre hogares o pérdida del último admin como emergencia inmediata, sin esperar al umbral porcentual.

## Bloqueo de despliegue pendiente

- [ ] Ejecutar en una base PostgreSQL/Supabase local o efímera pruebas runtime de RLS para `anon`, no miembro, `editor` y `admin`, además de los casos de último admin (`delete`, cambio de rol, traslado de hogar y borrado del hogar). No aplicar la migración a una instancia Supabase real hasta que todas pasen.
- [ ] Registrar los resultados runtime y la versión del entorno efímero antes de solicitar autorización de aplicación real.
- [ ] Completar el ensayo de backup/recuperación y asignar operador responsable antes de autorizar la aplicación.
