const fs=require('fs'); const path=require('path'); const {createRequire}=require('module');
const root=path.resolve(__dirname,'../..');
const req=createRequire(path.join(root,'Synple/mobile/package.json')); const parser=req('@babel/parser');
const models=[
 ['Votacao','meeting_votes','Pergunta e apuração independente da ata.'],
 ['OpcaoVotacao','meeting_vote_options','Alternativa ordenada.'],
 ['Voto','meeting_vote_ballots','Escolha única de um participante.'],
 ['CodigoPresenca','meeting_attendance_codes','Desafio temporário com hash e validade.'],
 ['AnexoReuniao','meeting_attachments','Arquivo privado com tamanho e conteúdo.'],
 ['Usuario','users','Conta e preferência da pessoa. Não possui método de instância login no código.'],
 ['Organizacao','organizations','Organização e proprietário contextual, que pode ser transferido.'],
 ['VinculoOrganizacao','access_requests','Solicitação ou convite e sua decisão; não confundir com sessão nem comissão.'],
 ['Comissao','commissions','Comissão/grupo de uma organização.'],
 ['VinculoComissao','commission_members','Associação pessoa/comissão e cargo.'],
 ['Reuniao','meetings','Agendamento, período, pauta e autoria.'],
 ['ConviteReuniao','meeting_invitations','Convite individual; aceite não equivale a presença.'],
 ['Presenca','meeting_attendance','Primeira entrada e saída por participante.'],
 ['Ata','meeting_minutes','Conteúdo/versão atual e conjunto de aprovadores congelado.'],
 ['DecisaoAta','meeting_minutes_approvals','Decisão atual da pessoa sobre uma versão.'],
 ['SessaoServidor','auth_sessions','Modelo técnico de credencial opaca; não devolve token_hash ao usuário.'],
 ['LimiteTentativas','auth_rate_limits','Modelo técnico do contador por janela/rota/IP/conta.'],
 ['MarcoInstalacao','system_metadata','Marco persistido da instalação.'],
 ['SubsistemaLegado','system_subsystems','Modelo técnico legado; não é monitor real de serviço.'],
 ['TicketDownload','download_tickets','Modelo técnico de download restrito à sessão/rota/prazo.'],
];
const snap=JSON.parse(fs.readFileSync(path.join(root,'docs/modelo-fisico.snapshot.json'),'utf8'));
const camel=s=>s.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
const purpose={
 generateAttendancePdf:['Promise<Buffer>','Gera PDF Unicode de convidados, presença e horários sem exigir uma ata.'],
 meetingRequest:['Promise<Resultado<JSON>>','Executa consulta ou escrita autenticada de reuniões, anexos e presença; retorna dados, erros por campo e falhas de conexão.'],
 createMeetingVoteWithApi:['Promise<Resultado<JSON>>','Abre votação independente da ata.'],
 castMeetingVoteWithApi:['Promise<Resultado<JSON>>','Registra ou altera opção do participante presente.'],
 closeMeetingVoteWithApi:['Promise<Resultado<JSON>>','Encerra votação como gestor.'],
 fetchMeetingParticipationReportWithApi:['Promise<Resultado<JSON>>','Consulta somente presenças da sessão autenticada.'],
 getApiBaseUrl:['String','Resolve configuração explícita/ambiente da API; não envia requisição.'],
 checkBackendHealth:['Promise<{online:Boolean,database?:String,dbName?:String,latencyMs?:Number,error?:String}>','Consulta saúde pública; não altera dados. Nome/latência podem estar ausentes na resposta mínima atual de /health.'],
 fetchRemoteData:['Promise<Snapshot|null>','Busca snapshot autorizado; falha devolve null.'],
 loginWithApi:['Promise<Resultado<{user:Perfil}>>','Envia senha ao servidor; em sucesso separa token e guarda sessão em memória/SecureStore.'],
 loginWithGoogleApi:['Promise<Resultado<{user:Perfil}>>','Envia ID token Google para validação; guarda a sessão Synple resultante.'],
 registerWithApi:['Promise<Resultado<{requiresActivation:Boolean,email:String}>>','Cria conta pendente; não cria usuário local nem sessão.'],
 requestAccessWithApi:['Promise<VinculoOrganizacao|null>','Solicita ingresso; devolve vínculo retornado pela API ou null.'],
 updateUserWithApi:['Promise<Resultado<{user:Perfil}>>','Atualiza o próprio perfil/tema e devolve perfil confirmado.'],
 changePasswordWithApi:['Promise<Resultado>','Troca senha no servidor; a API revoga sessões.'],
 requestPasswordResetWithApi:['Promise<Resultado<{message:String}>>','Solicita código por e-mail; timeout de 45 segundos.'],
 resetPasswordWithApi:['Promise<Resultado<{message:String}>>','Consome código e pede nova senha ao servidor; não muda senha Google.'],
 deleteUserWithApi:['Promise<Resultado<{deleted?:JSON}>>','Pede exclusão administrativa; erro não confirma remoção local.'],
 deleteOrganizationWithApi:['Promise<Resultado>','Pede exclusão de organização; FKs reais podem produzir cascata/impedimento.'],
 updateOrganizationStatusWithApi:['Promise<Organizacao|{success:false}>','Retorna organização atualizada diretamente, ou objeto de falha. Não usa envelope success=true no sucesso.'],
 transferOrganizationOwnershipWithApi:['Promise<Resultado<{organization:Organizacao}>>','Transfere propriedade; parâmetro do dono atual é substituído pela sessão na API.'],
 updateOrganizationWithApi:['Promise<Resultado<{organization:Organizacao}>>','Atualiza nome/CNPJ da organização como proprietário.'],
 addCommissionMemberWithApi:['Promise<Resultado<{member:JSON}>>','Inclui pessoa elegível no vínculo da comissão.'],
 updateCommissionMemberRoleWithApi:['Promise<Resultado<{member:JSON}>>','Transfere coordenação ou altera papel respeitando mínimo de um.'],
 removeCommissionMemberWithApi:['Promise<Resultado<{member:null}>>','Remove vínculo atual sem apagar convites/presença históricos da reunião.'],
 scheduleMeetingWithApi:['Promise<Resultado<{meeting:JSON}>>','Cria reunião e convites atomicamente.'],
 respondToMeetingInvitationWithApi:['Promise<Resultado<{invitation:JSON}>>','Responde convite da própria sessão.'],
 recordMeetingAttendanceWithApi:['Promise<Resultado<{attendance:JSON}>>','Registra entrada/saída pelo servidor.'],
 fetchMeetingAttendanceWithApi:['Promise<Resultado<{attendance:JSON}>>','Consulta presença para gerar lista compartilhável.'],
 saveMeetingMinutesWithApi:['Promise<Resultado<{minutes:JSON}>>','Salva rascunho/correção; erro não confirma persistência.'],
 submitMeetingMinutesWithApi:['Promise<Resultado>','Submete ata; mantém os dados devolvidos pelo endpoint no envelope da API cliente.'],
 approveMeetingMinutesWithApi:['Promise<Resultado>','Envia decisão, comentário e versão lida.'],
 updateAccessRequestStatusWithApi:['Promise<VinculoOrganizacao|{success:false}>','Atualiza situação/cargo; sucesso retorna linha diretamente.'],
 createOrganizationWithApi:['Promise<Resultado<{organization:Organizacao}>>','Cria organização PENDING, com dono obtido da sessão.'],
 createCommissionWithApi:['Promise<Resultado<{commission:Comissao}>>','Cria comissão com equipe; erro não equivale a cadastro offline.'],
 syncPendingData:['Promise<void>','Função compatível legada sem sincronização de escritas; não transmite cadastro offline.'],
 authRequest:['Promise<Resultado>','Executa endpoint de autenticação, retorna success e os campos JSON da resposta.'],
 fetchSystemInfo:['Promise<JSON>','Consulta detalhes administrativos; lança erro se consulta falha.'],
 organizationInvitation:['Promise<Resultado>','Cria convite por e-mail ou responde convite pelo requestId.'],
 authenticatedFetch:['Promise<Response>','Wrapper HTTP com Bearer da memória e timeout.'],
 authorizePdfDownload:['Promise<String>','Obtém ticket da rota e retorna URL curta para navegador.'],
 commissionRequest:['Promise<Resultado>','PATCH/DELETE da comissão; confirma apenas resposta positiva.'],
 digest:['String','Calcula SHA-256 hexadecimal; não criptografa para posterior recuperação.'],
 issueSession:['Promise<String>','Gera 32 bytes aleatórios; salva hash e prazo sete dias; devolve token bruto.'],
 authenticate:['Promise<void>','Middleware: verifica Bearer ou ticket PDF e preenche req.auth; 401 para inválido.'],
 bindActor:['void','Substitui campos de ator de operações privadas pela identidade da sessão.'],
 adminOnly:['void','Middleware: permite SYSTEM_ADMIN ou responde 403.'],
 rateLimit:['Middleware','Cria middleware assíncrono que atualiza contador persistente e devolve 429 no limite.'],
 scopeSnapshot:['Snapshot','Filtra coleções por ator. Modifica o objeto recebido, não é função pura.'],
 authorize:['Promise<void>','Middleware de propriedade/papel; valida acesso e define proprietário/usuário quando aplicável.'],
 getSessionToken:['String|null','Lê token em memória, sem autenticação biométrica adicional nessa leitura.'],
 setSessionToken:['void','Define token em memória; não grava SecureStore.'],
 rememberSession:['Promise<void>','Define memória e tenta guardar token protegido se dispositivo tem hardware/enrollment. Falha de armazenamento é tolerada sem persistir em AsyncStorage.'],
 restoreSession:['Promise<String|null>','Lê token protegido com confirmação do SO; falha/ausência retorna null. Servidor ainda precisa validar.'],
 clearSession:['Promise<void>','Apaga token da memória e SecureStore; não revoga remotamente por si só.'],
 confirmBiometric:['Promise<Boolean>','Solicita biometria forte sem fallback do aparelho; web/ausência/cancelamento não autorizam.'],
 loadStoredData:['Promise<Snapshot|null>','Lê chave @synple:incremento-1 e sanitiza JSON; parse inválido pode lançar.'],
 saveData:['Promise<void>','Sanitiza e serializa snapshot nessa mesma chave; não grava token/credenciais.'],
 removeCredentials:['JSON','Copia recursivamente eliminando chaves que contenham password/token/secret/activation_hash. Não altera o objeto original.'],
 generateMeetingMinutesPdf:['Promise<Buffer>','Produz PDFKit em memória; sem escrita em tabela/arquivo ou assinatura digital.'],
 sendActivationEmail:['Promise<{success:Boolean}>','Envia e-mail real via SMTP quando configurado. Não marca usuário como ativado.'],
 sendPasswordResetEmail:['Promise<{success:Boolean,messageId?:String,error?:String}>','Envia código de recuperação; falha não gera sucesso.'],
 createMeetingsRouter:['Router','Cria Router Express com callbacks de agendamento/presença/ata/PDF e transações.'],
 createCommissionsRouter:['Router','Cria Router com operações de comissão/equipe e transferência de coordenação.'],
 createUsersRouter:['Router','Cria Router de atualização de perfil e exclusão administrativa de conta.'],
 createSyncRouter:['Router','Cria Router de snapshot. No app real a sessão é exigida antes do router.'],
};
const modules=[['PresencaPDF','Synple/backend/src/services/attendancePdf.js'],['ClienteAPI','Synple/mobile/src/services/api.js'],['Seguranca','Synple/backend/src/services/security.js'],['Autorizacao','Synple/backend/src/services/authorization.js'],['SessaoDispositivo','Synple/mobile/src/services/session.js'],['Cache','Synple/mobile/src/services/storage.js'],['Sanitizador','Synple/mobile/src/services/cacheSafety.js'],['GeradorPDF','Synple/backend/src/services/meetingMinutesPdf.js'],['Correio','Synple/backend/src/services/mailer.js'],['RotasReuniao','Synple/backend/src/routes/meetings.js'],['RotasComissao','Synple/backend/src/routes/commissions.js'],['RotasUsuario','Synple/backend/src/routes/users.js'],['RotasSincronizacao','Synple/backend/src/routes/sync.js']];
let md='# Dicionário de classes, atributos e operações — Synple\n\nRevisão: 06/11/2026. O código usa objetos JSON, funções, hooks e módulos Express, não classes JavaScript de entidade/ORM. O modelo UML de análise representa os conceitos; o modelo de projeto usa o estereótipo local «módulo JS/CommonJS» para expor operações existentes. Não implica construtores ou métodos de instância inexistentes.\n\n## Tipos de contrato\n\n- UUID: string no JSON, uuid no PostgreSQL. DateTime: instante ISO/Date no código, TIMESTAMPTZ no banco.\n- Perfil: {id,name,email,phone,systemRole,theme}, sem password_hash. Sessão é separada; código Google pode incluir isNewUser.\n- Resultado<T>: convenção documental de {success:true,...T} ou {success:false,error?:String}; não é tipo TypeScript declarado. Funções que retornam linha/null diretamente estão identificadas na tabela.\n- Snapshot: users, organizations, accessRequests, commissions, commissionMembers, meetings, meetingInvitations, meetingAttendance, meetingMinutes, meetingMinutesApprovals e system. O hook pode acrescentar campos locais; não é linha de uma única tabela.\n- Request/Response/NextFunction e Router: objetos Express. Middleware: função (req,res,next) que pode devolver Promise<void>.\n- Campos privados no desenho marcam sensibilidade conceitual; JavaScript não declara esses campos com #private.\n\n## Classes de domínio e atributos\n\n| Classe/modelo | Persistência | Responsabilidade |\n| --- | --- | --- |\n';
for(const [name,table,desc] of models) md+=`| ${name} | [${table}](dicionario-banco-dados.md#tabela-${table.replaceAll('_','_')}) | ${desc} |\n`;
for(const [name,table] of models) {
 md+=`\n### ${name}\n\n| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |\n| --- | --- | --- |\n`;
 for(const c of snap.columns.filter(c=>c.table_name===table)) md+=`| ${camel(c.column_name)} | \`${c.column_name}\` | ${c.type} / ${c.not_null?'1':'0..1'} |\n`;
 md+='\nSemântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.\n';
}
md+='\n## Operações de projeto com implementação correspondente\n\nAs assinaturas abaixo são extraídas dos exports atuais. Os parâmetros entre chaves são objetos desestruturados. Tipos/efeitos descrevem o contrato observado; não são anotações de tipo presentes no JavaScript. Operações HTTP sem função nomeada são callbacks das rotas e estão especificadas pelas fichas RF e pelo contrato, em vez de serem inventadas como métodos de entidade.\n\n';
let count=0;
for(const [name,file] of modules) {
 const source=fs.readFileSync(path.join(root,file),'utf8'); const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});
 const bindings=new Map(), exports=new Set();
 function register(decl) {
  if(decl?.type==='FunctionDeclaration') bindings.set(decl.id.name,decl);
  if(decl?.type==='VariableDeclaration') for(const v of decl.declarations) if(v.id.type==='Identifier'&&['ArrowFunctionExpression','FunctionExpression'].includes(v.init?.type)) bindings.set(v.id.name,v.init);
 }
 for(const node of ast.program.body) {
  register(node);
  if(node.type==='ExportNamedDeclaration'&&node.declaration) {register(node.declaration); if(node.declaration.id) exports.add(node.declaration.id.name); for(const d of node.declaration.declarations||[]) exports.add(d.id.name);}
  if(node.type==='ExpressionStatement'&&node.expression.type==='AssignmentExpression') {
   const a=node.expression; const left=source.slice(a.left.start,a.left.end);
   if(left==='module.exports'&&a.right.type==='ObjectExpression') {
    for(const p of a.right.properties) if(p.key?.name) exports.add(p.key.name);
   } else if(left.startsWith('module.exports.')) exports.add(left.split('.').pop());
  }
 }
 md+=`### ${name}\n\nFonte: [${file}](../${file}).\n\n| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |\n| --- | --- | --- |\n`;
 for(const name of exports) {
  const decl=bindings.get(name); if(!decl) continue;
  const signature=`${name}(${decl.params.map(p=>source.slice(p.start,p.end)).join(', ')})`;
  const d=purpose[name]; if(!d) throw new Error('Contrato sem descrição: '+name);
  md+=`| \`${signature.replaceAll('|','\\|')}\` | \`${d[0].replaceAll('|','\\|')}\` | ${d[1]} |\n`; count++;
 }
 md+='\n';
}
md+='## Responsabilidades dos callbacks HTTP e validação\n\nCadastro/login/Google/ativação/recuperação: backend/src/routes/auth.js. Organização/ingresso/convites/transferência: organizations.js. Comissão/equipe: commissions.js. Perfil/exclusão: users.js. Reuniões/presença/atas/PDF: meetings.js. Condições de cada callback constam nas fichas RF, com telas, parâmetros, pós-condição, respostas e limites. Não há uma operação Usuario.salvarNoAsyncStorage no domínio.\n\nExceções: wrappers API retornam Resultado/linha/null conforme tabela; fetchSystemInfo e authorizePdfDownload podem lançar. Middleware usa next(error) ou resposta HTTP. SQL não comprova biometria; confirmBiometric é proteção local. Observação de documentação: as funções não são polimorfismo/herança implementados; multiplicidades do domínio e herança dos atores UML representam papéis/relações de análise.\n';
fs.writeFileSync(path.join(root,'docs/dicionario-classes.md'),md);
console.log(`${models.length} modelos de dados e ${count} operações exportadas documentados.`);
