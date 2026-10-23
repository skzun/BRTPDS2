# Diagramas — Incremento 1

Atualizado em 23/10/2026. Organizações, usuários, comissões e administração.

[Índice dos diagramas](Diagramas_Casos_de_Uso.md) · [Especificação acadêmica](../incremento-1-especificacao-completa.md)

## Casos de uso

Os nós arredondados representam casos de uso; Mermaid não tem notação UML nativa para esse tipo de diagrama. RF16–RF18 correspondem a operações de demonstração no estado local do app; não reiniciam processos nem apagam o banco. RF14 consulta também métricas reais da API e do PostgreSQL. A recuperação RF11 envia código por SMTP e é iniciada no login.

```mermaid
flowchart LR
  subgraph Atores
    AdminSys["Administrador do Sistema"]
    AdminOrg["Administrador da Organização"]
    User["Usuário Comum"]
  end

  subgraph Grupo1["Cadastro de Organização"]
    UC01(["RF01 - Cadastrar Organização"])
    UC02(["RF02 - Autorizar/Revogar Organização"])
    UC03(["RF03 - Gerenciar Organizações"])
  end

  subgraph Grupo2["Cadastro de Comissão"]
    UC04(["RF04 - Cadastrar Comissão/Grupo"])
    UC05(["RF05 - Gerenciar Comissões"])
    UC06(["RF06 - Gerenciar Equipe da Comissão"])
  end

  subgraph Grupo3["Cadastro de Usuário"]
    UC07(["RF07 - Cadastrar Usuário"])
    UC08(["RF08 - Solicitar e Decidir Acesso"])
    UC09(["RF09 - Gerenciar Usuários da Org"])
  end

  subgraph Grupo4["Configurações de Usuário"]
    UC10(["RF10 - Trocar Senha"])
    UC11(["RF11 - Recuperar Conta"])
    UC12(["RF12 - Alterar Dados Pessoais"])
    UC13(["RF13 - Definir Tema Preferido"])
  end

  subgraph Grupo5["Informações do Sistema"]
    UC14(["RF14 - Consultar Status e Subsistemas"])
    UC15(["RF15 - Consultar Relatórios"])
    UC16(["RF16 - Reinicializar Subsistemas"])
    UC17(["RF17 - Setup Inicial do Sistema"])
    UC18(["RF18 - Reset do Sistema"])
  end

  User --> UC01
  User --> UC07
  User --> UC08
  User --> UC10
  User --> UC11
  User --> UC12
  User --> UC13

  AdminOrg --> UC04
  AdminOrg --> UC05
  AdminOrg --> UC06
  AdminOrg --> UC08
  AdminOrg --> UC09

  AdminSys --> UC02
  AdminSys --> UC03
  AdminSys --> UC14
  AdminSys --> UC15
  AdminSys --> UC16
  AdminSys --> UC17
  AdminSys --> UC18
```

## Implantação atual

```mermaid
flowchart TB
  subgraph Cliente["Celular ou navegador"]
    App["Expo SDK 57 / React Native / JavaScript"]
    Local["AsyncStorage / estado local"]
    App --> Local
  end
  Google["Google OAuth / Google Sign-In"]
  App --> Google
  App -->|"HTTP na LAN ou HTTPS pelo túnel"| API
  subgraph Servidor["Computador de desenvolvimento ou servidor"]
    API["Node.js / Express 4"]
    PG[("PostgreSQL")]
    PDF["PDFKit / PDF em memória"]
    API --> PG
    API --> PDF
  end
  API -->|"Verificar identidade"| Google
  API -->|"Nodemailer / SMTP"| Email["Provedor de e-mail"]
```

Docker Compose executa API e PostgreSQL. Em outra rede, o script cria um Quick Tunnel Cloudflare para a API e um túnel Expo para o Metro. O development build é necessário para o login Google nativo. Não há chat, Redis, MinIO ou serviço de uploads na implementação.

## Modelo relacional do incremento 1

```mermaid
erDiagram
  users ||--o{ organizations : "proprietario"
  users ||--o{ access_requests : "solicita"
  organizations ||--o{ access_requests : "recebe"
  organizations ||--o{ commissions : "possui"
  users ||--o{ commission_members : "integra"
  commissions ||--o{ commission_members : "possui"
  users {
    uuid id PK
    varchar name
    varchar email UK
    varchar password_hash
    varchar system_role
    varchar theme
  }
  organizations {
    uuid id PK
    uuid owner_id FK
    varchar name
    varchar document UK
    varchar status
  }
  access_requests {
    uuid id PK
    uuid user_id FK
    uuid organization_id FK
    varchar status
  }
  commissions {
    uuid id PK
    uuid organization_id FK
    varchar name
    varchar status
  }
  commission_members {
    uuid commission_id PK,FK
    uuid user_id PK,FK
    varchar role
  }
  system_subsystems {
    varchar id PK
    varchar name
    varchar status
    timestamptz last_check
  }
```

O modelo destaca os campos principais; a definição física completa está em [schema.sql](../../Synple/backend/src/db/schema.sql). As entidades de reuniões e atas estão no [incremento 2](Incremento_2.md). O painel administrativo consulta as métricas sem gravá-las em tabelas novas.
