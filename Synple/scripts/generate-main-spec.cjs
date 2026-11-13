const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'../..');
const docs=path.join(root,'docs');
// Cada ficha descreve comportamento verificável e aponta para a implementação atual.
// Esquema: id, nome, ator, tela/gatilho, pré-condição, fluxo, exceções/limites, persistência, contrato, sequência.
const R=[
['RF01','Cadastrar organização','Usuário autenticado','Minha organização → formulário Nome da organização/CNPJ → botão Enviar cadastro','Sessão válida.',
 ['Preencher nome e CNPJ; a interface aplica máscara e verifica 14 dígitos.','Confirmar o cadastro no diálogo. A interface bloqueia envio repetido durante a operação.','A API usa o proprietário da sessão, remove a pontuação do CNPJ e verifica nome/CNPJ duplicados.','Inserir com status PENDING e retornar a organização; atualizar a lista somente após confirmação.'],
 'Campos ausentes/incompletos bloqueiam o envio; conflito de nome/CNPJ retorna 409. Falha/timeout não cria organização local. A validação é de quantidade de dígitos, não de dígitos verificadores do CNPJ.',
 'organizations: name, document, owner_id, status=PENDING. Índices normalizados protegem concorrência.', 'POST /organizations','seq-comando'],
['RF02','Decidir situação da organização','Administrador do sistema','Gestão → organização → Aprovar/Recusar ou comando de situação','Sessão SYSTEM_ADMIN e organização existente.',
 ['Selecionar organização e situação.','Confirmar o diálogo.','A API autoriza SYSTEM_ADMIN e aceita APPROVED, PENDING ou REJECTED.','Atualizar status e sincronizar após resposta positiva.'],
 'Usuário comum recebe 403; situação inválida recebe 400; organização ausente recebe 404. As permissões de proprietário na interface dependem de organização aprovada; nem toda rota interna repete essa verificação de situação.',
 'organizations.status e updated_at.', 'PATCH /organizations/:id/status','seq-comando'],
['RF03','Listar e remover organizações','Administrador do sistema','Gestão → organização → Remover → confirmação','Sessão administrativa; organização existente.',
 ['Consultar organizações pelo snapshot autorizado ou listagem.','Acionar Remover e confirmar a exclusão.','A API exclui a organização, obedecendo às FKs do DDL.','Confirmar exclusão somente após sucesso e atualizar os dados.'],
 'Cancelamento não envia escrita. Existem cascatas para comissões/vínculos e, por consequência, reuniões. FKs sem cascata podem impedir exclusões. Não existe proteção geral de histórico nessa rota; a documentação não promete preservação automática de todas as atas.',
 'DELETE organizations; efeitos das FKs listados no dicionário físico.', 'GET /organizations; DELETE /organizations/:id','seq-comando'],
['RF04','Criar comissão','Proprietário da organização','Comissões → Nome da comissão ou grupo/Tipo/Descrição / Objetivo → botão Cadastrar comissão','Organização aprovada; proprietário autenticado.',
 ['Preencher nome, tipo e descrição opcional.','A interface verifica nome vazio e repetição na organização.','A API abre transação, verifica propriedade, cria comissão e valida elegibilidade dos integrantes.','Incluir coordenador: primeiro integrante enviado; na ausência de lista, o próprio ator.','Confirmar transação e sincronizar; selecionar a comissão criada.'],
 'Integrante inexistente/sem acesso aprovado aborta a transação. O nome não tem UNIQUE SQL por organização; verificação local não garante concorrência. Erro da API não vira comissão offline.',
 'commissions e commission_members na mesma transação.', 'POST /commissions','seq-comando'],
['RF05','Editar, ativar/inativar e excluir comissão','Proprietário da organização','Comissões → editar dados, alterar situação ou excluir','Sessão do proprietário; comissão existente.',
 ['Editar nome/tipo/descrição/situação no formulário ou selecionar alteração de estado.','Enviar PATCH e aguardar confirmação antes de sincronizar.','Para excluir, confirmar o diálogo e enviar DELETE.','A exclusão só ocorre quando não há reunião vinculada; caso contrário usar inativação.'],
 'Nome vazio/situação inválida retorna 400; falta de propriedade, 403; exclusão com reuniões retorna 409. Não há alteração local confirmada em caso de erro.',
 'commissions; exclusão remove vínculos por FK, mas a rota bloqueia comissão com reunião.', 'PATCH /commissions/:commissionId; DELETE /commissions/:commissionId','seq-comando'],
['RF06','Gerenciar integrantes e transferir coordenação','Proprietário da organização','Comissões → integrantes → + Adicionar/Tornar coord./Tornar membro/Remover','Integrante elegível: proprietário ou membro APPROVED da organização.',
 ['Selecionar a comissão e pessoa alvo.','Enviar inclusão, mudança de papel ou remoção; a API obtém actorId da sessão.','A API bloqueia a comissão em transação. Ao promover, rebaixa o coordenador anterior e promove o novo.','Confirmar no servidor e sincronizar a equipe.'],
 'Papel deve ser MEMBER/COORDINATOR. Não se remove nem rebaixa o único coordenador antes de escolher sucessor: 409. Inserção duplicada recebe 409. SQL protege no máximo um; mínimo de um depende das rotas/migração. Regra deve ser validada com a comunidade.',
 'commission_members; PK (commission_id,user_id) e índice parcial único de COORDINATOR.', 'POST /commissions/:commissionId/members; PATCH/DELETE /commissions/:commissionId/members/:userId','seq-comando'],
['RF07','Cadastrar conta local pendente de ativação','Visitante','Login → Criar conta → Nome completo/E-mail/Telefone/Senha/Confirmar senha → Criar conta','API e SMTP configurados; e-mail ainda não cadastrado.',
 ['Digitar os campos; telefone é opcional.','A interface valida nome, e-mail, telefone preenchido, senha de oito caracteres e confirmação igual.','A API valida os campos, normaliza e-mail e consulta duplicidade.','Gerar código numérico de seis dígitos e enviar por SMTP.','Após envio aceito, persistir bcrypt e hash de ativação com prazo de 15 minutos; retornar requiresActivation=true.','Abrir a etapa Ativar conta; limpar as senhas do formulário. O cadastro não autentica automaticamente.'],
 'E-mail duplicado: 409. Validação inválida: 400. SMTP indisponível: 503 e nenhuma conta criada. SMTP aceitar mensagem não comprova entrega à caixa de entrada. O envio precede o INSERT: falha de banco posterior pode deixar uma mensagem sem cadastro concluído.',
 'users: email_verified=FALSE, activation_hash=SHA-256(código), activation_expires; password_hash=bcrypt fator 10.', 'POST /auth/register','seq-cadastro'],
['RF08','Solicitar e decidir ingresso na organização','Usuário autenticado / proprietário; administrador autorizado na API','Organizações → Solicitar entrada; Minha organização → solicitações → Aprovar/Recusar','Na interface, organização APPROVED e usuário sem vínculo PENDING/APPROVED.',
 ['Usuário solicita entrada na organização escolhida.','A API fixa userId como a pessoa da sessão; devolve vínculo existente ou cria PENDING/MEMBER.','Proprietário consulta as solicitações e decide a situação.','A API verifica proprietário/administrador e atualiza; a interface sincroniza após sucesso.'],
 'A rota de solicitação não repete todos os filtros de situação da interface. Convite criado pelo proprietário não pode ser aprovado por esse fluxo sem aceite do destinatário. Um vínculo existente não é recriado nem reaberto automaticamente.',
 'access_requests, UNIQUE(organization_id,user_id).', 'POST /organizations/:id/access-requests; PATCH /organizations/access-requests/:requestId','seq-comando'],
['RF09','Alterar cargo e revogar vínculo organizacional','Proprietário da organização','Minha organização → membro aprovado → cargo ou Remover membro','Membro e organização selecionados; interface exige proprietário e organização aprovada.',
 ['Escolher cargo MEMBER/COORDINATOR ou confirmar remoção.','Enviar PATCH de vínculo; a API verifica proprietário/administrador.','Na revogação, negar se a pessoa coordena alguma comissão dessa organização.','Persistir novo papel/status e sincronizar.'],
 'Papel de organização não substitui papel em commission_members. Revogação grava REVOKED, mas a rota atual não apaga automaticamente todos os vínculos de comissão; não prometer remoção em cascata da equipe. Resolver coordenação antes da revogação.',
 'access_requests.organization_role/status/updated_at.', 'PATCH /organizations/access-requests/:requestId','seq-comando'],
['RF10','Trocar senha autenticada','Usuário autenticado','Perfil → Trocar senha → Senha atual/Nova senha/Confirmar nova senha → Atualizar senha','Sessão válida; senha atual conhecida.',
 ['Preencher os três campos.','A interface exige atual, nova com oito caracteres e confirmação igual.','A API compara a senha atual com bcrypt e exige nova com pelo menos oito caracteres.','Atualizar hash, revogar todas as sessões da conta e pedir novo login.'],
 'Senha atual incorreta: 400; sessão inválida: 401; excesso de tentativas: 429. Conta exclusivamente Google não conhece a senha aleatória inicialmente criada: pode definir uma senha local pelo fluxo de recuperação.',
 'users.password_hash/updated_at; DELETE auth_sessions por user_id.', 'POST /auth/change-password','seq-comando'],
['RF11','Recuperar senha com código por e-mail','Visitante','Login → Esqueci minha senha → E-mail cadastrado → botão Enviar código por e-mail','SMTP e API disponíveis; não exige sessão.',
 ['Preencher E-mail cadastrado e acionar o botão textual Enviar código por e-mail.','O app remove espaços externos e exige campo preenchido; essa etapa não executa validação completa de formato.','A API normaliza, aplica limites e consulta conta. Para conta existente, grava hash de código de seis dígitos e validade de 15 minutos, enviando por SMTP.','Exibir mensagem genérica, sem confirmar existência da conta; abrir etapa com Código, Nova senha e confirmação.','Enviar e-mail/código/nova senha; a API exige oito caracteres, confere hash/prazo e consome o código com UPDATE condicionado.','Revogar sessões da conta e retornar ao login.'],
 'Sem SMTP: 503; falha de envio: 502 e código invalidado; código inválido/expirado/usado: 400; limite: 429. Há divergência local remanescente: resetPasswordFromLogin ainda usa mínimo seis, mas servidor exige oito. Não existe link simulado nem envio de link no fluxo atual.',
 'users.reset_token=SHA-256(código), reset_token_expires; novo password_hash; remoção de auth_sessions. O vínculo google_id permanece.', 'POST /auth/forgot-password; POST /auth/reset-password','seq-recuperacao'],
['RF12','Alterar nome e telefone com confirmação biométrica local','Usuário autenticado','Perfil → Dados pessoais → Nome/Telefone → Salvar dados','Celular com biometria forte disponível e cadastrada; sessão válida.',
 ['Abrir Perfil; o formulário recebe nome/e-mail/telefone da conta ativa.','Editar nome e/ou telefone. E-mail verificado permanece somente leitura.','Acionar Salvar dados; validar nome/e-mail do perfil e confirmar que e-mail não mudou.','Solicitar biometria com fallback para senha do aparelho desabilitado.','Se autorizada, enviar PUT do próprio usuário; sincronizar e mostrar sucesso somente após confirmação.'],
 'Biometria cancelada/ausente, inclusive web, impede envio nesse formulário. A biometria é verificação local; não há prova biométrica transmitida/validada pelo backend. A API protege a conta pela sessão. Trocar e-mail não é implementado.',
 'users.name/phone/updated_at; não altera email, system_role ou password_hash.', 'PUT /users/:id','seq-biometria'],
['RF13','Definir tema do perfil','Usuário autenticado','Perfil → Tema preferido → botões Claro/Escuro','Sessão válida.',
 ['Acionar Claro ou Escuro.','Enviar theme=LIGHT ou theme=DARK ao servidor.','A API valida o domínio e atualiza users.theme.','Após sucesso, sincronizar e recalcular getThemeStyles pelo ThemeContext.','Cachear o snapshot sanitizado em AsyncStorage; no login sem sessão a aparência acompanha o SO.'],
 'Falha de rede não confirma preferência salva. Não são usados L/D. Tema selecionável é requisito funcional; contraste e legibilidade são RNFs separados.',
 'users.theme; cache JSON na chave @synple:incremento-1, coleção users, atributo theme. Token não fica nesse JSON.', 'PUT /users/:id com {theme}; GET /sync','seq-comando'],
['RF14','Consultar informação operacional real','Administrador do sistema','Sistema → Status do sistema','Sessão SYSTEM_ADMIN; API alcançável.',
 ['Abrir Sistema.','Consultar GET /system com sessão.','A API consulta relógio/versão do PostgreSQL e marco de instalação, calculando uptime e latência.','Exibir versão da API/Node, versão do banco, horário e disponibilidade; se falhar, exibir falha da consulta.'],
 'Usuário comum recebe 403; erro de banco não deve ser apresentado como disponibilidade comprovada. /health é público e mínimo, sem os detalhes administrativos.',
 'Consulta system_metadata e funções SQL; uptime não é persistido. system_subsystems é tabela legada, não monitor real.', 'GET /system; GET /health público','seq-sistema'],
['RF15','Consultar contadores administrativos','Administrador do sistema','Sistema → Relatório resumido','Snapshot autorizado já carregado.',
 ['Abrir o relatório.','Calcular totais de usuários, organizações, comissões e acessos pendentes a partir das coleções do snapshot.','Atualizar dados para obter nova contagem.'],
 'Contadores representam o último snapshot; não há push nem atualização em tempo real garantida. Snapshot de usuário comum é filtrado e não equivale aos totais administrativos.',
 'Sem tabela própria de relatório; coleções de GET /sync.', 'GET /sync','seq-sincronizacao'],
['RF16','Verificar disponibilidade atual','Administrador do sistema','Sistema → botão Verificar de um subsistema','Sessão administrativa.',
 ['Acionar Verificar.','Consultar estado real da API/banco por GET /system.','Apresentar uptime/estado e atualizar snapshot.'],
 'Apesar do nome interno restartSubsystem, a função atual consulta disponibilidade. Não envia comando Docker, não reinicia serviço e não usa temporizador para fingir sucesso. Reinício operacional não é funcionalidade implementada no app.',
 'Nenhuma mudança de estado de serviço; consultas.', 'GET /system; GET /sync','seq-sistema'],
['RF17','Consultar marcos de inicialização','Administrador do sistema','Sistema → Inicializado em / Servidor iniciado em / Consultar disponibilidade real','Instalação migrada.',
 ['Abrir Sistema e consultar o snapshot e os detalhes.','Exibir initializedAt persistido e startedAt do processo como informações distintas.','Repetir consulta sem substituir a data persistida pela hora da sincronização.'],
 'Em instalação antiga, initialized_at representa a primeira aplicação da migração, não uma data histórica recuperada. O botão não executa setup de banco pelo celular. Inicialização/migração é operação externa do servidor.',
 'system_metadata.initialized_at; startedAt derivado de process.uptime().', 'GET /sync; GET /system','seq-sistema'],
['RF18','Sair e limpar o cache local','Usuário autenticado','Cabeçalho → Sair; administrador também tem Limpar cache e sair com confirmação','Sessão local aberta; serviço remoto pode estar indisponível.',
 ['Acionar Sair ou confirmar Limpar cache e sair.','Solicitar revogação da sessão atual no servidor.','Apagar token da memória/SecureStore e substituir snapshot local por estrutura vazia.','Retornar ao login; registros do PostgreSQL permanecem.'],
 'Cancelar a confirmação preserva sessão/cache. Se a API não for alcançada, a limpeza local ainda ocorre; revogação remota não é garantida e token expira no prazo original. Não se trata de restauração de backup nem reset do banco.',
 'DELETE auth_sessions quando alcançável; remoção de synple.session.v1 do SecureStore; JSON local vazio.', 'POST /auth/logout','seq-sistema'],
['RF19','Entrar com e-mail e senha','Visitante','Login → E-mail/Senha → botão Entrar; perfil identificado pelo servidor','Conta existente, ativa e API disponível.',
 ['Preencher e-mail/senha; validar formato do e-mail e presença da senha no app.','Enviar e-mail e senha ao servidor; o perfil da conta define o papel administrativo.','A API normaliza dados, compara bcrypt, verifica ativação e aplica limites.','Emitir sessão opaca de sete dias; devolver perfil sem hash de senha.','Guardar token em memória e tentar armazenamento biométrico protegido; consultar snapshot e abrir área conforme systemRole real.'],
 'Conta ausente/senha inválida: 401; conta pendente: 403; limite: 429. Não há autenticação por senha local nem senhas alternativas de demonstração.',
 'auth_sessions.token_hash/user_id/expires_at. Token bruto não é guardado no banco ou AsyncStorage.', 'POST /auth/login; GET /sync','seq-login'],
['RF20','Entrar/cadastrar com Google','Visitante','Login ou Criar conta → Continuar com Google','Client IDs Web/plataforma e backend configurados; development build compatível no celular.',
 ['Acionar Continuar com Google e selecionar conta no provedor.','SDK nativo retorna ID token; app envia ao backend.','Backend verifica assinatura/audience e exige sub e e-mail verificado.','Vincular conta de mesmo e-mail quando compatível ou criar conta Google verificada.','Emitir sessão do Synple e consultar snapshot autorizado.'],
 'Expo Go não contém o módulo nativo necessário. Credencial ausente: indisponibilidade/hint; Google incompatível: 401; vínculo Google conflitante: 409. Login web usa expo-auth-session. Alteração do PC não cria credenciais OAuth automaticamente.',
 'users.google_id/email_verified; senha aleatória com hash para nova conta Google; auth_sessions.', 'POST /auth/google','seq-login'],
['RF21','Ativar conta local e reenviar código','Visitante','Etapa Ativar conta; também Login → Já tenho um código de ativação','Cadastro local pendente; e-mail de ativação emitido.',
 ['Informar E-mail e Código recebido por e-mail; campo do código limita digitação a seis caracteres.','Acionar Confirmar código.','API valida hash/prazo e, em uma atualização, marca email_verified=TRUE e apaga desafio.','Retornar ao login. Se necessário, Reenviar código emite novo desafio, invalidando o anterior após atualização.'],
 'Código inválido, expirado ou consumido: 400; excesso: 429; reenvio sem SMTP: 503. Reenvio usa mensagem genérica para não confirmar cadastro. Não autentica automaticamente.',
 'users.email_verified/activation_hash/activation_expires.', 'POST /auth/verify-email; POST /auth/resend-activation','seq-cadastro'],
['RF22','Transferir propriedade da organização','Proprietário atual','Minha organização → membro aprovado → comando de transferência → confirmação','Novo proprietário distinto do atual e com acesso APPROVED.',
 ['Escolher membro e confirmar.','Enviar novo proprietário; API obtém proprietário atual pela sessão.','Abrir transação e bloquear organização; verificar proprietário e elegibilidade do sucessor.','Manter antigo proprietário como MEMBER aprovado e atualizar owner_id.','Confirmar transação e sincronizar permissões.'],
 'Pessoa não aprovada/igual ao dono: 400; ator não proprietário: 403. Erro causa rollback. O novo proprietário não recebe automaticamente o papel global SYSTEM_ADMIN.',
 'organizations.owner_id e access_requests do antigo dono.', 'PATCH /organizations/:id/owner','seq-transferencia'],
['RF23','Convidar conta existente para organização','Proprietário da organização','Minha organização → campo de e-mail → Enviar convite','Destinatário existente, verificado e diferente do proprietário.',
 ['Preencher e-mail da conta e enviar.','API verifica propriedade e procura conta verificada.','Criar vínculo PENDING/MEMBER com invited_by e invitation_accepted=FALSE.','Destinatário recebe o convite ao atualizar a lista de organizações no app.'],
 'Não há e-mail de convite nessa funcionalidade. Conta não encontrada: 404; vínculo existente de qualquer situação: 409. Não existe reabertura/reconvite automático para vínculo rejeitado.',
 'access_requests; uma linha por organização/pessoa.', 'POST /organizations/:id/invitations','seq-convite-org'],
['RF24','Aceitar/recusar convite de organização','Destinatário autenticado','Organizações → convite recebido → Aceitar convite ou Recusar','Convite PENDING recebido pela própria conta.',
 ['Atualizar a lista e localizar o convite.','Selecionar aceitar ou recusar.','API limita UPDATE ao user_id da sessão e à organização/solicitação informadas.','Aceite grava APPROVED/TRUE; recusa grava REJECTED/FALSE; sincronizar.'],
 'Outro usuário ou convite não pendente não consegue responder: 404. Proprietário não pode aprovar o próprio convite em nome do destinatário pelo fluxo de solicitações.',
 'access_requests.status/invitation_accepted/updated_at.', 'PATCH /organizations/:id/invitations/:requestId','seq-convite-org'],
['RF25','Sincronizar snapshot autorizado e manter cache sanitizado','Usuário autenticado','Acesso após login ou ação Atualizar','Sessão válida.',
 ['Enviar GET /sync com Bearer.','API consulta coleções e filtra por identidade/papel/vínculo/histórico.','Substituir snapshot anterior pela resposta; não mesclar novamente registros locais removidos no servidor.','Sanitizar campos de credenciais e serializar o snapshot no cache local.'],
 'Sem API, manter leitura do último estado em memória durante a sessão aberta, sem confirmar novas escritas. A reabertura exige validar a sessão online. Cache antigo é sanitizado, mas não é usado como senha nem prova de acesso. O snapshot é formado por múltiplas consultas, sem transação de leitura única.',
 'AsyncStorage @synple:incremento-1; não armazena senha/token. Sem fila automática de cadastros offline.', 'GET /sync','seq-sincronizacao'],
['RF26','Reabrir sessão com biometria','Pessoa com sessão previamente guardada','Reabertura do aplicativo após autenticação anterior','Celular com SecureStore/biometria disponíveis e token salvo.',
 ['Solicitar leitura de synple.session.v1 com requireAuthentication.','SO solicita confirmação para liberar o token; usuário pode cancelar.','Se token disponível, consultar /auth/me e validar sessão no servidor.','Abrir área autenticada somente após validação e atualizar dados.'],
 'Token expirado/revogado ou falha de validação exige login; no fluxo atual também limpa a sessão local após falha. Sem hardware/enrollment, web ou falha ao gravar SecureStore, token fica só em memória. Não há garantia de entrada offline nem teste físico comprovado nesta revisão.',
 'SecureStore synple.session.v1 protegido; memória do app; auth_sessions no servidor.', 'GET /auth/me','seq-biometria'],
['RF27','Excluir conta administrativamente','Administrador do sistema','Gestão → usuário → Remover → confirmação','Conta alvo existente e diferente do administrador ativo; interface também restringe remoção de outro administrador.',
 ['Selecionar usuário e confirmar a exclusão.','API verifica SYSTEM_ADMIN e inicia transação.','Bloquear remoção do próprio administrador, de coordenador atual, de aprovador fixado em ata em revisão/aprovada e de usuário com voto registrado em votação.','Executar DELETE conforme FKs; em sucesso confirmar e remover dados locais correspondentes.'],
 'É necessário transferir coordenação antes de remover coordenador. Referências históricas sem cascata podem impedir exclusão; conflitos retornam 409. A proteção contra excluir qualquer outro SYSTEM_ADMIN está na interface, não como regra equivalente em todas as ramificações do backend.',
 'users e cascatas/restrições reais das FKs; sessões são removidas por cascata.', 'DELETE /users/:id','seq-comando'],
['RF28','Alterar nome/CNPJ da organização','Proprietário da organização','Minha organização → Dados da organização → campos Nome/CNPJ → Salvar organização → confirmação','Organização selecionada; sessão do proprietário.',
 ['Editar nome e CNPJ no formulário.','Validar preenchimento no app e confirmar diálogo.','API confere proprietário, remove pontuação do documento e atualiza a linha.','Exibir alteração somente após resposta positiva e atualizar lista.'],
 'Nome/CNPJ duplicados são impedidos pelos índices, mas a rota de edição transforma alguns conflitos SQL em HTTP 500 genérico. A validação explícita de 14 dígitos feita no cadastro não é repetida integralmente nessa rota de edição. Não documentar um tratamento 409 uniforme inexistente.',
 'organizations.name/document/updated_at; owner_id não muda nessa operação.', 'PATCH /organizations/:id','seq-comando'],
['RF02.01','Agendar reunião da comissão','Coordenador atual ou proprietário','Reuniões → título, início, término, pauta → Agendar e convidar','Comissão existente; gestor com sessão válida.',
 ['Preencher título até 160 caracteres, datas DD/MM/AAAA HH:mm e pauta.','Validar campos e converter datas para ISO com fuso.','API valida período, gestor e comissão em transação com lock.','Criar reunião e convites; organizador entra como ACCEPTED.','Confirmar reunião após commit.'],
 'Término não posterior/início inválido: 400; não gestor: 403; convidados inválidos abortam toda a transação. Não há edição/cancelamento do agendamento implementados.',
 'meetings e meeting_invitations na mesma transação.', 'POST /meetings','seq-agendamento'],
['RF02.02','Selecionar e convidar integrantes no agendamento','Gestor da reunião','Reuniões → Membros convidados no formulário Agendar e convidar','Mesmo contexto de RF02.01; integrantes pertencentes à comissão.',
 ['Selecionar pessoas da comissão no formulário.','Enviar inviteeIds junto ao agendamento.','Resolver IDs, rejeitar pessoas não integrantes e deduplicar; incluir organizador.','Persistir INVITED para demais pessoas e ACCEPTED para organizador.'],
 'Não há endpoint/tela para convidar pessoas avulsas após criar a reunião. O proprietário pode ser organizador sem integrar a comissão; demais convidados precisam ser integrantes.',
 'meeting_invitations, UNIQUE(meeting_id,user_id).', 'POST /meetings, campo inviteeIds','seq-agendamento'],
['RF02.03','Responder convite de reunião','Convidado autenticado','Cartão da reunião → Aceitar convite / Recusar','Convite da própria pessoa.',
 ['Selecionar aceitar/recusar.','API usa identidade da sessão e valida estado enviado.','Atualizar status e responded_at pelo relógio do servidor.'],
 'Recusa após registrar entrada é bloqueada: 409. Usuário sem convite não responde pelo de outra pessoa.',
 'meeting_invitations.status/responded_at.', 'PATCH /meetings/:meetingId/invitation','seq-agendamento'],
['RF02.04','Registrar entrada','Convidado com convite aceito','Cartão da reunião → Registrar entrada','Convite ACCEPTED e ausência de entrada anterior; ata ainda permite novas entradas.',
 ['Acionar Registrar entrada.','API bloqueia reunião em transação e verifica convite/presença/ata.','Registrar entered_at pelo servidor e confirmar.'],
 'Não se registra por outro participante. Após submissão para revisão e aprovação final, novas entradas ficam bloqueadas. Registro é da primeira entrada; não existe fluxo de múltiplas reentradas.',
 'meeting_attendance, UNIQUE(meeting_id,user_id).', 'PATCH /meetings/:meetingId/attendance com action=ENTER','seq-presenca'],
['RF02.05','Registrar saída','Participante com entrada registrada','Cartão da reunião → Registrar saída','Entrada existente e saída ainda não registrada.',
 ['Acionar Registrar saída.','API confere própria presença em transação.','Gravar left_at com relógio do servidor e devolver presença.'],
 'Sem entrada, negar operação; saída não apaga presença nem retira voto obrigatório. Saídas continuam disponíveis após submissão/aprovação da ata.',
 'meeting_attendance.left_at.', 'PATCH /meetings/:meetingId/attendance com action=EXIT','seq-presenca'],
['RF02.06','Consultar e compartilhar lista de presença','Gestor atual ou convidado histórico','Reuniões → lista e Gerar / compartilhar lista de presença','Acesso à reunião por gestão ou convite, inclusive histórico.',
 ['Consultar lista atualizada pela API.','Exibir convidados, situação do convite, entrada, saída e ausências.','Contar presentes apenas com entered_at registrado.','Gerar texto e abrir compartilhamento do SO ou prévia copiável.'],
 'Convite aceito sozinho não significa presença. Falha de rede não é lista recém-confirmada. Compartilhar texto não cria assinatura digital.',
 'Leitura de meeting_invitations, meeting_attendance e users; sem nova tabela de relatório.', 'GET /meetings/:meetingId/attendance','seq-presenca'],
['RF02.07','Criar ou corrigir ata','Gestor atual','Reuniões → Discussões e decisões → Salvar rascunho da ata ou Salvar correção da ata','Gestor autorizado; ata não aprovada.',
 ['Preencher texto não vazio até 50.000 caracteres.','Enviar salvamento.','API bloqueia reunião/ata e grava DRAFT.','Se corrigir revisão/rejeição, gerar nova versão, limpar decisões/conjunto de aprovadores e exigir nova submissão.'],
 'APPROVED não pode ser alterada. Falha de envio preserva o texto local do formulário para nova tentativa, mas não o declara salvo no banco. Não há histórico completo dos conteúdos substituídos.',
 'meeting_minutes e remoção das decisões substituídas em meeting_minutes_approvals.', 'POST /meetings/:meetingId/minutes','seq-ata'],
['RF02.08','Submeter ata para aprovação','Gestor atual','Reuniões → botão Enviar ata para aprovação','Ata DRAFT salva e pelo menos uma pessoa com entrada registrada.',
 ['Enviar submissão.','API bloqueia reunião/ata e fixa o conjunto de pessoas com entered_at no instante do envio.','Gravar required_approver_ids, status=IN_REVIEW e submitted_at.','Exigir decisão de cada pessoa desse conjunto, inclusive gestor presente e quem já saiu.'],
 'Sem presentes ou sem rascunho: 409. Não inclui ausentes. Novas entradas são bloqueadas durante revisão/após aprovação. Remover vínculo da comissão não remove a obrigação do aprovador fixado.',
 'meeting_minutes e conjunto UUID[]; sem tabela de snapshot completo de pessoas.', 'POST /meetings/:meetingId/minutes/submit','seq-ata'],
['RF02.09','Aprovar ou solicitar correção da versão da ata','Aprovador fixado na submissão','Reuniões → leitura da versão → campo Comentário (opcional) → Aprovar ata / Rejeitar ata','Ata IN_REVIEW e ator incluído em required_approver_ids.',
 ['Ler texto e versão atual; selecionar decisão.','Enviar version, decision e comentário quando rejeitar.','API bloqueia a reunião, verifica versão e elegibilidade e grava a decisão atual.','Rejeição muda para REJECTED; unanimidade APPROVED fixa approved_at; antes disso permanece em revisão.'],
 'Versão antiga/estado incompatível: 409; pessoa não fixada: 403; rejeição sem comentário é inválida. Cargo de coordenador não equivale a aprovação automática. Uma decisão atual por usuário/ata, sem histórico completo dos votos substituídos.',
 'meeting_minutes_approvals e meeting_minutes.status/approved_at.', 'PATCH /meetings/:meetingId/minutes/approval','seq-ata'],
['RF02.10','Gerar PDF da ata salva','Gestor atual ou convidado histórico','Reuniões → Gerar ata em PDF','Ata salva; formulário sem alterações locais pendentes; versão atual.',
 ['Acionar exportação; app faz HEAD autenticado e confere MIME/versão.','Solicitar ticket de download limitado à rota/sessão por 60 segundos.','Abrir navegador com URL do PDF, versão, fuso e ticket.','API revalida sessão/acesso/versão e gera PDF em memória com dados atuais.','Exibir rascunho/revisão/rejeição como documento não final; ata aprovada é identificada como aprovada.'],
 'Sem acesso: 403; sem ata: 404; versão antiga: 409; ticket inválido/expirado: 401. Ticket pode ser reutilizado na mesma rota até expirar; não é de uso único. PDF não altera votos/situação e não contém assinatura digital.',
 'Leitura das tabelas de reunião/ata/presença/decisões; download_tickets para autorização temporária; PDF não é armazenado no banco.', 'HEAD/GET /meetings/:meetingId/minutes/pdf; POST /auth/download-ticket','seq-pdf'],
];
R.push(...require('./delivery-requirements.cjs'));
for (const r of R) {
 if (r[0] === 'RF02.01') { r[3]='Reuniões → Nova reunião → Salvar reunião'; r[6]='Início não futuro, término inválido e campos vazios: 400 com fields; não gestor: 403. Edição de reunião futura está em RF03.06.'; }
 if (r[0] === 'RF02.02') { r[3]='Reuniões → Nova reunião → Convidados da comissão'; r[5]=['Selecionar integrantes; todos começam selecionados e o gestor pode retirar pessoas.','Enviar inviteeIds; validar elegibilidade e deduplicar no servidor.','Persistir convites e incluir organizador aceito.']; }
 if (r[0] === 'RF02.03') r[6]='Após término, ou recusa após entrada, retorna 409. Usuário sem convite não responde por outro.';
 if (r[0] === 'RF02.04' || r[0] === 'RF02.05') { r[3]='Abrir reunião → Presença → Entrada/Saída com biometria, ou Arquivos → código'; r[4]+=' Reunião em andamento.'; r[5]=['Confirmar biometria local, ou usar código temporário válido, ou solicitar registro ao gestor.','PATCH valida identidade, convite, período e estado de presença.','Gravar horários pelo servidor e confirmar resultado.']; r[6]='Fora do período: 409; sem convite: 403; novas entradas bloqueadas durante revisão/aprovação da ata. Gestor pode atuar por convidado pela rota própria (RF03.10). Biometria é verificação local, sem atestado remoto.'; }
}
const e = s=>s.replaceAll('|','\\|');
let md=`# Especificação principal de engenharia de software — Synple

**Revisão:** 06/11/2026. **Escopo:** cadastro, organizações, comissões, contas, configuração, operação e incremento 2 (reuniões/atas). **Base:** código presente neste checkout, DDL e relatórios de teste identificados; não presume implantação em outro computador.

Esta revisão substitui integralmente a especificação anterior. Não descreve como implementados chat, calendário gráfico, disponibilidade, cancelamento de reunião, restauração de backup ou reinício de processos pelo celular. O levantamento de requisitos com a comunidade e os testes físicos ainda dependem de evidências externas.

## 1. Fontes, convenções e rastreabilidade

| Fonte | Uso nesta especificação |
| --- | --- |
| [App.js](../Synple/mobile/App.js), [telas](../Synple/mobile/src/screens) e [API cliente](../Synple/mobile/src/services/api.js) | Nomes de campos/ações, validações locais e tratamento de respostas |
| [Rotas Express](../Synple/backend/src/routes), [segurança](../Synple/backend/src/services/security.js) e [autorização](../Synple/backend/src/services/authorization.js) | Contrato HTTP, identidade, permissões e regras executadas |
| [DDL](../Synple/backend/src/db/schema.sql) | Estrutura física e restrições efetivamente existentes |
| [Versions](tecnologias-versoes.md) | Manifests e versões resolvidas no lockfile, incluindo dependências diretas |
| [Verificação das correções](../Synple/docs/VERIFICACAO_CORRECOES.md) | Execuções anteriores identificadas: 35 testes backend, 23 mobile e exportações; não são testes novos desta revisão documental |
| Enunciado do incremento 2, identificado na documentação anterior como slides 4–10 da apresentação f2b56f41bcb6-5d9f38abce32442c931a4ff49a379768.pptx | Origem declarada das funcionalidades de reunião; o arquivo original não está sendo apresentado como revalidado nesta revisão |

IDs RF01–RF18 foram preservados para rastrear a entrega anterior; RF16–RF18 agora descrevem o que existe no aplicativo, sem alegar reinício/setup/reset reais. RF19–RF28 explicitam contas/sessão/convites e gestão antes misturados a outros fluxos. RF02.01–RF02.10 pertencem ao incremento 2: o ponto faz parte do identificador e não os confunde com RF02.

Cada ficha registra ator, gatilho, pré/pós-condições, fluxo, exceções, dados e contrato. RF descreve comportamento; RNF descreve qualidade verificável. Contratos técnicos de serialização/colunas complementam o requisito, sem substituir o objetivo do usuário. Onde a implementação é incompleta, o limite fica escrito como tal, em vez de inventar uma garantia.

## 2. Arquitetura, versões e configurações

Cliente Expo SDK 58/React Native 0.88/React 19.3, JavaScript, componentes próprios; API Express 4/Node 22, SQL parametrizado com pg e PostgreSQL 16. Não há ORM Sequelize nem classes JavaScript de entidade declaradas. O modelo de classes abaixo é de análise/projeto; operações de módulos são identificadas separadamente. Requisitos e rastreabilidade do Incremento 3 estão em [documento complementar](INCREMENTO_3.md).

Android mínimo 7/API 24; iOS mínimo 16.4; Node mínimo 22.13. [Tabela completa de tecnologias](tecnologias-versoes.md). Faixa semver do manifest, versão do lockfile e versão do processo/imagem são coisas distintas; tags Docker e CLI latest não fixam patch. A compatibilidade declarada não comprova teste em todos os aparelhos.

![Implantação atual](Diagramas/renderizados/implantacao.svg)

API: EXPO_PUBLIC_API_URL tem precedência; há fallback de endereço por ambiente em api.js/network.json e detecção do IP local. O túnel Expo expõe Metro, não a API. O script tunnel abre também Cloudflare para a API. Em produção exige-se HTTPS e endereço estável; quick tunnel muda ao reiniciar e depende do computador ligado.

| Configuração | Local/representação | Observação |
| --- | --- | --- |
| URL API | mobile/.env, EXPO_PUBLIC_API_URL | Pública; sem credencial secreta no cliente |
| OAuth mobile | EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e ANDROID/IOS_CLIENT_ID | IDs reais correspondentes ao pacote/assinatura; não são Client Secrets |
| OAuth backend | GOOGLE_OAUTH_CLIENT_IDS, lista separada por vírgula | Públicos permitidos para validar o ID token |
| E-mail | backend/.env: SMTP_SERVICE/HOST/PORT/USER/PASS e EMAIL_FROM | Segredo SMTP somente no servidor; entrega real não foi testada aqui |
| Sessão | Bearer de 64 caracteres hex; banco guarda SHA-256 | Validade de sete dias; revogação por logout/troca/recuperação |
| Cache | AsyncStorage, chave @synple:incremento-1, JSON sanitizado | Não contém senha/token; não autoriza acesso |
| Sessão protegida | SecureStore, chave synple.session.v1, requireAuthentication | Condicionada a hardware, biometria cadastrada e módulo nativo; web usa memória |

Exemplo fictício de preferência em snapshot/cache: \\{ "users": [\\{ "id": "uuid-da-pessoa", "theme": "DARK" \\}] \\}. Persistência oficial em users.theme; LIGHT/DARK, não L/D. A gravação usa JSON.stringify(removeCredentials(data)). Cache anterior é sanitizado e não é mesclado de volta como fonte de credenciais.

## 3. Atores e permissões

| Ator | Definição e alcance |
| --- | --- |
| Visitante | Pessoa sem sessão válida; pode cadastrar/ativar/recuperar conta ou iniciar login |
| Usuário autenticado | Identidade obtida da sessão validada; não do seletor de modo nem de userId no JSON |
| Administrador do sistema | system_role=SYSTEM_ADMIN, para gestão sistêmica e dados operacionais |
| Proprietário da organização | organizations.owner_id; papel contextual, transferível, não equivale a SYSTEM_ADMIN |
| Coordenador de comissão | commission_members.role=COORDINATOR; gestor contextual da reunião junto ao proprietário |
| Convidado de reunião | Pessoa em meeting_invitations; acesso histórico pode permanecer após remoção da comissão |
| Aprovador da ata | Pessoa com entrada até submissão, fixada em required_approver_ids; cargo não substitui presença/decisão |
| Google, SMTP e serviço biométrico do SO | Sistemas externos que apoiam autenticação/envio/confirmação local |

API pública: /health e rotas de login/cadastro/Google/recuperação/ativação/reenvio. Demais recursos exigem sessão. PDF em navegador aceita ticket vinculado à sessão e ao caminho. Autenticação é pré-condição de operações privadas, não um include artificial desenhado em cada caso de uso. Regras de situação e associação ainda têm diferenças entre interface e algumas rotas; consultar seção 11.

## 4. Diagramas de casos de uso UML

Os atores ficam fora da fronteira Synple. Linhas representam associações; triângulo vazio indica especialização contextual. Não foram usadas setas de fluxo de processo ou componentes técnicos como atores internos.

![Contas e sessão](Diagramas/renderizados/uc-autenticacao.svg)

![Organizações e comissões](Diagramas/renderizados/uc-organizacoes.svg)

![Reuniões e atas](Diagramas/renderizados/uc-reunioes.svg)

![Consulta e operação](Diagramas/renderizados/uc-operacao.svg)

Fontes editáveis e todas as imagens: [catálogo dos diagramas](Diagramas/Diagramas_Casos_de_Uso.md). Referência normativa: [UML 2.5.1 — OMG](https://www.omg.org/spec/UML/2.5.1/About-UML).

## 5. Requisitos funcionais e fichas de casos de uso

| ID | Objetivo | Ator |
| --- | --- | --- |
`;
for(const r of R) md+=`| [${r[0]}](#${r[0].toLowerCase().replaceAll('.','')}) | ${r[1]} | ${r[2]} |\n`;
md+='\n## Requisitos funcionais declarativos\n\n| ID | Requisito |\n| --- | --- |\n';
const DECLARATIVOS = require('./requisitos-declarativos.json');
for (const [id,name,actor] of R) md+=`| ${id} | ${DECLARATIVOS[id] || `O sistema deve oferecer a função ${name.toLowerCase()} ao ator ${actor.toLowerCase()}, respeitando as condições e resultados da ficha correspondente.`} |\n`;
for(const [id,name,actor,trigger,pre,steps,exceptions,data,api,seq] of R) {
 md+=`\n<a id="${id.toLowerCase().replaceAll('.','')}"></a>\n\n### ${id} — ${name}\n\n`;
 md+=`| Campo | Especificação |\n| --- | --- |\n| Ator | ${e(actor)} |\n| Tela e gatilho | ${e(trigger)} |\n| Pré-condições | ${e(pre)} |\n| Entradas e contrato | ${e(api)}; prefixo /api em todas as rotas |\n| Dados/pós-condição de sucesso | ${e(data)} |\n| Sequência UML | [${seq}](Diagramas/renderizados/${seq}.svg) |\n\n**Fluxo principal**\n\n`;
 steps.forEach((s,i)=>md+=`${i+1}. ${s}\n`);
 md+=`\n**Alternativas, exceções e limites:** ${exceptions}\n\n**Critério de aceite:** executar o fluxo principal com as pré-condições indicadas, conferir os dados/pós-condição no servidor e repetir as exceções descritas. Aprovar somente se a interface e a resposta HTTP coincidirem com os resultados registrados. A existência desta ficha não é evidência de execução.\n`;
}
md+=`
## 6. Modelo de classes e dicionário

Os classificadores de domínio representam responsabilidades/dados, não classes JavaScript inexistentes. Não foi atribuída a Usuario uma operação login que, no código, pertence ao módulo de API/rotas. Os módulos de projeto têm operações com parâmetros/retornos reais e dicionário próprio. Associação não implica exclusão em cascata; esta é especificada no modelo físico.

![Classes de cadastro](Diagramas/renderizados/classes-cadastro.svg)

![Classes de reuniões](Diagramas/renderizados/classes-reunioes.svg)

![Módulos e operações](Diagramas/renderizados/classes-servicos.svg)

[Dicionário de classes, atributos e métodos](dicionario-classes.md). Atributos técnicos e nomes SQL completos estão no dicionário físico; os recortes visuais não substituem esses inventários.

## 7. Modelo relacional e dicionário físico

O modelo relacional representa tabelas, PKs, FKs e cardinalidades de referência. Não é chamado de diagrama UML. As multiplicidades relacionais indicam capacidade SQL, não pressupõem que cada organização já possua comissões ou cada reunião já possua uma ata.

![Cadastro relacional](Diagramas/renderizados/relacional-cadastro.svg)

![Reuniões relacionais](Diagramas/renderizados/relacional-reunioes.svg)

![Segurança e operação relacionais](Diagramas/renderizados/relacional-seguranca.svg)

[Dicionário físico completo](dicionario-banco-dados.md): inventário de tabelas, colunas, restrições e índices extraído do DDL atual. Inclui tipos, nulabilidade, defaults, PK/FK/UNIQUE/CHECK, índices parciais/expressões e ações de exclusão. [Snapshot estruturado](modelo-fisico.snapshot.json) permite conferir o inventário.

**Distinção entre regra e garantia:** enums de tema/papel/situação em várias tabelas são validados por rotas, mas não têm CHECK SQL. Nome de comissão não tem UNIQUE SQL. E-mail tem unicidade textual, não índice de minúsculas. Ao contrário, nome/CNPJ de organização têm índices normalizados. Presença/voto/unanimidade e validade de credenciais exigem lógica de serviço e transações; não são garantidos apenas pela existência de uma tabela.

## 8. Requisitos não funcionais

Cada RNF contém condição, medida e método de avaliação. “Implementado” indica mecanismo observado no código; só evidência identificada permite declarar teste aprovado. Metas de desempenho/usabilidade ainda não medidas permanecem metas pendentes.

| ID / atributo | Critério verificável | Condições e medida | Evidência ou estado |
| --- | --- | --- | --- |
| RNF01 — Autenticação | Recurso privado sem token válido retorna 401 e não efetua escrita | Chamadas HTTP anônimas, expiradas/revogadas e com ator adulterado | security.test.js; mecanismos implantados no código |
| RNF02 — Autorização | Usuário não altera perfil de outra conta nem acessa /system sem papel administrativo | Duas contas distintas; comparar resposta e dados antes/depois | security.test.js |
| RNF03 — Credenciais locais | Serialização do cache não contém campos de senha, token ou segredo | Objeto com credenciais inclusive aninhadas; comparar JSON sanitizado | cacheSafety.test.js; sem comprovação de inspeção forense de aparelho |
| RNF04 — Sessão/expiração | Sessão expira em sete dias; código em 15 minutos; ticket em 60 segundos; troca/recuperação revoga sessões | Alterar timestamps em schema isolado e consultar endpoints | Validades no código; testes específicos de sessão/código e revogação. Não alegar cobertura de todos os cenários apenas por essa descrição |
| RNF05 — Limitação de tentativas | Login/Google/troca: 10, envio/reenvio: 3, código/reset: 5 por janela de 900 s | Por endpoint/IP e e-mail quando fornecido; excedente retorna 429 | UPSERT persistente; teste de limite de recuperação |
| RNF06 — Integridade transacional | Agendamento, criação de comissão, transferência e decisões não deixam escritas parciais em falha validada | Consultar tabelas após payload inválido/falha e após disputa concorrente | Suítes de segurança/reuniões/migração; não generalizar transação a toda rota |
| RNF07 — Concorrência de atas | Voto de versão antiga é negado; aprovação depende do conjunto fixado e unanimidade | Pedidos concorrentes em schema isolado; comparar versão/votos/status | meetings.test.js |
| RNF08 — Persistência confirmada | Escrita declarada confirmada continua disponível ao consultar a API após atualização | Fluxos com API disponível; em falha, interface não informa salvamento concluído | Mecanismos presentes; roteiro manual por operação ainda necessário |
| RNF09 — Recuperação de falha | Indisponibilidade não vira autenticação local nem cadastro offline | Desligar API/rede; verificar mensagem, cache e ausência de escrita | Roteiro em aparelho pendente. Reabertura offline não é suportada |
| RNF10 — Privacidade | Snapshot de conta sem vínculo não contém contas/atas/presenças de outra organização | Duas organizações e pessoas; manter acesso histórico permitido explicitamente | Filtro por sessão; teste de isolamento de contas. Diretório de organizações aprovadas é público entre usuários autenticados |
| RNF11 — Compatibilidade | Fluxos essenciais em Android 7+/API24 e iOS16.4+ no build configurado | Registrar dispositivo, SO, assinatura e versão; executar casos de aceite | Mínimos declarados; validação física pendente |
| RNF12 — Legibilidade/acessibilidade | Campo focado e ação permanecem utilizáveis com teclado, fonte ampliada e temas claro/escuro | Telas 360×640; fonte 200%; leitor de tela; contraste alvo WCAG AA: 4,5:1 em texto comum | Meta de aceite; medições e testes físicos pendentes. Tema/máscara não são RNFs |
| RNF13 — Desempenho | Abertura p95 ≤ 3 s; lista de 100 registros p95 ≤ 500 ms | Build release, aparelho intermediário identificado; 30 execuções; separar latência local/API; fixar rede e volume | Meta não medida; não prometer resposta universal abaixo de 100 ms |
| RNF14 — Operação | Consultas repetidas/reinício não alteram marco persistido nem hashes de senha | Comparar metadados antes/depois de migração e consultas | Testes de data estável e migração; restart do processo é operação externa |
| RNF15 — Comunicação | Produção usa HTTPS e URL estável; não transmitir senha/sessão em HTTP público | Inspecionar implantação e certificados; LAN HTTP é desenvolvimento | Requisito de implantação pendente de evidência; túnel de desenvolvimento não garante disponibilidade |
| RNF16 — Manutenção | Documento, contrato, DDL e testes usam mesmos IDs, domínios e versões | Regerar inventário/diagramas e revisar alterações de regra | Scripts documentais e checklist; sem promessa de sincronização automática de textos manuais |
| RNF17 — PDF | Português legível, texto longo paginado, versão/status/fuso identificados e aviso não final | Fixtures longas e estados de ata, mais download em aparelhos | Testes de geração registrados; download/compartilhamento físico pendentes |

## 9. Contratos de interface e serialização

Campos de entrada são componentes nativos não controlados por value; usam defaultValue e ref para sincronizar alterações externas/máscaras. A aplicação ainda utiliza estado React para representar formulários e dados. Isso não significa ausência de estado ou teste de foco/cursor comprovado.

Tema: PUT /api/users/:id, JSON {"theme":"DARK"}; resposta deve confirmar e só então a interface sincroniza. Banco: users.theme. Cache: JSON.stringify do snapshot sanitizado na chave @synple:incremento-1. Não existe persistência isolada na chave theme e não se usam abreviações L/D.

Recuperação: tela Login → Esqueci minha senha; campo E-mail cadastrado e botão Enviar código por e-mail; segunda etapa com código/nova senha/confirmação. JSON do envio: {email}; JSON da redefinição: {email,code,newPassword}. O cliente não recebe o hash do código. Cadastros usam outra etapa Ativar conta e outro par de colunas/desafios.

Sessão: perfil devolvido por login inclui token; api.js separa o token do perfil e o envia em Authorization: Bearer. Cache não recebe esse token. A validação da sessão é no servidor a cada recurso privado; biometria apenas libera sessão protegida localmente e autoriza o formulário de perfil.

Estados de interface, fonte e componentes: [contrato de interfaces](../Synple/docs/INTERFACES.md). Padrões de programação diários: [PADROES_DESENVOLVIMENTO.md](../Synple/docs/PADROES_DESENVOLVIMENTO.md). Os formulários, o modelo físico e os dicionários adotam os identificadores reais; classes conceituais usam nomes de domínio em português com mapeamento explícito.

## 10. Testes, rastreabilidade e evidências

Cada RF está ligado a um contrato e a uma sequência no próprio formulário. Para execução manual, registrar ID, build/commit, aparelho/SO, pré-condições, dados fictícios, passos, esperado, obtido, responsável/data e evidência. Uma linha de roteiro não é resultado aprovado.

| Arquivo de teste | Comportamentos relacionados | RFs principais |
| --- | --- | --- |
| backend/test/security.test.js | Acesso, senha alternativa negada, sessão/hash, conta pendente/ativação, SMTP simulado, expiração, sincronização, unicidade, transferência, comissão e convite/ticket/limite/logout | RF01, RF04, RF07, RF11, RF12, RF17–RF26 |
| backend/test/meetings.test.js | Transações, elegibilidade, presença, versões, unanimidade, concorrência, histórico, permissões e PDF | RF06, RF02.01–RF02.10 |
| backend/test/migrate.test.js | Reaplicação sem redefinir senha e coordenador atribuído a comissão antiga sem responsável | RF06, RF17 |
| backend/test/backend.test.js | Conexão/tabelas, dados fictícios de demonstração, exclusão de usuário e estrutura de recuperação | Persistência e operação; não comprova interface ou envio real |
| backend/test/meetingMinutesPdf.test.js | Conteúdo, fonte e paginação do PDF | RF02.10 |
| mobile/test/validation.test.js | E-mail, formulários, senhas, telefone/CNPJ | RF01, RF04, RF07, RF10, RF19 |
| mobile/test/cacheSafety.test.js | Remoção de credenciais aninhadas sem mutar objeto original | RF25 |
| mobile/test/meetings.test.js e meetingMinutesPdf.test.js | Datas, lista, aprovadores, URL/HEAD/MIME/erros antes do navegador | RF02.01, RF02.06, RF02.09, RF02.10 |

[Resultados registrados da revisão de código](../Synple/docs/VERIFICACAO_CORRECOES.md): 35 testes backend e 23 mobile aprovados, exportação de bundles e migração. Nesta revisão documental, extração de schema e renderização UML são validações de documentação; não são nova execução dos 58 testes ou dos APKs. [Registro desta revisão documental](VERIFICACAO_DOCUMENTACAO.md).

**Roteiro manual complementar:** executar RFs em Android e iOS, usando duas contas em dois aparelhos; testar offline, teclado/fonte/tema, OAuth, envio real de e-mail, biometria cancelada, mudança de propriedade, coordenação, aceite/recusa e PDF com ticket expirado. Registrar também limites conhecidos para não confundir resultado observado com comportamento desejado.

## 11. Limitações e lacunas verificadas

1. Recuperação exige pelo menos oito caracteres no aplicativo e no servidor; o código é consumido uma única vez.
2. Recuperação valida formato de e-mail no cliente e no servidor. SMTP real e recebimento de mensagens continuam exigindo teste operacional.
3. Domínios de papel/tema/situação em várias tabelas dependem da API. UNIQUE de nome de comissão por organização não existe. Mínimo de coordenador não é uma restrição CHECK do banco.
4. Revogação de vínculo organizacional não apaga automaticamente os vínculos de comissão. Nem todas as rotas repetem a checagem de organização APPROVED da interface. Revisar consistência de autorização antes de produção.
5. Exclusão de organização segue cascatas SQL e não tem uma proteção histórica geral implementada. As proteções de exclusão de conta/ata não podem ser generalizadas a todas as entidades.
6. Reconvite após rejeição não está implementado: o vínculo único existente provoca conflito no convite novo. E-mail de convite para organização não é enviado; o convite é interno.
7. Não há autenticação offline por senha. Sessão reaberta requer servidor. Logout offline limpa o aparelho sem comprovar revogação remota imediata.
8. Biometria exige novo APK/módulos nativos, hardware e enrollment; edição de perfil no fluxo atual é bloqueada quando indisponível. Servidor não recebe atestado biométrico.
9. Atas guardam conteúdo/decisões atuais, sem histórico completo ou assinatura digital. Array de aprovadores não tem FK por elemento.
10. Papéis/quantidade de coordenadores, retenção de presença/atas, acessibilidade e itens adicionais de reunião precisam de validação com a comunidade. Não há entrevistas comprovadas nesta documentação.
11. Permanecem alertas de dependências do Expo, conforme relatório de correções; não declarar segurança absoluta com base nos testes.
12. Tags Docker/CLI flutuantes, tempo de resposta e disponibilidade de túneis não constituem garantias de versão fixa, desempenho universal ou hospedagem permanente.

## 12. Padrões de entrega e manutenção

Antes de entregar: conferir padrão institucional fornecido pelo professor (o formulário original não está disponível neste checkout); manter esta especificação como referência principal, dicionários e fontes UML como anexos versionados; registrar commit/build/data da evidência; separar teste automatizado, renderização e teste físico; citar somente tecnologias instaladas; atualizar todas as fichas afetadas por mudança de contrato.

Não há necessidade de anexar node_modules ou senhas para documentar. Dicionário físico e versões são regenerados com generate-data-dictionary.cjs; fontes UML com generate-uml.cjs; esta especificação com generate-main-spec.cjs. Qualquer regeneração exige revisão semântica dos textos manuais e conferência visual das imagens. [Índice geral do projeto](../Documentacao_do_ProjetoSynple.md).
`;
md=md.replace(/\\\{/g,'{').replace(/\\\}/g,'}');
fs.writeFileSync(path.join(docs,'incremento-1-especificacao-completa.md'),require('./documentation-paths.cjs').relocateDocument('docs/incremento-1-especificacao-completa.md',md).text);
fs.writeFileSync(path.join(docs,'requisitos.snapshot.json'),JSON.stringify(R.map(([id,name,actor,trigger,pre,steps,exceptions,data,api,sequence])=>({id,name,actor,trigger,pre,steps,exceptions,data,api,sequence})),null,2)+'\n');
console.log(`${R.length} requisitos funcionais consolidados na especificação principal.`);
