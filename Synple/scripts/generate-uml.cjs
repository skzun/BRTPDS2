const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname,'../..');
const dir = path.join(root,'docs/Diagramas');
const src = path.join(dir,'fontes'); fs.mkdirSync(src,{recursive:true});
const style = `@startuml
!pragma layout smetana
skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontName SansSerif
skinparam defaultFontSize 13
skinparam ArrowColor #334155
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
skinparam roundcorner 5
skinparam dpi 130
`;
const diagrams = {};
function usecases(name,title,actors,cases,links) {
 diagrams[name]=style+`left to right direction\ntitle ${title}\n`+actors+`\nrectangle "Synple" {\n`+cases.map(([id,label])=>`usecase "${id}\\n${label}" as ${id.replaceAll('.','_')}`).join('\n')+'\n}\n'+links+'\n@enduml\n';
}
usecases('uc-autenticacao','Casos de uso — contas, perfil e sessão',
`actor Visitante as V
actor "Usuário autenticado" as U
actor "Provedor Google" as G
actor "Servidor SMTP" as S
actor "Serviço biométrico do SO" as B`,
[['RF07','Cadastrar conta'],['RF21','Ativar conta / reenviar código'],['RF19','Entrar com e-mail e senha'],['RF20','Entrar com Google'],['RF11','Recuperar senha por código'],['RF10','Trocar senha'],['RF12','Alterar nome / telefone'],['RF13','Escolher tema'],['RF26','Reabrir sessão com biometria'],['RF18','Sair e limpar cache']],
`V -- RF07
V -- RF21
V -- RF19
V -- RF20
V -- RF11
V -- RF26
U -- RF10
U -- RF12
U -- RF13
U -- RF18
G -- RF20
S -- RF07
S -- RF21
S -- RF11
B -- RF26
B -- RF12`);
usecases('uc-organizacoes','Casos de uso — organizações e comissões',
`actor "Usuário autenticado" as U
actor "Proprietário da organização" as O
actor "Administrador do sistema" as A
U <|-- O
U <|-- A`,
[['RF01','Cadastrar organização'],['RF02','Decidir situação da organização'],['RF03','Listar / remover organizações'],['RF04','Criar comissão'],['RF05','Editar / inativar / excluir comissão'],['RF06','Gerenciar integrantes e coordenador'],['RF08','Solicitar / decidir ingresso'],['RF09','Alterar cargo / revogar vínculo'],['RF22','Transferir propriedade'],['RF23','Convidar conta existente'],['RF24','Aceitar / recusar convite'],['RF27','Excluir conta administrativamente'],['RF28','Alterar dados da organização']],
`U -- RF01
U -- RF08
U -- RF24
O -- RF04
O -- RF05
O -- RF06
O -- RF08
O -- RF09
O -- RF22
O -- RF23
A -- RF02
A -- RF03
A -- RF27
O -- RF28`);
usecases('uc-reunioes','Casos de uso — reuniões, presença e atas',
`actor "Usuário autenticado" as U
actor "Gestor da reunião\n(coordenador ou proprietário)" as M
actor "Convidado da reunião" as C
actor "Participante com entrada registrada" as P
U <|-- M
U <|-- C
C <|-- P`,
[['RF02.01','Agendar reunião'],['RF02.02','Convidar integrantes no agendamento'],['RF02.03','Responder convite'],['RF02.04','Registrar entrada'],['RF02.05','Registrar saída'],['RF02.06','Consultar / compartilhar presença'],['RF02.07','Criar / corrigir ata'],['RF02.08','Submeter ata'],['RF02.09','Aprovar / rejeitar versão'],['RF02.10','Gerar PDF da ata']],
`M -- RF02_01
M -- RF02_02
M -- RF02_06
M -- RF02_07
M -- RF02_08
M -- RF02_10
C -- RF02_03
C -- RF02_04
C -- RF02_06
C -- RF02_10
P -- RF02_05
P -- RF02_09
note bottom of RF02_02
Seleção feita no formulário de agendamento;
não existe envio avulso após criar a reunião.
end note
note bottom of RF02_09
Somente aprovadores fixados na submissão;
cargo de gestor não concede voto automático.
end note`);
usecases('uc-operacao','Casos de uso — consulta e operação',
`actor "Usuário autenticado" as U
actor "Administrador do sistema" as A
U <|-- A`,
[['RF14','Consultar disponibilidade e detalhes'],['RF15','Consultar contadores'],['RF16','Verificar disponibilidade atual'],['RF17','Consultar marcos de inicialização'],['RF25','Atualizar dados autorizados']],
`A -- RF14
A -- RF15
A -- RF16
A -- RF17
U -- RF25
note bottom of RF16
O aplicativo consulta serviços.
Reinício de processos é tarefa operacional
externa no Docker, não caso de uso implementado.
end note`);

