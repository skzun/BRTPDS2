# 🐳 Como Rodar o Synple via CMD com Docker

Este guia contém **todos os comandos e passos necessários** para rodar o Banco de Dados (PostgreSQL) e o Backend (API Node.js) em qualquer computador utilizando Docker via CMD (Prompt de Comando).

---

## ⚡ Opção Rápida (1 Clique)

Você pode simplesmente dar dois cliques ou rodar no CMD o script automático criado na pasta:
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
Aponte a câmera do seu celular no aplicativo **Expo Go** para escanear o QR Code e usar o app!

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
