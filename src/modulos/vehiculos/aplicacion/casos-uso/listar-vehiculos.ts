import type { Vehiculo } from '../../dominio/vehiculo';
import type { ContextoAplicacion } from '../../../../nucleo-familiar/aplicacion/puertos/alcance-familiar';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasListarVehiculos = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  proveedorIdentidad: ContextoAplicacion;
}>;

export async function listarVehiculos(
  dependencias: DependenciasListarVehiculos,
): Promise<Vehiculo[]> {
  const { householdId } = dependencias.proveedorIdentidad;

  return dependencias.repositorioVehiculos.listar(householdId);
}
