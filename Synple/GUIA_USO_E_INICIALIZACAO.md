# Synple — guia de uso e inicialização

Atualizado em 23/10/2026.

Este guia explica como preparar o projeto, iniciar a API e abrir o app no celular. Para login Google, consulte também [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md). Para configurar o envio de códigos de recuperação, consulte [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md). Os requisitos, diagramas e roteiro de avaliação do módulo de reuniões estão em [docs/INCREMENTO_2.md](docs/INCREMENTO_2.md).

## 1. O que instalar

- Node.js e npm.
- Git para clonar o repositório, se necessário.
- Docker Desktop para iniciar PostgreSQL e API juntos. Como alternativa, use uma instalação local do PostgreSQL.
- Para usar o túnel externo: `cloudflared` instalado e disponível como `cloudflared.exe` no `PATH`, ou em `%LOCALAPPDATA%\Synple\cloudflared.exe`.
- Para login Google no Android: o development build do Synple instalado no celular. O Expo Go não inclui o módulo nativo do Google.

Em outro computador, clone ou copie o repositório e use o diretório onde ele foi salvo. Os arquivos `backend/.env` e `mobile/.env` são locais e não são compartilhados pelo Git; precisam ser configurados em cada máquina/servidor.

### Checklist para executar em outro computador

Clonar o projeto é apenas o primeiro passo. Na primeira execução:

1. Instale Node.js/npm, Docker Desktop e Cloudflared (instruções abaixo).
2. Abra o terminal na pasta principal `Synple`, onde está o `package.json` do workspace.
3. Configure `backend/.env` e `mobile/.env` a partir dos modelos, conforme a seção 2. O envio de recuperação de senha também exige configurar o SMTP nesse backend.
4. Instale as dependências do mobile e inicie o banco/API conforme a seção 3. Se executar o backend diretamente pelo Node, instale também suas dependências.
5. Para login Google no Android, instale no celular o development build configurado para o Synple, conforme a seção 6. Confira os Client IDs e o certificado de assinatura em [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md).
6. Na raiz `Synple`, execute `npm run dev:tunnel` e abra o QR atual pelo development build no celular.

Depois dessa preparação, mantenha Docker Desktop e banco/API disponíveis e execute `npm run dev:tunnel` nas próximas sessões. O script cria os túneis, atualiza o endereço da API usado pelo mobile e inicia o Metro automaticamente. Mantenha o computador e o terminal em execução durante o uso.

### Banco próprio ou dados compartilhados

Se cada computador iniciar seu próprio PostgreSQL, cada instalação terá seus próprios dados. Clonar o código não copia contas, organizações, reuniões ou atas do banco de outra pessoa. Mesmo usando a mesma conta Google, os dados do Synple pertencem ao backend/banco acessado.

Para várias pessoas acessarem os mesmos dados, todos precisam usar a mesma API e o mesmo banco. Em uma demonstração, uma pessoa pode executar `npm run dev:tunnel` e compartilhar o QR atual com os celulares dos participantes que têm o development build compatível instalado; todos usarão a API dessa sessão. Os participantes não precisam iniciar outro backend no próprio computador para participar dessa demonstração. Para uso permanente, hospede a API e o banco em um servidor compartilhado e configure a URL HTTPS estável no app.

### Instalar o Cloudflared no Windows

Em cada computador que for executar `npm run dev:tunnel`, instale o Cloudflared pelo PowerShell:

```powershell
winget install --id Cloudflare.cloudflared --exact
```

Feche e abra novamente o terminal para carregar o `PATH` atualizado. Confirme a instalação:

```powershell
cloudflared --version
```

Depois, na pasta principal `Synple`, execute `npm run dev:tunnel`. O executável instalado em um computador não é compartilhado pelo Git; clonar o projeto ou rodar `npm install` não instala o Cloudflared. Se o Windows não tiver `winget`, use o download para Windows na [documentação oficial da Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) e disponibilize o executável como `cloudflared.exe` no `PATH` ou em `%LOCALAPPDATA%\Synple\cloudflared.exe`.

## 2. Preparar as variáveis de ambiente

Na raiz do repositório, crie o arquivo local do backend a partir do modelo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Configure `backend/.env` com os parâmetros do banco e, para recuperação de senha e login Google, os valores correspondentes. Para Docker Compose, o Compose fornece os parâmetros de conexão ao PostgreSQL do container; mantenha as variáveis de SMTP e Google nesse arquivo.