diagrams['classes-cadastro']=style+`title Classes de domínio — cadastro (modelo de análise)
class Usuario {
 +id: UUID
 +name: String[120]
 +email: String[150]
 +phone: String[0..1]
 -passwordHash: String
 +systemRole: PapelSistema
 +theme: Tema
 +emailVerified: Boolean
}
class Organizacao {
 +id: UUID
 +name: String[150]
 +document: String[18]
 +status: String
}
class VinculoOrganizacao {
 +id: UUID
 +status: String
 +organizationRole: String
 +invitationAccepted: Boolean
}
class Comissao {
 +id: UUID
 +name: String[120]
 +type: String[50]
 +description: String[0..1]
 +status: String
}
class VinculoComissao {
 +role: PapelComissao
 +createdAt: DateTime
}
enum Tema { LIGHT; DARK }
enum PapelSistema { USER; SYSTEM_ADMIN }
enum PapelComissao { MEMBER; COORDINATOR }
Usuario "1" -- "0..*" Organizacao : proprietário
Usuario "1" -- "0..*" VinculoOrganizacao : destinatário
Usuario "0..1" -- "0..*" VinculoOrganizacao : autor do convite
Organizacao "1" -- "0..*" VinculoOrganizacao : recebe
Organizacao "1" -- "0..*" Comissao : contém
Comissao "1" -- "0..*" VinculoComissao
Usuario "1" -- "0..*" VinculoComissao
note bottom of VinculoComissao
Um vínculo por pessoa/comissão.
No máximo um COORDINATOR por índice;
mínimo de um mantido pelas rotas/migração.
end note
@enduml
`;
diagrams['classes-reunioes']=style+`title Classes de domínio — reuniões e atas (modelo de análise)
class Usuario { +id: UUID }
class Comissao { +id: UUID }
class Reuniao {
 +id: UUID
 +title: String[160]
 +startsAt: DateTime
 +endsAt: DateTime
 +agenda: String
}
class ConviteReuniao {
 +id: UUID
 +status: String
 +respondedAt: DateTime[0..1]
}
class Presenca {
 +id: UUID
 +enteredAt: DateTime[0..1]
 +leftAt: DateTime[0..1]
}
class Ata {
 +id: UUID
 +content: String
 +status: String
 +version: Integer
 +requiredApproverIds: UUID[*]
 +submittedAt: DateTime[0..1]
 +approvedAt: DateTime[0..1]
}
class DecisaoAta {
 +id: UUID
 +version: Integer
 +decision: String
 +comment: String[2000]
 +decidedAt: DateTime
}
Comissao "1" -- "0..*" Reuniao
Usuario "1" -- "0..*" Reuniao : autoria
Reuniao "1" -- "0..*" ConviteReuniao
Usuario "1" -- "0..*" ConviteReuniao
Reuniao "1" -- "0..*" Presenca
Usuario "1" -- "0..*" Presenca
Reuniao "1" -- "0..1" Ata
Ata "1" -- "0..*" DecisaoAta
Usuario "1" -- "0..*" DecisaoAta
Usuario "1" -- "0..*" Ata : autoria inicial
Usuario "1" -- "0..*" Ata : última alteração
note bottom of Ata
Conjunto de aprovadores congelado no envio.
Somente a versão atual é persistida.
Sem assinatura digital no PDF.
end note
@enduml
`;
diagrams['classes-servicos']=style+`title Classes de projeto — responsabilidades de módulos existentes
class ClienteAPI <<módulo JS>> {
 +loginWithApi(email: String, password: String): Promise<Resultado>
 +registerWithApi(dados: Cadastro): Promise<Resultado>
 +loginWithGoogleApi(idToken: String): Promise<Resultado>
 +updateUserWithApi(userId: UUID, payload: JSON): Promise<Resultado>
 +transferOrganizationOwnershipWithApi(orgId: UUID, atual: UUID, novo: UUID): Promise<Resultado>
 +authRequest(endpoint: String, payload: JSON, method: String): Promise<Resultado>
}
class Seguranca <<módulo CommonJS>> {
 +digest(value: String): String
 +issueSession(userId: UUID): Promise<String>
 +authenticate(req: Request, res: Response, next: Function): Promise<void>
 +bindActor(req: Request, res: Response, next: Function): void
 +rateLimit(limit: Integer, seconds: Integer): Middleware
 +scopeSnapshot(data: Snapshot, actor: Perfil): Snapshot
}
class Autorizacao <<módulo CommonJS>> {
 +authorize(req: Request, res: Response, next: Function): Promise<void>
}
class SessaoDispositivo <<módulo JS>> {
 +rememberSession(value: String): Promise<void>
 +restoreSession(): Promise<String|null>
 +clearSession(): Promise<void>
 +confirmBiometric(): Promise<Boolean>
}
class Cache <<módulo JS>> {
 +loadStoredData(): Promise<Snapshot|null>
 +saveData(data: Snapshot): Promise<void>
}
class Sanitizador <<módulo CommonJS>> {
 +removeCredentials(value: JSON): JSON
}
class RotasReuniao <<módulo CommonJS>> {
 +createMeetingsRouter(database: Database, options: JSON): Router
}
class GeradorPDF <<módulo CommonJS>> {
 +generateMeetingMinutesPdf(snapshot: JSON): Promise<Buffer>
}
ClienteAPI ..> SessaoDispositivo : recupera token
Autorizacao ..> Seguranca : usa identidade autenticada
Cache ..> Sanitizador : remove credenciais
RotasReuniao ..> GeradorPDF
SessaoDispositivo -[hidden]down-> Autorizacao
Seguranca -[hidden]down-> Cache
Sanitizador -[hidden]down-> RotasReuniao
note bottom of Seguranca
Os módulos são representados como classificadores
de projeto com operações reais; não são classes
JavaScript que o código não declara.
end note
@enduml
`;

