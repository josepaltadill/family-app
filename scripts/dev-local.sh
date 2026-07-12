#!/usr/bin/env bash
set -euo pipefail

# Arranca un entorno de desarrollo local completo en un solo comando: stack de
# Supabase -> bootstrap admin (idempotente) -> `next dev` con las variables de
# entorno ya resueltas. Ver supabase/migrations/README.md, sección "Entorno
# local: de cero a `npm run dev`", para correr los pasos a mano si se prefiere.
#
# Sobreescribible por variable de entorno antes de invocar el script:
# SUPABASE_BOOTSTRAP_EMAIL, SUPABASE_BOOTSTRAP_PASSWORD,
# SUPABASE_BOOTSTRAP_HOUSEHOLD_NOMBRE, VEHICULOS_ACCESS_TOKEN.

: "${SUPABASE_BOOTSTRAP_EMAIL:=dev@ejemplo.local}"
: "${SUPABASE_BOOTSTRAP_PASSWORD:=password-desarrollo-local}"
: "${SUPABASE_BOOTSTRAP_HOUSEHOLD_NOMBRE:=Hogar de desarrollo}"
: "${VEHICULOS_ACCESS_TOKEN:=token-desarrollo-local}"
export SUPABASE_BOOTSTRAP_EMAIL SUPABASE_BOOTSTRAP_PASSWORD SUPABASE_BOOTSTRAP_HOUSEHOLD_NOMBRE VEHICULOS_ACCESS_TOKEN

if ! supabase status >/dev/null 2>&1; then
  echo "Levantando el stack local de Supabase..."
  supabase start
fi

estado_supabase="$(supabase status -o env)"
db_url="$(echo "$estado_supabase" | sed -n 's/^DB_URL="\(.*\)"$/\1/p')"
export SUPABASE_URL
SUPABASE_URL="$(echo "$estado_supabase" | sed -n 's/^API_URL="\(.*\)"$/\1/p')"
export SUPABASE_ANON_KEY
SUPABASE_ANON_KEY="$(echo "$estado_supabase" | sed -n 's/^ANON_KEY="\(.*\)"$/\1/p')"

if [[ -z "$db_url" || -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
  echo "No se pudo leer DB_URL/API_URL/ANON_KEY de 'supabase status -o env'; abortando." >&2
  exit 1
fi

echo "Sembrando (o reutilizando) el hogar/usuario de desarrollo..."
salida_bootstrap="$(SUPABASE_BOOTSTRAP_DATABASE_URL="$db_url" npm run bootstrap:admin 2>&1)"
echo "$salida_bootstrap"

household_id="$(echo "$salida_bootstrap" | sed -n 's/.*householdId: \([0-9a-f-]*\).*/\1/p')"
if [[ -z "$household_id" ]]; then
  echo "No se pudo extraer householdId de la salida del bootstrap; abortando." >&2
  exit 1
fi
export SUPABASE_HOUSEHOLD_ID_DESARROLLO="$household_id"

child_pids=()
cleanup() {
  if ((${#child_pids[@]})); then
    kill "${child_pids[@]}" 2>/dev/null || true
    wait "${child_pids[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

npm run dev -- --hostname 127.0.0.1 --port 3001 &
child_pids+=("$!")

node <<'NODE' &
const http = require('node:http');
const net = require('node:net');

const token = process.env.VEHICULOS_ACCESS_TOKEN;
if (!token) throw new Error('Falta VEHICULOS_ACCESS_TOKEN para el proxy local.');

const proxy = http.createServer((request, response) => {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: 3001,
    method: request.method,
    path: request.url,
    headers: { ...request.headers, 'x-vehiculos-access-token': token },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502);
    response.end('El servidor local todavía no está disponible.');
  });
  request.pipe(upstream);
});

proxy.on('upgrade', (request, socket, head) => {
  const upstream = net.connect(3001, '127.0.0.1', () => {
    const headers = { ...request.headers, 'x-vehiculos-access-token': token };
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);
    for (const [name, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const item of value) upstream.write(`${name}: ${item}\r\n`);
      } else if (value !== undefined) {
        upstream.write(`${name}: ${value}\r\n`);
      }
    }
    upstream.write('\r\n');
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
});

proxy.listen(3000, '127.0.0.1', () => {
  console.log('Proxy local listo en http://127.0.0.1:3000/vehiculos');
});
NODE
child_pids+=("$!")

echo ""
echo "Next y el proxy escuchan exclusivamente en 127.0.0.1."
echo "Abrí http://127.0.0.1:3000/vehiculos; el proxy agrega la prueba de acceso localmente."
echo "Fuera de este proxy, los clientes HTTP deben presentar el token."
echo ""

status=0
wait -n "${child_pids[@]}" || status=$?
exit "$status"
