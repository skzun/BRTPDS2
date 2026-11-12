# Rodar o Synple com Docker e acesso externo

O modo padrão usa o Synple instalado (development build SDK 58), ngrok para o aplicativo e Cloudflare para a API. O celular pode estar em outra rede ou no 4G/5G.

## Windows: iniciar tudo

Instale Node.js 22.13+ e Docker Desktop. No PowerShell, entre na pasta raiz onde baixou o projeto e execute:

```powershell
.\iniciar.ps1
```

No CMD, execute `iniciar_docker.bat` na mesma pasta. Esse arquivo chama o mesmo inicializador.

O inicializador prepara banco/API no Docker, instala as dependências do mobile, baixa cloudflared se necessário e abre os dois túneis. Docker Compose 2.24+ é necessário. Configure OAuth e SMTP nos arquivos `.env` para usar Google e e-mails.

## Com os serviços já preparados

Na raiz do repositório:

```powershell
docker compose up -d
cd Synple\mobile
npm start
```

`npm start`, `npm run start:dev-client` e `npm run tunnel` usam o mesmo modo externo para o Synple instalado. Deixe o computador ligado e o terminal aberto. Os endereços são públicos e temporários, próprios para desenvolvimento, e podem mudar a cada execução.

## Abrir no Synple

Use a câmera do celular para abrir o QR do terminal no Synple. No campo **Enter URL manually** do aplicativo, informe somente a URL HTTP/HTTPS do servidor Expo exibida na execução atual. Não cole `exp+synple://`, `synple://` ou o link completo `expo-development-client/?url=...` nesse campo.

O APK instalado precisa ser compatível com SDK 58 e os módulos nativos atuais. Para gerar outro APK, em `Synple/mobile`:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

## Parar e reiniciar

Pressione **Ctrl+C** no terminal dos túneis antes de iniciar novamente. A porta 8081 fica reservada ao Expo; se estiver ocupada, o inicializador pede para encerrar o antigo, em vez de criar outro servidor na 8082. API e banco usam 3001 e 5432.

Para parar os containers preservando os dados:

```powershell
docker compose down
```

Para conferir serviços e logs:

```powershell
docker compose ps
docker compose logs backend
```

O boot aplica migrações e preserva dados. Somente para criar dados fictícios de demonstração numa instalação nova, execute explicitamente `docker compose exec backend npm run init-db`.

## Modos opcionais

- `npm run start:go`: túneis com Expo Go, sem Google nativo.
- `npm run start:local`: Synple instalado pela rede local.
- `npm run start:local:go`: Expo Go pela rede local.

Somente os modos locais exigem computador e celular na mesma rede. Veja também o [README](../../README.md).
# Execução local do Synple (mobile + backend)

Antes de abrir o aplicativo, o backend precisa estar em execução. Sem a API na porta 3001, o login, o Google e a aprovação de organizações não funcionarão.

Em um terminal, na raiz `Synple`:

```powershell
npm run backend
```

Em outro terminal, inicie o mobile:

```powershell
cd mobile
npx expo start --dev-client --lan
```

Para usar outra rede ou 4G, use `npm run dev:tunnel` na raiz. Abra o development build do Synple, não o Expo Go.
