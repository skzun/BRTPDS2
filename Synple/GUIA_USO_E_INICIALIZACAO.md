# Synple — guia de uso e inicialização

Atualizado em 17/10/2026.

Este guia explica como preparar o projeto, iniciar a API e abrir o app no celular. Para login Google, consulte também [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md). Para configurar o envio de códigos de recuperação, consulte [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md).

## 1. O que instalar

- Node.js e npm.
- Git para clonar o repositório, se necessário.
- Docker Desktop para iniciar PostgreSQL e API juntos. Como alternativa, use uma instalação local do PostgreSQL.
- Para usar o túnel externo: `cloudflared` instalado e disponível como `cloudflared.exe` no `PATH`, ou em `%LOCALAPPDATA%\Synple\cloudflared.exe`.
- Para login Google no Android: o development build do Synple instalado no celular. O Expo Go não inclui o módulo nativo do Google.

Em outro computador, clone ou copie o repositório e use o diretório onde ele foi salvo. Os arquivos `backend/.env` e `mobile/.env` são locais e não são compartilhados pelo Git; precisam ser configurados em cada máquina/servidor.

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

Com Docker Desktop aberto, inicie o PostgreSQL e a API:

```powershell
docker compose up -d --build
```

Confirme que os serviços subiram e que a API responde:

```powershell
docker compose ps
Invoke-RestMethod http://localhost:3001/api/health
```

O health deve informar API `OK` (ou `DEGRADED`) e banco `ONLINE`. Se estiver usando PostgreSQL instalado diretamente no computador, instale também as dependências do backend (`npm --prefix backend install`), configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `backend/.env`, inicialize o schema uma vez (`npm --prefix backend run init-db`) e então inicie backend e app com `npm run dev` na raiz.

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
6. **Perfil e saída:** use a área de perfil para ver/editar os dados disponíveis e **Sair** para encerrar a sessão no dispositivo.

Os dados de organizações, solicitações e comissões são sincronizados com o backend/PostgreSQL quando a API está acessível.

## 8. Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| `EADDRINUSE` na porta 3001 | Já existe um backend ativo. Com Docker Compose, mantenha o backend do Compose e rode somente `npm --prefix mobile run start:dev-client` ou `npm --prefix mobile run start:go`, ou use `npm run dev:tunnel`, que detecta uma API Synple já ativa. |
| O QR abre Expo Go, mas o Google não funciona | Instale/abra o development build do Synple. Expo Go não contém o módulo nativo do Google. |
| “Falha na comunicação com o servidor” | Confirme que o terminal/túnel atual continua aberto e que `/api/health` responde. No túnel, use o QR gerado pela mesma sessão em execução. |
| O pedido do código de recuperação demora | O backend aguarda o provedor de e-mail aceitar a mensagem. Aguarde até 45 segundos; confira `backend/.env`, logs do backend e spam/lixo eletrônico. |
| O código de recuperação não chega | Confirme SMTP Gmail e a Senha de app no backend, confira se o endereço está cadastrado e veja spam. O código expira após 15 minutos. |
| Google retorna erro de identidade | Confirme que está escolhendo a mesma conta Google do cadastro, que a conta está incluída como usuário de teste enquanto o OAuth estiver em teste, e que o APK corresponde ao package/SHA-1 cadastrado. Confira os logs do backend. |
| O terminal de túnel não mostra QR | Aguarde o túnel Cloudflare da API e o Metro terminarem de iniciar. Se o comando encerrar, leia o erro anterior; confira `cloudflared` no PATH e tente novamente. |

Para encerrar a sessão do Expo/túnel, pressione `Ctrl+C` no terminal. Para parar os containers, na raiz execute `docker compose down`. **Não use `docker compose down -v` se quiser manter os dados**, pois `-v` apaga o volume persistente do banco.
