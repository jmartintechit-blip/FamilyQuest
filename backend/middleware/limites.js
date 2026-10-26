const { rateLimit } = require('express-rate-limit');

// Brute-force guard for credentials and invite codes. One limiter per route, so each
// has its own counter. Counts per IP: behind a reverse proxy set
// `app.set('trust proxy', ...)` or every client shares one counter.
const crearLimite = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, espera unos minutos' },
});

module.exports = { crearLimite };
