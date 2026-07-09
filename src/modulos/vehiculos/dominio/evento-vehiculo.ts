import type { Identificador } from '../../../compartido/dominio/identificador';
import { ErrorDominio } from './errores-dominio';

export type TipoEventoVehiculo = 'mantenimiento' | 'averia';

export type DatosCrearEventoVehiculo = Readonly<{
  id: Identificador;
  vehiculoId: Identificador;
  tipo: TipoEventoVehiculo;
  descripcion: string;
  kilometros: number;
  fecha: Date;
  proveedor?: string;
  coste?: number;
  moneda?: string;
  notas?: string;
  proximoVencimientoKm?: number;
  proximoVencimientoFecha?: Date;
  fechaCreacion: Date;
}>;

export class EventoVehiculo {
  readonly id: Identificador;
  readonly vehiculoId: Identificador;
  readonly tipo: TipoEventoVehiculo;
  readonly descripcion: string;
  readonly kilometros: number;
  readonly proveedor?: string;
  readonly coste?: number;
  readonly moneda?: string;
  readonly notas?: string;
  readonly proximoVencimientoKm?: number;
  readonly #fecha: Date;
  readonly #proximoVencimientoFecha?: Date;
  readonly #fechaCreacion: Date;

  static crear(datos: DatosCrearEventoVehiculo): EventoVehiculo {
    return new EventoVehiculo(datos);
  }

  private constructor(datos: DatosCrearEventoVehiculo) {
    validarKilometraje(datos.kilometros, 'El kilometraje del evento no puede ser negativo.');
    validarKilometrajeOpcional(
      datos.proximoVencimientoKm,
      'El próximo vencimiento por kilómetros no puede ser negativo.',
    );
    validarCosteOpcional(datos.coste);

    this.id = datos.id;
    this.vehiculoId = datos.vehiculoId;
    this.tipo = datos.tipo;
    this.descripcion = datos.descripcion;
    this.kilometros = datos.kilometros;
    this.#fecha = copiarFecha(datos.fecha);
    this.proveedor = datos.proveedor;
    this.coste = datos.coste;
    this.moneda = datos.coste === undefined ? undefined : (datos.moneda ?? 'EUR');
    this.notas = datos.notas;
    this.proximoVencimientoKm = datos.proximoVencimientoKm;
    this.#proximoVencimientoFecha = datos.proximoVencimientoFecha
      ? copiarFecha(datos.proximoVencimientoFecha)
      : undefined;
    this.#fechaCreacion = copiarFecha(datos.fechaCreacion);
  }

  get fecha(): Date {
    return copiarFecha(this.#fecha);
  }

  get proximoVencimientoFecha(): Date | undefined {
    return this.#proximoVencimientoFecha ? copiarFecha(this.#proximoVencimientoFecha) : undefined;
  }

  get fechaCreacion(): Date {
    return copiarFecha(this.#fechaCreacion);
  }

  debeActualizarKilometrajeActual(kilometrosActuales: number): boolean {
    validarKilometraje(kilometrosActuales, 'El kilometraje actual no puede ser negativo.');

    return this.kilometros > kilometrosActuales;
  }
}

export function crearEventoVehiculo(datos: DatosCrearEventoVehiculo): EventoVehiculo {
  return EventoVehiculo.crear(datos);
}

function validarKilometraje(valor: number, mensaje: string): void {
  if (valor < 0) {
    throw new ErrorDominio(mensaje);
  }
}

function validarKilometrajeOpcional(valor: number | undefined, mensaje: string): void {
  if (valor !== undefined) {
    validarKilometraje(valor, mensaje);
  }
}

function validarCosteOpcional(coste: number | undefined): void {
  if (coste !== undefined && coste < 0) {
    throw new ErrorDominio('El coste del evento no puede ser negativo.');
  }
}

function copiarFecha(fecha: Date): Date {
  return new Date(fecha.getTime());
}