Crie `mobile/.env` a partir do modelo e preencha os Client IDs OAuth:

```powershell
Copy-Item mobile/.env.example mobile/.env
```

O mobile precisa dos IDs Android, iOS e Web. O backend precisa dos IDs permitidos em `GOOGLE_OAUTH_CLIENT_IDS`. Os Client IDs são identificadores públicos; senha de app Gmail, senha do banco e outros segredos ficam somente em `backend/.env`. Veja [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md) para configurar os IDs e certificados.

Para recuperação de senha, configure `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS` (Senha de app do Gmail) e `EMAIL_FROM` em `backend/.env`. Não use a senha normal do Gmail. O passo a passo está em [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md).

## 3. Instalar dependências e preparar o banco

Instale as dependências do app uma vez:

```powershell
Set-Location mobile
npm install
Set-Location ..
```

Para atualizar uma instalação local do backend, execute também `npm --prefix backend install` na raiz. A geração de atas em PDF usa `pdfkit` no servidor; o Docker instala essa dependência ao reconstruir a imagem com o comando abaixo.

Com Docker Desktop aberto, inicie o PostgreSQL e a API:

```powershell
docker compose up -d --build
```

Confirme que os serviços subiram e que a API responde:

```powershell
docker compose ps
Invoke-RestMethod http://localhost:3001/api/health
```

O health deve informar API `OK` (ou `DEGRADED`) e banco `ONLINE`. O backend aplica o esquema do banco na inicialização, incluindo as tabelas de atas do incremento 2. Para aplicar somente a atualização do esquema, com PostgreSQL acessível e as dependências do backend instaladas, execute na raiz:

```powershell
npm run migrate
```

Esse comando preserva os dados e as senhas. Em um banco do Docker, confirme que as variáveis de conexão do comando apontam para a porta publicada do PostgreSQL; a API dentro do Compose já usa a configuração do container. Se estiver usando PostgreSQL instalado diretamente no computador, instale também as dependências do backend (`npm --prefix backend install`), configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `backend/.env` e prepare um banco vazio. `npm --prefix backend run init-db` pode criar o banco e os dados de demonstração na primeira instalação; para atualizações posteriores use `npm run migrate`, pois `init-db` também prepara/redefine credenciais de demonstração. Depois inicie backend e app com `npm run dev` na raiz.

## 4. Abrir o app na mesma rede Wi-Fi

Com Docker Compose já executando a API, escolha o destino e inicie o Expo:

```powershell
# Development build do Synple (suporta login Google)
npm --prefix mobile run start:dev-client

# Expo Go (não suporta login Google nativo)
npm --prefix mobile run start:go
```

Os dois scripts detectam o IP local do computador. Abra o QR no celular conectado à mesma rede Wi-Fi, usando o app selecionado no comando. Para Google Login, use o development build do Synple.

Se estiver usando API local fora do Docker e PostgreSQL já disponível, `npm run dev` na raiz inicia backend e development build/Metro juntos. Não execute essa opção ao mesmo tempo que outro backend já ocupa a porta 3001.

## 5. Abrir o app em outra rede ou fora de casa

Use um túnel para a API e outro para o Metro. Na raiz do repositório:

```powershell
npm run dev:tunnel
```

O script reaproveita uma API Synple saudável na porta 3001 ou inicia o backend, cria uma URL temporária para a API e inicia o Expo com o túnel. Mantenha o terminal aberto. O endereço e o QR mudam quando a sessão de túnel é recriada; use o QR da sessão atual.

- Para login Google, abra o QR pelo **development build do Synple** instalado no celular.
- Para abrir somente as telas com Expo Go, use `npm run dev:tunnel:go`. Google Login nativo não funciona no Expo Go.
- `npx expo start --tunnel` sozinho cria túnel apenas para o Metro; não publica a API na porta 3001.

O quick tunnel é temporário e serve para desenvolvimento. Ele não é um endereço permanente para um APK de produção. Para builds distribuídas, configure uma URL HTTPS estável da API no ambiente de build e hospede backend e banco em um servidor acessível.

## 6. Gerar/instalar o development build Android com Google Login

