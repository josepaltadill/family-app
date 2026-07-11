import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { Vehiculo } from '../../dominio/vehiculo';

export interface RepositorioVehiculos {
  guardar(householdId: Identificador, vehiculo: Vehiculo): Promise<void>;
  buscarPorId(householdId: Identificador, id: Identificador): Promise<Vehiculo | null>;
  listar(householdId: Identificador): Promise<Vehiculo[]>;
  // Unicidad por hogar, refleja unique (household_id, matricula) e incluye inactivos.
  existeMatricula(householdId: Identificador, matricula: string): Promise<boolean>;
}
