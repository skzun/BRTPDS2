// Gera a Wiki em um clone separado; não faz commit nem push.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const target = process.argv[2];
const revision = process.argv[3];
if (!target || !/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Uso: node scripts/export-wiki.cjs <clone-wiki> <SHA-codigo>');
if (!fs.existsSync(path.join(target, '.git'))) throw new Error('O destino deve ser um clone da Wiki.');
const pages = {
  'Incremento-1': 'docs/incremento-1-especificacao-completa.md',
  'Incremento-2': 'docs/INCREMENTO_2.md',
  'Incremento-3': 'docs/INCREMENTO_3.md',
  'Interface-e-UX': 'docs/INTERFACES.md',
  'Padroes-de-Codigo': 'docs/PADROES_DESENVOLVIMENTO.md',
  'Analise-de-Mercado': 'docs/Analise_de_Mercado.md',
  'Arquitetura-e-Tecnologias': 'docs/DOCUMENTACAO_SOFTWARE.md',
  'Diagramas': 'docs/Diagramas/ENTREGA_DEFINITIVA/README.md',
  'Dicionario-de-Classes': 'docs/dicionario-classes.md',
  'Dicionario-do-Banco': 'docs/dicionario-banco-dados.md',
  'Organizacao-do-Projeto': 'docs/ORGANIZACAO_DO_PROJETO.md',
  'Validacao-em-Aparelhos': 'docs/VALIDACAO_EM_APARELHOS.md',
  'Verificacao-Incremento-3': 'docs/VERIFICACAO_INCREMENTO_3.md',
  'Email-e-Recuperacao': 'docs/guias/EMAIL_RECOVERY_SETUP.md',
};
const base = `https://github.com/skzun/BRTPDS2/blob/${revision}/`;
const pageForFile = new Map(Object.entries(pages).map(([page, file]) => [path.resolve(root, file), page]));
const manifest = [];
for (const [page, file] of Object.entries(pages)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  let content = source.replace(/(!?\[[^\]]*\])\(([^)]+)\)/g, (all, label, link) => {
    if (/^(?:[a-z]+:|#)/i.test(link)) return all;
    const [relative, fragment] = link.split('#');
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(relative));
    if (!fs.existsSync(resolved)) throw new Error(`Link ausente: ${file}: ${link}`);
    const repoPath = path.relative(root, resolved).replaceAll('\\', '/');
    if (repoPath.startsWith('../')) throw new Error('Link fora do repositório');
    const mapped = pageForFile.get(resolved);
    const url = mapped || base + repoPath.split('/').map(encodeURIComponent).join('/');
    return `${label}(${url}${fragment ? '#' + fragment : label.startsWith('!') && !mapped ? '?raw=true' : ''})`;
  });
  // Erratas editoriais conferidas no código; preserva-se o documento original no repositório.
  content = content.replace('Fim da janela de 900 segundos; a primeira tentativa posterior reinicia o contador.', 'Fim da janela configurada por rota: autenticação usa 120 ou 300 segundos; código de presença mantém 900 segundos. A primeira tentativa posterior reinicia o contador.')
    .replace('Login/Google/troca: 10, envio/reenvio: 3, código/reset: 5 por janela de 900 s', 'Login/Google/troca: 10 em 120 s; envio/reenvio: 3 em 300 s; ativação/reset: 5 em 300 s')
    .replace('Há divergência local remanescente: resetPasswordFromLogin ainda usa mínimo seis, mas servidor exige oito.', 'A redefinição de senha exige pelo menos oito caracteres no fluxo atual.')
    .replace('Senha nova no servidor exige oito caracteres; a divergência remanescente na checagem local de recuperação está registrada na especificação principal.', 'A redefinição de senha exige pelo menos oito caracteres; consulte as pendências atuais para as demais divergências.')
    .replaceAll('Open-source e Custo Zero para o Cliente Final', 'Proposta de código aberto; custos de operação dependem do ambiente')
    .replaceAll('gratuidade e custo zero de infraestrutura', 'redução de custos de licenciamento; infraestrutura pode ter custos')
    .replaceAll('Open-Source / Custo Zero', 'Proposta de código aberto')
    .replaceAll('UX mobile limpa, integração local, 100% gratuito', 'Interface mobile e integração local; custos de infraestrutura variáveis')
    .replace(/\r\n/g, '\n').replace(/[\t ]+$/gm, '').trimEnd() + '\n';
  fs.writeFileSync(path.join(target, page + '.md'), `> Referência documental do código ${revision.slice(0, 7)}, com erratas editoriais desta revisão. Para alterações recentes e limites de validação, consulte [Estado atual e pendências](Estado-atual-e-pendencias).\n\n${content}`);
  manifest.push({page, source:file, sha256:crypto.createHash('sha256').update(source).digest('hex')});
}
for (const entry of fs.readdirSync(path.join(__dirname, 'wiki-pages'))) {
  if (!entry.endsWith('.md')) continue;
  const source = fs.readFileSync(path.join(__dirname, 'wiki-pages', entry), 'utf8');
  fs.writeFileSync(path.join(target, entry), source.replaceAll('{{SOURCE}}', base).replaceAll('{{REVISION}}', revision));
  manifest.push({page:entry.slice(0,-3), source:'Synple/scripts/wiki-pages/'+entry, sha256:crypto.createHash('sha256').update(source).digest('hex')});
}
const requirements = JSON.parse(fs.readFileSync(path.join(root, 'docs/requisitos.snapshot.json'), 'utf8'));
let versions = '# Versões configuradas\n\nExtraídas dos manifests e lockfiles do checkout '+revision+'. Não equivalem à versão instalada em um aparelho nem à versão efetiva do servidor em execução.\n\n';
for(const component of ['mobile','backend']) {
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'Synple',component,'package.json'),'utf8'));
 const lock=JSON.parse(fs.readFileSync(path.join(root,'Synple',component,'package-lock.json'),'utf8'));
 versions+=`## ${component}\n\nVersão do pacote: ${pkg.version}.\n\n| Dependência | Declarada | Resolvida no lock |\n| --- | --- | --- |\n`;
 for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies}))versions+=`| ${name} | ${version} | ${lock.packages?.['node_modules/'+name]?.version || 'não localizada'} |\n`;
 versions+='\n';
}
const config=JSON.parse(fs.readFileSync(path.join(root,'Synple/mobile/app.json'),'utf8')).expo;
versions+=`## Aplicativo e infraestrutura\n\nVersão Expo configurada: ${config.version}. Pacote Android: ${config.android.package}. Bundle iOS: ${config.ios.bundleIdentifier}. O Compose declara PostgreSQL 16; tags de imagem não fixam patch. O inicializador exige Node 22.13+. Os mínimos Android API 24/iOS 16.4 declarados em BuildProperties precisam ser conferidos na build gerada e não são garantia de compatibilidade de todos os módulos.\n`;
fs.writeFileSync(path.join(target,'Versoes.md'),versions);
fs.writeFileSync(path.join(target, 'Rastreabilidade.md'), '# Rastreabilidade dos requisitos\n\nOs requisitos e casos de uso são apresentados separadamente. Esta matriz relaciona os 49 requisitos às entradas, contratos e sequências do código de referência. As fichas completas estão na [especificação](Incremento-1). Situações divergentes estão em [Estado atual](Estado-atual-e-pendencias).\n\n| ID | Requisito | Ator | Contrato | Sequência |\n| --- | --- | --- | --- | --- |\n'+requirements.map(r=>`| ${r.id} | ${r.name} | ${r.actor} | ${r.api.replaceAll('|','/')} | [${r.sequence}](${base}docs/Diagramas/ENTREGA_DEFINITIVA/fontes/${r.sequence}.puml) |`).join('\n')+'\n');
fs.writeFileSync(path.join(target, 'fontes-documentais.json'), JSON.stringify({revision, pages:manifest},null,2)+'\n');
let links=0;
for(const file of fs.readdirSync(target).filter(f=>f.endsWith('.md'))) {
 const content=fs.readFileSync(path.join(target,file),'utf8');
 if(content.includes('{{SOURCE}}')||content.includes('{{REVISION}}')) throw new Error('Placeholder restante: '+file);
 for(const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
  const link=match[1]; if(/^(?:[a-z]+:|#)/i.test(link))continue;
  const page=decodeURIComponent(link.split('#')[0]);
  if(!fs.existsSync(path.join(target,page+'.md'))&&!fs.existsSync(path.join(target,page)))throw new Error('Página ausente: '+file+' -> '+link);
  links++;
 }
}
console.log(`${manifest.length+2} páginas geradas; ${links} links internos conferidos; 49 requisitos; código ${revision}.`);