O módulo nativo de autenticação Google exige um build do aplicativo. O Android SDK local não é necessário se o EAS construir na nuvem, mas a conta Expo precisa estar autenticada e o projeto EAS configurado:

```powershell
Set-Location mobile
npx eas-cli build --platform android --profile development
```

Baixe e instale o APK indicado pelo EAS. Depois, na raiz, inicie `npm run dev:tunnel` e abra o QR atual pelo Synple development build. Se a configuração OAuth (package name, SHA-1 ou IDs) mudar, gere um novo build depois de atualizar as credenciais. Consulte [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md).

## 7. Usar o app

1. **Criar conta ou entrar:** use e-mail e senha cadastrados ou **Continuar com Google**. No Google, escolha a mesma conta Google associada ao e-mail do Synple. A senha do app não é digitada na janela do Google.
2. **Recuperar acesso:** toque em **Esqueci minha senha**, informe o e-mail cadastrado e solicite o código. O app envia um código de seis dígitos por e-mail, válido por 15 minutos. Digite o código e defina uma nova senha.
3. **Google após recuperar senha:** recuperar senha altera a senha usada no login por e-mail e não remove o vínculo Google. Para entrar com Google, escolha a conta Google vinculada; não use a senha nova nessa tela.
4. **Organizações:** procure uma organização aprovada e solicite acesso, ou registre uma organização. O registro aguarda aprovação do administrador do sistema.
5. **Administrar organização:** depois de aprovada, o proprietário pode gerenciar solicitações, membros, cargos, equipes e comissões conforme as permissões da conta.
6. **Reuniões:** depois de ingressar em uma comissão, abra **Reuniões**. O presidente da comissão ou proprietário da organização pode agendar; os convidados aceitam/recusam e registram sua própria entrada/saída. O passo a passo está abaixo.
7. **Perfil e saída:** use a área de perfil para ver/editar os dados disponíveis e **Sair** para encerrar a sessão no dispositivo.

Os dados de organizações, solicitações e comissões são sincronizados com o backend/PostgreSQL quando a API está acessível.

### Reuniões, presença e atas

Prepare primeiro os vínculos: o proprietário aprova o acesso à organização, adiciona as pessoas à comissão e atribui o cargo de presidente a quem vai conduzir as reuniões. Essas alterações precisam estar confirmadas no servidor. O papel técnico do presidente é `COORDINATOR`; integrante comum usa `MEMBER`.

1. **Agendar:** como presidente ou proprietário, abra **Reuniões** e selecione a comissão. Informe título e pauta. Nos grupos **Início** e **Término**, preencha **Data** em **DD/MM/AAAA** e **Horário** em **HH:mm**; os separadores são inseridos automaticamente e os horários seguem o fuso local do dispositivo. O término deve ser posterior ao início. Selecione **Membros convidados** e toque em **Agendar e convidar**. O organizador fica com convite aceito automaticamente; a entrada continua sendo registrada separadamente.
2. **Responder:** como integrante convidado, abra a reunião e toque em **Aceitar convite** ou **Recusar**. O convite aparece no app depois da sincronização; não é um e-mail. Só o aceite permite registrar entrada.
3. **Marcar presença:** cada participante, incluindo o presidente, toca em **Registrar entrada** e, ao terminar, em **Registrar saída**. Os horários vêm do servidor. A saída não apaga a participação; há um único registro de entrada/saída por pessoa nesta versão.
4. **Gerar lista:** confira a lista de convidados e a quantidade de pessoas com entrada. Toque em **Gerar / compartilhar lista de presença** para obter e compartilhar a lista atualizada; pessoas sem entrada são identificadas como ausentes.
5. **Escrever ata:** como gestor, preencha **Discussões e decisões** e toque em **Salvar rascunho da ata**. Depois use **Enviar ata para aprovação**. É necessária ao menos uma entrada registrada.
6. **Aprovar:** cada pessoa que registrou entrada até a submissão lê a versão e usa **Aprovar ata** ou **Rejeitar ata**, com comentário opcional. Todos esses participantes precisam aprovar, inclusive o presidente quando registrou entrada e quem já registrou saída. Pessoas que apenas aceitaram o convite não votam.
7. **Corrigir:** o gestor pode salvar uma correção antes da aprovação final, inclusive durante a revisão. A correção abre nova versão em rascunho e remove os votos anteriores; é necessário enviar e aprovar novamente. Uma ata aprovada fica bloqueada e pode ser compartilhada por **Compartilhar ata aprovada**.
8. **Gerar PDF:** depois de salvar a ata, toque em **Gerar ata em PDF**. O arquivo pode ser gerado em qualquer situação da ata; a versão e a situação aparecem no documento. Veja as instruções abaixo para baixar e compartilhar.

