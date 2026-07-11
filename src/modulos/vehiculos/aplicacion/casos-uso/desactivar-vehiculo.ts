import type { Identificador } from '../../../../compartido/dominio/identificador';
import { ErrorDominio } from '../../dominio/errores-dominio';
import type { ProveedorFecha } from '../puertos/proveedor-fecha';
import type { ProveedorIdentidad } from '../puertos/proveedor-identidad';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasDesactivarVehiculo = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  proveedorIdentidad: ProveedorIdentidad;
  proveedorFecha: ProveedorFecha;
}>;

export type EntradaDesactivarVehiculo = Readonly<{
  vehiculoId: Identificador;
}>;

export async function desactivarVehiculo(
  dependencias: DependenciasDesactivarVehiculo,
  entrada: EntradaDesactivarVehiculo,
): Promise<void> {
  const { householdId } = await dependencias.proveedorIdentidad.obtenerContexto();
  const vehiculo = await dependencias.repositorioVehiculos.buscarPorId(householdId, entrada.vehiculoId);

  if (!vehiculo) {
    throw new ErrorDominio('No existe el vehículo indicado.');
  }

  await dependencias.repositorioVehiculos.guardar(
    householdId,
    vehiculo.desactivar(dependencias.proveedorFecha.ahora()),
  );
}
