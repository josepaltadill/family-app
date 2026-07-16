// Cliente Supabase de SERVIDOR. Decisión de credencial resuelta (diseño §15.6):
// se autentica como un usuario `auth.users` real sembrado por bootstrap (ver
// `bootstrap-servidor.ts`), no con `service_role`. RLS sigue siendo la frontera
// de seguridad real: este cliente solo puede leer/escribir lo que la membresía
// del usuario sembrado permita.
//
// Este módulo NUNCA debe importarse desde componentes cliente ni desde código que
// se ejecute en el navegador. La guarda `asegurarEjecucionServidor` lo impide en runtime.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoSupabase, type EntornoSupabase } from '../entorno';
import { errorAdaptadorSupabaseDesde } from './errores-adaptador';

export type ClienteSupabaseServidor = SupabaseClient;

export async function crearClienteSupabaseServidor(
  entorno: EntornoSupabase = leerEntornoSupabase(),
): Promise<ClienteSupabaseServidor> {
  asegurarEjecucionServidor();

  const cliente = createClient(entorno.url, entorno.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await cliente.auth.signInWithPassword({
    email: entorno.bootstrapEmail,
    password: entorno.bootstrapPassword,
  });

  if (error) {
    throw errorAdaptadorSupabaseDesde('No se pudo autenticar el usuario de servidor sembrado', error);
  }

  return cliente;
}

function asegurarEjecucionServidor(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'crearClienteSupabaseServidor solo puede ejecutarse en servidor: nunca debe llamarse desde código de cliente/navegador.',
    );
  }
}