Use **Atualizar reuniões e aprovações** para ver respostas de outras contas. Novas entradas ficam bloqueadas enquanto a ata está em aprovação ou aprovada; saídas continuam permitidas. Se a versão mudar enquanto alguém lê, o voto antigo é recusado e a pessoa deve atualizar e ler a versão atual. Em falha de rede, os formulários preservam o texto para tentar novamente; confirme o sucesso antes de sair.

Quem for removido da comissão continua acessando em **Reuniões** os encontros para os quais já tinha convite. Se registrou entrada e integra os aprovadores da ata submetida, ainda precisa decidir sobre essa versão. O acesso histórico não mantém a permissão de agendar/editar atas por um cargo que a pessoa deixou de exercer.

O [documento do incremento 2](docs/INCREMENTO_2.md) inclui o roteiro completo de demonstração, critérios de aceitação e as limitações de autenticação da API antes de uso público em produção.

### Gerar ata em PDF

1. Abra **Reuniões**, selecione a reunião e confira o conteúdo da ata salva. Se estiver editando, toque em **Salvar rascunho da ata** ou **Salvar correção da ata** e aguarde a confirmação. O botão de PDF fica desabilitado enquanto houver alterações não salvas.
2. Toque em **Gerar ata em PDF**. O app confere no servidor o acesso e a versão da ata; em seguida, abre o navegador do dispositivo para baixar o arquivo.
3. No Android, confira o download no Chrome ou no navegador escolhido; abra o arquivo em **Downloads** para visualizar e compartilhar. No iPhone/iPad, use **Compartilhar → Salvar em Arquivos** no Safari. No computador, permita a abertura da nova aba; o navegador baixa o arquivo ou abre seu visualizador de PDF, conforme a configuração.
4. Confira a organização, a comissão, a reunião, a versão, a situação e os dados de presença/aprovação antes de compartilhar. Atas em rascunho, em aprovação ou rejeitadas recebem indicação de **documento não final**. Gerar o PDF não submete nem aprova a ata, e o arquivo não contém assinatura digital.

Se a versão mudar enquanto a tela estiver aberta, toque em **Atualizar reuniões e aprovações**, leia a ata atual e gere novamente. O arquivo representa os dados do servidor no momento da geração; um arquivo já baixado não recebe correções automaticamente. A API precisa estar acessível pelo navegador, inclusive no celular: mantenha o túnel atual aberto ao usar redes diferentes.

Para disponibilizar essa opção depois de atualizar o projeto, instale as dependências do backend e reinicie a API (`npm --prefix backend install` em uma instalação local, ou `docker compose up -d --build` com Docker). Recarregue o JavaScript do app pelo Expo/Metro. Esta opção não exige gerar outro APK ou development build, pois não adiciona um módulo nativo ao aplicativo.

## 8. Problemas comuns

### Consultar as informações do servidor

Entre como **Administrador do sistema** e abra a aba **Sistema**. O painel consulta a API a cada 15 segundos e também permite usar **Atualizar informações**. Ele mostra:

- Nome e versão da API, ID do processo (PID), Node.js, sistema operacional, ambiente de execução, endereço da API e nome do host.
- Tempo online e horário de início do processo da API.
- Memória total/livre do ambiente e memória usada pelo processo (RSS e heap).
- Conexões TCP abertas, requisições HTTP em andamento e conexões totais/ociosas/em espera no pool PostgreSQL.
- Situação, nome, versão, tamanho, latência, conexões e consultas ativas do banco de dados.
- Uploads: **não implementados**, pois o backend não possui serviço de armazenamento de arquivos enviados. Gerar PDF é uma operação de download.

Esses dados pertencem ao servidor, não ao celular. Em Docker, PID e nome do host pertencem ao container; a memória é a que o sistema operacional disponibiliza ao processo. Conexões TCP incluem keep-alive, e consultas/requisições ativas incluem o próprio monitoramento; não representam uma contagem de pessoas conectadas. O tempo online é atualizado em cada coleta e volta a zero ao reiniciar a API.

