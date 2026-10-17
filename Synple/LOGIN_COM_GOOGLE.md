# Login com Google

Para o passo a passo geral de instalação, inicialização e uso, consulte [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md).

O Synple usa o SDK nativo de login do Google em Android/iOS e `google-auth-library` no backend. A implementação não usa Firebase Authentication, Identity Platform nem APIs pagas: o login básico com as credenciais OAuth deste guia não exige plano pago do Google hoje.

> Não é possível garantir preços ou políticas futuras de uma plataforma de terceiros. Custos de hospedagem e de publicação nas lojas, se houver, são independentes deste login. Veja a seção de custos em [DOCUMENTACAO_SOFTWARE.md](DOCUMENTACAO_SOFTWARE.md#custo-e-licenças).

## 1. Criar as credenciais OAuth

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure a tela de consentimento OAuth. No mesmo projeto, crie clientes OAuth para as plataformas usadas:

- **Android**: use o pacote `com.conradobr1.synple` e o SHA-1 do certificado que assina a build instalada. O SHA-1 de uma build EAS deve ser o certificado Android configurado no EAS.
- **iOS**: use o Bundle ID `com.conradobr1.synple`.
- **Web**: usado pelo SDK nativo como `webClientId` para emitir o ID token que o backend valida. Esse ID é diferente do Android e iOS. Para autenticação mobile, não é preciso cadastrar `synple://oauthredirect` como redirect URI.

Use somente os escopos básicos de identidade (`openid`, `email` e `profile`). Antes de disponibilizar o app para pessoas fora da equipe, informe página inicial, e-mail de suporte e política de privacidade na tela de consentimento. Aplicativos externos não verificados podem ter um limite de novos usuários.

## 2. Configurar o aplicativo mobile

Preencha `mobile/.env` com os Client IDs Android, iOS e Web. Não deixe os valores de exemplo. Os Client IDs podem ficar no app; eles não são segredos.

Android/iOS usam o SDK nativo do Google e não enviam `synple://oauthredirect` ao fluxo OAuth no navegador. O cliente Android precisa corresponder ao pacote e SHA-1 da assinatura. O plugin iOS usa o esquema reverso do Client ID iOS configurado em `mobile/app.json`.

O Client ID Android é associado ao certificado de assinatura. O ID criado com o keystore de depuração local funciona nas builds locais deste computador. Para build EAS ou publicada na Play Store, crie outro cliente Android usando o SHA-1 do certificado EAS ou Play e inclua esse novo ID também no backend. Configure no app o ID correspondente ao certificado da build que será instalada.

## 3. Configurar o backend

Inclua em `backend/.env` os IDs Android, iOS e Web em `GOOGLE_OAUTH_CLIENT_IDS`, separados por vírgula:

```env
GOOGLE_OAUTH_CLIENT_IDS=android-id.apps.googleusercontent.com,ios-id.apps.googleusercontent.com,web-id.apps.googleusercontent.com
```

O backend valida o token recebido contra essa lista antes de criar ou acessar uma conta. Não coloque um Client Secret no app mobile.

## 4. Executar

O Expo Go serve para abrir as telas do app, mas não inclui o módulo nativo de login Google. Para testar o login, use um development build.

Para testar as telas pelo Expo Go, inclusive em outra rede, use na raiz do projeto:

```powershell
npm run dev:tunnel:go
```

Esse comando inicia a API, cria um túnel público para ela e abre o Metro explicitamente no Expo Go. Ele não habilita Google Login.

Para usar Google Login, configure o Client ID Web e gere uma nova development build Android na nuvem (não requer Android Studio/SDK local):

```powershell
cd mobile
npx eas-cli build --platform android --profile development
npx eas-cli credentials -p android
```

Instale o APK de desenvolvimento no celular. Depois que o EAS gerar/selecionar as credenciais, use `npx eas-cli credentials -p android` e escolha o perfil `development` para consultar o SHA-1 do keystore remoto. Crie no Google Cloud um cliente OAuth **Android** com esse SHA-1 e o pacote `com.conradobr1.synple`. Configure o ID correspondente em `mobile/.env`. Crie também um cliente OAuth **Web** e coloque o ID em `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no mobile e em `GOOGLE_OAUTH_CLIENT_IDS` no backend, preservando os outros IDs usados por builds locais/iOS.

Com o development build instalado, execute na raiz:

```powershell
npm run dev:tunnel
```

O comando inicia o backend e os dois túneis, e agora direciona o QR explicitamente ao development build do Synple. Mantenha o terminal aberto e escaneie o QR novo pelo Synple development build, não pelo Expo Go. Se aparecer “Cannot connect to Expo CLI”, reinicie o comando, aguarde o túnel do Expo ficar pronto e use o QR da sessão atual.

O endereço do quick tunnel e o QR são temporários e mudam ao reiniciar a sessão. Para login Google em outro computador ou rede, instale o mesmo development build compatível e abra o QR da sessão atual. Não use o QR antigo nem Expo Go para autenticação Google nativa.

As variáveis do Client ID são públicas e ficam disponíveis ao JavaScript do app; reinicie o Metro após editá-las. Para uma build instalada que não dependa do Metro, defina `EXPO_PUBLIC_API_URL` em `mobile/.env` com uma URL HTTPS pública e estável da API antes de compilar. O túnel de desenvolvimento muda de endereço e não serve como URL permanente da build.

Para web, rode `npm --prefix mobile run web` e cadastre no cliente OAuth Web a origem e o URI de retorno exibidos pelo Expo.

Antes de liberar para qualquer pessoa, publique o app OAuth como externo e conclua a verificação do Google se solicitada. Enquanto a tela OAuth estiver em modo de teste, inclua a conta Google usada como usuário de teste.

## Relação com a recuperação de senha

O código de recuperação redefine a senha local usada para entrar com e-mail no Synple. Ele não altera nem remove a associação Google da conta. Depois do reset, escolha **Continuar com Google** e selecione a mesma conta Google; não digite a nova senha do Synple na tela do Google. Se o Google não retornar ao app, confirme que a conta Google escolhida tem o mesmo e-mail cadastrado e consulte o log do backend para verificar se a chamada chegou à rota `/api/auth/google`.

## Segurança do fluxo

O Client ID é público e pode ficar no `.env` do mobile. O backend recebe o ID token e só aceita tokens emitidos para os IDs listados em `GOOGLE_OAUTH_CLIENT_IDS`; também exige e-mail verificado. Não coloque Client Secret, senha do banco ou outra chave privada no aplicativo.
