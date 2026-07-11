import { crearIdentificador } from '../../../../compartido/dominio/identificador';
import type { ContextoAplicacion, ProveedorIdentidad } from '../puertos/proveedor-identidad';

const HOGAR_DESARROLLO_POR_DEFECTO = crearIdentificador('hogar-desarrollo');

export class ProveedorIdentidadTemporal implements ProveedorIdentidad {
  constructor(private readonly householdId = HOGAR_DESARROLLO_POR_DEFECTO) {}

  async obtenerContexto(): Promise<ContextoAplicacion> {
    return {
      actor: {
        id: crearIdentificador('actor-temporal'),
        rol: 'admin',
      },
      householdId: this.householdId,
    };
  }
}
