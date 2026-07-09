import type { Identificador } from '../../../../compartido/dominio/identificador';
import type { Vehiculo } from '../../dominio/vehiculo';
import type { RepositorioVehiculos } from '../puertos/repositorio-vehiculos';

export class RepositorioVehiculosEnMemoria implements RepositorioVehiculos {
  readonly #vehiculos = new Map<string, Vehiculo>();

  async guardar(vehiculo: Vehiculo): Promise<void> {
    this.#vehiculos.set(vehiculo.id.valor, vehiculo);
  }

  async buscarPorId(id: Identificador): Promise<Vehiculo | null> {
    return this.#vehiculos.get(id.valor) ?? null;
  }

  async listar(): Promise<Vehiculo[]> {
    return Array.from(this.#vehiculos.values()).sort((a, b) =>
      a.matricula.localeCompare(b.matricula),
    );
  }

  async existeMatricula(matricula: string): Promise<boolean> {
    const matriculaNormalizada = normalizarMatricula(matricula);

    return Array.from(this.#vehiculos.values()).some(
      (vehiculo) => normalizarMatricula(vehiculo.matricula) === matriculaNormalizada,
    );
  }
}

function normalizarMatricula(matricula: string): string {
  return matricula.trim().toLocaleUpperCase('es');
}
