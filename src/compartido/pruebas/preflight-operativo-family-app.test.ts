import { describe, expect, it, vi } from 'vitest';
import {
  ejecutarPreflightFamiliar,
  ejecutarPreflightOperativoFamiliar,
  type ClientePreflightOperativo,
} from '../../../supabase/validation/preflight-operativo-family-app';

function clienteConInvariantes(opciones: {
  duplicadosHogar?: number;
  duplicadosMatricula?: number;
  eventosHuerfanos?: number;
  eventosCruzados?: number;
  hogaresSinAdmin?: number;
  membresiasInvalidas?: number;
} = {}): ClientePreflightOperativo {
  const query = vi.fn().mockResolvedValue({
    rows: [{
      duplicados_hogar: opciones.duplicadosHogar ?? 0,
      duplicados_matricula: opciones.duplicadosMatricula ?? 0,
      eventos_huerfanos: opciones.eventosHuerfanos ?? 0,
      eventos_cruzados: opciones.eventosCruzados ?? 0,
      hogares_sin_admin: opciones.hogaresSinAdmin ?? 0,
      membresias_invalidas: opciones.membresiasInvalidas ?? 0,
    }],
  });
  return { query };
}

const evidenciaValida = {
  backup: { identificador: 'snapshot-2026-07-24', huellaSha256: 'a'.repeat(64) },
  consumidoresExternos: [
    { identidad: 'job:family-app-reporter', referencia: 'mv_vehiculos', clasificacion: 'propio' as const, justificacion: 'Se despliega con la aplicación familiar.' },
  ],
};

const verificadorRecuperacion = vi.fn().mockResolvedValue({
  estado: 'restauracion-verificada',
  identificadorBackup: 'snapshot-2026-07-24',
  tablasOrigen: ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'],
  filasYUuidPreservados: true,
  relacionesPreservadas: true,
});

