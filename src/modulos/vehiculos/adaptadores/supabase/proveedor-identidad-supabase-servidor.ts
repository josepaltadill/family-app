// Adaptador de servidor de `ProveedorIdentidad` (diseño §6.1/§15.6/§15.7).
//
// El `householdId` que recibe este adaptador SIEMPRE viene del resultado real
// de `sembrarHogarDeDesarrollo` (bootstrap-servidor.ts): nunca es un valor
// arbitrario ni inventado en este archivo. El cliente inyectado ya está
// autenticado como el usuario sembrado (`crearClienteSupabaseServidor` hace el
// `signInWithPassword`); este adaptador solo confirma esa identidad y resuelve
// su rol dentro del hogar mediante una lectura normal sujeta a RLS
// (`mv_household_members_select_member_or_admin`: un miembro puede leer su
// propia fila). No se usa `service_role` en ningún punto de esta resolución.
import { crearIdentificador, type Identificador } from '../../../../compartido/dominio/identificador';
import { esRolUsuario } from '../../dominio/rol-usuario';
import type { ContextoAplicacion, ProveedorIdentidad } from '../../aplicacion/puertos/proveedor-identidad';
import type { ClienteSupabaseServidor } from './cliente-supabase-servidor';
import { errorAdaptadorSupabaseDesde } from './errores-adaptador';

export class ProveedorIdentidadSupabaseServidor implements ProveedorIdentidad {
  constructor(
    private readonly cliente: ClienteSupabaseServidor,
    private readonly householdIdSembrado: Identificador,
  ) {}

  async obtenerContexto(): Promise<ContextoAplicacion> {
    const { data: sesion, error: errorSesion } = await this.cliente.auth.getUser();

    if (errorSesion || !sesion?.user) {
      throw new Error('No se pudo resolver el usuario de servidor autenticado.');
    }

    const { data: membresia, error: errorMembresia } = await this.cliente
      .from('mv_household_members')
      .select('rol')
      .eq('household_id', this.householdIdSembrado.valor)
      .eq('user_id', sesion.user.id)
      .maybeSingle();

    if (errorMembresia) {
      throw errorAdaptadorSupabaseDesde('No se pudo resolver la membresía del hogar sembrado', errorMembresia);
    }

    if (!membresia) {
      throw new Error('El usuario de servidor no tiene membresía en el hogar de desarrollo sembrado.');
    }

    if (!esRolUsuario(membresia.rol)) {
      throw new Error(`Rol de membresía desconocido: ${membresia.rol}`);
    }

    return {
      actor: {
        id: crearIdentificador(sesion.user.id),
        rol: membresia.rol,
      },
      householdId: this.householdIdSembrado,
    };
  }
}
