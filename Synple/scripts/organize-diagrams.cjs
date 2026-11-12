const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const jobs = [
 ['docs/Diagramas/fontes','docs/Diagramas/ENTREGA_DEFINITIVA/fontes'],
 ['docs/Diagramas/renderizados','docs/Diagramas/ENTREGA_DEFINITIVA/renderizados'],
 ['Synple/docs/Diagramas/fontes','docs/Diagramas/VERSOES_ANTERIORES/fontes'],
];
const safe = relative => {
 const full=path.resolve(root,relative);
 if(!full.startsWith(root+path.sep))throw new Error('Caminho fora do repositório: '+relative);
 return full;
};
const moves=[];
for(const [source,destination] of jobs) {
 if(!fs.existsSync(safe(source)))continue;
 for(const file of fs.readdirSync(safe(source),{withFileTypes:true})) {
  if(!file.isFile())throw new Error('Item inesperado: '+file.name);
  const from=source+'/'+file.name,to=destination+'/'+file.name;
  if(fs.existsSync(safe(to)))throw new Error('Destino já existe: '+to);
  moves.push({from,to,hash:crypto.createHash('sha256').update(fs.readFileSync(safe(from))).digest('hex')});
 }
}
if(!moves.length){console.log('Diagramas já separados; nenhum arquivo movido.');process.exit(0);}
if(!process.argv.includes('--apply')){console.log(JSON.stringify({files:moves.length,folders:jobs},null,2));process.exit(0);}
const mapping=Object.fromEntries(moves.map(x=>[x.from,x.to]));
const mdFiles=[];
const skipped=new Set(['.git','node_modules','.expo','android','ios','dist','web-build','.verification-build']);
function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
 if(entry.isSymbolicLink())continue;
 const file=path.join(folder,entry.name);
 if(entry.isDirectory()&&!skipped.has(entry.name))walk(file);
 else if(entry.isFile()&&entry.name.endsWith('.md'))mdFiles.push(file);
}}
walk(root);
const p=path.posix;
for(const file of mdFiles){
 const relative=path.relative(root,file).replaceAll('\\','/');
 let text=fs.readFileSync(file,'utf8');
 text=text.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g,(match,start,url,end)=>{
  if(/^[a-z][a-z\d+.-]*:/i.test(url)||url.startsWith('#')||url.startsWith('/'))return match;
  const hash=url.indexOf('#'),target=hash<0?url:url.slice(0,hash),fragment=hash<0?'':url.slice(hash);
  const original=p.normalize(p.join(p.dirname(relative),decodeURI(target)));
  return mapping[original]?start+encodeURI(p.relative(p.dirname(relative),mapping[original]))+fragment+end:match;
 });
 // Atualiza também caminhos em texto e comandos. Links já resolvidos não casam
 // com os prefixos antigos, pois incluem a nova pasta intermediária.
 text=text.replaceAll('Synple/docs/Diagramas/fontes','docs/Diagramas/VERSOES_ANTERIORES/fontes')
  .replaceAll('Diagramas/fontes','Diagramas/ENTREGA_DEFINITIVA/fontes')
  .replaceAll('Diagramas/renderizados','Diagramas/ENTREGA_DEFINITIVA/renderizados');
 if(text!==fs.readFileSync(file,'utf8'))fs.writeFileSync(file,text);
}
for(const job of moves){
 fs.mkdirSync(path.dirname(safe(job.to)),{recursive:true});
 fs.renameSync(safe(job.from),safe(job.to));
 if(crypto.createHash('sha256').update(fs.readFileSync(safe(job.to))).digest('hex')!==job.hash)throw new Error('Conteúdo alterado ao mover: '+job.to);
}
fs.writeFileSync(path.join(__dirname,'diagram-locations.json'),JSON.stringify(mapping,null,2)+'\n');
console.log(`${moves.length} arquivos movidos com hashes preservados; links atualizados; versões antigas conservadas.`);
