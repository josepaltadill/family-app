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
  await dependencias.proveedorIdentidad.obtenerActorActual();
  const vehiculo = await dependencias.repositorioVehiculos.buscarPorId(entrada.vehiculoId);

  if (!vehiculo) {
    throw new ErrorDominio('No existe el vehículo indicado.');
  }

  await dependencias.repositorioVehiculos.guardar(
    vehiculo.desactivar(dependencias.proveedorFecha.ahora()),
  );
}