A consulta exige uma sessão administrativa validada pelo backend e a senha cadastrada no banco (ou login Google da conta administrativa). A sessão expira após oito horas e é invalidada quando a API reinicia; nesse caso, saia e entre novamente. O token fica apenas na memória do app. Se uma consulta falhar, o painel indica o erro e identifica os valores antigos como a última coleta bem-sucedida.

Após atualizar o projeto, reinicie a API local ou reconstrua o container com `docker compose up -d --build` e recarregue o aplicativo. Não é necessário um novo APK, pois o painel não adiciona módulos nativos. Os controles antigos de setup, reinício de subsistemas e reset continuam sendo operações locais da demonstração; não reiniciam o servidor real.

Os diagramas estão organizados por [incremento 1](../docs/Diagramas/Incremento_1.md) e [incremento 2](../docs/Diagramas/Incremento_2.md) na pasta `docs/Diagramas` da raiz do repositório.

### Solução de problemas

| Sintoma | O que conferir |
| --- | --- |
| `EADDRINUSE` na porta 3001 | Já existe um backend ativo. Com Docker Compose, mantenha o backend do Compose e rode somente `npm --prefix mobile run start:dev-client` ou `npm --prefix mobile run start:go`, ou use `npm run dev:tunnel`, que detecta uma API Synple já ativa. |
| `spawn cloudflared.exe ENOENT` | O executável do Cloudflared não foi encontrado nesse computador. Siga [Instalar o Cloudflared no Windows](#instalar-o-cloudflared-no-windows), reabra o terminal, confirme `cloudflared --version` e execute `npm run dev:tunnel` na raiz. |
| O QR abre Expo Go, mas o Google não funciona | Instale/abra o development build do Synple. Expo Go não contém o módulo nativo do Google. |
| “Falha na comunicação com o servidor” | Confirme que o terminal/túnel atual continua aberto e que `/api/health` responde. No túnel, use o QR gerado pela mesma sessão em execução. |
| O pedido do código de recuperação demora | O backend aguarda o provedor de e-mail aceitar a mensagem. Aguarde até 45 segundos; confira `backend/.env`, logs do backend e spam/lixo eletrônico. |
| O código de recuperação não chega | Confirme SMTP Gmail e a Senha de app no backend, confira se o endereço está cadastrado e veja spam. O código expira após 15 minutos. |
| Google retorna erro de identidade | Confirme que está escolhendo a mesma conta Google do cadastro, que a conta está incluída como usuário de teste enquanto o OAuth estiver em teste, e que o APK corresponde ao package/SHA-1 cadastrado. Confira os logs do backend. |
| O terminal de túnel não mostra QR | Aguarde o túnel Cloudflare da API e o Metro terminarem de iniciar. Se o comando encerrar, leia o erro anterior; confira `cloudflared` no PATH e tente novamente. |
| Reunião/ata não aparece ou tabela não existe | Atualize/reinicie o backend para aplicar o esquema ou rode `npm run migrate` com acesso ao PostgreSQL; depois toque em **Atualizar reuniões e aprovações**. |
| Não consigo agendar ou convidar alguém | Confirme no servidor o vínculo com a comissão, o cargo de presidente e o acesso aprovado da pessoa à organização. Só integrantes da mesma comissão podem ser selecionados como convidados. |
| Ata ainda não foi aprovada | Confira a versão atual e as decisões pendentes de todas as pessoas que registraram entrada, incluindo presidente e pessoas que já saíram. Correção exige nova submissão e novos votos. |
| **Gerar ata em PDF** não aparece ou está desabilitado | A opção aparece após salvar a primeira ata. Salve a ata ou a correção e aguarde a confirmação do servidor; edições pendentes desabilitam o botão. O PDF usa o conteúdo salvo. |
| O PDF não abre ou o navegador não baixa | Confira API/túnel e conexão do celular; atualize a reunião se a versão mudou. Após atualizar o código, instale as dependências do backend e reinicie/reconstrua a API. Veja [Gerar ata em PDF](#gerar-ata-em-pdf). |

Para encerrar a sessão do Expo/túnel, pressione `Ctrl+C` no terminal. Para parar os containers, na raiz execute `docker compose down`. **Não use `docker compose down -v` se quiser manter os dados**, pois `-v` apaga o volume persistente do banco.
