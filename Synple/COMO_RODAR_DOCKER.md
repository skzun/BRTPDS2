# 🐳 Como Rodar o Synple via CMD com Docker

Este guia contém **todos os comandos e passos necessários** para rodar o Banco de Dados (PostgreSQL) e o Backend (API Node.js) em qualquer computador utilizando Docker via CMD (Prompt de Comando).

---

## ⚡ Opção Rápida (1 Clique)

Você pode simplesmente dar dois cliques ou rodar no CMD o script automático criado nesta pasta:
```cmd
iniciar_docker.bat
```
Ele faz todas as verificações, sobe os containers e deixa tudo pronto automaticamente!

---

## 📋 Passo a Passo Manual no CMD

### 1. Abrir o Docker Desktop
Certifique-se de que o **Docker Desktop** está aberto na barra de tarefas (ícone da baleinha).

---

### 2. Abrir o Prompt de Comando (CMD)
Pressione `Win + R`, digite `cmd` e pressione `Enter`.

Navegue até a pasta do projeto:
```cmd
cd /d C:\Users\Conra\OneDrive\Documentos\GitHub\BRTPDS2\Synple
```
*(Se estiver em outro computador, use o caminho onde você clonou ou descompactou a pasta `Synple`).*

---

### 3. Subir o Banco e o Backend
Execute o comando de build e inicialização em segundo plano:
```cmd
docker compose up -d --build
```

> **O que esse comando faz sozinho:**
> 1. Baixa o PostgreSQL 16 oficial.
> 2. Cria o banco `Banco_synple`.
> 3. Constrói e inicia o servidor da API Node.js.
> 4. Executa a criação de todas as tabelas e dados de teste iniciais.

---

### 4. Verificar se os Containers estão Rodando
Execute:
```cmd
docker compose ps
```
Você verá dois containers com status **Up** (verde):
* `synple-postgres` (porta 5432)
* `synple-backend` (porta 3001)

---

### 5. Ver os Logs do Backend (Opcional)
Para acompanhar as requisições em tempo real:
```cmd
docker compose logs -f backend
```
*(Para sair da visualização dos logs, pressione `Ctrl + C`).*

---

### 6. Iniciar o Aplicativo Celular (Expo)
Abra uma **nova janela do CMD** e execute:
```cmd
cd /d C:\Users\Conra\OneDrive\Documentos\GitHub\BRTPDS2\Synple\mobile
npm start
```
Para testar no navegador ou emulador, a API já estará em `http://localhost:3001` em qualquer computador. No emulador Android, o app converte o acesso para `10.0.2.2`, que é o `localhost` do computador hospedeiro. Para o Expo Go no celular físico, use os scripts do projeto: eles detectam o IP atual do notebook automaticamente e o app usa esse IP na mesma rede Wi-Fi, sem IP fixo salvo no repositório.

> Use `npm --prefix mobile run tunnel` em vez de `npx expo start --tunnel`, pois o script atualiza o IP antes de abrir o Metro. O `--tunnel` do Expo disponibiliza o Metro, mas não encaminha sozinho a porta `3001` da API. Celular e notebook precisam estar no mesmo Wi-Fi e o Firewall do Windows deve permitir conexões privadas para a porta 3001. Além disso, o login Google com OAuth não roda no Expo Go; para ele use development build. Consulte [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md).

Antes de abrir o Expo, confirme que a API (e não apenas o PostgreSQL) responde no notebook:

```cmd
curl http://localhost:3001/api/health
```

Se não responder, suba todos os serviços com `docker compose up -d --build` e verifique `docker compose logs backend`.

---

## 🛑 Comandos de Gerenciamento

| Ação | Comando no CMD |
| :--- | :--- |
| **Parar tudo** | `docker compose down` |
| **Ligar novamente** | `docker compose up -d` |
| **Ver logs do backend** | `docker compose logs backend` |
| **Resetar banco do zero** | `docker compose down -v && docker compose up -d --build` |

---

## ⚠️ Resolução de Problemas

### 1. Erro: *"port is already allocated" (porta 5432 ocupada)*
Ocorre se o Windows já tiver o serviço local do PostgreSQL rodando. Pare o serviço com:
```cmd
net stop postgresql-x64-18
```
*(ou pelo Gerenciador de Tarefas do Windows, aba "Serviços").*

### 2. Erro: *"error during connect: ... docker daemon is not running"*
O Docker Desktop está fechado. Abra o **Docker Desktop** no menu Iniciar do Windows e aguarde 15 segundos antes de rodar o comando novamente.
