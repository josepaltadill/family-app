import { describe, expect, it } from 'vitest';
import { evaluarVencimiento } from './vencimiento';

describe('evaluarVencimiento', () => {
  it('devuelve sin vencimiento cuando no hay próximo km ni próxima fecha', () => {
    const estado = evaluarVencimiento({
      kilometrosActuales: 120_000,
      fechaActual: new Date('2026-02-10T00:00:00.000Z'),
    });

    expect(estado).toBe('sin_vencimiento');
  });

  it('vence por kilometraje cuando se alcanza el próximo km', () => {
    const estado = evaluarVencimiento({
      proximoVencimientoKm: 130_000,
      kilometrosActuales: 130_000,
      fechaActual: new Date('2026-02-10T00:00:00.000Z'),
    });

    expect(estado).toBe('vencido');
  });

  it('vence por fecha cuando se alcanza la próxima fecha', () => {
    const estado = evaluarVencimiento({
      proximoVencimientoFecha: new Date('2027-01-01T00:00:00.000Z'),
      kilometrosActuales: 120_000,
      fechaActual: new Date('2027-01-01T00:00:00.000Z'),
    });

    expect(estado).toBe('vencido');
  });

  it('queda pendiente si todavía no llegó ninguna condición', () => {
    const estado = evaluarVencimiento({
      proximoVencimientoKm: 130_000,
      proximoVencimientoFecha: new Date('2027-01-01T00:00:00.000Z'),
      kilometrosActuales: 125_000,
      fechaActual: new Date('2026-12-31T00:00:00.000Z'),
    });

    expect(estado).toBe('pendiente');
  });

  it('queda pendiente justo por debajo del umbral de kilometraje', () => {
    const estado = evaluarVencimiento({
      proximoVencimientoKm: 130_000,
      kilometrosActuales: 129_999,
      fechaActual: new Date('2026-12-31T00:00:00.000Z'),
    });

    expect(estado).toBe('pendiente');
  });

  it('queda pendiente justo antes del umbral de fecha', () => {
    const estado = evaluarVencimiento({
      proximoVencimientoFecha: new Date('2027-01-01T00:00:00.000Z'),
      kilometrosActuales: 130_000,
      fechaActual: new Date('2026-12-31T23:59:59.999Z'),
    });

    expect(estado).toBe('pendiente');
  });

  it('vence cuando llega cualquiera de las condiciones si existen km y fecha', () => {
    const vencidoPorKm = evaluarVencimiento({
      proximoVencimientoKm: 130_000,
      proximoVencimientoFecha: new Date('2027-01-01T00:00:00.000Z'),
      kilometrosActuales: 130_000,
      fechaActual: new Date('2026-06-01T00:00:00.000Z'),
    });
    const vencidoPorFecha = evaluarVencimiento({
      proximoVencimientoKm: 130_000,
      proximoVencimientoFecha: new Date('2027-01-01T00:00:00.000Z'),
      kilometrosActuales: 125_000,
      fechaActual: new Date('2027-01-01T00:00:00.000Z'),
    });

    expect(vencidoPorKm).toBe('vencido');
    expect(vencidoPorFecha).toBe('vencido');
  });
});
