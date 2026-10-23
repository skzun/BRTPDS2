# Documentação técnica — Synple

Atualizada em 23/10/2026.

Este documento reúne as mudanças recentes do aplicativo e os procedimentos de execução. O tutorial de uso e inicialização está em [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md); os guias específicos estão em [COMO_RODAR_DOCKER.md](COMO_RODAR_DOCKER.md), [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md) e [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md).

O [Incremento 2 — reuniões](docs/INCREMENTO_2.md) contém casos de uso, fichas de requisitos funcionais, regras, classes e dicionário, modelo relacional e dicionário, requisitos não funcionais, sequências para todos os casos de uso, rastreabilidade e roteiro de aceitação/demonstração.

## Arquitetura e execução local

### Monitoramento administrativo e diagramas

Os diagramas dos [incrementos 1](../docs/Diagramas/Incremento_1.md) e [2](../docs/Diagramas/Incremento_2.md) estão em `docs/Diagramas` na raiz do repositório. O [README principal](../README.md) apresenta o estado atual do projeto e encaminha aos manuais.

`GET /api/system` fornece métricas reais do processo Node e do PostgreSQL para a aba **Sistema**: nome, versão do pacote backend, PID, host, plataforma, ambiente, porta, tempo online, memória RSS/heap e total/livre do ambiente, sockets TCP, requisições em andamento, pool PostgreSQL e tamanho/versão/conexões do banco. Não existe serviço de uploads; o endpoint informa essa indisponibilidade explicitamente.

A rota exige `Authorization: Bearer <systemToken>`. O backend emite uma sessão assinada de oito horas ao validar a senha cadastrada de um administrador ou sua identidade Google; a API confirma o cargo atual no banco a cada consulta. O token fica em memória no app, e reiniciar a API invalida as sessões. A autenticação administrativa por senha não aceita os atalhos de senha da demonstração. Esse controle protege a nova rota; não substitui a revisão de autorização das demais rotas apontada no incremento 2.

O painel atualiza a cada 15 segundos, permite atualização manual e identifica dados anteriores quando a coleta falha. Os contadores incluem conexões keep-alive e o próprio monitoramento; não medem usuários autenticados. Em Docker, host/PID são do container e a memória representa o ambiente observado pelo processo. As operações antigas de setup, reinício de subsistemas e reset continuam sendo operações locais da demonstração.

- `mobile/`: aplicativo Expo/React Native.
- `backend/`: API Express/Node.js.
- `postgres`: banco PostgreSQL 16, iniciado pelo Docker Compose.

Para iniciar banco e API em qualquer computador com Docker Desktop:

```powershell
docker compose up -d --build
```

A API fica em `http://localhost:3001`. A configuração não mantém mais o IP da casa: navegador e emulador usam `localhost`; o emulador Android resolve esse endereço para `10.0.2.2`. Para celular na mesma rede Wi-Fi, `npm --prefix mobile run start:dev-client` ou `npm --prefix mobile run start:go` detecta o IP atual do notebook e grava `mobile/.env.local` (ignorado pelo Git). O primeiro inicia o development build; o segundo inicia o Expo Go. Para acesso fora da rede, rode `npm run dev:tunnel` na raiz (ou `npm --prefix mobile run tunnel`): esse comando expõe a API e inicia o Metro pelo túnel do Expo. Rodar apenas `npx expo start --tunnel` expõe o Metro, não a API.

Para iniciar o aplicativo:

```powershell
npm --prefix mobile start
```

O comando correto é sempre o CLI local do projeto (`npx expo ...` ou os scripts `npm`), nunca o `expo-cli` global descontinuado. Caso as dependências ainda não estejam instaladas, execute `npm install` dentro de `mobile/` antes de iniciar.

## Experiência no app

### Campos cobertos pelo teclado

As telas de autenticação e a área autenticada usam `KeyboardAvoidingView` com rolagem. Assim, ao selecionar um campo próximo ao fim da tela, o conteúdo é deslocado e o toque nos controles continua funcionando. No Android o comportamento é `height`; no iOS, `padding`.

### Criação de organização sem duplicidade

Ao criar uma organização, o botão é bloqueado imediatamente e mostra **“Confirmando no servidor...”**. Ele só volta a ficar disponível após a resposta da API. A organização é incluída na lista local somente depois da confirmação do PostgreSQL.

