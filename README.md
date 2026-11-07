# Synple — BRTPDS2

App Expo/React Native com API Express e PostgreSQL para organizações, comissões, reuniões e atas.

## Iniciar no Windows

Instale Node.js 22.13+ e Docker Desktop. Abra o PowerShell na raiz do repositório e execute:

```powershell
.\iniciar.ps1
```

O padrão é abrir o **Synple instalado (development build, SDK 58)** por túneis externos: ngrok para o Expo e Cloudflare para a API. Computador e celular podem estar em redes diferentes, inclusive 4G/5G. O computador precisa continuar ligado, conectado à internet e com o terminal aberto. Os túneis disponibilizam o pacote de desenvolvimento e a API por endereços públicos temporários; use-os para desenvolvimento.

O script inicia Docker, banco/API, instala dependências do mobile e abre os túneis. Se necessário, baixa cloudflared do repositório oficial. Ele cria .env a partir dos exemplos apenas quando ausente; preencha valores reais de OAuth no mobile/backend e SMTP no backend. Não sobrescreve configurações existentes.

O APK instalado precisa ser compatível com o SDK 58 e os módulos nativos atuais (SecureStore e biometria). Para gerar um novo development build, em Synple/mobile:

```powershell
npx eas-cli@latest build --platform android --profile development
```

Instale o APK no Android e abra o QR atual no Synple. Expo Go serve para testes de telas, sem Google nativo; use .\iniciar.ps1 -ExpoGo.

### Abrir no celular e reiniciar

Escaneie o QR do terminal pela câmera do celular e abra no Synple. Se usar **Enter URL manually** dentro do Synple, informe somente o endereço HTTP/HTTPS do Metro exibido pelo Expo (por exemplo, `http://...exp.direct`), sem o prefixo `exp+synple://` ou `synple://` e sem o invólucro `expo-development-client/?url=`. Esses links completos servem para a câmera/sistema abrir o aplicativo; o campo manual espera a URL do servidor.

Pare o terminal anterior com **Ctrl+C** antes de iniciar novamente. A porta 8081 é reservada ao Expo; o inicializador avisa se estiver ocupada, em vez de abrir outro servidor na 8082. A porta 3001 pertence à API. Os endereços dos túneis podem mudar a cada execução: use sempre o QR e endereço atuais.

## Inicialização manual

```powershell
docker compose up -d --build
cd Synple/mobile
npm install
npm run tunnel
```

Com banco/API já ativos e cloudflared instalado, `npm start` em `Synple/mobile` também abre os dois túneis para o Synple instalado. `npm run start:dev-client` é um alias do mesmo fluxo. Para testes opcionais com Expo Go, use `npm run start:go`. Para rede local, use `npm run start:local` (Synple) ou `npm run start:local:go` (Expo Go); somente esses modos exigem a mesma rede.

Docker Compose 2.24+ é requerido para env_file opcional. Configure Synple/backend/.env antes de reconstruir a API. A aplicação usa a API em http://localhost:3001 e o banco local na porta 5432. Não inicie outro backend na mesma porta.

O boot aplica migrações e preserva dados/senhas. Para uma instalação de demonstração nova, preparar explicitamente as contas documentadas:

```powershell
docker compose exec backend npm run init-db
```

Esse comando cria dados fictícios; não faz parte do boot normal. Novos cadastros reais exigem ativação por e-mail. Login sempre é validado no servidor; limpar cache não apaga o banco.

## Verificação

```powershell
npm --prefix Synple/mobile test
npm --prefix Synple/backend test
```

Os testes de backend precisam do PostgreSQL e das dependências instaladas. Novos testes de segurança usam dados fictícios e SMTP simulado em schema isolado.

## Documentação

- [Correções e validações pendentes](Synple/docs/CORRECOES_AVALIACAO.md)
- [Interfaces](Synple/docs/INTERFACES.md)
- [Padrões de programação](Synple/docs/PADROES_DESENVOLVIMENTO.md)
- [Google Login](Synple/LOGIN_COM_GOOGLE.md)
- [Incremento 2](Synple/docs/INCREMENTO_2.md)

## Entrega e validação do incremento 3

[Estado verificado e roteiro de demonstração](docs/ENTREGA_INCREMENTO_3.md) · [Aceite em aparelhos](docs/VALIDACAO_EM_APARELHOS.md). Esta atualização acrescenta módulos nativos de arquivos/data/hora: instale um build SDK 58 atualizado. Os builds antigos não recebem esses módulos pelo QR Code.
