# Diseño técnico: aplicación de mantenimiento de vehículos

## 1. Objetivo del diseño

Diseñar un MVP privado familiar para gestionar vehículos, mantenimientos, averías, kilometraje y vencimientos, usando una arquitectura ligera de tipo Clean/Hexagonal que permita empezar simple sin encerrar el dominio en Next.js, Supabase ni una solución concreta de autenticación.

Stack recomendado y aceptado para el diseño:

- Next.js + TypeScript para aplicación web responsive.
- Supabase self-hosted compartido para persistencia.
- Tailwind CSS para interfaz.
- Zod para validación de entrada y contratos.
- Vitest para pruebas unitarias y de aplicación.

No se detecta un bloqueo mayor para este stack en un proyecto greenfield. El punto importante es disciplinar las dependencias: el dominio no debe importar Next.js, Supabase, React ni Tailwind.

## 2. Principios arquitectónicos

La arquitectura será una Clean/Hexagonal ligera:

- `dominio`: reglas de negocio puras, entidades, value objects y decisiones de estado.
- `aplicacion`: casos de uso que coordinan dominio y puertos.
- `puertos`: interfaces que necesita la aplicación para persistir, leer usuario actual, fechas, etc.
- `adaptadores`: implementaciones concretas, por ejemplo Supabase.
- `interfaz`: páginas, componentes, formularios y server actions/API handlers de Next.js.

Regla de oro: las dependencias apuntan hacia dentro.

```text
interfaz / adaptadores -> aplicacion -> dominio
```

El dominio no sabe si se ejecuta desde una página, una server action, una API route, Supabase o una prueba.

## 3. Estructura propuesta de carpetas

```text
src/
  app/
    layout.tsx
    page.tsx
    vehiculos/
      page.tsx
      nuevo/page.tsx
      [vehiculoId]/page.tsx
      [vehiculoId]/eventos/nuevo/page.tsx
  modulos/
    vehiculos/
      dominio/
        vehiculo.ts
        evento-vehiculo.ts
        vencimiento.ts
        rol-usuario.ts
        errores-dominio.ts
      aplicacion/
        casos-uso/
          registrar-vehiculo.ts
          listar-vehiculos.ts
          desactivar-vehiculo.ts
          registrar-evento-vehiculo.ts
          corregir-kilometraje.ts
          evaluar-vencimientos.ts
        puertos/
          repositorio-vehiculos.ts
          repositorio-eventos-vehiculo.ts
          proveedor-fecha.ts
          proveedor-identidad.ts
      adaptadores/
        supabase/
          cliente-supabase-servidor.ts
          repositorio-vehiculos-supabase.ts
          repositorio-eventos-supabase.ts
          mapeadores-supabase.ts
      interfaz/
        acciones/
          acciones-vehiculos.ts
          acciones-eventos.ts
        componentes/
          formulario-vehiculo.tsx
          lista-vehiculos.tsx
          formulario-evento.tsx
          historial-eventos.tsx
        validacion/
          esquemas-vehiculo.ts
          esquemas-evento.ts
  compartido/
    dominio/
      identificador.ts
      resultado.ts
    infraestructura/
      entorno.ts
    pruebas/
      constructor-vehiculo.ts
      constructor-evento.ts
```

Notas:

- `src/modulos/vehiculos` concentra el primer dominio real. No conviene crear módulos artificiales todavía.
- `compartido` debe mantenerse pequeño. Si empieza a crecer, seguramente se está escondiendo dominio que pertenece a un módulo.
- Los nombres están en español por convención explícita del proyecto.

## 4. Modelo de dominio

### 4.1 Vehículo

Entidad `Vehiculo`:

- `id`
- `marca`
- `modelo`
- `anio`
- `combustible`
- `matricula`
- `kilometrosActuales`
- `estado`: `activo | inactivo`
- `fechaCompra`
- `fechaAltaAplicacion`
- `fechaDesactivacion`, opcional

