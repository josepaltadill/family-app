export type EstadoVencimiento = 'sin_vencimiento' | 'pendiente' | 'vencido';

export type DatosEvaluarVencimiento = Readonly<{
  proximoVencimientoKm?: number;
  proximoVencimientoFecha?: Date;
  kilometrosActuales: number;
  fechaActual: Date;
}>;

export function evaluarVencimiento(datos: DatosEvaluarVencimiento): EstadoVencimiento {
  const tieneVencimientoKm = datos.proximoVencimientoKm !== undefined;
  const tieneVencimientoFecha = datos.proximoVencimientoFecha !== undefined;

  if (!tieneVencimientoKm && !tieneVencimientoFecha) {
    return 'sin_vencimiento';
  }

  if (tieneVencimientoKm && datos.kilometrosActuales >= datos.proximoVencimientoKm) {
    return 'vencido';
  }

  if (tieneVencimientoFecha && datos.fechaActual.getTime() >= datos.proximoVencimientoFecha.getTime()) {
    return 'vencido';
  }

  return 'pendiente';
}
