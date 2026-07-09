import { crearEventoVehiculo, type DatosCrearEventoVehiculo, type EventoVehiculo } from '../../dominio/evento-vehiculo';
import { ErrorDominio } from '../../dominio/errores-dominio';
import type { ProveedorFecha } from '../puertos/proveedor-fecha';
import type { ProveedorIdentidad } from '../puertos/proveedor-identidad';
import type { UnidadTrabajoVehiculos } from '../puertos/repositorio-eventos-vehiculo';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export type DependenciasRegistrarEventoVehiculo = Readonly<{
  repositorioVehiculos: RepositorioVehiculos;
  unidadTrabajoVehiculos: UnidadTrabajoVehiculos;
  proveedorIdentidad: ProveedorIdentidad;
  proveedorFecha: ProveedorFecha;
}>;

export type EntradaRegistrarEventoVehiculo = Omit<DatosCrearEventoVehiculo, 'fechaCreacion'>;

export async function registrarEventoVehiculo(
  dependencias: DependenciasRegistrarEventoVehiculo,
  entrada: EntradaRegistrarEventoVehiculo,
): Promise<EventoVehiculo> {
  await dependencias.proveedorIdentidad.obtenerActorActual();
  const vehiculo = await dependencias.repositorioVehiculos.buscarPorId(entrada.vehiculoId);

  if (!vehiculo) {
    throw new ErrorDominio('No existe el vehículo indicado.');
  }

  const evento = crearEventoVehiculo({
    ...entrada,
    fechaCreacion: dependencias.proveedorFecha.ahora(),
  });
  const vehiculoActualizado = evento.debeActualizarKilometrajeActual(vehiculo.kilometrosActuales)
    ? vehiculo.corregirKilometraje(evento.kilometros)
    : undefined;

  await dependencias.unidadTrabajoVehiculos.registrarEventoYActualizarKilometraje({
    evento,
    vehiculoActualizado,
  });

  return evento;
}