// O relacional usa notação de entidades/tabelas; não é chamado de diagrama UML.
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/modelo-fisico.snapshot.json'),'utf8'));
const groups={
 'relacional-cadastro':['users','organizations','access_requests','commissions','commission_members'],
 'relacional-reunioes':['users','commissions','meetings','meeting_invitations','meeting_attendance','meeting_minutes','meeting_minutes_approvals'],
 'relacional-seguranca':['users','auth_sessions','auth_rate_limits','system_metadata','system_subsystems','download_tickets'],
};
for(const [name,group] of Object.entries(groups)) {
 let p=style+`title Modelo físico relacional — ${name.replace('relacional-','')}\nhide methods\n`;
 for(const table of group) {
  p+=`entity "${table}" as ${table} {\n`;
  for(const c of snapshot.columns.filter(c=>c.table_name===table)) {
   const constraintColumns=k=>(k.definition.match(/(?:PRIMARY|FOREIGN) KEY \(([^)]+)\)/)?.[1]||'').split(',').map(s=>s.trim());
   const pk=snapshot.constraints.some(k=>k.table_name===table&&k.kind==='p'&&constraintColumns(k).includes(c.column_name));
   const fk=snapshot.constraints.some(k=>k.table_name===table&&k.kind==='f'&&constraintColumns(k).includes(c.column_name));
   p+=`{field} ${c.not_null?'* ':''}${c.column_name}: ${c.type}${pk?' <<PK>>':''}${fk?' <<FK>>':''}\n`;
  }
  p+='}\n';
 }
 for(const k of snapshot.constraints.filter(k=>k.kind==='f'&&group.includes(k.table_name))) {
  const parent=k.definition.match(/REFERENCES ([\w]+)/)?.[1];
  const fkColumns=(k.definition.match(/FOREIGN KEY \(([^)]+)\)/)?.[1]||'').split(',').map(s=>s.trim());
  const nullable=fkColumns.some(name=>!snapshot.columns.find(c=>c.table_name===k.table_name&&c.column_name===name)?.not_null);
  const single=snapshot.constraints.some(c=>c.table_name===k.table_name&&c.kind==='u'&&c.definition===`UNIQUE (${fkColumns.join(', ')})`);
  if(group.includes(parent)) p+=`${parent} ${nullable?'|o':'||'}--${single?'o|':'o{'} ${k.table_name} : "${fkColumns.join(', ')}"\n`;
 }
 p+='legend bottom\n* = NOT NULL; PK/FK = chaves.\nUnicidades, CHECK, defaults e ações de exclusão:\nver dicionário físico, extraído do DDL.\nendlegend\n@enduml\n'; diagrams[name]=p;
}

