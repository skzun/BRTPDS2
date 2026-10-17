# Documentação técnica — Synple

Atualizada em 17/10/2026.

Este documento reúne as mudanças recentes do aplicativo e os procedimentos de execução. O tutorial de uso e inicialização está em [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md); os guias específicos estão em [COMO_RODAR_DOCKER.md](COMO_RODAR_DOCKER.md), [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md) e [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md).

## Arquitetura e execução local

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

## Guias de operação

- [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md): preparação em outro computador, modos LAN/túnel, abertura do app e uso dos fluxos principais.
- [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md): OAuth Android/iOS/Web e build compatível.
- [backend/EMAIL_RECOVERY_SETUP.md](backend/EMAIL_RECOVERY_SETUP.md): credenciais Gmail SMTP para recuperação.
- [COMO_RODAR_DOCKER.md](COMO_RODAR_DOCKER.md): inicialização e operação com Docker Compose.

