const path = require('node:path').posix;
const locations = { ...require('./documentation-locations.json'), ...require('./diagram-locations.json') };

// Resolve links a partir da localização original, inclusive em templates dos
// geradores antigos. A lista também registra onde cada documento foi movido.
function relocateDocument(file, text) {
  const destination = locations[file] || file;
  const content = text.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g, (match, start, url, end) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('#') || url.startsWith('/')) return match;
    const hash = url.indexOf('#');
    const target = hash < 0 ? url : url.slice(0, hash);
    const fragment = hash < 0 ? '' : url.slice(hash);
    const original = path.normalize(path.join(path.dirname(file), decodeURI(target)));
    const relocated = locations[original] || original;
    const relative = path.relative(path.dirname(destination), relocated);
    return start + encodeURI(relative) + fragment + end;
  });
  return { file: destination, text: content };
}

module.exports = { relocateDocument, locations };
