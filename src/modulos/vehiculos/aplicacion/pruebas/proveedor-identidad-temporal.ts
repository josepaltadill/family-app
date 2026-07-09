import { crearIdentificador } from '../../../../compartido/dominio/identificador';
import type { ActorAplicacion, ProveedorIdentidad } from '../puertos/proveedor-identidad';

export class ProveedorIdentidadTemporal implements ProveedorIdentidad {
  async obtenerActorActual(): Promise<ActorAplicacion> {
    return {
      id: crearIdentificador('actor-temporal'),
      rol: 'admin',
    };
  }
}