const sequence = (name,title,body) => { diagrams[name]=style+`title ${title}\nautonumber\nactor Pessoa\nparticipant "App Synple" as App\nparticipant "API Express" as API\ndatabase PostgreSQL as DB\n`+body+'\n@enduml\n'; };
sequence('seq-cadastro','SQ01 — cadastro e ativação',`participant SMTP
Pessoa -> App : Preenche cadastro e toca Criar conta
App -> App : Valida nome, e-mail, telefone e confirmação
App -> API : POST /auth/register
API -> DB : Verifica duplicidade de e-mail
API -> API : Valida dados e gera código de seis dígitos
API -> SMTP : Envia código de ativação
alt envio aceito
 API -> DB : INSERT conta pendente com bcrypt e hash do código
 API --> App : 201 requiresActivation=true
 App --> Pessoa : Abre etapa Ativar conta
else SMTP indisponível
 API --> App : 503; conta não criada
end
Pessoa -> App : Informa código e toca Confirmar código
App -> API : POST /auth/verify-email
API -> DB : UPDATE condicionado a hash e prazo válidos
API --> App : 200 ou 400
App --> Pessoa : Solicita login após ativação`);
sequence('seq-login','SQ02 — senha ou Google e sessão',`participant Google
participant SecureStore
Pessoa -> App : Escolhe forma de entrada
alt e-mail e senha
 App -> API : POST /auth/login
 API -> DB : Consulta conta
 API -> API : bcrypt.compare e email_verified
else Google
 App -> Google : Solicita login no SDK nativo
 Google --> App : ID token
 App -> API : POST /auth/google com ID token
 API -> Google : Verifica assinatura / audience do token
 API -> DB : Vincula ou cria conta verificada
end
API -> API : Gera token aleatório
API -> DB : INSERT auth_sessions(hash, user_id, prazo)
API --> App : Perfil e token bruto
App -> SecureStore : Guarda token protegido, se biometria disponível
App -> API : GET /sync com Bearer token
API --> App : Dados autorizados
App --> Pessoa : Área autenticada`);
sequence('seq-comando','SQ03 — comando privado confirmado pelo servidor',`Pessoa -> App : Aciona comando no formulário
App -> App : Valida campos e solicita confirmação quando prevista
App -> API : Requisição com Bearer token
API -> DB : Verifica sessão e prazo
API -> API : Vincula ator e verifica permissão
alt permitido e dados válidos
 API -> DB : Escrita parametrizada
 note right of DB
 Transação/lock somente nos fluxos
 que efetivamente os implementam.
 end note
 API --> App : Confirmação ou dados alterados
 App -> API : GET /sync
 API --> App : Snapshot autorizado
else sessão / permissão / dados inválidos
 API --> App : 401 / 403 / 400 / 409
 App --> Pessoa : Exibe erro sem confirmar sucesso
end`);
sequence('seq-recuperacao','SQ04 — recuperação por código',`participant SMTP
Pessoa -> App : Esqueci minha senha; E-mail cadastrado
App -> API : POST /auth/forgot-password
API -> DB : Limita tentativas; consulta conta
alt conta existente e SMTP configurado
 API -> DB : Salva SHA-256 e prazo de 15 minutos
 API -> SMTP : Envia código
else conta inexistente
 note right of API : Mesma mensagem genérica de solicitação.
end
API --> App : Sucesso genérico ou erro SMTP
Pessoa -> App : Código, nova senha e confirmação
App -> API : POST /auth/reset-password
API -> DB : Confere hash e expiração
API -> API : Valida senha com pelo menos oito caracteres
API -> DB : UPDATE condicionado consome código
API -> DB : DELETE sessões da conta
API --> App : Sucesso ou código inválido/expirado
App --> Pessoa : Retorna ao login`);
sequence('seq-sincronizacao','SQ05 — sincronização e cache',`participant AsyncStorage
Pessoa -> App : Atualizar
App -> API : GET /sync com Bearer
API -> DB : Consulta coleções e system_metadata
API -> API : Filtra por papel, vínculo e histórico
API --> App : Snapshot autorizado
App -> App : Substitui snapshot e remove credenciais
App -> AsyncStorage : setItem(@synple:incremento-1, JSON)
alt indisponibilidade da API
 App --> Pessoa : Estado offline; não confirma novas escritas
end`);
sequence('seq-convite-org','SQ06 — convite para organização',`Pessoa -> App : Proprietário informa e-mail e envia convite
App -> API : POST /organizations/:id/invitations
API -> DB : Confere proprietário e conta verificada
API -> DB : INSERT vínculo PENDING, invited_by, accepted=false
API --> App : 201 ou conflito
Pessoa -> App : Destinatário atualiza e aceita/recusa
App -> API : PATCH /organizations/:id/invitations/:requestId
API -> DB : UPDATE somente vínculo do usuário da sessão
API --> App : APPROVED/aceito ou REJECTED/recusado`);
sequence('seq-transferencia','SQ07 — transferência da organização',`Pessoa -> App : Seleciona novo proprietário e confirma
App -> API : PATCH /organizations/:id/owner
API -> DB : Verifica sessão e dono atual
API -> DB : BEGIN; lock da organização
API -> DB : Confere novo proprietário com vínculo APPROVED
API -> DB : Mantém antigo proprietário como membro
API -> DB : Atualiza owner_id; COMMIT
API --> App : Organização atualizada
App -> API : GET /sync
API --> App : Permissões e vínculos atuais`);
sequence('seq-agendamento','SQ08 — agendamento e convidados',`Pessoa -> App : Gestor preenche título, datas, pauta e integrantes
App -> API : POST /meetings
API -> DB : BEGIN; confere gestor e lock da comissão
API -> API : Valida período e convidados
API -> DB : INSERT reunião e convites deduplicados
API -> DB : Inclui organizador como ACCEPTED; COMMIT
API --> App : 201 reunião
Pessoa -> App : Convidado aceita/recusa
App -> API : PATCH /meetings/:id/invitation
API -> DB : Confere destinatário e atualiza convite
API --> App : Convite atualizado`);
sequence('seq-presenca','SQ09 — entrada e saída',`Pessoa -> App : Registrar entrada ou Registrar saída
App -> API : PATCH /meetings/:id/attendance
API -> DB : BEGIN; lock da reunião
API -> DB : Verifica convite, presença e situação da ata
alt entrada permitida
 API -> DB : Registra entered_at pelo relógio do servidor
else saída permitida
 API -> DB : Registra left_at pelo relógio do servidor
else operação inválida
 API -> DB : ROLLBACK
 API --> App : 403/409
end
API -> DB : COMMIT se operação válida
API --> App : Presença atualizada`);
sequence('seq-ata','SQ10 — ata, versão e unanimidade',`Pessoa -> App : Gestor salva texto da ata
App -> API : POST /meetings/:id/minutes
API -> DB : Valida gestor; salva rascunho / nova versão
Pessoa -> App : Gestor submete ata
App -> API : POST /meetings/:id/minutes/submit
API -> DB : BEGIN; lock da reunião/ata e presentes
API -> DB : Fixa required_approver_ids; IN_REVIEW; COMMIT
Pessoa -> App : Aprovador decide sobre versão lida
App -> API : PATCH /meetings/:id/minutes/approval
API -> DB : BEGIN; lock; confere ator, versão e conjunto
API -> DB : Salva decisão atual
alt rejeição
 API -> DB : Situação REJECTED
else unanimidade
 API -> DB : Situação APPROVED e approved_at
else decisões pendentes
 API -> DB : Mantém IN_REVIEW
end
API -> DB : COMMIT
API --> App : Ata e decisões atuais`);
sequence('seq-pdf','SQ11 — exportação autenticada',`participant Navegador
Pessoa -> App : Gerar ata em PDF
App -> API : HEAD /meetings/:id/minutes/pdf com Bearer
API -> DB : Verifica acesso, versão e ata salva
API --> App : application/pdf ou erro
App -> API : POST /auth/download-ticket com caminho
API -> DB : INSERT ticket ligado à sessão por 60 segundos
API --> App : Ticket
App -> Navegador : Abre URL com ticket, versão e fuso
Navegador -> API : GET PDF
API -> DB : Verifica ticket, sessão, acesso e versão
API -> API : Gera PDF em memória
API --> Navegador : PDF ou erro; não modifica ata`);
sequence('seq-biometria','SQ12 — sessão protegida e perfil',`participant "Biometria / SecureStore" as Bio
Pessoa -> App : Reabre app após login anterior
App -> Bio : Solicita token protegido
Bio --> Pessoa : Solicita autenticação
Pessoa --> Bio : Autoriza ou cancela
Bio --> App : Token ou ausência
App -> API : GET /auth/me com Bearer, quando disponível
API -> DB : Confere validade da sessão
API --> App : Perfil ou 401
Pessoa -> App : Altera nome/telefone e toca Salvar dados
App -> Bio : confirmBiometric()
alt biometria forte autorizada
 App -> API : PUT /users/:id com Bearer
 API -> DB : Atualiza próprio perfil
 API --> App : Perfil atualizado
else indisponível ou cancelada
 App --> Pessoa : Alteração não enviada
end
note right of API
Biometria é proteção local;
a API verifica sessão, não recebe prova biométrica.
end note`);
sequence('seq-sistema','SQ13 — informação administrativa e saída',`Pessoa -> App : Administrador abre Sistema / Verificar
App -> API : GET /system com Bearer
API -> DB : SELECT NOW(), version(), system_metadata
API --> App : Uptime, versões, latência e datas
App --> Pessoa : Exibe resultado real ou falha da consulta
Pessoa -> App : Limpar cache e sair; confirma
App -> API : POST /auth/logout
API -> DB : Remove sessão atual
App -> App : Apaga token e substitui cache por dados vazios
note right of App
Não reinicia processos e
não restaura/apaga dados do banco.
end note`);

