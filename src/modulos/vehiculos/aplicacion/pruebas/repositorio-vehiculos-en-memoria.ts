import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { Vehiculo } from '../../dominio/vehiculo';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export class RepositorioVehiculosEnMemoria implements RepositorioVehiculos {
  readonly #vehiculos = new Map<string, Vehiculo>();

  async guardar(householdId: Identificador, vehiculo: Vehiculo): Promise<void> {
    this.#vehiculos.set(clave(householdId, vehiculo.id), vehiculo);
  }

  async buscarPorId(householdId: Identificador, id: Identificador): Promise<Vehiculo | null> {
    return this.#vehiculos.get(clave(householdId, id)) ?? null;
  }

  async listar(householdId: Identificador): Promise<Vehiculo[]> {
    return Array.from(this.#vehiculos.entries())
      .filter(([claveCompuesta]) => perteneceAlHogar(claveCompuesta, householdId))
      .map(([, vehiculo]) => vehiculo)
      .sort((a, b) => a.matricula.localeCompare(b.matricula));
  }

  async existeMatricula(householdId: Identificador, matricula: string): Promise<boolean> {
    // Comparación sensible a mayúsculas/minúsculas: coincide con el adaptador Supabase
    // real (`.eq('matricula', matricula)`) y con la restricción `unique (household_id,
    // matricula)` de la migración, que también es sensible a mayúsculas. No se
    // normaliza aquí para no divergir del comportamiento real de la base de datos.
    return Array.from(this.#vehiculos.entries())
      .filter(([claveCompuesta]) => perteneceAlHogar(claveCompuesta, householdId))
      .some(([, vehiculo]) => vehiculo.matricula === matricula);
  }
}

function clave(householdId: Identificador, id: Identificador): string {
  return `${householdId.valor}:${id.valor}`;
}

function perteneceAlHogar(claveCompuesta: string, householdId: Identificador): boolean {
  return claveCompuesta.startsWith(`${householdId.valor}:`);
}
