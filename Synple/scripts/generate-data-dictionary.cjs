// Gera artefatos documentais a partir de um schema temporário; não altera dados da instalação.
const fs = require('fs');
const path = require('path');
const { randomUUID, createHash } = require('crypto');
const { Pool } = require('../backend/node_modules/pg');
const db = require('../backend/src/db/connection');
const { migrateSchema } = require('../backend/src/db/migrate');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'docs');
const common = {
  id: 'Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual.',
  created_at: 'Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente.',
  updated_at: 'Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização.',
  user_id: 'Pessoa vinculada ao registro; referência a users.id.',
  organization_id: 'Organização à qual o registro pertence; referência a organizations.id.',
  commission_id: 'Comissão à qual o registro pertence; referência a commissions.id.',
  meeting_id: 'Reunião à qual o registro pertence; referência a meetings.id.',
  expires_at: 'Instante após o qual a aplicação rejeita o registro; expiração não implica remoção automática da linha.',
  all_day: 'Indica reunião por dias de calendário; término exclusivo à meia-noite seguinte no fuso selecionado no aparelho.',
  location: 'Local opcional, até 300 caracteres.',
  details: 'Detalhes opcionais, até 4.000 caracteres.',
  recorded_by: 'Ator autenticado responsável pelo último registro de presença; FK para users.',
  method: 'SELF para autorregistro, CHAIR para registro pelo gestor ou CODE para código temporário. Biometria é proteção local, não atestado do servidor.',
};
const tables = {
 meeting_votes:['Votação de escolha única independente da aprovação da ata.',{question:'Pergunta não vazia, até 500 caracteres.',status:'OPEN ou CLOSED por CHECK.',created_by:'Autor autenticado; FK para users.',closed_at:'Instante de encerramento; nulo enquanto aberta.'}],
 meeting_vote_options:['Alternativas ordenadas de uma votação.',{vote_id:'Votação à qual pertence; FK com cascata.',label:'Alternativa não vazia, até 160 caracteres.',position:'Ordem positiva e única por votação; rota aceita de duas a oito opções.'}],
 meeting_vote_ballots:['Um voto por participante e votação.',{vote_id:'Votação escolhida; FK com cascata.',option_id:'Opção pertencente à mesma votação, protegida por FK composta.',cast_at:'Instante da última escolha; rota só altera enquanto aberta.'}],
 meeting_attendance_codes:['Desafio temporário de presença, criado pelo gestor durante a reunião.',{code_hash:'SHA-256 de código de seis dígitos; nunca o código em texto.',created_by:'Gestor autenticado que emitiu o desafio.'}],
 meeting_attachments:['Arquivos de reunião disponíveis aos convidados e gestores.',{name:'Nome de até 160 caracteres; sem barras/controles.',mime_type:'PDF, PNG, JPEG ou texto; validado na rota.',content:'Conteúdo binário entre 1 byte e 5 MB por CHECK; até dez arquivos por reunião na rota.',created_by:'Gestor autenticado responsável pelo arquivo.'}],
 users: ['Contas locais/Google, preferências e desafios de ativação/recuperação.', {
  name:'Nome completo; cadastro limita a 120 caracteres.',email:'E-mail de acesso; rotas normalizam com trim e minúsculas. UNIQUE é por texto, não índice LOWER(email).',phone:'Telefone opcional; coluna admite 20 caracteres. Formulário aplica máscara de 10/11 dígitos.',password_hash:'Hash bcrypt, fator 10; senha em texto não é persistida nesta tabela.',google_id:'Identificador sub verificado no token Google; nulo para conta sem vínculo Google.',system_role:'Domínio aceito pela aplicação: USER ou SYSTEM_ADMIN. O DDL não possui CHECK de domínio.',theme:'Preferência LIGHT ou DARK; validada na atualização do perfil. O DDL não possui CHECK.',reset_token:'SHA-256 do código de recuperação; não é o código em texto nem token de sessão.',reset_token_expires:'Validade do desafio de recuperação; 15 minutos a partir da emissão.',email_verified:'Novas contas locais começam FALSE; código correto ou Google verificado ativa. A migração inicial preserva contas antigas como TRUE.',activation_hash:'SHA-256 do código de ativação; apagado após uso.',activation_expires:'Validade do código de ativação; 15 minutos.'}],
 organizations:['Organizações cadastradas e proprietário atual.',{name:'Nome da organização; unicidade normalizada por LOWER(TRIM(name)).',document:'CNPJ; criação remove pontuação e exige 14 dígitos. Índice também impede equivalentes formatados.',owner_id:'Proprietário atual; referência a users.id, não um cargo global.',status:'PENDING, APPROVED ou REJECTED nas rotas de situação. Coluna textual sem CHECK; valores legados não são convertidos automaticamente.'}],
 access_requests:['Solicitações e convites de ingresso; o mesmo par organização/pessoa tem uma linha.',{status:'PENDING, APPROVED, REJECTED ou REVOKED nas rotas; sem CHECK SQL.',organization_role:'MEMBER ou COORDINATOR na organização; não é o mesmo vínculo/cargo de commission_members.',invited_by:'Autor do convite. Nulo para solicitação espontânea. FK ON DELETE SET NULL.',invitation_accepted:'Convite novo usa FALSE; aceite usa TRUE e APPROVED. Solicitações espontâneas usam o default TRUE, que não significa aprovação de acesso.'}],
 commissions:['Comissões/grupos de uma organização.',{name:'Nome da comissão; interface verifica repetição por organização. Não existe índice UNIQUE para esse nome no DDL.',type:'Categoria textual; padrão Comissão. Não há enum SQL.',description:'Atribuições e descrição opcionais.',status:'ACTIVE ou INACTIVE nas rotas de edição; sem CHECK SQL.'}],
 commission_members:['Associação pessoa/comissão, com cargo próprio.',{role:'MEMBER ou COORDINATOR nas rotas. Índice parcial permite no máximo um COORDINATOR por comissão; criação/promoção/remoção controlam a existência de um coordenador.'}],
 meetings:['Agendamento e pauta das reuniões de uma comissão.',{title:'Título validado na rota: não vazio, até 160 caracteres.',starts_at:'Início agendado; a API exige data ISO com fuso válido.',ends_at:'Término agendado, posterior ao início por CHECK SQL.',agenda:'Pauta obrigatória na rota; NOT NULL no SQL não impede texto vazio.',created_by:'Usuário autor; FK users.id. Produção obtém o ator da sessão.'}],
 meeting_invitations:['Convites individuais de reunião.',{status:'INVITED, ACCEPTED ou DECLINED; domínio protegido por CHECK SQL.',responded_at:'Instante da resposta; organizador é incluído como ACCEPTED na criação.'}],
 meeting_attendance:['Primeira entrada e saída de cada participante.',{entered_at:'Entrada registrada pelo relógio do servidor; entrada requer convite aceito.',left_at:'Saída registrada pelo servidor; a ordem temporal é validada na rota, não por CHECK SQL.'}],
 meeting_minutes:['Conteúdo e versão atual da ata, com conjunto de aprovadores fixado na submissão.',{content:'Texto não vazio por CHECK; a rota limita a 50.000 caracteres.',status:'DRAFT, IN_REVIEW, APPROVED ou REJECTED por CHECK.',version:'Inteiro positivo; incrementado ao corrigir uma revisão/rejeição. Não há tabela de histórico completo de versões.',required_approver_ids:'Array UUID dos presentes que precisam decidir na versão. Elementos não têm FK individual; integridade adicional é mantida pelas rotas.',created_by:'Autor inicial; FK users.id, sem cascata.',updated_by:'Último responsável pela alteração; FK users.id, sem cascata.',submitted_at:'Instante da submissão atual, ou nulo em rascunho.',approved_at:'Instante em que a unanimidade foi atingida, ou nulo.'}],
 meeting_minutes_approvals:['Decisão atual por pessoa/ata, vinculada à versão lida.',{minutes_id:'Ata decidida; participa da FK composta (minutes_id, meeting_id).',version:'Versão que a pessoa leu; SQL exige positivo e rota exige igualdade com a versão atual.',decision:'APPROVED ou REJECTED por CHECK.',comment:'Comentário até 2.000 caracteres; rejeição exige texto na rota.',decided_at:'Instante da decisão registrado pelo servidor.'}],
 system_subsystems:['Tabela legada de estados de subsistemas; não comprova disponibilidade real.',{id:'Chave textual do subsistema.',name:'Nome descritivo.',status:'Estado textual legado, padrão ONLINE; não usar como prova de serviço ativo.',last_check:'Instante salvo no registro; sem monitor ativo associado a esta tabela.'}],
 auth_sessions:['Sessões opacas emitidas após autenticação.',{token_hash:'SHA-256 de token aleatório de 32 bytes. PK; o token bruto só é devolvido ao cliente.',expires_at:'Sessão válida por sete dias; conferida a cada requisição privada.'}],
 auth_rate_limits:['Contadores persistentes de limitação por endpoint/IP e, quando fornecido, e-mail.',{key:'SHA-256 da chave de limitação; PK.',attempts:'Quantidade de tentativas na janela; incrementada por UPSERT atômico.',expires_at:'Fim da janela de 900 segundos; a primeira tentativa posterior reinicia o contador.'}],
 system_metadata:['Marco de inicialização da instalação.',{id:'Booleano TRUE, PK e CHECK(id). Impede mais de uma linha, mas SQL isolado não impede tabela vazia.',initialized_at:'Instante da primeira aplicação desta migração. Não recupera uma data histórica desconhecida de instalação antiga.'}],
 download_tickets:['Autorização curta para abrir PDF em navegador sem expor o Bearer token.',{token_hash:'SHA-256 do ticket aleatório; PK.',session_hash:'Sessão à qual o ticket pertence; FK auth_sessions.token_hash com cascata.',path:'Caminho de uma rota de PDF, conferido na autenticação do ticket.',expires_at:'Validade de 60 segundos. Ticket não é de uso único; pode ser reutilizado na mesma rota até expirar/revogar a sessão.'}],
};
async function main() {
 const schema = `docs_${randomUUID().replace(/-/g,'')}`;
 let pool;
 await db.query(`CREATE SCHEMA "${schema}"`);
 try {
  pool = new Pool({...db.pool.options,password:db.pool.options.password,options:`-c search_path=${schema}`});
  await migrateSchema(pool);
  const columns = (await pool.query(`SELECT c.relname AS table_name,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,
    a.attnotnull AS not_null,pg_get_expr(d.adbin,d.adrelid) AS default_value
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    WHERE n.nspname=$1 AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum`,[schema])).rows;
  const constraints = (await pool.query(`SELECT c.relname AS table_name,k.conname AS name,k.contype AS kind,
    pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 ORDER BY c.relname,k.conname`,[schema])).rows;
  const indexes = (await pool.query('SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname=$1 ORDER BY tablename,indexname',[schema])).rows;
  const normalize = value => String(value).replaceAll(`"${schema}".`, '').replaceAll(`${schema}.`,'');
  for (const row of [...constraints,...indexes]) row.definition=normalize(row.definition);
  const schemaSha256=createHash('sha256').update(fs.readFileSync(path.join(root,'Synple/backend/src/db/schema.sql'))).digest('hex');
  const data = {generatedFrom:'Synple/backend/src/db/schema.sql',schemaSha256,columns,constraints,indexes};
  fs.mkdirSync(target,{recursive:true});
  fs.writeFileSync(path.join(target,'modelo-fisico.snapshot.json'), JSON.stringify(data,null,2)+'\n');
  let md = '# Dicionário físico do PostgreSQL — Synple\n\nRevisão: 06/11/2026. Extraído de um schema temporário criado pelo DDL atual, incluindo ALTER TABLE e índices. Não consulta dados pessoais. Reproduzir: `node Synple/scripts/generate-data-dictionary.cjs`. Requer PostgreSQL configurado e permissão de criar/remover schema temporário.\n\n## Convenções\n\nCada tabela tem finalidade, todas as colunas, nulabilidade, defaults, restrições e índices reais. “Sem CHECK” significa que o domínio citado é convenção/validação da aplicação, não garantia SQL. `timestamp with time zone` corresponde a TIMESTAMPTZ e `character varying(n)` a VARCHAR(n). FKs sem ON DELETE explícito usam NO ACTION. As restrições de regra entre várias linhas são descritas separadamente na especificação.\n\n';
  for (const [name,[purpose,descriptions]] of Object.entries(tables)) {
   const cols=columns.filter(c=>c.table_name===name); if(!cols.length) throw new Error(`Tabela ausente: ${name}`);
   md += `## Tabela \`${name}\`\n\n${purpose}\n\n| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |\n| --- | --- | --- | --- | --- |\n`;
   for(const c of cols) {
    const meaning=descriptions[c.column_name]||common[c.column_name]; if(!meaning) throw new Error(`Descrição ausente: ${name}.${c.column_name}`);
    md += `| \`${c.column_name}\` | \`${c.type}\` | ${c.not_null?'Não':'Sim'} | ${c.default_value?`\`${normalize(c.default_value)}\``:'—'} | ${meaning} |\n`;
   }
   md+='\n### Restrições de '+name+'\n\n';
   for(const c of constraints.filter(c=>c.table_name===name)) md+=`- \`${c.name}\`: \`${c.definition}\`.\n`;
   md+='\n### Índices de '+name+'\n\n';
   for(const i of indexes.filter(i=>i.table_name===name)) md+=`- \`${i.name}\`: \`${i.definition}\`.\n`;
   md+='\n';
  }
  md+='## Limites e integridade entre camadas\n\n- Não existem triggers gerais de updated_at. Rotas precisam atualizar o campo explicitamente.\n- E-mail é normalizado nas rotas, mas UNIQUE(email) não equivale a UNIQUE(LOWER(email)).\n- Não existe UNIQUE de nome de comissão por organização. A interface faz uma verificação; não é garantia concorrente do banco.\n- O índice parcial de coordenador garante no máximo um. O mínimo de um depende das operações transacionais e da migração que atribui o proprietário quando não há coordenador.\n- O array required_approver_ids não tem FKs por elemento. Regras de versão, presença, unanimidade e preservação de aprovadores são implementadas nas rotas.\n- Ordem entrada/saída é validada na API; meeting_attendance não tem CHECK temporal.\n- Expiração de códigos, sessões, limites e tickets é conferida pela aplicação; registros expirados não somem apenas por terem expires_at.\n- Exclusões seguem as FKs reais listadas. Excluir organização pode apagar comissões, reuniões e registros em cascata; não documentar uma proteção histórica geral que a rota não implementa.\n- O comentário de cabeçalho do DDL cita PostgreSQL 12+, mas a configuração suportada/testada pelo projeto é PostgreSQL 16; esse comentário não certifica compatibilidade com outras versões.\n';
  fs.writeFileSync(path.join(target,'dicionario-banco-dados.md'),md);
  let versions='# Tecnologias e versões — Synple\n\nRevisão: 06/11/2026. Faixas vêm dos manifests; versões resolvidas vêm dos lockfiles versionados. Não representam prova de instalação em outro PC.\n\n';
  for(const area of ['mobile','backend']) {
   const pkg=JSON.parse(fs.readFileSync(path.join(root,'Synple',area,'package.json'),'utf8'));
   const lock=JSON.parse(fs.readFileSync(path.join(root,'Synple',area,'package-lock.json'),'utf8'));
   versions+=`## ${area}\n\n| Dependência direta | Faixa declarada | Resolvida no lockfile | Uso |\n| --- | --- | --- | --- |\n`;
   for(const [name,range] of Object.entries({...pkg.dependencies,...pkg.devDependencies})) versions+=`| \`${name}\` | \`${range}\` | \`${lock.packages?.['node_modules/'+name]?.version||'não registrada'}\` | ${pkg.devDependencies?.[name]?'Desenvolvimento':'Aplicação'} |\n`;
   versions+='\n';
  }
  versions+='## Plataforma e infraestrutura\n\n| Item | Configuração/requisito | Evidência |\n| --- | --- | --- |\n| Node.js | Mínimo 22.13; imagem backend node:22-alpine (tag flutuante, patch não fixado) | README, Dockerfile e compatibilidade Expo SDK 58 |\n| Android | 7.0/API 24 ou superior | app.json, expo-build-properties.minSdkVersion=24 |\n| iOS | 16.4 ou superior | app.json, deploymentTarget=16.4 |\n| PostgreSQL | Imagem postgres:16-alpine; versão menor não fixada | Ambos os docker-compose.yml |\n| Docker Compose | 2.24+ para env_file opcional | README e configuração Compose |\n| JavaScript | Código mobile/backend; não há TypeScript no código da aplicação | Arquivos .js/.cjs |\n| Testes | node:test incluído no Node.js | Scripts npm test |\n| Cloudflared | Executável externo; versão não fixada pelo repositório | iniciar.ps1 e scripts/dev-tunnel.js |\n| EAS CLI | Comandos com latest; versão efetiva depende da execução | README e eas.json |\n\nNão há Sequelize, Lucia Auth, JWT de sessão, WatermelonDB, Redis, MinIO, TanStack Query, Zustand, React Native Paper ou React Navigation nas dependências atuais. Não confundir ID token Google com o token opaco de sessão do Synple.\n\nReferências: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [upgrade Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [ciclo PostgreSQL](https://www.postgresql.org/support/versioning/). SDK 58 usa React Native 0.88, React 19.3 e Node 22.13 ou superior; manter PostgreSQL 16 preserva compatibilidade com dados existentes.\n';
  fs.writeFileSync(path.join(target,'tecnologias-versoes.md'),versions);
  console.log(`${Object.keys(tables).length} tabelas, ${columns.length} colunas, ${constraints.length} restrições e ${indexes.length} índices documentados.`);
 } finally { if(pool) await pool.end(); await db.query(`DROP SCHEMA "${schema}" CASCADE`); await db.pool.end(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