Reglas:

- Un vehículo se desactiva, no se borra físicamente.
- La matrícula debería ser única entre vehículos activos. La política exacta para históricos queda como decisión abierta.
- El kilometraje actual puede subir automáticamente al registrar eventos con más kilómetros.
- El kilometraje actual puede corregirse manualmente hacia arriba o hacia abajo.

### 4.2 Evento de vehículo

Entidad `EventoVehiculo`:

- `id`
- `vehiculoId`
- `tipo`: `mantenimiento | averia`
- `descripcion`
- `kilometros`
- `fecha`
- `proveedor`, opcional o texto vacío permitido según validación de producto
- `coste`, opcional
- `moneda`, inicialmente `EUR` si hay coste
- `notas`, opcional
- `proximoVencimientoKm`, opcional
- `proximoVencimientoFecha`, opcional
- `fechaCreacion`

Reglas:

- El coste es opcional.
- El evento conserva su kilometraje original aunque sea inferior al kilometraje actual del vehículo.
- Un evento sin próximo vencimiento no participa en cálculo de recurrencia.

### 4.3 Vencimiento

Objeto/función de dominio `evaluarVencimiento`:

Entradas:

- evento con `proximoVencimientoKm` y/o `proximoVencimientoFecha`;
- `kilometrosActuales` del vehículo;
- `fechaActual`.

Salida sugerida:

```ts
type EstadoVencimiento = 'sin_vencimiento' | 'pendiente' | 'vencido';
```

Regla principal:

- Si existe vencimiento por kilómetros y el vehículo alcanza o supera ese valor, vence.
- Si existe vencimiento por fecha y la fecha actual alcanza o supera esa fecha, vence.
- Si existen ambos, vence cuando ocurra cualquiera primero.

### 4.4 Roles futuros

Concepto de dominio `RolUsuario`:

- `admin`
- `editor`

Intención de permisos futura:

- `admin`: crear/editar/desactivar vehículos, crear/editar eventos, corregir kilometraje y gestionar usuarios en el futuro.
- `editor`: crear/editar eventos y actualizar kilometraje; no puede desactivar vehículos ni gestionar usuarios.

En el primer PR sin autenticación real, se documentan los roles pero no se aplican restricciones. Los casos de uso deben recibir un `Actor` o `ContextoAutorizacion` opcional/falso para que la autorización real pueda añadirse después sin reescribir la lógica de dominio.

## 5. Casos de uso de aplicación

### 5.1 Registrar vehículo

Responsabilidades:

1. Validar entrada básica con Zod en la frontera de interfaz.
2. Construir `Vehiculo` válido en dominio.
3. Verificar matrícula duplicada según política MVP.
4. Persistir mediante `RepositorioVehiculos`.

### 5.2 Listar vehículos

Responsabilidades:

1. Leer vehículos desde `RepositorioVehiculos`.
2. Devolver datos ordenados para la pantalla principal.
3. Incluir activos e inactivos, o permitir filtro explícito.

### 5.3 Desactivar vehículo

Responsabilidades:

1. Cargar vehículo.
2. Cambiar estado a `inactivo` con fecha de desactivación.
3. Guardar sin eliminar eventos.

### 5.4 Registrar evento de vehículo

Responsabilidades:

1. Validar entrada.
2. Cargar vehículo.
3. Crear `EventoVehiculo`.
4. Guardar evento.
5. Si `evento.kilometros > vehiculo.kilometrosActuales`, actualizar kilometraje actual del vehículo.
6. Si el evento es histórico, conservarlo sin bajar automáticamente el kilometraje.

Este caso de uso debe ejecutarse de forma transaccional en el adaptador Supabase o mediante una operación coordinada que evite guardar evento sin actualizar kilometraje cuando corresponde.

### 5.5 Corregir kilometraje

Responsabilidades:

1. Cargar vehículo.
2. Cambiar `kilometrosActuales` al valor indicado, aunque suba o baje.
3. Guardar corrección.

