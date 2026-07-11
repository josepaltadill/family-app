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
  const { householdId } = await dependencias.proveedorIdentidad.obtenerContexto();
  const vehiculo = await dependencias.repositorioVehiculos.buscarPorId(householdId, entrada.vehiculoId);

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

  // Contrato de atomicidad (tarea 8): NUNCA se hacen dos escrituras independientes
  // (p. ej. `repositorioVehiculos.guardar` + `unidadTrabajoVehiculos.guardar` por
  // separado). Dos llamadas separadas dejarían una ventana insegura donde el evento
  // queda guardado sin actualizar el kilometraje, o viceversa, si la segunda llamada
  // falla. Por eso ambas escrituras se delegan a una única unidad de trabajo.
  await dependencias.unidadTrabajoVehiculos.registrarEventoYActualizarKilometraje(householdId, {
    evento,
    vehiculoActualizado,
  });

  return evento;
}
