import {
  inspeccionarPreflightCatalogoFamiliar,
  type ClienteCatalogoPostgres,
  type InventarioCatalogoFamiliar,
} from './preflight-catalogo-family-app';

export type ClientePreflightOperativo = Readonly<{
  query<T extends Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
}>;

type FilaInvariantes = Readonly<{
  duplicados_hogar: number;
  duplicados_matricula: number;
  eventos_huerfanos: number;
  eventos_cruzados: number;
  hogares_sin_admin: number;
  membresias_invalidas: number;
}>;

export type EvidenciaPreflightOperativo = Readonly<{
  backup: Readonly<{ identificador: string; huellaSha256: string; }>;
  consumidoresExternos: ReadonlyArray<Readonly<{
    identidad: string;
    referencia: string;
    clasificacion: 'propio' | 'externo-aprobado' | 'sin-clasificar';
    justificacion: string;
  }>>;
}>;

export type VerificadorRecuperacion = (backup: EvidenciaPreflightOperativo['backup']) => Promise<Readonly<{
  estado: 'restauracion-verificada';
  identificadorBackup: string;
  tablasOrigen: readonly string[];
  filasYUuidPreservados: boolean;
  relacionesPreservadas: boolean;
}>>;

type ConsumidorObservado = Readonly<{ identidad: string; referencia: string }>;

export type InventarioConsumidoresObservados = Readonly<{
  estado: 'inventario-verificado';
  jobs: readonly ConsumidorObservado[];
  webhooks: readonly ConsumidorObservado[];
}>;

export type InspectorConsumidoresExternos = () => Promise<InventarioConsumidoresObservados>;

export type ResultadoPreflightOperativo = Readonly<{
  backup: EvidenciaPreflightOperativo['backup'];
  consumidoresExternos: EvidenciaPreflightOperativo['consumidoresExternos'];
  invariantes: Readonly<{
    duplicadosHogar: number;
    duplicadosMatricula: number;
    eventosHuerfanos: number;
    eventosCruzados: number;
    hogaresSinAdmin: number;
    membresiasInvalidas: number;
  }>;
}>;

async function exigirBackupRecuperable(backup: EvidenciaPreflightOperativo['backup'], verificar: VerificadorRecuperacion) {
  if (!backup.identificador || !/^[a-f0-9]{64}$/i.test(backup.huellaSha256)) {
    throw new Error('Preflight operativo bloqueado: falta evidencia de backup recuperable');
  }
  const restauracion = await verificar(backup);
  const tablasEsperadas = ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'];
  if (restauracion.estado !== 'restauracion-verificada'
    || restauracion.identificadorBackup !== backup.identificador
    || !restauracion.filasYUuidPreservados
    || !restauracion.relacionesPreservadas
    || tablasEsperadas.some((tabla) => !restauracion.tablasOrigen.includes(tabla))) {
    throw new Error('Preflight operativo bloqueado: falta evidencia de backup recuperable');
  }
}

function exigirConsumidoresClasificados(consumidores: EvidenciaPreflightOperativo['consumidoresExternos']) {
  const noClasificados = consumidores.filter(({ referencia, clasificacion, justificacion }) => (
    referencia.startsWith('mv_') && (!['propio', 'externo-aprobado'].includes(clasificacion) || !justificacion)
  ));
  if (noClasificados.length > 0) {
    throw new Error(`Preflight operativo bloqueado: consumidores externos sin clasificar ${noClasificados.map(({ identidad }) => identidad).join(', ')}`);
  }
}

function estaClasificado(
  identidad: string,
  referencia: string,
  consumidores: EvidenciaPreflightOperativo['consumidoresExternos'],
) {
  return consumidores.some((consumidor) => (
    consumidor.identidad === identidad
    && consumidor.referencia === referencia
    && ['propio', 'externo-aprobado'].includes(consumidor.clasificacion)
    && Boolean(consumidor.justificacion)
  ));
}

function exigirDependenciasExternasClasificadas(
  inventario: InventarioCatalogoFamiliar,
  consumidores: EvidenciaPreflightOperativo['consumidoresExternos'],
) {
  const noClasificadas = inventario.dependencias
    .filter(({ tablaOrigen, tipoDependencia }) => tablaOrigen.startsWith('mv_') && tipoDependencia === 'n')
    .filter(({ tablaOrigen, objetoDependiente }) => !estaClasificado(objetoDependiente, tablaOrigen, consumidores))
    .map(({ objetoDependiente }) => objetoDependiente)
    .filter((identidad, indice, identidades) => identidades.indexOf(identidad) === indice)
    .sort();
  if (noClasificadas.length > 0) {
    throw new Error(`Preflight operativo bloqueado: consumidores externos sin clasificar ${noClasificadas.join(', ')}`);
  }
}