Decisión práctica para MVP: no crear todavía una tabla de auditoría de correcciones, pero dejar el caso de uso separado para poder añadirla después.

### 5.6 Evaluar vencimientos

Responsabilidades:

1. Leer eventos con próximos vencimientos.
2. Leer vehículo asociado o sus kilómetros actuales.
3. Aplicar regla OR: kilómetros o fecha, lo que llegue primero.
4. Devolver estado calculado, sin necesidad de persistirlo en MVP.

Para el MVP conviene calcular vencimiento al consultar. Persistir estados derivados demasiado pronto suele generar inconsistencias.

## 6. Puertos y adaptadores

### 6.1 Puertos principales

```ts
interface RepositorioVehiculos {
  guardar(vehiculo: Vehiculo): Promise<void>;
  buscarPorId(id: string): Promise<Vehiculo | null>;
  listar(): Promise<Vehiculo[]>;
  existeMatriculaActiva(matricula: string): Promise<boolean>;
}

interface RepositorioEventosVehiculo {
  guardar(evento: EventoVehiculo): Promise<void>;
  listarPorVehiculo(vehiculoId: string): Promise<EventoVehiculo[]>;
  listarConVencimiento(): Promise<EventoVehiculo[]>;
}

interface ProveedorFecha {
  ahora(): Date;
}

interface ProveedorIdentidad {
  obtenerActorActual(): Promise<ActorAplicacion>;
}
```

`ProveedorIdentidad` puede devolver un actor de sistema o familiar por defecto en el primer PR. Cuando llegue Supabase Auth, solo se cambia el adaptador.

### 6.2 Adaptador Supabase

Responsabilidades:

- Convertir filas `mv_*` a entidades de dominio.
- Encapsular nombres de columnas y detalles SQL.
- No filtrar reglas de negocio fuera del dominio salvo restricciones de integridad necesarias.

### 6.3 Interfaz Next.js

Uso recomendado:

- Server Components para consultas iniciales.
- Server Actions para mutaciones simples del MVP.
- Zod en actions para validar payloads.
- Componentes React pequeños y presentacionales para formularios/listados.

No se recomienda introducir una capa API REST interna si la app solo consume sus propias server actions. Se podrá añadir después si aparece una app móvil nativa o integración externa.

## 7. Modelo de persistencia Supabase

Todas las tablas deben usar prefijo `mv_`.

### 7.1 Tabla `mv_vehiculos`

Columnas sugeridas:

- `id uuid primary key default gen_random_uuid()`
- `marca text not null`
- `modelo text not null`
- `anio integer not null`
- `combustible text not null`
- `matricula text not null`
- `kilometros_actuales integer not null check (kilometros_actuales >= 0)`
- `estado text not null check (estado in ('activo', 'inactivo'))`
- `fecha_compra date not null`
- `fecha_alta_aplicacion timestamptz not null default now()`
- `fecha_desactivacion timestamptz null`
- `creado_en timestamptz not null default now()`
- `actualizado_en timestamptz not null default now()`

Índices/restricciones:

- Índice por `estado`.
- Índice por `matricula`.
- Idealmente unicidad parcial para matrícula activa:
  - `unique (matricula) where estado = 'activo'` si la estrategia SQL del entorno lo permite.

### 7.2 Tabla `mv_eventos_vehiculo`

Columnas sugeridas:

- `id uuid primary key default gen_random_uuid()`
- `vehiculo_id uuid not null references mv_vehiculos(id)`
- `tipo text not null check (tipo in ('mantenimiento', 'averia'))`
- `descripcion text not null`
- `kilometros integer not null check (kilometros >= 0)`
- `fecha date not null`
- `proveedor text null`
- `coste numeric(10,2) null check (coste is null or coste >= 0)`
- `moneda text null`
- `notas text null`
- `proximo_vencimiento_km integer null check (proximo_vencimiento_km is null or proximo_vencimiento_km >= 0)`
- `proximo_vencimiento_fecha date null`
- `creado_en timestamptz not null default now()`
- `actualizado_en timestamptz not null default now()`

