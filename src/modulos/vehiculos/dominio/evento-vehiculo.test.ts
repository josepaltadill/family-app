import { describe, expect, it } from 'vitest';
import { crearIdentificador } from '../../../compartido/dominio/identificador';
import { crearEventoVehiculo } from './evento-vehiculo';

const datosBase = () => ({
  id: crearIdentificador('evento-1'),
  vehiculoId: crearIdentificador('vehiculo-1'),
  descripcion: 'Cambio de aceite y filtros',
  kilometros: 120_000,
  fecha: new Date('2026-02-10T00:00:00.000Z'),
  proveedor: 'Taller X',
  notas: 'Usar aceite recomendado por fabricante',
  fechaCreacion: new Date('2026-02-10T10:00:00.000Z'),
});

describe('EventoVehiculo', () => {
  it('crea un mantenimiento con coste y vencimientos opcionales', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      coste: 300,
      moneda: 'EUR',
      proximoVencimientoKm: 130_000,
      proximoVencimientoFecha: new Date('2027-02-10T00:00:00.000Z'),
    });

    expect(evento.tipo).toBe('mantenimiento');
    expect(evento.coste).toBe(300);
    expect(evento.moneda).toBe('EUR');
    expect(evento.proximoVencimientoKm).toBe(130_000);
    expect(evento.proximoVencimientoFecha?.toISOString()).toBe('2027-02-10T00:00:00.000Z');
  });

  it('crea una avería sin coste informado', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      id: crearIdentificador('evento-averia'),
      tipo: 'averia',
      descripcion: 'Cambio de bombilla trasera',
      coste: undefined,
    });

    expect(evento.tipo).toBe('averia');
    expect(evento.coste).toBeUndefined();
    expect(evento.moneda).toBeUndefined();
  });

  it('conserva un evento histórico sin pedir bajar el kilometraje actual', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      kilometros: 118_000,
    });

    expect(evento.kilometros).toBe(118_000);
    expect(evento.debeActualizarKilometrajeActual(120_000)).toBe(false);
  });

  it('pide actualizar kilometraje cuando el evento es más reciente', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'averia',
      kilometros: 120_005,
    });

    expect(evento.debeActualizarKilometrajeActual(120_000)).toBe(true);
  });

  it('no pide actualizar kilometraje cuando el evento iguala el kilometraje actual', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      kilometros: 120_000,
    });

    expect(evento.debeActualizarKilometrajeActual(120_000)).toBe(false);
  });

  it('rechaza un evento con kilometraje negativo', () => {
    expect(() =>
      crearEventoVehiculo({
        ...datosBase(),
        tipo: 'mantenimiento',
        kilometros: -1,
      }),
    ).toThrow('El kilometraje del evento no puede ser negativo.');
  });

  it('rechaza evaluar actualización contra kilometraje actual negativo', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
    });

    expect(() => evento.debeActualizarKilometrajeActual(-1)).toThrow(
      'El kilometraje actual no puede ser negativo.',
    );
  });

  it('rechaza próximo vencimiento por kilómetros negativo', () => {
    expect(() =>
      crearEventoVehiculo({
        ...datosBase(),
        tipo: 'mantenimiento',
        proximoVencimientoKm: -1,
      }),
    ).toThrow('El próximo vencimiento por kilómetros no puede ser negativo.');
  });

  it('rechaza coste negativo', () => {
    expect(() =>
      crearEventoVehiculo({
        ...datosBase(),
        tipo: 'averia',
        coste: -0.01,
      }),
    ).toThrow('El coste del evento no puede ser negativo.');
  });

  it('protege las fechas expuestas con copias defensivas', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      proximoVencimientoFecha: new Date('2027-02-10T00:00:00.000Z'),
    });

    evento.fecha.setUTCFullYear(2030);
    evento.proximoVencimientoFecha?.setUTCFullYear(2030);
    evento.fechaCreacion.setUTCFullYear(2030);

    expect(evento.fecha.toISOString()).toBe('2026-02-10T00:00:00.000Z');
    expect(evento.proximoVencimientoFecha?.toISOString()).toBe('2027-02-10T00:00:00.000Z');
    expect(evento.fechaCreacion.toISOString()).toBe('2026-02-10T10:00:00.000Z');
  });

  it('acepta evento solo con próximo vencimiento por km', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      proximoVencimientoKm: 130_000,
    });

    expect(evento.proximoVencimientoKm).toBe(130_000);
    expect(evento.proximoVencimientoFecha).toBeUndefined();
  });

  it('acepta evento solo con próximo vencimiento por fecha', () => {
    const evento = crearEventoVehiculo({
      ...datosBase(),
      tipo: 'mantenimiento',
      proximoVencimientoFecha: new Date('2027-02-10T00:00:00.000Z'),
    });

    expect(evento.proximoVencimientoKm).toBeUndefined();
    expect(evento.proximoVencimientoFecha?.toISOString()).toBe('2027-02-10T00:00:00.000Z');
  });
});
