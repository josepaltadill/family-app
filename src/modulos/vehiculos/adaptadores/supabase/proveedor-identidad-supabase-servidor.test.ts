import { describe, expect, it } from 'vitest';
import { crearIdentificador } from '../../../../compartido/dominio/identificador';
import { crearClienteSupabaseFalso } from './pruebas/cliente-supabase-falso';
import { ProveedorIdentidadSupabaseServidor } from './proveedor-identidad-supabase-servidor';
import { ErrorAdaptadorSupabase } from './errores-adaptador';
import type { ClienteSupabaseServidor } from './cliente-supabase-servidor';

// El householdId sembrado se inyecta desde el resultado REAL del bootstrap
// (`sembrarHogarDeDesarrollo`), nunca como valor arbitrario (diseño §15.7).
const householdIdSembrado = crearIdentificador('hogar-real-1');

function clienteConUsuarioYMembresia(
  usuarioId: string | null,
  membresia: { rol: string } | null,
): ClienteSupabaseServidor {
  const { cliente } = crearClienteSupabaseFalso({ data: membresia });
  const clienteFalso = cliente as unknown as {
    from: ClienteSupabaseServidor['from'];
    auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: null }> };
  };
  clienteFalso.auth = {
    getUser: async () => ({ data: { user: usuarioId ? { id: usuarioId } : null }, error: null }),
  };
  return clienteFalso as unknown as ClienteSupabaseServidor;
}

describe('ProveedorIdentidadSupabaseServidor', () => {
  it('resuelve el contexto con el householdId sembrado y el rol admin de la membresía', async () => {
    const cliente = clienteConUsuarioYMembresia('usuario-real-1', { rol: 'admin' });
    const proveedor = new ProveedorIdentidadSupabaseServidor(cliente, householdIdSembrado);

    const contexto = await proveedor.obtenerContexto();

    expect(contexto.householdId.valor).toBe('hogar-real-1');
    expect(contexto.actor.id.valor).toBe('usuario-real-1');
    expect(contexto.actor.rol).toBe('admin');
  });

  it('resuelve el contexto con rol editor cuando la membresía es editor', async () => {
    const cliente = clienteConUsuarioYMembresia('usuario-real-2', { rol: 'editor' });
    const proveedor = new ProveedorIdentidadSupabaseServidor(cliente, householdIdSembrado);

    const contexto = await proveedor.obtenerContexto();

    expect(contexto.actor.rol).toBe('editor');
  });

  it('rechaza resolver el contexto si el usuario de servidor no tiene membresía en el hogar sembrado', async () => {
    const cliente = clienteConUsuarioYMembresia('usuario-sin-hogar', null);
    const proveedor = new ProveedorIdentidadSupabaseServidor(cliente, householdIdSembrado);

    await expect(proveedor.obtenerContexto()).rejects.toThrow(/no tiene membresía/);
  });

  it('lanza ErrorAdaptadorSupabase con el código Postgres cuando falla la lectura de membresía', async () => {
    const { cliente } = crearClienteSupabaseFalso({
      error: { message: 'permission denied for table mv_household_members', code: '42501' },
    });
    const clienteFalso = cliente as unknown as {
      from: ClienteSupabaseServidor['from'];
      auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: null }> };
    };
    clienteFalso.auth = {
      getUser: async () => ({ data: { user: { id: 'usuario-real-1' } }, error: null }),
    };
    const proveedor = new ProveedorIdentidadSupabaseServidor(
      clienteFalso as unknown as ClienteSupabaseServidor,
      householdIdSembrado,
    );

    let errorCapturado: unknown;
    try {
      await proveedor.obtenerContexto();
    } catch (error) {
      errorCapturado = error;
    }

    expect(errorCapturado).toBeInstanceOf(ErrorAdaptadorSupabase);
    expect((errorCapturado as ErrorAdaptadorSupabase).codigo).toBe('42501');
  });
});
