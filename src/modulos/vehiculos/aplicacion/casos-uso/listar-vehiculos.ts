import type { Vehiculo } from '../../dominio/vehiculo';
import type { ProveedorIdentidad } from '../puertos/proveedor-identidad';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasListarVehiculos = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  proveedorIdentidad: ProveedorIdentidad;
}>;

export async function listarVehiculos(
  dependencias: DependenciasListarVehiculos,
): Promise<Vehiculo[]> {
  const { householdId } = await dependencias.proveedorIdentidad.obtenerContexto();

  return dependencias.repositorioVehiculos.listar(householdId);
}
