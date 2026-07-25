import { describe, expect, it } from 'vitest';
import {
  aplicarRecuperacionCorteFamiliar,
  decidirRecuperacionCorteFamiliar,
  type EstadoRecuperableFamiliar,
} from '../../../supabase/validation/recuperacion-corte-family-app';

const estadoInicial: EstadoRecuperableFamiliar = {
  migracionConfirmada: true,
  consumidoresObservados: ['runtime', 'bootstrap'],
  filas: [
    { tabla: 'fam_hogares', id: 'hogar-1', householdId: 'hogar-1' },
    { tabla: 'fam_miembros_hogar', id: 'miembro-1', householdId: 'hogar-1' },
    { tabla: 'fam_ve_vehiculos', id: 'vehiculo-1', householdId: 'hogar-1' },
    { tabla: 'fam_ve_eventos_vehiculo', id: 'evento-1', householdId: 'hogar-1', relacionadoCon: 'vehiculo-1' },
  ],
  seguridad: {
    propietario: 'family_app_runner',
    grants: ['authenticated:select', 'authenticated:update'],
    politicasRls: ['fam_ve_vehiculos_select_member'],
    rlsHabilitado: false,
  },
};

function crearAcciones(mutador: (estado: EstadoRecuperableFamiliar) => EstadoRecuperableFamiliar = (estado) => estado) {
  const llamadas: string[] = [];
  const ejecutar = (estrategia: string) => (estado: EstadoRecuperableFamiliar) => {
    llamadas.push(estrategia);
    const observado = { ...estado, seguridad: { ...estado.seguridad, rlsHabilitado: true } };
    return structuredClone(mutador(observado));
  };
  return { llamadas, acciones: { 'rollback-controlado': ejecutar('rollback-controlado'), 'fix-forward': ejecutar('fix-forward') } };
}

describe('recuperación del corte family-app', () => {
  it('documenta que el punto de no retorno es la primera escritura fam_* aceptada tras el commit', () => {
    expect(decidirRecuperacionCorteFamiliar({
      migracionConfirmada: true,
      escriturasFamAceptadas: 0,
    })).toMatchObject({ estrategia: 'rollback-controlado', puntoDeNoRetornoAlcanzado: false });

    expect(decidirRecuperacionCorteFamiliar({
      migracionConfirmada: true,
      escriturasFamAceptadas: 1,
    })).toMatchObject({ estrategia: 'fix-forward', puntoDeNoRetornoAlcanzado: true });
  });

  it('ejecuta rollback controlado sin borrar, reasignar ni cambiar relaciones o seguridad', () => {
    const antes = structuredClone(estadoInicial);
    const accion = crearAcciones();
    const resultado = aplicarRecuperacionCorteFamiliar(estadoInicial, {
      migracionConfirmada: true,
      escriturasFamAceptadas: 0,
    }, ['runtime', 'bootstrap'], accion.acciones);

    expect(accion.llamadas).toEqual(['rollback-controlado']);
    expect(resultado).toMatchObject({ estrategia: 'rollback-controlado', acceso: 'abierto' });
    expect(estadoInicial).toEqual(antes);
    expect(resultado.estadoPosterior.filas).toEqual(antes.filas);
    expect(resultado.estadoPosterior.seguridad).toEqual({ ...antes.seguridad, rlsHabilitado: true });
  });

  it('ejecuta fix-forward tras el punto de no retorno sin perder filas ni permisos', () => {
    const antes = structuredClone(estadoInicial);
    const accion = crearAcciones();
    const resultado = aplicarRecuperacionCorteFamiliar(estadoInicial, {
      migracionConfirmada: true,
      escriturasFamAceptadas: 1,
    }, ['runtime', 'bootstrap'], accion.acciones);

    expect(accion.llamadas).toEqual(['fix-forward']);
    expect(resultado).toMatchObject({ estrategia: 'fix-forward', acceso: 'abierto' });
    expect(estadoInicial).toEqual(antes);
    expect(resultado.estadoPosterior.filas).toEqual(antes.filas);
    expect(resultado.estadoPosterior.seguridad.rlsHabilitado).toBe(true);
  });

  it.each([
    ['borrado', (e: EstadoRecuperableFamiliar) => ({ ...e, filas: e.filas.slice(1) })],
    ['reasignación', (e: EstadoRecuperableFamiliar) => ({ ...e, filas: e.filas.map((f, i) => i ? f : { ...f, householdId: 'otro' }) })],
    ['relación', (e: EstadoRecuperableFamiliar) => ({ ...e, filas: e.filas.map((f) => f.relacionadoCon ? { ...f, relacionadoCon: 'otro' } : f) })],
    ['grant', (e: EstadoRecuperableFamiliar) => ({ ...e, seguridad: { ...e.seguridad, grants: [] } })],
    ['policy', (e: EstadoRecuperableFamiliar) => ({ ...e, seguridad: { ...e.seguridad, politicasRls: [] } })],
    ['RLS', (e: EstadoRecuperableFamiliar) => ({ ...e, seguridad: { ...e.seguridad, rlsHabilitado: false } })],
    ['migración', (e: EstadoRecuperableFamiliar) => ({ ...e, migracionConfirmada: false })],
    ['consumidores', (e: EstadoRecuperableFamiliar) => ({ ...e, consumidoresObservados: ['runtime'] })],
    ['fallo de acción', () => { throw new Error('fallo'); }],
  ])('mantiene el acceso cerrado si no se verifica %s', (_caso, mutador) => {
    const accion = crearAcciones(mutador);
    const resultado = aplicarRecuperacionCorteFamiliar(estadoInicial, {
      migracionConfirmada: true, escriturasFamAceptadas: 1,
    }, ['runtime', 'bootstrap'], accion.acciones);

    expect(resultado).toMatchObject({ estrategia: 'fix-forward', acceso: 'cerrado' });
    expect(accion.llamadas).toEqual(['fix-forward']);
  });
});
