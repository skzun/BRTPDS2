# Dicionário de classes, atributos e operações — Synple

Revisão: 13/11/2026. O código usa objetos JSON, funções, hooks e módulos Express, não classes JavaScript de entidade/ORM. O modelo UML de análise representa os conceitos; o modelo de projeto usa o estereótipo local «módulo JS/CommonJS» para expor operações existentes. Não implica construtores ou métodos de instância inexistentes.

## Tipos de contrato

- UUID: string no JSON, uuid no PostgreSQL. DateTime: instante ISO/Date no código, TIMESTAMPTZ no banco.
- Perfil: {id,name,email,phone,systemRole,theme}, sem password_hash. Sessão é separada; código Google pode incluir isNewUser.
- Resultado<T>: convenção documental de {success:true,...T} ou {success:false,error?:String}; não é tipo TypeScript declarado. Funções que retornam linha/null diretamente estão identificadas na tabela.
- Snapshot: users, organizations, accessRequests, commissions, commissionMembers, meetings, meetingInvitations, meetingAttendance, meetingMinutes, meetingMinutesApprovals e system. O hook pode acrescentar campos locais; não é linha de uma única tabela.
- Request/Response/NextFunction e Router: objetos Express. Middleware: função (req,res,next) que pode devolver Promise<void>.
- Campos privados no desenho marcam sensibilidade conceitual; JavaScript não declara esses campos com #private.

## Classes de domínio e atributos

