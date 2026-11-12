const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const { locations } = require('./documentation-paths.cjs');
const excluded = new Set(['.git', 'node_modules', '.expo', 'android', 'ios', 'dist', 'web-build', '.verification-build']);
const generated = new Set(['docs/INVENTARIO_ARQUIVOS.json', 'docs/INVENTARIO_ARQUIVOS.md']);
const tracked = new Set(execFileSync('git', ['ls-files', '--full-name', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean));
const previous = Object.fromEntries(Object.entries(locations).map(([a,b]) => [b,a]));
const files = [], omitted = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    const full = path.join(dir, item.name), name = path.relative(root, full).replaceAll('\\', '/');
    if (item.isDirectory()) {
      if (excluded.has(item.name)) omitted.push(name); else walk(full);
    } else if (item.isFile() && !generated.has(name)) {
      files.push({ path: name, bytes: fs.statSync(full).size, tracked: tracked.has(name), previousTrackedPath: tracked.has(previous[name]) ? previous[name] : undefined });
    }
  }
}
walk(root);
files.sort((a,b) => a.path.localeCompare(b.path));
const sizes = new Map(), groups = new Map();
for (const file of files) {
  // Nunca lê conteúdo de configurações locais para identificar duplicatas.
  if (/(^|\/)\.env($|\.)/.test(file.path) || file.bytes > 2 * 1024 * 1024 || !file.bytes) continue;
  const group = sizes.get(file.bytes) || []; group.push(file); sizes.set(file.bytes, group);
}
for (const group of sizes.values()) {
  if (group.length < 2) continue;
  for (const file of group) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file.path))).digest('hex');
    const matches = groups.get(hash) || []; matches.push(file.path); groups.set(hash, matches);
  }
}
const inventory = {
  generatedAt: new Date().toISOString(),
  scope: 'Arquivos próprios e configurações por caminho/tamanho; sem ler valores de .env. Dependências, Git, caches e projetos nativos gerados excluídos da listagem individual.',
  trackedDependencyFiles: [...tracked].filter(x => x.includes('/node_modules/')).length,
  trackedEnvironmentFiles: [...tracked].filter(x => /(^|\/)\.env($|\.)/.test(x) && !x.endsWith('.example')),
  omittedDirectories: omitted.sort(),
  exactDuplicates: [...groups].filter(([,matches]) => matches.length > 1).map(([sha256, paths]) => ({sha256, paths})),
  files,
};
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root,'docs/INVENTARIO_ARQUIVOS.json'),JSON.stringify(inventory,null,2)+'\n');
  let md = '# Inventário dos arquivos do projeto\n\nGerado por `node Synple/scripts/inventory-project.cjs --write`. Caminhos relativos à raiz BRTPDS2. Consulte [o mapa](ORGANIZACAO_DO_PROJETO.md) para a finalidade das pastas e [a revisão de limpeza](REVISAO_DE_LIMPEZA.md) antes de remover arquivos.\n\n'+inventory.scope+'\n\n';
  md += `Dependências já versionadas: **${inventory.trackedDependencyFiles} arquivos**. Configurações locais versionadas: ${inventory.trackedEnvironmentFiles.map(x=>'`'+x+'`').join(', ') || 'nenhuma'}.\n\n`;
  md += '## Arquivos próprios\n\n| Caminho | Bytes | Situação no índice Git |\n| --- | ---: | --- |\n';
  for (const f of files) md += `| [${f.path}](../${f.path}) | ${f.bytes} | ${f.tracked?'Versionado':f.previousTrackedPath?'Movido; origem versionada':'Local/novo'} |\n`;
  md += '\n## Duplicatas exatas por SHA-256\n\n';
  for (const g of inventory.exactDuplicates) md += g.paths.map(x=>'`'+x+'`').join(' = ')+'\n\n';
  md += 'Arquivos com conteúdo diferente não são considerados duplicatas só porque têm o mesmo nome. Não foi executada nenhuma exclusão. O inventário muda após commit ou novas gerações.\n';
  fs.writeFileSync(path.join(root,'docs/INVENTARIO_ARQUIVOS.md'),md);
}
console.log(JSON.stringify({files:files.length,trackedDependencyFiles:inventory.trackedDependencyFiles,trackedEnvironmentFiles:inventory.trackedEnvironmentFiles,exactDuplicates:inventory.exactDuplicates,largeFiles:files.filter(f=>f.bytes>5*1024*1024)},null,2));
