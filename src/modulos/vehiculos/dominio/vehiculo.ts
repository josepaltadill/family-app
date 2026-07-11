import type { Identificador } from '../../../compartido/dominio/identificador';
import { ErrorDominio } from './errores-dominio';

export type EstadoVehiculo = 'activo' | 'inactivo';

export type DatosCrearVehiculo = Readonly<{
  id: Identificador;
  marca: string;
  modelo: string;
  anio: number;
  combustible: string;
  matricula: string;
  kilometrosActuales: number;
  fechaCompra: Date;
  fechaAltaAplicacion: Date;
}>;

export type DatosVehiculo = DatosCrearVehiculo &
  Readonly<{
    estado: EstadoVehiculo;
    fechaDesactivacion?: Date;
  }>;

export class Vehiculo {
  readonly id: Identificador;
  readonly marca: string;
  readonly modelo: string;
  readonly anio: number;
  readonly combustible: string;
  readonly matricula: string;
  readonly kilometrosActuales: number;
  readonly estado: EstadoVehiculo;
  readonly #fechaCompra: Date;
  readonly #fechaAltaAplicacion: Date;
  readonly #fechaDesactivacion?: Date;

  static crear(datos: DatosCrearVehiculo): Vehiculo {
    return new Vehiculo({
      ...datos,
      estado: 'activo',
    });
  }

  /**
   * Reconstruye un vehículo ya existente (por ejemplo desde una fila de persistencia)
   * conservando su estado y fecha de desactivación reales. A diferencia de `crear`,
   * no fuerza el estado inicial `activo`. Solo usado por adaptadores de persistencia.
   */
  static reconstruir(datos: DatosVehiculo): Vehiculo {
    return new Vehiculo(datos);
  }

  private constructor(datos: DatosVehiculo) {
    validarKilometraje(datos.kilometrosActuales);
    validarConsistenciaEstadoDesactivacion(datos.estado, datos.fechaDesactivacion);

    this.id = datos.id;
    this.marca = datos.marca;
    this.modelo = datos.modelo;
    this.anio = datos.anio;
    this.combustible = datos.combustible;
    this.matricula = datos.matricula;
    this.kilometrosActuales = datos.kilometrosActuales;
    this.estado = datos.estado;
    this.#fechaCompra = copiarFecha(datos.fechaCompra);
    this.#fechaAltaAplicacion = copiarFecha(datos.fechaAltaAplicacion);
    this.#fechaDesactivacion = datos.fechaDesactivacion
      ? copiarFecha(datos.fechaDesactivacion)
      : undefined;
  }

  get fechaCompra(): Date {
    return copiarFecha(this.#fechaCompra);
  }

  get fechaAltaAplicacion(): Date {
    return copiarFecha(this.#fechaAltaAplicacion);
  }

  get fechaDesactivacion(): Date | undefined {
    return this.#fechaDesactivacion ? copiarFecha(this.#fechaDesactivacion) : undefined;
  }

  desactivar(fechaDesactivacion: Date): Vehiculo {
    return new Vehiculo({
      ...this.datosBase(),
      estado: 'inactivo',
      fechaDesactivacion,
    });
  }

  corregirKilometraje(kilometrosActuales: number): Vehiculo {
    return new Vehiculo({
      ...this.datosBase(),
      kilometrosActuales,
    });
  }

  private datosBase(): DatosVehiculo {
    return {
      id: this.id,
      marca: this.marca,
      modelo: this.modelo,
      anio: this.anio,
      combustible: this.combustible,
      matricula: this.matricula,
      kilometrosActuales: this.kilometrosActuales,
      estado: this.estado,
      fechaCompra: this.#fechaCompra,
      fechaAltaAplicacion: this.#fechaAltaAplicacion,
      fechaDesactivacion: this.#fechaDesactivacion,
    };
  }
}

export function crearVehiculo(datos: DatosCrearVehiculo): Vehiculo {
  return Vehiculo.crear(datos);
}

export function reconstruirVehiculo(datos: DatosVehiculo): Vehiculo {
  return Vehiculo.reconstruir(datos);
}

function validarKilometraje(kilometrosActuales: number): void {
  if (kilometrosActuales < 0) {
    throw new ErrorDominio('El kilometraje actual no puede ser negativo.');
  }
}

/**
 * Reconstruir() acepta `DatosVehiculo` arbitrarios de una fuente externa (fila
 * de base de datos); esta validación garantiza que `estado` y `fechaDesactivacion`
 * sean un par coherente en TODOS los puntos de entrada (constructor privado
 * compartido), no solo en `crear`/`desactivar`, que ya construyen el par correcto
 * internamente.
 */
function validarConsistenciaEstadoDesactivacion(
  estado: EstadoVehiculo,
  fechaDesactivacion: Date | undefined,
): void {
  if (estado === 'activo' && fechaDesactivacion) {
    throw new ErrorDominio(
      'Estado y fecha de desactivación inconsistentes: un vehículo activo no puede tener fecha de desactivación.',
    );
  }

  if (estado === 'inactivo' && !fechaDesactivacion) {
    throw new ErrorDominio(
      'Estado y fecha de desactivación inconsistentes: un vehículo inactivo debe tener fecha de desactivación.',
    );
  }
}

function copiarFecha(fecha: Date): Date {
  return new Date(fecha.getTime());
}
