const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'../..');
const base = path.join(root,'docs/Diagramas');
const delivery = path.join(base,'ENTREGA_DEFINITIVA');
const previous = path.join(base,'VERSOES_ANTERIORES');
const names = fs.readdirSync(path.join(delivery,'fontes')).filter(n=>n.endsWith('.puml')).sort();
const categories = [
 ['Casos de uso', n=>n.startsWith('uc-')],
 ['Classes e módulos', n=>n.startsWith('classes-')],
 ['Modelo relacional', n=>n.startsWith('relacional-')],
 ['Sequências', n=>n.startsWith('seq-')],
 ['Implantação', n=>n==='implantacao.puml'],
];
const manifest=[];
for(const name of names)for(const [folder,file] of [['fontes',name],['renderizados',name.replace('.puml','.svg')]]){
 const relative=folder+'/'+file,full=path.join(delivery,relative);
 if(!fs.existsSync(full))throw new Error('Par fonte/imagem incompleto: '+relative);
 manifest.push({file:relative,sha256:crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')});
}
let md='# Diagramas — Entrega definitiva\n\nPacote vigente selecionado e organizado em 12/11/2026: **'+names.length+' diagramas**, com fontes PlantUML editáveis e imagens SVG. Use esta pasta na entrega ao professor.\n\n';
md+='## Critério de seleção\n\nEste é o conjunto completo usado pela especificação atual: cobre os 49 requisitos documentados, inclui os incrementos 2 e 3 e está associado aos dicionários e ao snapshot do DDL. As cinco fontes antigas isoladas não substituem esse conjunto e foram preservadas em [Versões anteriores](../VERSOES_ANTERIORES/README.md). A seleção usa cobertura e correspondência com a documentação/código, não somente a data de modificação do arquivo.\n\n';
md+='As imagens e fontes foram realocadas sem alterar o conteúdo, com conferência SHA-256. “Entrega definitiva” identifica a versão escolhida para entregar; futuras mudanças de requisitos ou código exigem revisão dos diagramas correspondentes.\n\n';
for(const [title,filter] of categories){
 const group=names.filter(filter);
 md+=`## ${title} (${group.length})\n\n| Diagrama | Visualizar | Editar |\n| --- | --- | --- |\n`;
 for(const name of group){const stem=name.slice(0,-5);md+=`| ${stem} | [SVG](renderizados/${stem}.svg) | [PlantUML](fontes/${name}) |\n`;}
 md+='\n';
}
md+='## Documentos que acompanham os diagramas\n\n- [Especificação dos requisitos](../../incremento-1-especificacao-completa.md).\n- [Dicionário de classes](../../dicionario-classes.md).\n- [Dicionário do banco](../../dicionario-banco-dados.md).\n- [Catálogo com imagens incorporadas](../Diagramas_Casos_de_Uso.md).\n- [Manifesto de integridade](manifesto.json).\n\n## Manutenção\n\nNa raiz BRTPDS2, execute `node Synple/scripts/validate-documentation.cjs`. Os geradores já apontam para esta pasta; após atualizar fontes e renderizar SVGs, revise os diagramas antes de regenerar o índice/manifesto com `node Synple/scripts/index-diagrams.cjs`. Não substitua este pacote pelas fontes de versões anteriores.\n';
fs.writeFileSync(path.join(delivery,'README.md'),md);
fs.writeFileSync(path.join(delivery,'manifesto.json'),JSON.stringify({selectionDate:'2026-11-12',diagrams:names.length,files:manifest},null,2)+'\n');
const old=fs.readdirSync(path.join(previous,'fontes')).filter(n=>n.endsWith('.puml')).sort();
fs.writeFileSync(path.join(previous,'README.md'),'# Diagramas — Versões anteriores\n\nFontes antigas preservadas, anteriormente em `Synple/docs/Diagramas/fontes`. **Não usar como pacote final da entrega.** Os conteúdos são diferentes dos modelos atuais, inclusive análise versus módulos de projeto; nenhum deles foi apagado.\n\nUse a [Entrega definitiva](../ENTREGA_DEFINITIVA/README.md).\n\n'+old.map(n=>'- ['+n+'](fontes/'+n+')').join('\n')+'\n');
fs.writeFileSync(path.join(base,'README.md'),'# Diagramas do Synple\n\n- **[ENTREGA DEFINITIVA](ENTREGA_DEFINITIVA/README.md):** pacote escolhido para a entrega, com 33 fontes e 33 imagens SVG, separado por tipo no índice.\n- [Versões anteriores](VERSOES_ANTERIORES/README.md): cinco fontes antigas preservadas como histórico.\n- [Catálogo visual completo](Diagramas_Casos_de_Uso.md): imagens da entrega definitiva incorporadas para consulta.\n\nAs pastas `fontes` contêm arquivos editáveis; `renderizados` contém as imagens para visualizar. Para enviar o pacote completo, utilize a pasta `ENTREGA_DEFINITIVA` com seu README e manifesto. Os dicionários e requisitos que acompanham os modelos estão vinculados no índice.\n');
console.log(`${names.length} diagramas na entrega definitiva; ${old.length} versões anteriores; índice e manifesto atualizados.`);
