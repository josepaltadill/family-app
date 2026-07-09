import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { EventoVehiculo } from '../../dominio/evento-vehiculo';
import type { Vehiculo } from '../../dominio/vehiculo';

export interface RepositorioEventosVehiculo {
  guardar(evento: EventoVehiculo): Promise<void>;
  listarPorVehiculo(vehiculoId: Identificador): Promise<EventoVehiculo[]>;
  listarConVencimiento(): Promise<EventoVehiculo[]>;
}

export interface UnidadTrabajoVehiculos {
  /**
   * Persiste el evento y, cuando corresponde, el kilometraje actualizado como una única unidad lógica.
   * Las implementaciones no deben confirmar un evento si falla la persistencia del kilometraje.
   */
  registrarEventoYActualizarKilometraje(datos: Readonly<{
    evento: EventoVehiculo;
    vehiculoActualizado?: Vehiculo;
  }>): Promise<void>;
}
