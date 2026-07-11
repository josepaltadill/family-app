// Runner operativo del bootstrap administrativo (issue de seguimiento del PR #4:
// "wire a real runner for ejecutarBootstrapPostgresDesdeEntorno").
//
// Invocar con `npm run bootstrap:admin`. Requiere en el entorno del proceso:
// SUPABASE_BOOTSTRAP_DATABASE_URL, SUPABASE_BOOTSTRAP_EMAIL,
// SUPABASE_BOOTSTRAP_PASSWORD y SUPABASE_BOOTSTRAP_HOUSEHOLD_NOMBRE. Ninguna
// debe tener prefijo `NEXT_PUBLIC_*` ni guardarse en el repositorio; son
// credenciales administrativas para un proceso operador puntual, no para la
// app en ejecución. Ver `supabase/migrations/README.md` para el detalle
// completo de qué hace el bootstrap y por qué existe.
import { ejecutarBootstrapPostgresDesdeEntorno } from '../src/modulos/vehiculos/adaptadores/supabase/operaciones-bootstrap-postgres';

async function main(): Promise<void> {
  const resultado = await ejecutarBootstrapPostgresDesdeEntorno();
  console.log('Bootstrap administrativo completado.');
  console.log(`  householdId: ${resultado.householdId.valor}`);
  console.log(`  userId: ${resultado.userId.valor}`);
}

// `process.exit()` explícito en vez de dejar que el event loop drene solo:
// el cierre de la conexión administrativa tiene un límite de tiempo, pero si
// algún handle igual queda vivo (ej. un socket que no terminó de cerrarse),
// el proceso no debe quedar colgado sin ninguna señal para el operador.
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Bootstrap administrativo falló.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
