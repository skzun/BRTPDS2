# Rodar o Synple com Docker e acesso externo

O modo padrão usa o Synple instalado (development build SDK 58), ngrok para o aplicativo e Cloudflare para a API. O celular pode estar em outra rede ou no 4G/5G.

## Windows: iniciar tudo

Instale Node.js 22.13+ e Docker Desktop. No PowerShell, entre na pasta raiz onde baixou o projeto e execute:

```powershell
.\iniciar.ps1
```

No CMD, execute `iniciar_docker.bat` na mesma pasta. Esse arquivo chama o mesmo inicializador.

O inicializador prepara banco/API no Docker, instala as dependências do mobile, baixa cloudflared se necessário e abre os dois túneis. Docker Compose 2.24+ é necessário. Configure OAuth e SMTP nos arquivos `.env` para usar Google e e-mails.

## Instalar ou reparar dependências (backend e mobile)

O backend e o mobile têm instalações separadas. Faça estes passos após baixar o projeto ou quando houver dependências ausentes. Pare as execuções antigas com Ctrl+C antes de reinstalar. `npm run backend` apenas inicia a API; não instala pacotes.

Identifique a pasta que contém **backend**, **mobile** e **package.json**. Ela é a pasta interna `Synple`; dependendo do nome escolhido ao clonar, o caminho pode terminar em `BRTPDS2\Synple` ou `Synple\Synple`. Não copie o caminho pessoal de outro computador.

**Terminal 1 — backend local:** nessa pasta interna, com PostgreSQL disponível e `backend/.env` configurado:

```powershell
npm --prefix backend ci
npm run backend
```

Mantenha o terminal aberto. **Terminal 2 — mobile:** abra outro PowerShell na mesma pasta interna e execute:

```powershell
cd mobile
npm ci
npm start
```

`npm start` usa os túneis da API e do Expo para abrir o Synple instalado (development build), inclusive em outra rede. O túnel requer cloudflared; o inicializador `iniciar.ps1` da raiz prepara esse requisito. Para usar somente a rede local, substitua `npm start` por `npm run start:local`, com celular e computador na mesma rede. Para Google, use o development build com OAuth configurado, não Expo Go.

Se o backend já estiver rodando no Docker, não execute uma segunda API com `npm run backend`. Nesse caso, mantenha banco/API do Docker ativos e execute apenas os passos do mobile; para atualizar dependências da API em Docker, execute `docker compose up -d --build backend` na pasta que contém `docker-compose.yml`.

### Erros de pacotes ausentes

- **`Cannot find module './mergeConfig'` ou arquivo ausente em `@expo/config`:** uma instalação incompleta do mobile pode causar esse erro. Na pasta `mobile`, pare o Expo, execute `npm ci` e depois `npm start`.
- **`Cannot find module 'nodemailer'`, `pdfkit` ou `google-auth-library`:** na pasta interna que contém `backend`, execute `npm --prefix backend ci` e reinicie a API com `npm run backend`.
- Reinstalar o mobile não corrige dependências do backend. Se o erro continuar, confira a saída completa da instalação e a pasta em que o comando foi executado.

`npm ci` reinstala `node_modules` usando as versões do `package-lock.json`; não altera os arquivos `.env` nem os dados do banco. Não é necessário executá-lo a cada inicialização. Se reclamar de divergência entre `package.json` e `package-lock.json`, obtenha os dois arquivos da mesma revisão do projeto em vez de apagar o lockfile.

Antes do login, confira `http://127.0.0.1:3001/api/health` no computador. O QR do Expo sozinho não garante que a API e o banco estejam funcionando.

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