A proteção também existe no servidor: o documento da organização é único no banco e a rota de criação usa inserção sem sobrescrever registros existentes. Uma segunda tentativa para o mesmo documento recebe conflito, em vez de criar ou atualizar duplicadamente.

## Login e cadastro com Google

O app oferece **Continuar com Google** tanto no login quanto no cadastro. O fluxo é OAuth/OpenID Connect:

1. O aplicativo abre a tela oficial de autenticação do Google.
2. O Google devolve um ID token.
3. O backend valida assinatura, emissor, público (Client ID), e-mail verificado e identificador Google.
4. Uma conta existente com o mesmo e-mail é vinculada com segurança; uma nova conta é criada com `google_id` único.

Não há Client Secret no aplicativo. Os Client IDs públicos ficam em `mobile/.env`; a lista permitida é configurada somente no backend por `GOOGLE_OAUTH_CLIENT_IDS`. Consulte [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md) para criar as credenciais e preencher as variáveis.

### Limites de teste

OAuth com redirecionamento não funciona no Expo Go. Para Android/iOS, gere e instale uma development build ou uma build do aplicativo; no navegador, use `npm --prefix mobile run web`. Um projeto OAuth externo que ainda não foi verificado tem limite de novos usuários e pode exibir aviso de app não verificado. Como o Synple solicita somente identificação básica, não há necessidade de escopos sensíveis.

## Custo e licenças

O código incluído é baseado em bibliotecas open source: `expo-auth-session`, `expo-web-browser` e `google-auth-library`. A implementação não usa Firebase Authentication, Identity Platform, APIs pagas do Google nem Client Secret; criar e usar as credenciais OAuth básicas para este login não habilita cobrança no projeto.

Isso significa que **o recurso implementado não tem custo cobrado pelo Synple e não requer plano pago do Google atualmente**. Entretanto, não é correto prometer que o Google nunca alterará preços, políticas ou limites: essas regras pertencem ao Google e podem mudar. Também são custos independentes do login: hospedagem da API/banco em nuvem e publicação em lojas. A distribuição completa no Google Play possui taxa única de registro; publicação na App Store requer assinatura anual, segundo as páginas oficiais das plataformas.

