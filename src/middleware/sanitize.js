function stripMongoOperators(value) {
  if (Array.isArray(value)) return value.map(stripMongoOperators);
  if (!value || typeof value !== 'object') return value;

  const clean = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = stripMongoOperators(nested);
  }
  return clean;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripMongoOperators(req.body);
  }
  next();
}
