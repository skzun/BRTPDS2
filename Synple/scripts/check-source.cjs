const fs = require('fs'); const path = require('path'); const { createRequire } = require('module');
const root = path.resolve(__dirname, '..');
const mobileRequire = createRequire(path.join(root, 'mobile/package.json'));
const parser = mobileRequire('@babel/parser'); const traverse = mobileRequire('@babel/traverse').default;
const globals = new Set(['undefined','console','process','fetch','setTimeout','clearTimeout','setInterval','clearInterval','Promise','Object','Array','String','Number','Boolean','Date','Math','JSON','Error','TypeError','Map','Set','WeakMap','RegExp','Intl','URL','URLSearchParams','AbortController','window','document','navigator','module','require','__DEV__','global','NaN','Infinity','parseInt','parseFloat','isNaN','encodeURIComponent','decodeURIComponent']);
let problems = 0;
function walk(folder) { for (const item of fs.readdirSync(folder,{withFileTypes:true})) { const file = path.join(folder,item.name); if(item.isDirectory()) walk(file); else if(file.endsWith('.js')) check(file); } }
function check(file) {
 const ast = parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'unambiguous',plugins:['jsx']});
 traverse(ast,{ReferencedIdentifier(p) { if (!p.scope.hasBinding(p.node.name) && !globals.has(p.node.name)) { console.log(path.relative(root,file)+':'+p.node.loc.start.line+' '+p.node.name); problems++; } }});
}
check(path.join(root,'mobile/App.js')); walk(path.join(root,'mobile/src'));
if (problems) process.exitCode=1; else console.log('Sem referências livres inesperadas nos arquivos do aplicativo.');
