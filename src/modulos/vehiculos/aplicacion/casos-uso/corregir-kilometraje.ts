import type { Identificador } from '../../../../compartido/dominio/identificador';
import { ErrorDominio } from '../../dominio/errores-dominio';
import type { ProveedorIdentidad } from '../puertos/proveedor-identidad';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasCorregirKilometraje = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  proveedorIdentidad: ProveedorIdentidad;
}>;

export type EntradaCorregirKilometraje = Readonly<{
  vehiculoId: Identificador;
  kilometrosActuales: number;
}>;

export async function corregirKilometraje(
  dependencias: DependenciasCorregirKilometraje,
  entrada: EntradaCorregirKilometraje,
): Promise<void> {
  await dependencias.proveedorIdentidad.obtenerActorActual();
  const vehiculo = await dependencias.repositorioVehiculos.buscarPorId(entrada.vehiculoId);

  if (!vehiculo) {
    throw new ErrorDominio('No existe el vehículo indicado.');
  }

  await dependencias.repositorioVehiculos.guardar(
    vehiculo.corregirKilometraje(entrada.kilometrosActuales),
  );
}
