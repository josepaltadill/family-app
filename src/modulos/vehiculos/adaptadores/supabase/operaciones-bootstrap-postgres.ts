import 'server-only';
import {
  sembrarHogarDeDesarrollo,
  type EntradaBootstrap,
  type OperacionesBootstrap,
} from './bootstrap-servidor';

/** Cliente mínimo para aislar el acceso administrativo de Postgres en pruebas. */
export type ClientePostgresBootstrap = Readonly<{
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    valores?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
  cerrar?(): Promise<void>;
}>;

type FilaId = Readonly<{ id: string }>;
type FilaCantidad = Readonly<{ cantidad: string | number }>;
type FilaMembresia = Readonly<{ rol: string }>;

/**
 * Implementación administrativa y server-only del puerto de bootstrap.
 *
 * Nunca debe importarse desde componentes, rutas cliente o acciones de producto. Su
 * conexión PostgreSQL tiene privilegios administrativos porque debe sembrar el primer
 * usuario y la primera membresía, operaciones que RLS bloquea deliberadamente.
 *
 * El `import 'server-only'` de arriba solo hace fallar el build si este módulo se
 * bundlea para un Client Component; no impide que una Server Action u otra ruta de
 * servidor lo importe indebidamente, ya que ambas comparten el mismo grafo de
 * compilación server-side. Ver issue de seguimiento sobre limitar quién puede
 * importar este módulo.
 */
export class OperacionesBootstrapPostgres implements OperacionesBootstrap {
  constructor(private readonly cliente: ClientePostgresBootstrap) {}

  async buscarUsuarioPorEmail(email: string): Promise<FilaId | null> {
    return primeraFila<FilaId>(
      this.cliente.query('select id from auth.users where email = $1 limit 1', [email]),
    );
  }

  async crearUsuario(email: string, password: string): Promise<FilaId> {
    const usuario = await primeraFila<FilaId>(
      this.cliente.query(
        `insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
           confirmation_token, recovery_token, email_change_token_new, email_change
         ) values (
           '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
           $1, extensions.crypt($2, extensions.gen_salt('bf')), now(),
           '{}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
         )
         on conflict (email) where is_sso_user = false do update set email = excluded.email
         returning id`,
        [email, password],
      ),
    );

    if (!usuario) throw new Error('No se pudo crear ni recuperar el usuario de bootstrap.');
    return usuario;
  }

  async buscarHogarPorNombre(nombre: string): Promise<FilaId | null> {
    return primeraFila<FilaId>(
      this.cliente.query('select id from public.mv_households where nombre = $1 limit 1', [nombre]),
    );
  }

  async crearHogar(nombre: string): Promise<FilaId> {
    const hogar = await primeraFila<FilaId>(
      this.cliente.query(
        `insert into public.mv_households (nombre)
         values ($1)
         on conflict (nombre) do update set nombre = excluded.nombre
         returning id`,
        [nombre],
      ),
    );

    if (!hogar) throw new Error('No se pudo crear ni recuperar el hogar de bootstrap.');
    return hogar;
  }

  async contarHogaresPorNombre(nombre: string): Promise<number> {
    const fila = await primeraFila<FilaCantidad>(
      this.cliente.query(
        'select count(*)::text as cantidad from public.mv_households where nombre = $1',
        [nombre],
      ),
    );
    return Number(fila?.cantidad ?? 0);
  }

  async buscarMembresia(householdId: string, userId: string): Promise<FilaMembresia | null> {
    return primeraFila<FilaMembresia>(
      this.cliente.query(
        `select rol from public.mv_household_members
         where household_id = $1 and user_id = $2 limit 1`,
        [householdId, userId],
      ),
    );
  }

  async crearMembresiaAdmin(householdId: string, userId: string): Promise<void> {
    await this.cliente.query(
      `insert into public.mv_household_members (household_id, user_id, rol)
       values ($1, $2, 'admin')
       on conflict (household_id, user_id) do nothing`,
      [householdId, userId],
    );
  }

  async cerrar(): Promise<void> {
    await this.cliente.cerrar?.();
  }
}

const CONNECTION_TIMEOUT_MS_DEFECTO = 5_000;
const INTENTOS_CONEXION_DEFECTO = 3;
const BACKOFF_BASE_MS_DEFECTO = 200;

export type OpcionesConexionBootstrap = Readonly<{
  connectionTimeoutMillis?: number;
  intentosConexion?: number;
  backoffBaseMs?: number;
}>;

