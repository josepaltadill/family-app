import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { leerEntornoRuntimeSupabase } from '../../compartido/infraestructura/entorno';
import { crearClienteSupabaseSsrPorSolicitud, type ClienteSupabaseSsr } from '../../compartido/infraestructura/supabase/cliente-supabase-ssr';
import { ProveedorIdentidadSupabaseServidor } from '../../nucleo-familiar/adaptadores/supabase/proveedor-identidad-supabase-servidor';
import type { AccesoFamiliar, ContextoAplicacion } from '../../nucleo-familiar/aplicacion/puertos/alcance-familiar';
export type AlcanceFamiliarPorSolicitud = Readonly<{ clienteSupabase: ClienteSupabaseSsr; contextoFamiliar: ContextoAplicacion }>;
class DenegacionAccesoFamiliar extends Error { constructor(readonly ruta: '/login' | '/acceso-no-disponible', mensaje: string) { super(mensaje); } }
type DependenciasSolicitud = Readonly<{ crearClienteSupabase: () => ClienteSupabaseSsr; crearProveedorIdentidad: (cliente: ClienteSupabaseSsr) => Readonly<{ resolverAcceso(): Promise<AccesoFamiliar> }> }>;
export async function resolverAlcanceFamiliarPorSolicitud(dependencias: DependenciasSolicitud): Promise<AlcanceFamiliarPorSolicitud> {
  const clienteSupabase = dependencias.crearClienteSupabase(); const acceso = await dependencias.crearProveedorIdentidad(clienteSupabase).resolverAcceso();
  if (acceso.estado === 'concedido') return Object.freeze({ clienteSupabase, contextoFamiliar: acceso.contexto });
  throw acceso.estado === 'anonimo'
    ? new DenegacionAccesoFamiliar('/login', 'Sesión familiar no disponible')
    : new DenegacionAccesoFamiliar('/acceso-no-disponible', `Contexto familiar no disponible: ${acceso.motivo}`);
}
export async function resolverAlcanceFamiliarActual(): Promise<AlcanceFamiliarPorSolicitud> {
  const almacenCookies = await cookies();
  const clienteSupabase = crearClienteSupabaseSsrPorSolicitud(leerEntornoRuntimeSupabase(), { getAll: () => almacenCookies.getAll(), setAll: (cookiesParaEscribir) => cookiesParaEscribir.forEach(({ name, value, options }) => almacenCookies.set(name, value, options)) });
  return resolverAlcanceFamiliarPorSolicitud({ crearClienteSupabase: () => clienteSupabase, crearProveedorIdentidad: (cliente) => new ProveedorIdentidadSupabaseServidor(cliente) });
}
export async function crearDependenciasVehiculosPorSolicitud(resolverAlcance = resolverAlcanceFamiliarActual) {
  try { const { crearDependenciasVehiculos } = await import('../../modulos/vehiculos/interfaz/composicion/dependencias-servidor'); return crearDependenciasVehiculos(await resolverAlcance()); }
  catch (error) { if (error instanceof DenegacionAccesoFamiliar) redirect(error.ruta); throw error; }
}