Índices:

- `vehiculo_id`
- `(vehiculo_id, fecha desc)`
- `proximo_vencimiento_km` cuando no sea nulo
- `proximo_vencimiento_fecha` cuando no sea nulo

### 7.3 Tablas futuras, no MVP

Reservar nombres conceptuales sin implementarlas aún:

- `mv_adjuntos_evento`
- `mv_manuales_vehiculo`
- `mv_extracciones_ocr`
- `mv_interacciones_asistente`

No crearlas en el primer PR salvo que haya una necesidad real. Preparar el diseño no significa pagar la complejidad ahora.

## 8. Estrategia de validación

Capas de validación:

1. **Zod en frontera de interfaz**: formularios y server actions validan tipos, campos obligatorios y formatos.
2. **Dominio**: protege invariantes reales, por ejemplo kilometraje no negativo, tipo de evento válido, estado válido.
3. **Base de datos**: restricciones `not null`, `check`, claves foráneas e índices únicos.

Ejemplos:

- `esquemaRegistrarVehiculo` valida que marca/modelo/matrícula no estén vacíos.
- `Vehiculo.crear` garantiza estado inicial activo y kilometraje no negativo.
- `mv_vehiculos` impide persistir kilometraje negativo aunque falle una capa superior.

Esto no es duplicación inútil: cada capa protege una frontera diferente.

## 9. Estrategia de pruebas

TDD estricto está activo en el proyecto y el comando configurado es `npm test`. Como el repo es greenfield, el primer PR debe crear `package.json`, Vitest y los primeros tests antes de la implementación correspondiente.

Pruebas mínimas recomendadas:

### 9.1 Pruebas de dominio con Vitest

- Crear vehículo válido.
- Rechazar kilometraje negativo.
- Desactivar vehículo conserva identidad y estado histórico.
- Registrar evento con kilometraje mayor produce decisión de actualización.
- Registrar evento histórico no reduce kilometraje automáticamente.
- Corrección manual permite subir y bajar.
- Vencimiento por kilómetros.
- Vencimiento por fecha.
- No vencido si ninguna condición llegó.
- Evento sin coste es válido.

### 9.2 Pruebas de casos de uso

Usar repositorios en memoria:

- `registrarVehiculo` guarda y lista.
- `desactivarVehiculo` no elimina eventos.
- `registrarEventoVehiculo` guarda evento y actualiza kilometraje cuando corresponde.
- `corregirKilometraje` permite valor inferior al último evento.

### 9.3 Pruebas de adaptador Supabase

En primer PR pueden quedar como pruebas de contrato pendientes si no hay entorno Supabase automatizado. Lo importante es no mezclar pruebas de dominio con infraestructura.

## 10. Despliegue y configuración

Destino previsto:

- VPS gestionado con Dokploy.
- Supabase self-hosted compartido.

Consideraciones:

- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y si aplica una clave de servicio solo en servidor.
- Nunca exponer claves privilegiadas al cliente.
- Migraciones SQL versionadas en el repo, por ejemplo `supabase/migrations/*`.
- Todas las tablas y artefactos SQL de esta app deben empezar por `mv_`.
- Como no hay autenticación real en el primer PR, evitar políticas RLS definitivas hasta diseñar auth. Si se activa RLS desde el inicio, documentar una política temporal explícita y segura para entorno privado.

## 11. Límite de autenticación futura

El primer PR puede funcionar sin login real, pero la arquitectura debe dejar una costura clara:

- Los casos de uso pueden recibir `ActorAplicacion`.
- `ProveedorIdentidad` devuelve un actor temporal en MVP.
- La autorización futura se añade como servicio/caso de uso de aplicación, no dentro de componentes React.
- Supabase Auth será un adaptador posible, no una dependencia del dominio.

