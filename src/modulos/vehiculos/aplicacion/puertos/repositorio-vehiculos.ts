import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { Vehiculo } from '../../dominio/vehiculo';

export interface RepositorioVehiculos {
  guardar(vehiculo: Vehiculo): Promise<void>;
  buscarPorId(id: Identificador): Promise<Vehiculo | null>;
  listar(): Promise<Vehiculo[]>;
  existeMatricula(matricula: string): Promise<boolean>;
}
