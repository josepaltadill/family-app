import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { RolUsuario } from '../../dominio/rol-usuario';

export type ActorAplicacion = Readonly<{
  id: Identificador;
  rol: RolUsuario;
}>;

export interface ProveedorIdentidad {
  obtenerActorActual(): Promise<ActorAplicacion>;
}
