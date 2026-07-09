import { ErrorDominio } from '../../dominio/errores-dominio';
import { crearVehiculo, type DatosCrearVehiculo, type Vehiculo } from '../../dominio/vehiculo';
import type { ProveedorIdentidad } from '../puertos/proveedor-identidad';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasRegistrarVehiculo = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  proveedorIdentidad: ProveedorIdentidad;
}>;

export async function registrarVehiculo(
  dependencias: DependenciasRegistrarVehiculo,
  datos: DatosCrearVehiculo,
): Promise<Vehiculo> {
  await dependencias.proveedorIdentidad.obtenerActorActual();

  if (await dependencias.repositorioVehiculos.existeMatricula(datos.matricula)) {
    throw new ErrorDominio('Ya existe un vehículo con esa matrícula.');
  }

  const vehiculo = crearVehiculo(datos);
  await dependencias.repositorioVehiculos.guardar(vehiculo);

  return vehiculo;
}
