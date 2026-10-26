// Fails fast at start-up: a server without a real JWT secret would sign tokens
// anyone can forge, so refusing to start is safer than a warning.
const PLACEHOLDER = 'replace-with-a-long-random-string';

function comprobarEntorno() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < 16 || secreto === PLACEHOLDER) {
    throw new Error('JWT_SECRET is missing, too short (min 16 chars) or still the example value. Set it in backend/.env.');
  }
}

// CORS_ORIGIN is a comma-separated list. Without it only localhost origins
// are accepted (Expo web dev server); native apps do not send CORS requests.
function origenesPermitidos() {
  const lista = process.env.CORS_ORIGIN;
  if (lista) return lista.split(',').map((o) => o.trim()).filter(Boolean);
  return [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
}

module.exports = { comprobarEntorno, origenesPermitidos };
