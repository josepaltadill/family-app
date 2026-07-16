import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { EventoVehiculo } from '../../dominio/evento-vehiculo';
import type { ContextoAplicacion } from '../../../../nucleo-familiar/aplicacion/puertos/alcance-familiar';
import type { RepositorioEventosVehiculo } from '../puertos/repositorio-eventos-vehiculo';

export type DependenciasListarEventosVehiculo = Readonly<{
  repositorioEventosVehiculo: RepositorioEventosVehiculo;
  proveedorIdentidad: ContextoAplicacion;
}>;

export type EntradaListarEventosVehiculo = Readonly<{
  vehiculoId: Identificador;
}>;

export async function listarEventosVehiculo(
  dependencias: DependenciasListarEventosVehiculo,
  entrada: EntradaListarEventosVehiculo,
): Promise<EventoVehiculo[]> {
  const { householdId } = dependencias.proveedorIdentidad;

  return dependencias.repositorioEventosVehiculo.listarPorVehiculo(householdId, entrada.vehiculoId);
}
