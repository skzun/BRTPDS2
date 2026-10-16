# Login com Google

O Synple usa OAuth/OpenID Connect do Google e bibliotecas open source (`expo-auth-session`, `expo-web-browser` e `google-auth-library`). A implementação não usa Firebase Authentication, Identity Platform nem APIs pagas: o login básico com as credenciais OAuth deste guia não exige plano pago do Google hoje.

> Não é possível garantir preços ou políticas futuras de uma plataforma de terceiros. Custos de hospedagem e de publicação nas lojas, se houver, são independentes deste login. Veja a seção de custos em [DOCUMENTACAO_SOFTWARE.md](DOCUMENTACAO_SOFTWARE.md#custo-e-licenças).

## 1. Criar as credenciais gratuitas

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um projeto e configure a tela de consentimento OAuth. Em seguida, crie três clientes OAuth no mesmo projeto:

- **Android**: use o pacote `com.conradobr1.synple` e o SHA-1 do certificado da build.
- **iOS**: use o Bundle ID `com.conradobr1.synple`.
- **Web**: para desenvolvimento, autorize a origem que o Expo Web usar, por exemplo `http://localhost:8081`.

Use somente os escopos básicos de identidade (`openid`, `email` e `profile`). Antes de disponibilizar o app para pessoas fora da equipe, informe página inicial, e-mail de suporte e política de privacidade na tela de consentimento. Aplicativos externos não verificados podem ter um limite de novos usuários.

## 2. Configurar o aplicativo mobile

Copie `mobile/.env.example` para `mobile/.env` e preencha os três Client IDs fornecidos pelo Google. Os Client IDs podem ficar no app; eles não são segredos.

## 3. Configurar o backend

No arquivo `backend/.env`, preencha `GOOGLE_OAUTH_CLIENT_IDS` com os mesmos IDs separados por vírgula:

```env
GOOGLE_OAUTH_CLIENT_IDS=android-id.apps.googleusercontent.com,ios-id.apps.googleusercontent.com,web-id.apps.googleusercontent.com
```

O backend valida o token recebido contra essa lista antes de criar ou acessar uma conta. Não coloque um Client Secret no app mobile.

## 4. Executar

Reinicie Docker e Metro depois de configurar as variáveis:

```powershell
docker compose up -d --build
npm --prefix mobile run android
```

OAuth com redirecionamento não funciona no Expo Go. Para Android/iOS, use uma development build ou versão instalada do app; para web, use `npm --prefix mobile run web`.

## Segurança do fluxo

O Client ID é público e pode ficar no `.env` do mobile. O backend recebe o ID token e só aceita tokens emitidos para os IDs listados em `GOOGLE_OAUTH_CLIENT_IDS`; também exige e-mail verificado. Não coloque Client Secret, senha do banco ou outra chave privada no aplicativo.