Referências de política e custos: [verificação e limite para apps OAuth não verificados](https://support.google.com/cloud/answer/13463817), [registro do Google Play](https://support.google.com/android-developer-console/answer/16640817) e [Apple Developer Program](https://developer.apple.com/programs/).

## Segurança e operação

- Não versionar `mobile/.env` ou `backend/.env`; use os arquivos `.env.example` como modelo.
- Não exponha `GOOGLE_OAUTH_CLIENT_IDS` como segredo crítico, mas mantenha chaves privadas e senhas apenas no backend.
- Em produção, use HTTPS, uma URL pública para a API e a política de privacidade solicitada na tela de consentimento Google.
- Antes de liberar a aplicação externamente, preencha página inicial, política de privacidade e dados de suporte no consentimento OAuth; se necessário, envie a aplicação para verificação do Google.

## Recuperação de senha por e-mail

O app solicita um código de seis dígitos enviado pelo backend via Gmail SMTP. O código expira em 15 minutos e é guardado no banco como hash. Configure `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS` (Senha de app, não a senha normal do Gmail) e `EMAIL_FROM` somente em `backend/.env` ou no ambiente do backend hospedado. A chamada do app espera até 45 segundos pela resposta do provedor. Veja [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md).

A redefinição atualiza a senha do login por e-mail e não remove `google_id`. O usuário continua podendo escolher **Continuar com Google** usando a mesma conta Google; a senha nova não é usada na tela de login do Google.

## Incremento 2 — reuniões das comissões

O módulo relaciona a reunião à comissão e permite ao presidente (`COORDINATOR`) ou proprietário da organização agendar com título, início, término e pauta. Os convidados selecionados pertencem à comissão; recebem um convite interno no app, que podem aceitar ou recusar. O organizador é incluído com aceite automático. Entrada e saída são ações separadas, feitas por cada participante e registradas pelo relógio do servidor.

A lista de presença identifica convidados, ausências e horários; sua contagem de presentes usa somente entradas efetivamente registradas. O app pode gerar/compartilhar o texto da lista. A ata é salva em rascunho, submetida e aprovada por **todos que registraram entrada até a submissão**, incluindo o presidente presente e quem já saiu. O conjunto de aprovadores é fixado na submissão. Novas entradas ficam bloqueadas durante a revisão e depois da aprovação; saídas continuam disponíveis.

Uma reprovação devolve a ata para correção. Antes da aprovação final, o gestor também pode corrigir uma revisão em andamento: o sistema cria outra versão em rascunho, remove os votos e exige nova submissão. A decisão informa a versão lida; se ela mudou, o servidor retorna conflito e o usuário precisa ler novamente. A aprovação final bloqueia alterações e libera o compartilhamento da ata. O banco mantém o texto e as decisões atuais, sem histórico completo dos conteúdos/votos substituídos.

### Exportação da ata em PDF

Em **Reuniões**, **Gerar ata em PDF** exporta a ata já salva em qualquer situação. O botão fica desabilitado durante alterações locais não salvas. O PDF identifica organização, comissão, reunião, versão, situação, presença e aprovações; rascunho, revisão e rejeição recebem aviso de documento não final. O arquivo é uma representação dos dados atuais do servidor e não contém assinatura digital. Sua geração não altera a ata nem seus votos.

A API disponibiliza `HEAD` e `GET /api/meetings/:meetingId/minutes/pdf?userId=...&version=...&timeZone=...`. A primeira chamada confere acesso e versão antes de o app abrir o download no navegador externo. O backend permite ao gestor atual ou a um convidado, inclusive histórico, consultar a reunião e exige a versão atual. Uma versão antiga recebe HTTP 409; é necessário atualizar a reunião e gerar novamente. O fuso enviado é um identificador IANA, como `America/Sao_Paulo`; sem ele, o servidor usa esse fuso padrão. A limitação de identificação do ator descrita abaixo também se aplica à exportação.

O servidor gera o arquivo com `pdfkit` e responde como `application/pdf`, com disposição de download. Não há nova biblioteca nativa mobile, tabela ou armazenamento permanente do PDF. Para atualizar uma instalação local, execute `npm --prefix backend install` e reinicie a API; no Docker, execute `docker compose up -d --build`. Recarregue o JavaScript no Expo/Metro; não é necessário outro APK/development build por causa desta opção. O procedimento para salvar/compartilhar em Android, iOS e computador está em [Gerar ata em PDF](GUIA_USO_E_INICIALIZACAO.md#gerar-ata-em-pdf).

Os dados são persistidos em `meetings`, `meeting_invitations`, `meeting_attendance`, `meeting_minutes` e `meeting_minutes_approvals`. Os vínculos e cargos de `commission_members`, pré-requisito para agendamento/convites, também são gravados no servidor. O contrato HTTP e cada coluna estão descritos no [documento do incremento](docs/INCREMENTO_2.md).

A remoção de um vínculo com a comissão preserva convites e registros históricos da reunião. A pessoa mantém a consulta das reuniões já convidadas e o direito/dever de decidir quando integra o conjunto de aprovadores da versão submetida. A gestão depende do vínculo/cargo atual ou da propriedade da organização; um convite histórico não conserva o cargo anterior.

O backend aplica o esquema idempotente ao iniciar. Para aplicar somente o esquema com o PostgreSQL disponível, execute `npm run migrate` na raiz, ou `npm --prefix backend run migrate`. O comando usa `backend/.env`, não executa seeds e preserva senhas. Use `init-db` somente para a preparação inicial consciente dos dados de demonstração, pois ele também prepara essas contas. Com Docker Compose, reconstrua/reinicie a API após atualizar o código (`docker compose up -d --build`).

As regras de papel/vínculo/estado são verificadas no backend, mas a identidade atual é informada pelo cliente. Antes de exposição pública em produção, os recursos precisam de sessão/token validado no servidor e a sincronização deve ser filtrada por usuário autorizado. Os testes do módulo e o roteiro documental não substituem a validação em dispositivos físicos Android e iOS solicitada na apresentação. O formulário institucional e o levantamento de itens adicionais com a comunidade permanecem dependências documentais externas, identificadas no documento do incremento.

## Guias de operação

- [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md): preparação em outro computador, modos LAN/túnel, abertura do app e uso dos fluxos principais.
- [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md): OAuth Android/iOS/Web e build compatível.
- [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md): credenciais Gmail SMTP para recuperação.
- [COMO_RODAR_DOCKER.md](COMO_RODAR_DOCKER.md): inicialização e operação com Docker Compose.
- [docs/INCREMENTO_2.md](docs/INCREMENTO_2.md): especificação e demonstração de reuniões, convites, presença, ata e aprovação unânime.