function exigirConsumidoresObservadosClasificados(
  inventario: InventarioConsumidoresObservados,
  consumidores: EvidenciaPreflightOperativo['consumidoresExternos'],
) {
  if (inventario.estado !== 'inventario-verificado') {
    throw new Error('Preflight operativo bloqueado: falta inventario verificado de jobs y webhooks');
  }
  const noClasificados = [...inventario.jobs, ...inventario.webhooks]
    .filter(({ referencia }) => referencia.startsWith('mv_'))
    .filter(({ identidad, referencia }) => !estaClasificado(identidad, referencia, consumidores));
  if (noClasificados.length > 0) {
    throw new Error(`Preflight operativo bloqueado: jobs o webhooks sin clasificar ${noClasificados.map(({ identidad }) => identidad).join(', ')}`);
  }
}

function exigirInvariantes(invariantes: ResultadoPreflightOperativo['invariantes']) {
  const rotas = Object.entries(invariantes).filter(([, cantidad]) => cantidad > 0);
  if (rotas.length > 0) {
    throw new Error(`Preflight operativo bloqueado: invariantes rotas ${rotas.map(([nombre, cantidad]) => `${nombre}=${cantidad}`).join(', ')}`);
  }
}

export async function ejecutarPreflightOperativoFamiliar(
  cliente: ClientePreflightOperativo,
  evidencia: EvidenciaPreflightOperativo,
  verificarRecuperacion: VerificadorRecuperacion,
): Promise<ResultadoPreflightOperativo> {
  await exigirBackupRecuperable(evidencia.backup, verificarRecuperacion);
  exigirConsumidoresClasificados(evidencia.consumidoresExternos);

  const resultado = await cliente.query<FilaInvariantes>(`
    select
      (select count(*) from (select lower(btrim(nombre)) from public.mv_households group by lower(btrim(nombre)) having count(*) > 1) duplicados) as duplicados_hogar,
      (select count(*) from (select household_id, matricula from public.mv_vehiculos group by household_id, matricula having count(*) > 1) duplicados) as duplicados_matricula,
      (select count(*) from public.mv_eventos_vehiculo e left join public.mv_vehiculos v on v.id = e.vehiculo_id where v.id is null) as eventos_huerfanos,
      (select count(*) from public.mv_eventos_vehiculo e join public.mv_vehiculos v on v.id = e.vehiculo_id where v.household_id <> e.household_id) as eventos_cruzados,
      (select count(*) from public.mv_households h where not exists (select from public.mv_household_members m where m.household_id = h.id and m.rol = 'admin')) as hogares_sin_admin,
      (select count(*) from public.mv_household_members where rol not in ('admin', 'editor')) as membresias_invalidas`);
  const fila = resultado.rows[0];
  if (!fila) throw new Error('Preflight operativo bloqueado: no se obtuvo el inventario de invariantes');

  const invariantes = {
    duplicadosHogar: fila.duplicados_hogar,
    duplicadosMatricula: fila.duplicados_matricula,
    eventosHuerfanos: fila.eventos_huerfanos,
    eventosCruzados: fila.eventos_cruzados,
    hogaresSinAdmin: fila.hogares_sin_admin,
    membresiasInvalidas: fila.membresias_invalidas,
  };
  exigirInvariantes(invariantes);
  return { backup: evidencia.backup, consumidoresExternos: evidencia.consumidoresExternos, invariantes };
}

export async function ejecutarPreflightFamiliar(
  catalogo: ClienteCatalogoPostgres,
  operativo: ClientePreflightOperativo,
  evidencia: EvidenciaPreflightOperativo,
  verificarRecuperacion: VerificadorRecuperacion,
  inspeccionarConsumidores: InspectorConsumidoresExternos,
) {
  const inventarioCatalogo = await inspeccionarPreflightCatalogoFamiliar(catalogo);
  exigirDependenciasExternasClasificadas(inventarioCatalogo, evidencia.consumidoresExternos);
  const consumidoresObservados = await inspeccionarConsumidores();
  exigirConsumidoresObservadosClasificados(consumidoresObservados, evidencia.consumidoresExternos);
  const inventarioOperativo = await ejecutarPreflightOperativoFamiliar(operativo, evidencia, verificarRecuperacion);
  return { catalogo: inventarioCatalogo, operativo: inventarioOperativo, consumidoresObservados };
}