diagrams['implantacao']=style+`title Implantação implementada — desenvolvimento
node "Celular Android/iOS" {
 artifact "Synple development build\nExpo 57 / React Native" as APP
 artifact "SecureStore + biometria" as BIO
 artifact "AsyncStorage sanitizado" as CACHE
}
node "Computador de desenvolvimento" {
 artifact "Metro / Expo CLI\nporta 8081" as METRO
 artifact "cloudflared" as CF
 node "Docker Compose" {
  artifact "API Express / Node 22\nporta 3001" as API
  database "PostgreSQL 16\nvolume persistente" as PG
 }
}
cloud "Túnel Expo" as ET
cloud "Quick Tunnel Cloudflare" as CT
cloud "Google OAuth" as GOOGLE
cloud "SMTP configurado" as SMTP
APP -- BIO
APP -- CACHE
APP --> ET : bundle de desenvolvimento
ET --> METRO
APP --> CT : HTTPS / API e Bearer
CT --> CF
CF --> API : HTTP local
API --> PG : rede interna Docker
APP --> GOOGLE : login nativo
API --> GOOGLE : valida ID token
API --> SMTP : códigos por e-mail
note bottom of API
LAN pode usar HTTP durante desenvolvimento.
Produção exige HTTPS e URL estável;
o quick tunnel não é hospedagem permanente.
end note
@enduml
`;

