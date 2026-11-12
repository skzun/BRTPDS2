const fs = require('node:fs');
const path = require('node:path');
const { relocateDocument, locations } = require('./documentation-paths.cjs');
const root = path.resolve(__dirname, '../..');
const skipped = new Set(['.git', 'node_modules', '.expo', 'android', 'ios', 'state', 'dist', 'web-build', '.claude']);
const files = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory() && !skipped.has(item.name)) walk(file);
    else if (item.isFile() && item.name.endsWith('.md')) files.push(path.relative(root, file).replaceAll('\\', '/'));
  }
}
function inside(relative) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new Error('Caminho fora do repositório: ' + relative);
  return absolute;
}
walk(root);
const pending = Object.entries(locations).filter(([from]) => fs.existsSync(inside(from)));
if (!pending.length) { console.log('Documentação já organizada; nenhuma movimentação.'); process.exit(0); }
// Verifica todos os destinos antes de alterar qualquer arquivo. Nunca sobrescreve.
for (const [, to] of pending) if (fs.existsSync(inside(to))) throw new Error('Destino já existe: ' + to);
const active = new Set(pending.map(([from]) => from));
const changes = files.map(file => {
  const original = fs.readFileSync(inside(file), 'utf8');
  const moved = relocateDocument(file, original);
  return { from: file, ...moved, original };
}).filter(item => item.file !== item.from || item.text !== item.original);
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ moves: pending, updatedDocuments: changes.length }, null, 2));
  process.exit(0);
}
for (const change of changes) {
  const source = inside(change.from), target = inside(change.file);
  if (active.has(change.from)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(source, target);
  }
  fs.writeFileSync(target, change.text);
}
console.log(`${pending.length} documentos movidos; ${changes.length} documentos com caminhos atualizados. Nenhum conteúdo descartado.`);