/**
 * Reintenta `intentar` hasta `intentos` veces con backoff lineal creciente
 * (`backoffBaseMs * intento` entre cada reintento), pensado para errores
 * transitorios de conexión (red caída momentáneamente, reset). No distingue
 * el tipo de error: solo debe usarse para operaciones idempotentes como abrir
 * una conexión nueva, nunca para lógica de negocio no idempotente.
 */
export async function conectarConReintentos<T>(
  intentar: () => Promise<T>,
  intentos: number,
  backoffBaseMs: number,
): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      return await intentar();
    } catch (error) {
      ultimoError = error;
      if (intento < intentos) {
        await esperar(backoffBaseMs * intento);
      }
    }
  }

  throw ultimoError;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Crea el adaptador real para scripts server-only; no acepta variables públicas. */
export async function crearOperacionesBootstrapPostgres(
  databaseUrl: string,
  opciones: OpcionesConexionBootstrap = {},
): Promise<OperacionesBootstrapPostgres> {
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error('Se requiere una URL PostgreSQL administrativa para el bootstrap.');
  }

  const {
    connectionTimeoutMillis = CONNECTION_TIMEOUT_MS_DEFECTO,
    intentosConexion = INTENTOS_CONEXION_DEFECTO,
    backoffBaseMs = BACKOFF_BASE_MS_DEFECTO,
  } = opciones;

  const { Client } = await import('pg');
  const cliente = await conectarConReintentos(
    async () => {
      const nuevoCliente = new Client({ connectionString: databaseUrl, connectionTimeoutMillis });
      await nuevoCliente.connect();
      return nuevoCliente;
    },
    intentosConexion,
    backoffBaseMs,
  );

  return new OperacionesBootstrapPostgres({
    query: cliente.query.bind(cliente),
    cerrar: () => cliente.end(),
  });
}

type EntornoBootstrapPostgres = Readonly<Record<string, string | undefined>>;
type OperacionesBootstrapCerrables = OperacionesBootstrap & Readonly<{ cerrar(): Promise<void> }>;
type DependenciasBootstrapPostgres = Readonly<{
  crearOperaciones(databaseUrl: string): Promise<OperacionesBootstrapCerrables>;
  sembrar: typeof sembrarHogarDeDesarrollo;
}>;

/**
 * Punto de entrada operativo server-only para la siembra administrativa.
 *
 * Lee exclusivamente variables privadas del proceso y garantiza que la conexión
 * privilegiada se cierre tanto si la siembra termina como si falla.
 */
export async function ejecutarBootstrapPostgresDesdeEntorno(
  entorno: EntornoBootstrapPostgres = process.env,
  dependencias: DependenciasBootstrapPostgres = {
    crearOperaciones: crearOperacionesBootstrapPostgres,
    sembrar: sembrarHogarDeDesarrollo,
  },
) {
  const databaseUrl = exigirVariablePrivada(entorno, 'SUPABASE_BOOTSTRAP_DATABASE_URL');
  const entrada: EntradaBootstrap = {
    bootstrapEmail: exigirVariablePrivada(entorno, 'SUPABASE_BOOTSTRAP_EMAIL'),
    bootstrapPassword: exigirVariablePrivada(entorno, 'SUPABASE_BOOTSTRAP_PASSWORD'),
    bootstrapHouseholdNombre: exigirVariablePrivada(
      entorno,
      'SUPABASE_BOOTSTRAP_HOUSEHOLD_NOMBRE',
    ),
  };
  const operaciones = await dependencias.crearOperaciones(databaseUrl);

  let resultado: Awaited<ReturnType<typeof dependencias.sembrar>>;
  try {
    resultado = await dependencias.sembrar(operaciones, entrada);
  } catch (errorSiembra) {
    try {
      await operaciones.cerrar();
    } catch (errorCierre) {
      console.error(
        'Fallo al cerrar la conexión administrativa de bootstrap tras un error de siembra.',
        { errorSiembra, errorCierre },
      );
    }
    throw errorSiembra;
  }

  await operaciones.cerrar();
  return resultado;
}

function exigirVariablePrivada(entorno: EntornoBootstrapPostgres, nombre: string): string {
  const valor = entorno[nombre];
  if (!valor || valor.trim().length === 0) {
    throw new Error(`Falta la variable privada obligatoria ${nombre}.`);
  }
  return valor;
}

async function primeraFila<T>(resultado: Promise<{ rows: T[] }>): Promise<T | null> {
  return (await resultado).rows[0] ?? null;
}
