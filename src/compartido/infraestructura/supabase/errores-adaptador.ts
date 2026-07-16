// Error tipado compartido por los adaptadores Supabase de servidor. Todo error
// devuelto por el cliente Supabase (Postgres/PostgREST) trae un `code` (por
// ejemplo `23505` violación de unicidad, `42501` denegado por RLS) que se perdía
// al envolverlo en un `Error` genérico. `ErrorAdaptadorSupabase` conserva ese
// código en `codigo` para que quien llame pueda distinguir el tipo de fallo.
export class ErrorAdaptadorSupabase extends Error {
  readonly codigo?: string;

  constructor(mensaje: string, codigo?: string) {
    super(mensaje);
    this.name = 'ErrorAdaptadorSupabase';
    this.codigo = codigo;
  }
}

/**
 * Construye un `ErrorAdaptadorSupabase` a partir de un error crudo del cliente
 * Supabase (forma `{ message?: string; code?: string }`), sin asumir un tipo
 * concreto de `@supabase/supabase-js` para no acoplar este helper a una versión.
 */
export function errorAdaptadorSupabaseDesde(
  contexto: string,
  errorCrudo: { message?: string; code?: string } | null | undefined,
): ErrorAdaptadorSupabase {
  const mensaje = errorCrudo?.message ?? 'error desconocido';
  return new ErrorAdaptadorSupabase(`${contexto}: ${mensaje}`, errorCrudo?.code);
}