| Classe/modelo | Persistência | Responsabilidade |
| --- | --- | --- |
| Votacao | [meeting_votes](dicionario-banco-dados.md#tabela-meeting_votes) | Pergunta e apuração independente da ata. |
| OpcaoVotacao | [meeting_vote_options](dicionario-banco-dados.md#tabela-meeting_vote_options) | Alternativa ordenada. |
| Voto | [meeting_vote_ballots](dicionario-banco-dados.md#tabela-meeting_vote_ballots) | Escolha única de um participante. |
| CodigoPresenca | [meeting_attendance_codes](dicionario-banco-dados.md#tabela-meeting_attendance_codes) | Desafio temporário com hash e validade. |
| AnexoReuniao | [meeting_attachments](dicionario-banco-dados.md#tabela-meeting_attachments) | Arquivo privado com tamanho e conteúdo. |
| Usuario | [users](dicionario-banco-dados.md#tabela-users) | Conta e preferência da pessoa. Não possui método de instância login no código. |
| Organizacao | [organizations](dicionario-banco-dados.md#tabela-organizations) | Organização e proprietário contextual, que pode ser transferido. |
| VinculoOrganizacao | [access_requests](dicionario-banco-dados.md#tabela-access_requests) | Solicitação ou convite e sua decisão; não confundir com sessão nem comissão. |
| Comissao | [commissions](dicionario-banco-dados.md#tabela-commissions) | Comissão/grupo de uma organização. |
| VinculoComissao | [commission_members](dicionario-banco-dados.md#tabela-commission_members) | Associação pessoa/comissão e cargo. |
| Reuniao | [meetings](dicionario-banco-dados.md#tabela-meetings) | Agendamento, período, pauta e autoria. |
| ConviteReuniao | [meeting_invitations](dicionario-banco-dados.md#tabela-meeting_invitations) | Convite individual; aceite não equivale a presença. |
| Presenca | [meeting_attendance](dicionario-banco-dados.md#tabela-meeting_attendance) | Primeira entrada e saída por participante. |
| Ata | [meeting_minutes](dicionario-banco-dados.md#tabela-meeting_minutes) | Conteúdo/versão atual e conjunto de aprovadores congelado. |
| DecisaoAta | [meeting_minutes_approvals](dicionario-banco-dados.md#tabela-meeting_minutes_approvals) | Decisão atual da pessoa sobre uma versão. |
| SessaoServidor | [auth_sessions](dicionario-banco-dados.md#tabela-auth_sessions) | Modelo técnico de credencial opaca; não devolve token_hash ao usuário. |
| LimiteTentativas | [auth_rate_limits](dicionario-banco-dados.md#tabela-auth_rate_limits) | Modelo técnico do contador por janela/rota/IP/conta. |
| MarcoInstalacao | [system_metadata](dicionario-banco-dados.md#tabela-system_metadata) | Marco persistido da instalação. |
| SubsistemaLegado | [system_subsystems](dicionario-banco-dados.md#tabela-system_subsystems) | Modelo técnico legado; não é monitor real de serviço. |
| TicketDownload | [download_tickets](dicionario-banco-dados.md#tabela-download_tickets) | Modelo técnico de download restrito à sessão/rota/prazo. |

### Votacao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| question | `question` | character varying(500) / 1 |
| status | `status` | character varying(10) / 1 |
| createdBy | `created_by` | uuid / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| closedAt | `closed_at` | timestamp with time zone / 0..1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### OpcaoVotacao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| voteId | `vote_id` | uuid / 1 |
| label | `label` | character varying(160) / 1 |
| position | `position` | smallint / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Voto

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| voteId | `vote_id` | uuid / 1 |
| optionId | `option_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| castAt | `cast_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### CodigoPresenca

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| meetingId | `meeting_id` | uuid / 1 |
| codeHash | `code_hash` | text / 1 |
| expiresAt | `expires_at` | timestamp with time zone / 1 |
| createdBy | `created_by` | uuid / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### AnexoReuniao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| name | `name` | character varying(160) / 1 |
| mimeType | `mime_type` | character varying(100) / 1 |
| content | `content` | bytea / 1 |
| createdBy | `created_by` | uuid / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Usuario

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| name | `name` | character varying(120) / 1 |
| email | `email` | character varying(150) / 1 |
| phone | `phone` | character varying(20) / 0..1 |
| passwordHash | `password_hash` | character varying(255) / 1 |
| googleId | `google_id` | character varying(255) / 0..1 |
| systemRole | `system_role` | character varying(30) / 1 |
| theme | `theme` | character varying(10) / 1 |
| resetToken | `reset_token` | character varying(255) / 0..1 |
| resetTokenExpires | `reset_token_expires` | timestamp with time zone / 0..1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |
| emailVerified | `email_verified` | boolean / 1 |
| activationHash | `activation_hash` | text / 0..1 |
| activationExpires | `activation_expires` | timestamp with time zone / 0..1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Organizacao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| name | `name` | character varying(150) / 1 |
| document | `document` | character varying(18) / 1 |
| ownerId | `owner_id` | uuid / 1 |
| status | `status` | character varying(20) / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### VinculoOrganizacao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| organizationId | `organization_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| status | `status` | character varying(20) / 1 |
| organizationRole | `organization_role` | character varying(30) / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |
| invitedBy | `invited_by` | uuid / 0..1 |
| invitationAccepted | `invitation_accepted` | boolean / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Comissao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| organizationId | `organization_id` | uuid / 1 |
| name | `name` | character varying(120) / 1 |
| type | `type` | character varying(50) / 1 |
| description | `description` | text / 0..1 |
| status | `status` | character varying(20) / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### VinculoComissao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| commissionId | `commission_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| role | `role` | character varying(20) / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Reuniao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| commissionId | `commission_id` | uuid / 1 |
| title | `title` | character varying(160) / 1 |
| startsAt | `starts_at` | timestamp with time zone / 1 |
| endsAt | `ends_at` | timestamp with time zone / 1 |
| agenda | `agenda` | text / 1 |
| createdBy | `created_by` | uuid / 1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |
| allDay | `all_day` | boolean / 1 |
| location | `location` | character varying(300) / 1 |
| details | `details` | character varying(4000) / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### ConviteReuniao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| status | `status` | character varying(20) / 1 |
| respondedAt | `responded_at` | timestamp with time zone / 0..1 |
| createdAt | `created_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Presenca

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| enteredAt | `entered_at` | timestamp with time zone / 0..1 |
| leftAt | `left_at` | timestamp with time zone / 0..1 |
| recordedBy | `recorded_by` | uuid / 0..1 |
| method | `method` | character varying(20) / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### Ata

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| content | `content` | text / 1 |
| status | `status` | character varying(20) / 1 |
| version | `version` | integer / 1 |
| requiredApproverIds | `required_approver_ids` | uuid[] / 1 |
| createdBy | `created_by` | uuid / 1 |
| updatedBy | `updated_by` | uuid / 1 |
| submittedAt | `submitted_at` | timestamp with time zone / 0..1 |
| approvedAt | `approved_at` | timestamp with time zone / 0..1 |
| createdAt | `created_at` | timestamp with time zone / 1 |
| updatedAt | `updated_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### DecisaoAta

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | uuid / 1 |
| minutesId | `minutes_id` | uuid / 1 |
| meetingId | `meeting_id` | uuid / 1 |
| userId | `user_id` | uuid / 1 |
| version | `version` | integer / 1 |
| decision | `decision` | character varying(20) / 1 |
| comment | `comment` | character varying(2000) / 1 |
| decidedAt | `decided_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### SessaoServidor

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| tokenHash | `token_hash` | text / 1 |
| userId | `user_id` | uuid / 1 |
| expiresAt | `expires_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### LimiteTentativas

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| key | `key` | text / 1 |
| attempts | `attempts` | integer / 1 |
| expiresAt | `expires_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### MarcoInstalacao

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | boolean / 1 |
| initializedAt | `initialized_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### SubsistemaLegado

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| id | `id` | character varying(50) / 1 |
| name | `name` | character varying(100) / 1 |
| status | `status` | character varying(20) / 1 |
| lastCheck | `last_check` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

### TicketDownload

| Atributo conceitual | Coluna | Tipo / cardinalidade do valor |
| --- | --- | --- |
| tokenHash | `token_hash` | text / 1 |
| sessionHash | `session_hash` | text / 1 |
| path | `path` | text / 1 |
| expiresAt | `expires_at` | timestamp with time zone / 1 |

Semântica, nulabilidade, default, domínio e restrições detalhados na tabela física correspondente. Os aliases JSON reais não são derivados automaticamente desse camelCase: o backend usa, por exemplo, systemRole; campos sensíveis não são enviados ao mobile.

## Classes de projeto do Incremento 3

Correspondem ao [diagrama de classes do Incremento 3](Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg), feito a partir do código (revisão de 13/11/2026). Componentes React são funções com estado (`useState`/`useRef`): os atributos abaixo são esse estado; os métodos são as funções internas chamadas pela interface. Módulos são arquivos que exportam funções. `RequestError` é a única classe JavaScript declarada com `class`.

### MeetingCard «component»

Fonte: [MeetingsScreen.js](../Synple/mobile/src/screens/MeetingsScreen.js), função `MeetingCard`.

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| `content` | String | Texto da ata em edição no formulário. |
| `dirty` | Boolean | Indica texto alterado e ainda não salvo; bloqueia envio, decisão e PDF. |
| `comment` | String | Comentário opcional da decisão sobre a ata. |
| `pending` | String | Nome da operação em andamento (`save`, `submit`, `vote`, `openVote`, `pdf`…); desabilita botões. |
| `voteQuestion` | String | Pergunta da votação a abrir (até 500 caracteres). |
| `voteOptionsText` | String | Opções da votação, uma por linha. |
| `section` | String | Aba aberta no cartão: `presence`, `resources`, `votes` ou `minutes`. |
| `inFlight` | Ref<Boolean> | Impede duas operações simultâneas no mesmo cartão. |

| Método | Retorno | Responsabilidade |
| --- | --- | --- |
| `saveMinutes()` | `Promise<void>` | Valida texto não vazio e chama `onSaveMinutes` (App.saveMeetingMinutes). |
| `confirmSubmission()` | `void` | Pede confirmação e chama `onSubmitMinutes` (App.submitMeetingMinutes). |
| `confirmDecision(decision)` | `void` | Pede confirmação e chama `onApproveMinutes` com decisão, comentário e versão lida. |
| `openVote()` | `Promise<void>` | Separa as opções por linha, exige pergunta e 2+ opções e chama `onCreateVote`. |
| `exportMinutesPdf()` | `Promise<void>` | Usa `prepareMinutesPdf` e `authorizePdfDownload` e abre o PDF. |
| `perform(action, callback)` | `Promise<Boolean>` | Executa a operação marcando `pending`/`inFlight` e trata falha de conexão. |

### MeetingsScreen «component»

Fonte: [MeetingsScreen.js](../Synple/mobile/src/screens/MeetingsScreen.js). Atributos: `selectedCommissionId: UUID` (comissão do agendamento) e `creating: Boolean` (formulário aberto). Método: `MeetingsScreen(props): JSX.Element`, que lista um `MeetingCard` por reunião (composição 1 para 0..*).

### MeetingParticipationScreen «component»

Fonte: [MeetingParticipationScreen.js](../Synple/mobile/src/screens/MeetingParticipationScreen.js). Atributos: `meetings: ParticipationRow[]` (linhas do relatório), `loading: Boolean`, `error: String`. Método: `refresh(): Promise<void>`, que chama `fetchMeetingParticipationReportWithApi()` e atualiza a lista.

### ManualScreen «component»

Fonte: [ManualScreen.js](../Synple/mobile/src/screens/ManualScreen.js). Atributo: `TOPICS: String[][]` (pares título/conteúdo do manual). Método: `ManualScreen(): JSX.Element`, que desenha um cartão por tópico sem acessar a API.

### App «component»

Fonte: [App.js](../Synple/mobile/App.js). Atributos usados no incremento: `data: Snapshot` e `activeUserId: UUID`.

| Método | Retorno | Responsabilidade |
| --- | --- | --- |
| `saveMeetingMinutes(meetingId, content)` | `Promise<Boolean>` | Chama `saveMeetingMinutesWithApi` e guarda a ata devolvida. |
| `submitMeetingMinutes(meetingId)` | `Promise<Boolean>` | Chama `submitMeetingMinutesWithApi` e guarda a ata Em aprovação. |
| `approveMeetingMinutes(meetingId, decision, comment, version)` | `Promise<Boolean>` | Chama `approveMeetingMinutesWithApi` e atualiza ata e decisões. |
| `createMeetingVote(meetingId, question, options)` | `Promise<Boolean>` | Chama `createMeetingVoteWithApi` e sincroniza. |
| `castMeetingVote(meetingId, voteId, optionId)` | `Promise<Boolean>` | Chama `castMeetingVoteWithApi` e sincroniza. |
| `closeMeetingVote(meetingId, voteId)` | `Promise<Boolean>` | Chama `closeMeetingVoteWithApi` e sincroniza. |
| `storeMeetingMinutes(minutes)` | `void` | Substitui a ata da reunião no estado local. |

### ApiClient «module»

Fonte: [api.js](../Synple/mobile/src/services/api.js). Funções do incremento: `saveMeetingMinutesWithApi`, `submitMeetingMinutesWithApi`, `approveMeetingMinutesWithApi`, `createMeetingVoteWithApi`, `castMeetingVoteWithApi`, `closeMeetingVoteWithApi`, `fetchMeetingParticipationReportWithApi` e `authorizePdfDownload`. Todas enviam o token Bearer da sessão e devolvem `Result` (`{success:true,...}` ou `{success:false,error}`); `authorizePdfDownload` devolve a URL com o ticket. Detalhes de cada assinatura em [ClienteAPI](#clienteapi).

### MeetingRules «module»

Fonte: [meetings.js](../Synple/mobile/src/services/meetings.js).

| Operação | Retorno | Responsabilidade |
| --- | --- | --- |
| `getMinutesVotingSummary(minutes, attendees, approvals)` | `VotingSummary` | Conta aprovadores exigidos, aprovações e reprovações da versão atual da ata. |
| `canManageMeetingCommission(data, commissionId, userId)` | `Boolean` | Indica se o usuário é coordenador da comissão ou proprietário da organização. |
| `getMeetingAttendanceRows(data, meetingId)` | `Row[]` | Monta as linhas de convidados e presença da reunião. |

### MinutesPdfClient «module»

Fonte: [meetingMinutesPdf.js](../Synple/mobile/src/services/meetingMinutesPdf.js).

| Operação | Retorno | Responsabilidade |
| --- | --- | --- |
| `buildMinutesPdfUrl(apiBaseUrl, {meetingId, userId, version, timeZone})` | `String` | Monta a URL do PDF; recusa base inválida ou versão menor que 1. |
| `prepareMinutesPdf(options)` | `Promise<String>` | Faz HEAD na rota do PDF para conferir acesso e versão antes de abrir. |
| `minutesPdfError(status, code)` | `String` | Traduz 403/404/409 em mensagem para o usuário. |

### MeetingsRouter «module»

Fonte: [meetings.js](../Synple/backend/src/routes/meetings.js). Além de `createMeetingsRouter` (ver [RotasReuniao](#rotasreuniao)):

| Operação | Retorno | Responsabilidade |
| --- | --- | --- |
| `getMeeting(client, meetingId, userId)` | `Promise<Meeting>` | Lê a reunião com `FOR UPDATE` e calcula `canManage`; 404 se não existir. |
| `requireManager(meeting)` | `void` | Lança `RequestError(403)` se o usuário não for presidente nem proprietário. |
| `resolveUserId(client, identifier)` | `Promise<UUID\|null>` | Converte o identificador recebido no UUID da conta. |
| `transaction(handler, fallback)` | `Middleware` | Executa o handler entre BEGIN/COMMIT, com ROLLBACK e resposta de erro. |
| `POST /:meetingId/minutes`, `POST /:meetingId/minutes/submit`, `PATCH /:meetingId/minutes/approval`, `GET\|HEAD /:meetingId/minutes/pdf` | HTTP | Ata: salvar, enviar, decidir e gerar PDF (RF02.07–RF02.10). |
| `POST /:meetingId/votes`, `POST /:meetingId/votes/:voteId/ballot`, `PATCH /:meetingId/votes/:voteId/close` | HTTP | Votação: abrir, votar e encerrar (RF03.01–RF03.03). |
| `GET /participation/report` | HTTP | Relatório individual pela sessão (RF03.04). |

### RequestError

Fonte: [meetings.js](../Synple/backend/src/routes/meetings.js). Classe que estende `Error`.

| Membro | Tipo | Descrição |
| --- | --- | --- |
| `status` | Integer | Código HTTP devolvido (400, 403, 404, 409). |
| `message` | String | Mensagem em português enviada ao app. |
| `fields` | Object | Opcional: erros por campo do formulário de reunião. |
| `RequestError(status, message)` | construtor | Cria o erro com código e mensagem. |

### Security «module» e MinutesPdfGenerator «module»

[security.js](../Synple/backend/src/services/security.js): `authenticate(req, res, next)` valida o Bearer ou o ticket de download; `bindActor(req, res, next)` força `userId` igual à sessão; `scopeSnapshot(data, actor)` filtra a sincronização. Detalhes em [Seguranca](#seguranca). [meetingMinutesPdf.js](../Synple/backend/src/services/meetingMinutesPdf.js): `generateMeetingMinutesPdf(snapshot): Promise<Buffer>` gera o PDF da ata em memória.

## Operações de projeto com implementação correspondente

As assinaturas abaixo são extraídas dos exports atuais. Os parâmetros entre chaves são objetos desestruturados. Tipos/efeitos descrevem o contrato observado; não são anotações de tipo presentes no JavaScript. Operações HTTP sem função nomeada são callbacks das rotas e estão especificadas pelas fichas RF e pelo contrato, em vez de serem inventadas como métodos de entidade.

### PresencaPDF

Fonte: [Synple/backend/src/services/attendancePdf.js](../Synple/backend/src/services/attendancePdf.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `generateAttendancePdf({ meeting, attendance })` | `Promise<Buffer>` | Gera PDF Unicode de convidados, presença e horários sem exigir uma ata. |

### ClienteAPI

Fonte: [Synple/mobile/src/services/api.js](../Synple/mobile/src/services/api.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `getApiBaseUrl()` | `String` | Resolve configuração explícita/ambiente da API; não envia requisição. |
| `checkBackendHealth()` | `Promise<{online:Boolean,database?:String,dbName?:String,latencyMs?:Number,error?:String}>` | Consulta saúde pública; não altera dados. Nome/latência podem estar ausentes na resposta mínima atual de /health. |
| `fetchRemoteData()` | `Promise<Snapshot\|null>` | Busca snapshot autorizado; falha devolve null. |
| `loginWithApi(email, password)` | `Promise<Resultado<{user:Perfil}>>` | Envia senha ao servidor; em sucesso separa token e guarda sessão em memória/SecureStore. |
| `loginWithGoogleApi(idToken)` | `Promise<Resultado<{user:Perfil}>>` | Envia ID token Google para validação; guarda a sessão Synple resultante. |
| `registerWithApi({ name, email, phone, password })` | `Promise<Resultado<{requiresActivation:Boolean,email:String}>>` | Cria conta pendente; não cria usuário local nem sessão. |
| `requestAccessWithApi(organizationId, userId)` | `Promise<VinculoOrganizacao\|null>` | Solicita ingresso; devolve vínculo retornado pela API ou null. |
| `updateUserWithApi(userId, payload)` | `Promise<Resultado<{user:Perfil}>>` | Atualiza o próprio perfil/tema e devolve perfil confirmado. |
| `changePasswordWithApi(userId, currentPassword, nextPassword)` | `Promise<Resultado>` | Troca senha no servidor; a API revoga sessões. |
| `requestPasswordResetWithApi(email)` | `Promise<Resultado<{message:String}>>` | Solicita código por e-mail; timeout de 45 segundos. |
| `resetPasswordWithApi({ email, code, newPassword })` | `Promise<Resultado<{message:String}>>` | Consome código e pede nova senha ao servidor; não muda senha Google. |
| `deleteUserWithApi(userIdOrEmail)` | `Promise<Resultado<{deleted?:JSON}>>` | Pede exclusão administrativa; erro não confirma remoção local. |
| `deleteOrganizationWithApi(organizationId)` | `Promise<Resultado>` | Pede exclusão de organização; FKs reais podem produzir cascata/impedimento. |
| `updateOrganizationStatusWithApi(organizationId, status)` | `Promise<Organizacao\|{success:false}>` | Retorna organização atualizada diretamente, ou objeto de falha. Não usa envelope success=true no sucesso. |
| `transferOrganizationOwnershipWithApi(organizationId, currentOwnerId, newOwnerId)` | `Promise<Resultado<{organization:Organizacao}>>` | Transfere propriedade; parâmetro do dono atual é substituído pela sessão na API. |
| `updateOrganizationWithApi(organizationId, { name, document, ownerId })` | `Promise<Resultado<{organization:Organizacao}>>` | Atualiza nome/CNPJ da organização como proprietário. |
| `addCommissionMemberWithApi(commissionId, actorId, userId, role)` | `Promise<Resultado<{member:JSON}>>` | Inclui pessoa elegível no vínculo da comissão. |
| `updateCommissionMemberRoleWithApi(commissionId, actorId, userId, role)` | `Promise<Resultado<{member:JSON}>>` | Transfere coordenação ou altera papel respeitando mínimo de um. |
| `removeCommissionMemberWithApi(commissionId, actorId, userId)` | `Promise<Resultado<{member:null}>>` | Remove vínculo atual sem apagar convites/presença históricos da reunião. |
| `scheduleMeetingWithApi(meeting)` | `Promise<Resultado<{meeting:JSON}>>` | Cria reunião e convites atomicamente. |
| `meetingRequest(path, method = 'GET', payload)` | `Promise<Resultado<JSON>>` | Executa consulta ou escrita autenticada de reuniões, anexos e presença; retorna dados, erros por campo e falhas de conexão. |
| `respondToMeetingInvitationWithApi(meetingId, userId, status)` | `Promise<Resultado<{invitation:JSON}>>` | Responde convite da própria sessão. |
| `recordMeetingAttendanceWithApi(meetingId, userId, action)` | `Promise<Resultado<{attendance:JSON}>>` | Registra entrada/saída pelo servidor. |
| `fetchMeetingAttendanceWithApi(meetingId, userId)` | `Promise<Resultado<{attendance:JSON}>>` | Consulta presença para gerar lista compartilhável. |
| `saveMeetingMinutesWithApi(meetingId, userId, content)` | `Promise<Resultado<{minutes:JSON}>>` | Salva rascunho/correção; erro não confirma persistência. |
| `submitMeetingMinutesWithApi(meetingId, userId)` | `Promise<Resultado>` | Submete ata; mantém os dados devolvidos pelo endpoint no envelope da API cliente. |
| `approveMeetingMinutesWithApi(meetingId, userId, decision, comment = '', version)` | `Promise<Resultado>` | Envia decisão, comentário e versão lida. |
| `createMeetingVoteWithApi(meetingId, userId, question, options)` | `Promise<Resultado<JSON>>` | Abre votação independente da ata. |
| `castMeetingVoteWithApi(meetingId, voteId, userId, optionId)` | `Promise<Resultado<JSON>>` | Registra ou altera opção do participante presente. |
| `closeMeetingVoteWithApi(meetingId, voteId, userId)` | `Promise<Resultado<JSON>>` | Encerra votação como gestor. |
| `fetchMeetingParticipationReportWithApi()` | `Promise<Resultado<JSON>>` | Consulta somente presenças da sessão autenticada. |
| `updateAccessRequestStatusWithApi(requestId, status, role)` | `Promise<VinculoOrganizacao\|{success:false}>` | Atualiza situação/cargo; sucesso retorna linha diretamente. |
| `createOrganizationWithApi({ name, document, ownerId, status = 'PENDING' })` | `Promise<Resultado<{organization:Organizacao}>>` | Cria organização PENDING, com dono obtido da sessão. |
| `createCommissionWithApi({ organizationId, name, type, description, memberIds = [] })` | `Promise<Resultado<{commission:Comissao}>>` | Cria comissão com equipe; erro não equivale a cadastro offline. |
| `syncPendingData()` | `Promise<void>` | Função compatível legada sem sincronização de escritas; não transmite cadastro offline. |
| `authRequest(endpoint, payload, method = 'POST')` | `Promise<Resultado>` | Executa endpoint de autenticação, retorna success e os campos JSON da resposta. |
| `fetchSystemInfo()` | `Promise<JSON>` | Consulta detalhes administrativos; lança erro se consulta falha. |
| `organizationInvitation(organizationId, payload, requestId)` | `Promise<Resultado>` | Cria convite por e-mail ou responde convite pelo requestId. |
| `authenticatedFetch(url, options = {})` | `Promise<Response>` | Wrapper HTTP com Bearer da memória e timeout. |
| `authorizePdfDownload(url)` | `Promise<String>` | Obtém ticket da rota e retorna URL curta para navegador. |
| `commissionRequest(id, method, payload)` | `Promise<Resultado>` | PATCH/DELETE da comissão; confirma apenas resposta positiva. |

### Seguranca

Fonte: [Synple/backend/src/services/security.js](../Synple/backend/src/services/security.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `digest(value)` | `String` | Calcula SHA-256 hexadecimal; não criptografa para posterior recuperação. |
| `issueSession(userId)` | `Promise<String>` | Gera 32 bytes aleatórios; salva hash e prazo sete dias; devolve token bruto. |
| `authenticate(req, res, next)` | `Promise<void>` | Middleware: verifica Bearer ou ticket PDF e preenche req.auth; 401 para inválido. |
| `bindActor(req, res, next)` | `void` | Substitui campos de ator de operações privadas pela identidade da sessão. |
| `adminOnly(req, res, next)` | `void` | Middleware: permite SYSTEM_ADMIN ou responde 403. |
| `rateLimit(limit, seconds, database = db)` | `Middleware` | Cria middleware assíncrono que atualiza contador persistente e devolve 429 no limite. |
| `scopeSnapshot(data, actor)` | `Snapshot` | Filtra coleções por ator. Modifica o objeto recebido, não é função pura. |

### Autorizacao

Fonte: [Synple/backend/src/services/authorization.js](../Synple/backend/src/services/authorization.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `authorize(req, res, next)` | `Promise<void>` | Middleware de propriedade/papel; valida acesso e define proprietário/usuário quando aplicável. |

### SessaoDispositivo

Fonte: [Synple/mobile/src/services/session.js](../Synple/mobile/src/services/session.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `getSessionToken()` | `String\|null` | Lê token em memória, sem autenticação biométrica adicional nessa leitura. |
| `setSessionToken(value)` | `void` | Define token em memória; não grava SecureStore. |
| `rememberSession(value)` | `Promise<void>` | Define memória e tenta guardar token protegido se dispositivo tem hardware/enrollment. Falha de armazenamento é tolerada sem persistir em AsyncStorage. |
| `restoreSession()` | `Promise<String\|null>` | Lê token protegido com confirmação do SO; falha/ausência retorna null. Servidor ainda precisa validar. |
| `clearSession()` | `Promise<void>` | Apaga token da memória e SecureStore; não revoga remotamente por si só. |
| `confirmBiometric()` | `Promise<Boolean>` | Solicita biometria forte sem fallback do aparelho; web/ausência/cancelamento não autorizam. |

### Cache

Fonte: [Synple/mobile/src/services/storage.js](../Synple/mobile/src/services/storage.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `loadStoredData()` | `Promise<Snapshot\|null>` | Lê chave @synple:incremento-1 e sanitiza JSON; parse inválido pode lançar. |
| `saveData(data)` | `Promise<void>` | Sanitiza e serializa snapshot nessa mesma chave; não grava token/credenciais. |

### Sanitizador

Fonte: [Synple/mobile/src/services/cacheSafety.js](../Synple/mobile/src/services/cacheSafety.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `removeCredentials(value)` | `JSON` | Copia recursivamente eliminando chaves que contenham password/token/secret/activation_hash. Não altera o objeto original. |

### GeradorPDF

Fonte: [Synple/backend/src/services/meetingMinutesPdf.js](../Synple/backend/src/services/meetingMinutesPdf.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `generateMeetingMinutesPdf(snapshot)` | `Promise<Buffer>` | Produz PDFKit em memória; sem escrita em tabela/arquivo ou assinatura digital. |

### Correio

Fonte: [Synple/backend/src/services/mailer.js](../Synple/backend/src/services/mailer.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `sendActivationEmail(email, code)` | `Promise<{success:Boolean}>` | Envia e-mail real via SMTP quando configurado. Não marca usuário como ativado. |
| `sendPasswordResetEmail(toEmail, code)` | `Promise<{success:Boolean,messageId?:String,error?:String}>` | Envia código de recuperação; falha não gera sucesso. |

### RotasReuniao

Fonte: [Synple/backend/src/routes/meetings.js](../Synple/backend/src/routes/meetings.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `createMeetingsRouter(database, { renderMinutesPdf = generateMeetingMinutesPdf, now = () => new Date() } = {})` | `Router` | Cria Router Express com callbacks de agendamento/presença/ata/PDF e transações. |

### RotasComissao

Fonte: [Synple/backend/src/routes/commissions.js](../Synple/backend/src/routes/commissions.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `createCommissionsRouter(db)` | `Router` | Cria Router com operações de comissão/equipe e transferência de coordenação. |

### RotasUsuario

Fonte: [Synple/backend/src/routes/users.js](../Synple/backend/src/routes/users.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `createUsersRouter(db)` | `Router` | Cria Router de atualização de perfil e exclusão administrativa de conta. |

### RotasSincronizacao

Fonte: [Synple/backend/src/routes/sync.js](../Synple/backend/src/routes/sync.js).

| Operação e parâmetros | Retorno | Responsabilidade / efeito / erro |
| --- | --- | --- |
| `createSyncRouter(db)` | `Router` | Cria Router de snapshot. No app real a sessão é exigida antes do router. |

## Responsabilidades dos callbacks HTTP e validação

Cadastro/login/Google/ativação/recuperação: backend/src/routes/auth.js. Organização/ingresso/convites/transferência: organizations.js. Comissão/equipe: commissions.js. Perfil/exclusão: users.js. Reuniões/presença/atas/PDF: meetings.js. Condições de cada callback constam nas fichas RF, com telas, parâmetros, pós-condição, respostas e limites. Não há uma operação Usuario.salvarNoAsyncStorage no domínio.

Exceções: wrappers API retornam Resultado/linha/null conforme tabela; fetchSystemInfo e authorizePdfDownload podem lançar. Middleware usa next(error) ou resposta HTTP. SQL não comprova biometria; confirmBiometric é proteção local. Observação de documentação: as funções não são polimorfismo/herança implementados; multiplicidades do domínio e herança dos atores UML representam papéis/relações de análise.