for(const [name,raw] of Object.entries(diagrams)) {
 const text = raw.replace(/"[^"]*"/g, m => m.replace(/\n/g, '\\n'))
   .replace(/class (\w+) \{ ([^{}\n]+) \}/g, 'class $1 {\n $2\n}')
   .replace(/enum (\w+) \{ ([^{}\n]+) \}/g, (_,name,values) => `enum ${name} {\n ${values.split(';').map(s=>s.trim()).join('\n ')}\n}`)
   .replace(/: String\[(\d+)\]/g, ': String {maxLength=$1}');
 fs.writeFileSync(path.join(src,name+'.puml'),text);
}
let md='# Diagramas do Synple — revisão de 30/10/2026\n\nNotação UML para casos de uso, classes, sequências e implantação. O modelo físico é relacional, com entidades/tabelas, e não é apresentado como UML. Fontes PlantUML versionadas em `fontes/`; SVGs renderizados localmente em `renderizados/`. Não dependem de servidor externo para abrir.\n\nAtores estão fora da fronteira Synple. As associações ator/caso de uso são linhas; especializações usam triângulo vazio voltado ao ator geral. Autenticação é pré-condição de operações privadas; não foi inserido `include` de login em todos os casos. Os papéis de proprietário/coordenador são contextuais. Campos que não aparecem nos recortes de classes constam no dicionário físico completo.\n\n[Especificação principal](../incremento-1-especificacao-completa.md) · [Dicionário físico](../dicionario-banco-dados.md) · [Dicionário de classes e operações](../dicionario-classes.md).\n\n';
for(const name of Object.keys(diagrams)) {
 md+=`## ${name}\n\n![${name}](renderizados/${name}.svg)\n\n[Fonte editável](fontes/${name}.puml) · [SVG](renderizados/${name}.svg)\n\n`;
}
md+='## Reprodução\n\nGerar fontes: `node Synple/scripts/generate-uml.cjs` após gerar o snapshot do DDL. Renderizar com Java e o PlantUML oficial: `java -jar plantuml.jar -tsvg -o ../renderizados docs/Diagramas/fontes/*.puml`. O JAR não é dependência do app nem foi incluído no repositório. Referências: [UML 2.5.1 — OMG](https://www.omg.org/spec/UML/2.5.1/About-UML), [casos de uso PlantUML](https://plantuml.com/use-case-diagram), [classes PlantUML](https://plantuml.com/class-diagram). Renderização sem erro comprova sintaxe; a conferência de atores, multiplicidades e comportamento exige confrontar o modelo com o código.\n';
fs.writeFileSync(path.join(dir,'Diagramas_Casos_de_Uso.md'),md);
console.log(`${Object.keys(diagrams).length} fontes PlantUML geradas.`);
