import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { EventoVehiculo } from '../../dominio/evento-vehiculo';
import type { Vehiculo } from '../../dominio/vehiculo';
import type { RepositorioEventosVehiculo, UnidadTrabajoVehiculos } from '../puertos/repositorio-eventos-vehiculo';
import type { RepositorioVehiculosEnMemoria } from './repositorio-vehiculos-en-memoria';

export class RepositorioEventosVehiculoEnMemoria
  implements RepositorioEventosVehiculo, UnidadTrabajoVehiculos
{
  readonly #eventos = new Map<string, EventoVehiculo>();

  constructor(private readonly repositorioVehiculos?: RepositorioVehiculosEnMemoria) {}

  async guardar(householdId: Identificador, evento: EventoVehiculo): Promise<void> {
    this.#eventos.set(clave(householdId, evento.id), evento);
  }

  async listarPorVehiculo(householdId: Identificador, vehiculoId: Identificador): Promise<EventoVehiculo[]> {
    return Array.from(this.#eventos.entries())
      .filter(([claveCompuesta]) => perteneceAlHogar(claveCompuesta, householdId))
      .map(([, evento]) => evento)
      .filter((evento) => evento.vehiculoId.valor === vehiculoId.valor)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async listarConVencimiento(householdId: Identificador): Promise<EventoVehiculo[]> {
    return Array.from(this.#eventos.entries())
      .filter(([claveCompuesta]) => perteneceAlHogar(claveCompuesta, householdId))
      .map(([, evento]) => evento)
      .filter(
        (evento) =>
          evento.proximoVencimientoKm !== undefined || evento.proximoVencimientoFecha !== undefined,
      );
  }

  async registrarEventoYActualizarKilometraje(
    householdId: Identificador,
    datos: Readonly<{
      evento: EventoVehiculo;
      vehiculoActualizado?: Vehiculo;
    }>,
  ): Promise<void> {
    if (datos.vehiculoActualizado && !this.repositorioVehiculos) {
      throw new Error('No hay repositorio de vehículos para actualizar kilometraje.');
    }

    if (datos.vehiculoActualizado) {
      await this.repositorioVehiculos?.guardar(householdId, datos.vehiculoActualizado);
    }

    this.#eventos.set(clave(householdId, datos.evento.id), datos.evento);
  }
}

function clave(householdId: Identificador, id: Identificador): string {
  return `${householdId.valor}:${id.valor}`;
}

function perteneceAlHogar(claveCompuesta: string, householdId: Identificador): boolean {
  return claveCompuesta.startsWith(`${householdId.valor}:`);
}
