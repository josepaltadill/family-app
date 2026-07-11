// Doble de prueba mínimo del cliente Supabase de servidor. No hay entorno Supabase
// (local ni real) disponible en esta sesión (sin MCP conectado, sin Docker/CLI
// verificados para este corte); por eso los adaptadores de tarea 7/8 se validan con
// este doble determinista en lugar de una integración real. Documentado como
// blocker/decisión en apply-progress.md.
//
// Reproduce solo el subconjunto encadenable de la query builder de supabase-js que
// usan los repositorios de esta app: `select`, `eq`, `order`, `or`, `limit`,
// `maybeSingle`, `upsert` e `insert`. Cada llamada queda registrada para poder
// assertar que toda escritura inyecta `household_id` y toda lectura lo filtra.
export type OperacionRegistrada = Readonly<{ metodo: string; args: readonly unknown[] }>;
export type TablaRegistrada = Readonly<{ tabla: string; operaciones: OperacionRegistrada[] }>;

export type RespuestaClienteFalso = Readonly<{ data?: unknown; error?: unknown }>;

export function crearClienteSupabaseFalso(
  respuesta: RespuestaClienteFalso = {},
  respuestaPorTabla: Readonly<Record<string, RespuestaClienteFalso>> = {},
) {
  const llamadas: TablaRegistrada[] = [];

  function construirQuery(tabla: string) {
    const operaciones: OperacionRegistrada[] = [];
    llamadas.push({ tabla, operaciones });

    const respuestaTabla = respuestaPorTabla[tabla] ?? respuesta;
    const resolverPromesa = () =>
      Promise.resolve({ data: respuestaTabla.data ?? null, error: respuestaTabla.error ?? null });

    const query = {
      select(...args: unknown[]) {
        operaciones.push({ metodo: 'select', args });
        return query;
      },
      eq(...args: unknown[]) {
        operaciones.push({ metodo: 'eq', args });
        return query;
      },
      order(...args: unknown[]) {
        operaciones.push({ metodo: 'order', args });
        return query;
      },
      or(...args: unknown[]) {
        operaciones.push({ metodo: 'or', args });
        return query;
      },
      limit(...args: unknown[]) {
        operaciones.push({ metodo: 'limit', args });
        return query;
      },
      maybeSingle() {
        operaciones.push({ metodo: 'maybeSingle', args: [] });
        return resolverPromesa();
      },
      upsert(...args: unknown[]) {
        operaciones.push({ metodo: 'upsert', args });
        return resolverPromesa();
      },
      insert(...args: unknown[]) {
        operaciones.push({ metodo: 'insert', args });
        return resolverPromesa();
      },
      then(
        resolve: (valor: { data: unknown; error: unknown }) => unknown,
        reject?: (motivo: unknown) => unknown,
      ) {
        return resolverPromesa().then(resolve, reject);
      },
    };

    return query;
  }

  const cliente = {
    from: (tabla: string) => construirQuery(tabla),
  };

  return { cliente, llamadas };
}
