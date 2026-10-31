// Migra caches antigos sem reaproveitar credenciais ou cadastros offline.
function removeCredentials(value) {
  if (Array.isArray(value)) return value.map(removeCredentials);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/password|token|secret|activation_hash/i.test(key))
    .map(([key, item]) => [key, removeCredentials(item)]));
}
module.exports = { removeCredentials };
