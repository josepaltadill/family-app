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

  async guardar(evento: EventoVehiculo): Promise<void> {
    this.#eventos.set(evento.id.valor, evento);
  }

  async listarPorVehiculo(vehiculoId: Identificador): Promise<EventoVehiculo[]> {
    return Array.from(this.#eventos.values())
      .filter((evento) => evento.vehiculoId.valor === vehiculoId.valor)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async listarConVencimiento(): Promise<EventoVehiculo[]> {
    return Array.from(this.#eventos.values()).filter(
      (evento) =>
        evento.proximoVencimientoKm !== undefined || evento.proximoVencimientoFecha !== undefined,
    );
  }

  async registrarEventoYActualizarKilometraje(datos: Readonly<{
    evento: EventoVehiculo;
    vehiculoActualizado?: Vehiculo;
  }>): Promise<void> {
    if (datos.vehiculoActualizado && !this.repositorioVehiculos) {
      throw new Error('No hay repositorio de vehículos para actualizar kilometraje.');
    }

    if (datos.vehiculoActualizado) {
      await this.repositorioVehiculos?.guardar(datos.vehiculoActualizado);
    }

    this.#eventos.set(datos.evento.id.valor, datos.evento);
  }
}