describe('ejecutarPreflightOperativoFamiliar', () => {
  it('acepta una restauración demostrada, consumidores clasificados y todas las invariantes pre-corte', async () => {
    const cliente = clienteConInvariantes();

    const resultado = await ejecutarPreflightOperativoFamiliar(cliente, evidenciaValida, verificadorRecuperacion);

    expect(resultado).toEqual({
      backup: evidenciaValida.backup,
      consumidoresExternos: evidenciaValida.consumidoresExternos,
      invariantes: {
        duplicadosHogar: 0,
        duplicadosMatricula: 0,
        eventosHuerfanos: 0,
        eventosCruzados: 0,
        hogaresSinAdmin: 0,
        membresiasInvalidas: 0,
      },
    });
    expect(cliente.query).toHaveBeenCalledTimes(1);
    expect(vi.mocked(cliente.query).mock.calls[0]?.[0]).toContain('mv_eventos_vehiculo');
  });

  it.each([
    ['no hay restauración demostrada', { backup: { ...evidenciaValida.backup, huellaSha256: '' } }, clienteConInvariantes(), /backup recuperable/],
    ['un consumidor externo no tiene clasificación', { consumidoresExternos: [{ identidad: 'view:other-app', referencia: 'mv_vehiculos', clasificacion: 'sin-clasificar' as const, justificacion: '' }] }, clienteConInvariantes(), /view:other-app/],
    ['un consumidor externo declara una clasificación desconocida', { consumidoresExternos: [{ identidad: 'job:unknown', referencia: 'mv_vehiculos', clasificacion: 'desconocida' as never, justificacion: 'No autorizada.' }] }, clienteConInvariantes(), /job:unknown/],
  ])('falla cerrado cuando %s', async (_caso, cambio, cliente, mensaje) => {
    await expect(ejecutarPreflightOperativoFamiliar(cliente, {
      ...evidenciaValida,
      ...cambio,
    }, verificadorRecuperacion)).rejects.toThrow(mensaje);
  });

  it.each([
    ['duplicadosHogar', { duplicadosHogar: 1 }],
    ['duplicadosMatricula', { duplicadosMatricula: 1 }],
    ['eventosHuerfanos', { eventosHuerfanos: 1 }],
    ['eventosCruzados', { eventosCruzados: 1 }],
    ['hogaresSinAdmin', { hogaresSinAdmin: 1 }],
    ['membresiasInvalidas', { membresiasInvalidas: 1 }],
  ])('falla cerrado ante %s', async (invariante, opciones) => {
    await expect(ejecutarPreflightOperativoFamiliar(clienteConInvariantes(opciones), evidenciaValida, verificadorRecuperacion))
      .rejects.toThrow(new RegExp(`${invariante}=1`));
  });

  it('rechaza evidencia de restauración forjada aunque sus etiquetas no estén vacías', async () => {
    await expect(ejecutarPreflightOperativoFamiliar(clienteConInvariantes(), evidenciaValida, async () => ({
      ...await verificadorRecuperacion(), filasYUuidPreservados: false,
    }))).rejects.toThrow(/backup recuperable/);
  });

  it('ejecuta catálogo y operación en una única entrada de preflight', async () => {
    const catalogo = { query: vi.fn()
      .mockResolvedValueOnce({ rows: ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'].map((nombre, indice) => ({ nombre, oid: String(indice), propietario: 'postgres', definicion: [] })) })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [
        { tabla_origen: 'mv_vehiculos', objeto_dependiente: 'job:family-app-reporter', clase_dependiente: '1259', oid_dependiente: '80', subobjeto_dependiente: '0', tipo_dependencia: 'n', clase_referencia: '1259', oid_referencia: '3', subobjeto_referencia: '0', definicion: 'family reporter' },
        { tabla_origen: 'mv_vehiculos', objeto_dependiente: 'indice_interno', clase_dependiente: '1259', oid_dependiente: '81', subobjeto_dependiente: '0', tipo_dependencia: 'i', clase_referencia: '1259', oid_referencia: '3', subobjeto_referencia: '0', definicion: 'internal index' },
      ] }) };
    const resultado = await ejecutarPreflightFamiliar(catalogo, clienteConInvariantes(), evidenciaValida, verificadorRecuperacion);
    expect(resultado.catalogo.objetosOrigen).toHaveLength(5);
    expect(resultado.operativo.invariantes).toEqual(expect.objectContaining({ hogaresSinAdmin: 0 }));
    expect(catalogo.query).toHaveBeenCalledTimes(3);
  });

  it('rechaza un consumidor externo derivado del catálogo aunque el llamador no lo declare', async () => {
    const catalogo = { query: vi.fn()
      .mockResolvedValueOnce({ rows: ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'].map((nombre, indice) => ({ nombre, oid: String(indice), propietario: 'postgres', definicion: [] })) })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{
        tabla_origen: 'mv_vehiculos', objeto_dependiente: 'vista_otro_servicio', clase_dependiente: '1259', oid_dependiente: '90', subobjeto_dependiente: '0',
        tipo_dependencia: 'n', clase_referencia: '1259', oid_referencia: '3', subobjeto_referencia: '0', definicion: 'view vista_otro_servicio',
      }] }) };

    await expect(ejecutarPreflightFamiliar(catalogo, clienteConInvariantes(), {
      ...evidenciaValida, consumidoresExternos: [],
    }, verificadorRecuperacion)).rejects.toThrow(/vista_otro_servicio/);
  });

  it('no ejecuta las invariantes si el catálogo bloquea un conflicto final', async () => {
    const catalogo = { query: vi.fn()
      .mockResolvedValueOnce({ rows: ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'].map((nombre, indice) => ({ nombre, oid: String(indice), propietario: 'postgres', definicion: [] })) })
      .mockResolvedValueOnce({ rows: [{ nombre: 'fam_hogares', oid: '99' }] }) };
    const operativo = clienteConInvariantes();
    await expect(ejecutarPreflightFamiliar(catalogo, operativo, evidenciaValida, verificadorRecuperacion)).rejects.toThrow(/fam_hogares/);
    expect(operativo.query).not.toHaveBeenCalled();
  });
});
