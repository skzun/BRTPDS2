const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'../..');
const errors=[];
const files=['README.md','Synple/README.md','Synple/docs/README.md'];
function collectDocuments(folder) {
 for(const item of fs.readdirSync(path.join(root,folder),{withFileTypes:true})) {
  const relative=folder+'/'+item.name;
  if(item.isDirectory())collectDocuments(relative);
  else if(item.name.endsWith('.md'))files.push(relative);
 }
}
collectDocuments('docs');
function anchors(file) {
 const source=fs.readFileSync(file,'utf8');const ids=new Set();const seen=new Map();
 for(const m of source.matchAll(/<a\s+id="([^"]+)"/g))ids.add(m[1]);
 for(const m of source.matchAll(/^#{1,6}\s+(.+)$/gm)) {
  let slug=m[1].replace(/<[^>]*>/g,'').replace(/[`*]/g,'').toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu,'').replace(/\s/g,'-');
  const n=seen.get(slug)||0;seen.set(slug,n+1);if(n)slug+='-'+n;ids.add(slug);
 }
 return ids;
}
let links=0;
for(const rel of files) {
 const file=path.join(root,rel);if(!fs.existsSync(file)){errors.push(`Ausente: ${rel}`);continue;}
 const source=fs.readFileSync(file,'utf8');
 for(const m of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
  const raw=m[1].trim();if(/^[a-z]+:/i.test(raw))continue;
  const [p,fragment]=raw.split('#');const target=path.resolve(path.dirname(file),decodeURIComponent(p||''));
  links++;
  if(!fs.existsSync(target)){errors.push(`${rel}: destino ausente ${raw}`);continue;}
  if(fragment&&target.endsWith('.md')&&!anchors(target).has(decodeURIComponent(fragment)))errors.push(`${rel}: fragmento ausente ${raw}`);
 }
}
const requirements=JSON.parse(fs.readFileSync(path.join(root,'docs/requisitos.snapshot.json'),'utf8'));
const ids=new Set();const sourceDir=path.join(root,'docs/Diagramas/ENTREGA_DEFINITIVA/fontes');
const names=fs.readdirSync(sourceDir).filter(x=>x.endsWith('.puml'));
const usecases=names.filter(n=>n.startsWith('uc-')).map(n=>fs.readFileSync(path.join(sourceDir,n),'utf8')).join('\n');
for(const r of requirements) {
 if(ids.has(r.id))errors.push('ID RF duplicado: '+r.id);ids.add(r.id);
 if(!usecases.includes(`"${r.id}\\n`))errors.push('RF sem caso de uso: '+r.id);
 if(!r.steps.length||!r.pre||!r.exceptions||!r.data||!r.api)errors.push('Ficha incompleta: '+r.id);
 if(!fs.existsSync(path.join(sourceDir,r.sequence+'.puml')))errors.push('Sequência ausente: '+r.id);
}
for(const name of names) {
 const source=fs.readFileSync(path.join(sourceDir,name),'utf8');
 const svgFile=path.join(root,'docs/Diagramas/ENTREGA_DEFINITIVA/renderizados',name.replace('.puml','.svg'));
 if(!source.startsWith('@startuml')||!source.trim().endsWith('@enduml'))errors.push('Delimitadores UML inválidos: '+name);
 if(!fs.existsSync(svgFile)){errors.push('SVG ausente: '+name);continue;}
 const svg=fs.readFileSync(svgFile,'utf8');
 if(!svg.includes('<svg')||/Syntax Error\?|An error has occur|Error line \d+/i.test(svg))errors.push('SVG com erro: '+name);
 if(name.startsWith('relacional-')) {
  // Confere que os campos não foram ocultados como métodos por causa de VARCHAR(n).
  for(const m of source.matchAll(/^\{field\}\s+\*?\s*(\w+):/gm)) {
   if(!svg.includes(m[1]+':'))errors.push(`Campo não renderizado: ${name}:${m[1]}`);
  }
 }
}
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/modelo-fisico.snapshot.json'),'utf8'));
const schemaHash=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,snapshot.generatedFrom))).digest('hex');
if(snapshot.schemaSha256!==schemaHash)errors.push('DDL foi alterado após gerar o snapshot físico. Regere o dicionário.');
const dictionary=fs.readFileSync(path.join(root,'docs/dicionario-banco-dados.md'),'utf8');
for(const c of snapshot.columns)if(!dictionary.includes('`'+c.column_name+'`'))errors.push(`Coluna não documentada: ${c.table_name}.${c.column_name}`);
const main=fs.readFileSync(path.join(root,'docs/incremento-1-especificacao-completa.md'),'utf8');
if(main.includes('```mermaid'))errors.push('Diagrama Mermaid antigo permaneceu na especificação principal.');
if(/menos de 100ms|simula o link|ORM \*\*Sequelize|Expo SDK 54/.test(main))errors.push('Afirmação obsoleta permaneceu na especificação principal.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`${files.length} documentos; ${links} referências locais; ${requirements.length} RFs únicos; ${names.length} SVGs/fontes; ${snapshot.columns.length} colunas: validação documental aprovada.`);
