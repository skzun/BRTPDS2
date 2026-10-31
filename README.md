# Synple — BRTPDS2

App Expo/React Native com API Express e PostgreSQL para organizações, comissões, reuniões e atas.

## Iniciar no Windows

Instale Node.js 22.13+ e Docker Desktop. Abra o PowerShell na raiz do repositório e execute:

```powershell
.\iniciar.ps1
```

O script inicia Docker, banco/API, instala dependências do mobile e abre os túneis em modo development build. Se necessário, baixa cloudflared do repositório oficial. Ele cria .env a partir dos exemplos apenas quando ausente; preencha valores reais de OAuth no mobile/backend e SMTP no backend. Não sobrescreve configurações existentes.

Instale um novo development build após esta atualização: foram adicionados SecureStore e biometria. Em Synple/mobile:

```powershell
npx eas-cli@latest build --platform android --profile development
```

Instale o APK no Android e abra o QR atual no Synple. Expo Go serve para testes de telas, sem Google nativo; use .\iniciar.ps1 -ExpoGo.

## Inicialização manual

```powershell
docker compose up -d --build
cd Synple/mobile
npm install
npm run tunnel
```

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
