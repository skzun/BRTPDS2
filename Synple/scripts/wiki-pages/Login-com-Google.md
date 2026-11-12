# Login com Google

## Configuração

O mobile Android/iOS usa `@react-native-google-signin/google-signin`; a API valida o ID token com `google-auth-library` e emite uma sessão própria. A configuração precisa acompanhar o aplicativo efetivamente instalado.

| Local | Configuração |
| --- | --- |
| Google Cloud, cliente Android | Pacote `com.conradobr1.synple` e SHA-1 do certificado que assinou o APK instalado. |
| Google Cloud, cliente iOS | Bundle ID `com.conradobr1.synple`. |
| Google Cloud, cliente Web | ID utilizado como `webClientId` pelo SDK nativo. |
| `Synple/mobile/.env` | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. |
| `Synple/mobile/app.json` | Plugin Google e esquema reverso do cliente iOS. |
| `Synple/backend/.env` | `GOOGLE_OAUTH_CLIENT_IDS`, lista separada por vírgulas incluindo o cliente Web usado no token. |
| `Synple/mobile/.env.local` | URL da API para a rede local; o script de túnel injeta a URL temporária durante a execução. |

SHA-1 é a impressão digital pública do certificado, não o Client ID e não uma senha para `.env`. Os Client IDs terminam em `.apps.googleusercontent.com`. Não publicar senhas SMTP, keystore, Client Secret ou tokens na Wiki. Os arquivos `.env` locais continuam necessários.

## Executar e diagnosticar

Siga [Como executar](Como-executar) para deixar banco/API disponíveis. Abra um development build compatível do Synple; Expo Go não contém o módulo nativo Google. Em modo OAuth de teste, confira se a conta usada está autorizada no projeto Google.

Se falhar, registre a mensagem completa e o horário, confira se houve chamada a `/api/auth/google` e consulte o log do backend. Falha ao abrir Google pode ser módulo nativo, Play Services ou configuração de pacote/assinatura. Falha ao enviar token pode ser rede/API; falha de validação pode envolver audiência, validade do token ou erro de banco, pois o catch atual do endpoint agrupa esses erros. Não atribuir automaticamente toda falha ao SHA-1 ou ao IP.

O IP local só funciona se o aparelho alcançar o computador. Teste `/api/health`. Reinicie o backend após editar seu `.env`; reinicie Metro após editar variáveis mobile. Alterações de configuração compilada/módulos nativos requerem build atualizada. Cadastrar o SHA-1 correto no Google não altera a assinatura de um APK existente nem exige, sozinho, refazer esse APK.

Para consultar credenciais EAS, execute em `Synple/mobile`: `npx eas-cli credentials -p android`. A assinatura local, EAS e Play App Signing pode diferir. Use o certificado da distribuição instalada. A versão 2.0.0 do manifesto não confirma qual certificado assinou o aplicativo no celular.
