# 🎓 Entrega do Projeto Synple — Guia de Execução Docker para o Professor

Este documento descreve a arquitetura em containers e todas as formas para o professor avaliar e rodar o projeto **Synple** utilizando **Docker**.

Atualizado em 22/10/2026. O tutorial de uso está em [GUIA_USO_E_INICIALIZACAO.md](GUIA_USO_E_INICIALIZACAO.md); a demonstração do incremento 2 está em [docs/INCREMENTO_2.md](docs/INCREMENTO_2.md).

---

## 🏛️ 1. Arquitetura da Solução em Containers

O ambiente do Synple é composto por dois serviços orquestrados via **Docker Compose**:

1. **`synple-backend` (API REST)**:
   * **Base:** `node:20-alpine` (imagem leve e otimizada).
   * **Porta:** `3001:3001`.
   * **Função:** Servidor Express com rotas de autenticação (bcrypt), gestão de organizações, comissões, membros e sincronização de dados.
   * **Auto-inicialização:** Ao subir, executa automaticamente a criação de tabelas (`schema.sql`) e aplicação de dados iniciais (*seeds*).

2. **`synple-postgres` (Banco de Dados Relacional)**:
   * **Base:** `postgres:16-alpine`.
   * **Porta:** `5432:5432`.
   * **Base de dados:** `Banco_synple`.
   * **Usuário / Senha:** `postgres` / `123`.
   * **Persistência:** Volume Docker nomeado `synple_pg_data`.
   * **Healthcheck:** Configurado para só liberar a inicialização do backend quando o PostgreSQL estiver 100% pronto para aceitar conexões.

3. **Rede Interna (`synple-net`)**:
   * Rede bridge dedicada para comunicação segura entre a API e o banco de dados.

---

## 📁 2. Arquivos Gerados para a Entrega

| Arquivo | Descrição |
| :--- | :--- |
| **`docker-compose.yml`** | Arquivo principal de orquestração dos serviços. |
| **`backend/Dockerfile`** | Receita de compilação da imagem do backend Node.js. |
| **`dump_banco_synple.sql`** | Dump SQL oficial exportado do banco com toda a estrutura e dados reais. |
| **`synple-backend.tar`** | Imagem Docker da API exportada via `docker save` (pronta para `docker load`). |
| **`iniciar_docker.bat`** | Script executável de 1 clique para ambiente Windows. |

---

## 🚀 3. Como Rodar o Projeto

O professor pode rodar o projeto por qualquer uma das opções abaixo:

### Opção A — A Mais Simples: Via Docker Compose (Recomendada)
Com o Docker Desktop aberto, abra o terminal na pasta do projeto e execute:

```bash
docker compose up -d --build
```
> O Docker baixará o PostgreSQL, construirá a imagem da API, criará o banco `Banco_synple` e aplicará as migrações e seeds automaticamente.

Para avaliar a geração de atas em PDF, use o código atual e esse comando com `--build`: a imagem precisa incluir a dependência `pdfkit` e a rota de exportação. Depois recarregue o app no Expo/Metro. A função de PDF não exige outro APK ou development build.

---

### Opção B — Carregando a Imagem `.tar` Exportada
Caso queira carregar a imagem pré-compilada sem precisar fazer o build:

```bash
# 1. Carrega a imagem exportada no Docker local
docker load -i synple-backend.tar

# 2. Sobe os containers usando a imagem carregada
docker compose up -d
```

O arquivo `.tar` representa o código da data em que foi exportado. Se ele for anterior à opção de PDF, use a opção A para reconstruir com o código atual. Alterar os fontes não atualiza uma imagem já exportada.

---

### Opção C — 1 Clique no Windows
Basta dar **dois cliques** no arquivo:
```cmd
iniciar_docker.bat
```

---

## 🧪 4. Como Testar e Validar a Aplicação

### 1. Teste da API no Navegador:
Acesse no seu navegador:
* **Status Geral da API:** [http://localhost:3001](http://localhost:3001)
* **Healthcheck do Servidor e Banco:** [http://localhost:3001/api/health](http://localhost:3001/api/health)
* **Lista de Organizações:** [http://localhost:3001/api/organizations](http://localhost:3001/api/organizations)

### 2. Credenciais de Teste Prontas no Banco:
* **Administrador do Sistema:**
  * E-mail: `admin@synple.com` | Senha: `Admin@123`
* **Usuário / Admin de Organização (Marina Costa):**
  * E-mail: `marina@synple.com` | Senha: `Marina@123`
* **Usuário Colaborador (João Silva):**
  * E-mail: `joao@synple.com` | Senha: `Joao@123`
* **Usuário Conrado:**
  * E-mail: `conradosoares3@gmail.com`

### Login com Google (opcional para a avaliação)

O login/cadastro Google já está implementado, mas precisa que o avaliador crie seus próprios Client IDs OAuth e preencha `mobile/.env` e `backend/.env`; nenhum segredo ou credencial pessoal é entregue no repositório. Ele não depende de IP fixo, e a API local fica em `localhost:3001`. O guia completo está em [LOGIN_COM_GOOGLE.md](LOGIN_COM_GOOGLE.md).

### Reuniões, aprovação e PDF da ata

Prepare organização/comissão e os vínculos dos participantes conforme o [roteiro do incremento 2](docs/INCREMENTO_2.md#13-preparar-e-demonstrar-o-incremento). Salve uma ata e toque em **Gerar ata em PDF**. O navegador do dispositivo recebe o arquivo para baixar ou compartilhar; o [tutorial de PDF](GUIA_USO_E_INICIALIZACAO.md#gerar-ata-em-pdf) descreve Android, iOS e computador.

O PDF mostra versão e situação. Rascunho, revisão e rejeição são identificados como documento não final; gerar o arquivo não aprova a ata. Para demonstrar o resultado final, registre entrada com todas as contas participantes, envie a ata e aprove com cada presente, incluindo o presidente quando presente. Gere o PDF novamente após a última aprovação.

---

## 🗄️ 5. Como Inspecionar o Banco de Dados Diretamente

Para ver as tabelas e dados no terminal:
```bash
docker exec -it synple-postgres psql -U postgres -d Banco_synple -c "SELECT id, name, email, phone, system_role FROM users;"
```

Para restaurar o dump exportado (caso queira reiniciar os dados):
```bash
docker exec -i synple-postgres psql -U postgres -d Banco_synple < dump_banco_synple.sql
```

---

## 🛑 6. Como Parar os Containers

```bash
docker compose down
```
*(Para parar e apagar os volumes de dados: `docker compose down -v`)*.