Modelo conceptual:

```ts
type ActorAplicacion = {
  id: string;
  rol: 'admin' | 'editor';
};
```

En MVP:

- Actor fijo: `admin` o `editor` temporal según convenga para desarrollo.
- Permisos documentados, no aplicados.

En fase futura:

- `admin` podrá desactivar vehículos y gestionar usuarios.
- `editor` no podrá desactivar vehículos ni gestionar usuarios.

## 12. Fronteras del primer PR

Incluido en primer PR:

- Inicialización de Next.js + TypeScript + Tailwind + Vitest.
- Estructura modular `vehiculos`.
- Dominio y casos de uso básicos.
- Repositorios en memoria para tests.
- Adaptador Supabase mínimo o migraciones iniciales según corte de tareas.
- Pantallas mínimas para alta/listado de vehículos.
- Desactivación lógica.
- Registro manual de eventos.
- Actualización automática de kilometraje por evento más reciente.
- Corrección manual de kilometraje.
- Evaluación de vencimientos recurrentes.

Fuera del primer PR:

- Autenticación real.
- Permisos aplicados por rol.
- Adjuntos.
- OCR.
- IA/manuales/chat.
- Notificaciones.
- Dashboard avanzado.
- Auditoría completa de correcciones.

## 13. Decisiones tomadas

- Stack: Next.js + TypeScript + Supabase + Tailwind + Zod + Vitest.
- Arquitectura: Clean/Hexagonal ligera, no ceremonial.
- Persistencia: tablas Supabase con prefijo obligatorio `mv_`.
- Coste de evento: opcional.
- Corrección de kilometraje: puede subir o bajar.
- Mantenimiento recurrente: vence por kilometraje o fecha, lo que ocurra primero.
- Autenticación: desacoplada; primer PR puede usar actor temporal.
- Adjuntos/OCR/IA/chat: roadmap, sin implementación MVP.

## 14. Riesgos de diseño

- **Transaccionalidad evento + kilometraje**: registrar evento y actualizar vehículo debe ser atómico o recuperable. Si se implementa con dos llamadas separadas sin cuidado, puede quedar inconsistencia.
- **Autenticación diferida**: empezar sin auth acelera el MVP, pero hay que mantener `ProveedorIdentidad` y `ActorAplicacion` desde el principio para no reescribir luego.
- **RLS en Supabase compartido**: cuando haya auth, las políticas deben diseñarse con cuidado para no exponer datos entre apps o usuarios.
- **Matrícula duplicada**: la regla exacta para vehículos históricos necesita una decisión final antes de cerrar migraciones definitivas.
- **Auditoría de kilometraje**: permitir correcciones hacia abajo es necesario, pero en el futuro convendrá auditar quién corrigió, cuándo y por qué.
- **Presupuesto de revisión**: inicializar stack + dominio + UI + Supabase puede superar 400 líneas; conviene dividir tareas en cortes revisables.

## 15. Decisiones abiertas

1. ¿La matrícula debe ser única globalmente o solo entre vehículos activos?
2. ¿El proveedor/taller es obligatorio o puede quedar vacío?
3. ¿El primer PR incluye migraciones Supabase reales o empieza con dominio/UI y deja Supabase para el siguiente corte?
4. ¿Se activará RLS desde el primer despliegue aunque no haya auth real?
5. ¿Se quiere registrar una razón textual para correcciones manuales de kilometraje desde el MVP?

## 16. Guía educativa para implementación

No conviene empezar por pantallas bonitas. Primero hay que capturar reglas: kilometraje, baja lógica, eventos históricos y vencimientos. La UI cambia fácil; un dominio mal separado se paga durante todo el proyecto.

Orden sano:

1. Tests de dominio.
2. Entidades y reglas puras.
3. Casos de uso con repositorios en memoria.
4. Adaptador Supabase.
5. Interfaz Next.js.

Así el framework queda como una herramienta, no como el dueño del diseño.
