# 📊 Diagramas UML — Synple

> Diagramas arquiteturais e comportamentais do **Synple**, aplicativo mobile open source para gerenciamento de reuniões, agendamentos e chat integrado.

---

## Índice

1. [Diagrama de Casos de Uso](#1-diagrama-de-casos-de-uso)
2. [Diagrama de Implantação](#2-diagrama-de-implantação)
3. [Diagrama de Classes](#3-diagrama-de-classes)
4. [Diagramas de Sequência](#4-diagramas-de-sequência)
5. [Diagramas de Atividades](#5-diagramas-de-atividades)

---

# 1. Diagrama de Casos de Uso

O diagrama representa as principais funcionalidades disponíveis para o usuário e os serviços responsáveis pelo funcionamento do sistema.

```mermaid
flowchart LR
    U([👤 Usuário])

    subgraph SYNPLE["📱 Synple"]
        UC1((Criar conta))
        UC2((Autenticar))
        UC3((Gerenciar perfil))

        UC4((Criar reunião))
        UC5((Editar reunião))
        UC6((Cancelar reunião))
        UC7((Visualizar agenda))

        UC8((Convidar participantes))
        UC9((Responder convite))
        UC10((Informar disponibilidade))

        UC11((Criar grupo))
        UC12((Gerenciar grupo))

        UC13((Enviar mensagem))
        UC14((Receber mensagem))
        UC15((Visualizar histórico))

        UC16((Sincronizar dados))
        UC17((Usar aplicativo offline))
    end

    U --> UC1
    U --> UC2
    U --> UC3

    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7

    U --> UC8
    U --> UC9
    U --> UC10

    U --> UC11
    U --> UC12

    U --> UC13
    U --> UC14
    U --> UC15

    U --> UC16
    U --> UC17

    UC4 -. inclui .-> UC8
    UC4 -. inclui .-> UC16
    UC13 -. depende de .-> UC2
    UC16 -. requer .-> UC2
```

### Principais casos de uso

| ID   | Caso de uso                 | Ator    |
| ---- | --------------------------- | ------- |
| UC01 | Criar conta                 | Usuário |
| UC02 | Autenticar                  | Usuário |
| UC03 | Gerenciar perfil            | Usuário |
| UC04 | Criar reunião               | Usuário |
| UC05 | Editar reunião              | Usuário |
| UC06 | Cancelar reunião            | Usuário |
| UC07 | Visualizar agenda           | Usuário |
| UC08 | Convidar participantes      | Usuário |
| UC09 | Responder convite           | Usuário |
| UC10 | Informar disponibilidade    | Usuário |
| UC11 | Criar grupo                 | Usuário |
| UC12 | Gerenciar grupo             | Usuário |
| UC13 | Enviar mensagem             | Usuário |
| UC14 | Receber mensagem            | Usuário |
| UC15 | Visualizar histórico        | Usuário |
| UC16 | Sincronizar dados           | Sistema |
| UC17 | Utilizar aplicativo offline | Usuário |

---

# 2. Diagrama de Implantação

O Synple possui uma arquitetura cliente-servidor. O aplicativo mobile mantém os dados localmente e se comunica com o servidor quando há conectividade.

```mermaid
flowchart TB

    subgraph CLIENT["📱 Dispositivo do Usuário"]

        AND["Android"]
        IOS["iOS"]

        APP["Synple Mobile<br/>React Native CLI<br/>TypeScript"]

        DB["WatermelonDB<br/>SQLite"]

        CACHE["TanStack Query<br/>Cache"]

        STATE["Zustand<br/>Estado global"]

        AND --> APP
        IOS --> APP

        APP --> DB
        APP --> CACHE
        APP --> STATE
    end

    subgraph NETWORK["🌐 Internet"]

        HTTPS["HTTPS"]
        WSS["WebSocket / WSS"]
    end

    subgraph SERVER["🖥️ Servidor Próprio"]

        NGINX["Nginx<br/>Reverse Proxy<br/>TLS"]

        API["Express.js 5<br/>Node.js 22<br/>TypeScript"]

        SOCKET["Socket.io 4"]

        AUTH["Lucia Auth<br/>JWT"]

        REDIS["Redis 7"]

        PG["PostgreSQL 16"]

        MINIO["MinIO<br/>S3-compatible storage"]

        PM2["PM2"]

        NGINX --> API
        NGINX --> SOCKET

        API --> AUTH
        API --> PG
        API --> REDIS
        API --> MINIO

        SOCKET --> REDIS
        SOCKET --> PG

        PM2 -. gerencia .-> API
        PM2 -. gerencia .-> SOCKET
    end

    APP --> HTTPS
    APP --> WSS

    HTTPS --> NGINX
    WSS --> NGINX
```

### Implantação física

```mermaid
flowchart TB

    INTERNET["🌐 Internet"]

    ROUTER["Roteador / Firewall<br/>IP público fixo"]

    SERVER["🖥️ Servidor próprio"]

    NGINX["Nginx<br/>80 / 443"]

    subgraph DOCKER["🐳 Docker"]
        PG["PostgreSQL 16"]
        REDIS["Redis 7"]
        MINIO["MinIO"]
    end

    subgraph NODE["⚙️ Processos Node.js"]
        API["Express API"]
        SOCKET["Socket.io"]
    end

    INTERNET --> ROUTER
    ROUTER -->|HTTPS 443| NGINX

    NGINX --> API
    NGINX --> SOCKET

    API --> PG
    API --> REDIS
    API --> MINIO

    SOCKET --> REDIS
    SOCKET --> PG
```

> O diagrama não fixa um endereço IP ou domínio específico. Esses valores pertencem ao ambiente de implantação e devem ser configurados externamente.

---

# 3. Diagrama de Classes

O modelo abaixo representa as principais entidades de domínio do Synple.

```mermaid
classDiagram

    class User {
        +UUID id
        +string name
        +string email
        +string avatarUrl
        +Date createdAt
        +Date updatedAt
    }

    class AuthSession {
        +UUID id
        +UUID userId
        +string token
        +Date expiresAt
        +Date createdAt
        +isValid()
        +revoke()
    }

    class Event {
        +UUID id
        +UUID creatorId
        +string title
        +string description
        +Date startAt
        +Date endAt
        +EventStatus status
        +Date createdAt
        +Date updatedAt
        +cancel()
        +update()
    }

    class Participant {
        +UUID id
        +UUID eventId
        +UUID userId
        +ParticipantStatus status
        +Availability availability
        +Date respondedAt
        +accept()
        +decline()
        +setAvailability()
    }

    class Availability {
        +UUID id
        +UUID participantId
        +Date startAt
        +Date endAt
        +AvailabilityStatus status
    }

    class Group {
        +UUID id
        +UUID ownerId
        +string name
        +Date createdAt
        +addMember()
        +removeMember()
    }

    class GroupMember {
        +UUID groupId
        +UUID userId
        +Date joinedAt
    }

    class Message {
        +UUID id
        +UUID eventId
        +UUID senderId
        +string content
        +MessageStatus status
        +Date createdAt
        +Date updatedAt
        +edit()
        +delete()
    }

    class Attachment {
        +UUID id
        +UUID messageId
        +string objectKey
        +string fileName
        +string mimeType
        +number size
    }

    class Notification {
        +UUID id
        +UUID userId
        +string type
        +string title
        +string content
        +boolean read
        +Date createdAt
        +markAsRead()
    }

    class SyncRecord {
        +UUID id
        +string entity
        +UUID entityId
        +string operation
        +number version
        +Date timestamp
    }

    User "1" --> "*" Event : cria
    User "1" --> "*" AuthSession : possui

    Event "1" --> "*" Participant : possui
    User "1" --> "*" Participant : participa

    Participant "1" --> "*" Availability : informa

    User "1" --> "*" Group : administra
    Group "1" --> "*" GroupMember : possui
    User "1" --> "*" GroupMember : pertence

    Event "1" --> "*" Message : possui
    User "1" --> "*" Message : envia

    Message "1" --> "*" Attachment : possui

    User "1" --> "*" Notification : recebe

    Event ..> SyncRecord : sincroniza
    Message ..> SyncRecord : sincroniza
    Participant ..> SyncRecord : sincroniza
```

### Relações principais

```text
User
 ├── Event
 │    ├── Participant
 │    │    └── Availability
 │    └── Message
 │         └── Attachment
 │
 ├── Group
 │    └── GroupMember
 │
 ├── AuthSession
 │
 └── Notification
```

---

# 4. Diagramas de Sequência

## 4.1 Criar reunião

```mermaid
sequenceDiagram

    actor U as Usuário
    participant UI as React Native
    participant DB as WatermelonDB
    participant API as Express API
    participant PG as PostgreSQL

    U->>UI: Preenche formulário
    UI->>UI: Valida dados com Zod

    UI->>DB: Cria reunião local
    DB-->>UI: Reunião salva

    UI-->>U: Exibe reunião imediatamente

    UI->>API: POST /events
    API->>API: Valida autenticação
    API->>API: Valida payload
    API->>PG: INSERT event
    PG-->>API: Evento criado

    API-->>UI: 201 Created
    UI->>DB: Atualiza registro local
```

### Com ausência de conexão

```mermaid
sequenceDiagram

    actor U as Usuário
    participant UI as React Native
    participant DB as WatermelonDB
    participant SYNC as Sync Engine

    U->>UI: Cria reunião
    UI->>DB: Salva localmente
    DB-->>UI: OK

    UI-->>U: Reunião disponível offline

    Note over DB,SYNC: Operação permanece pendente

    SYNC->>SYNC: Detecta conexão
    SYNC->>SYNC: Envia alterações pendentes
```

---

## 4.2 Responder convite

```mermaid
sequenceDiagram

    actor U as Usuário
    participant UI as React Native
    participant DB as WatermelonDB
    participant API as Express API
    participant PG as PostgreSQL

    U->>UI: Seleciona "Aceitar"
    UI->>DB: Atualiza participante
    DB-->>UI: Status = ACCEPTED

    UI-->>U: Participação atualizada

    UI->>API: PATCH /events/:id/participants
    API->>API: Valida JWT
    API->>PG: UPDATE participant
    PG-->>API: Atualizado

    API-->>UI: 200 OK
    UI->>DB: Confirma sincronização
```

---

## 4.3 Chat em tempo real

```mermaid
sequenceDiagram

    actor A as Usuário A
    participant APP_A as App A
    participant WS as Socket.io
    participant REDIS as Redis
    participant PG as PostgreSQL
    participant APP_B as App B
    actor B as Usuário B

    A->>APP_A: Digita mensagem
    APP_A->>WS: emit(message:send)

    WS->>WS: Valida sessão
    WS->>WS: Valida participação no evento

    WS->>PG: Salva mensagem
    PG-->>WS: Mensagem persistida

    WS->>REDIS: Publica evento

    WS-->>APP_A: message:sent
    WS-->>APP_B: message:new

    APP_A->>APP_A: Atualiza WatermelonDB
    APP_B->>APP_B: Atualiza WatermelonDB

    APP_B-->>B: Exibe mensagem
```

---

## 4.4 Sincronização offline-first

```mermaid
sequenceDiagram

    participant APP as React Native
    participant DB as WatermelonDB
    participant SYNC as Sync Engine
    participant API as Express API
    participant PG as PostgreSQL

    APP->>SYNC: Solicita sincronização

    SYNC->>DB: Obtém alterações locais
    DB-->>SYNC: Alterações pendentes

    SYNC->>API: Envia alterações

    API->>PG: Valida e persiste alterações
    PG-->>API: Operações concluídas

    API-->>SYNC: Confirmações + alterações remotas

    SYNC->>DB: Aplica alterações remotas

    DB-->>SYNC: Sincronização concluída

    SYNC-->>APP: Estado atualizado
```

---

# 5. Diagramas de Atividades

## 5.1 Criação de reunião

```mermaid
flowchart TD

    START((Início))

    A["Abrir criação de reunião"]
    B["Preencher título, descrição e horário"]
    C{"Dados válidos?"}

    D["Exibir erros"]
    E["Salvar no WatermelonDB"]
    F{"Existe conexão?"}

    G["Adicionar operação à fila"]
    H["Enviar para API"]
    I{"Servidor aceitou?"}

    J["Atualizar estado local"]
    K["Manter operação pendente"]
    L["Exibir reunião"]

    END((Fim))

    START --> A
    A --> B
    B --> C

    C -->|Não| D
    D --> B

    C -->|Sim| E
    E --> F

    F -->|Não| G
    G --> L

    F -->|Sim| H
    H --> I

    I -->|Sim| J
    J --> L

    I -->|Não| K
    K --> L

    L --> END
```

---

## 5.2 Confirmação de disponibilidade

```mermaid
flowchart TD

    START((Início))

    A["Abrir convite"]
    B["Visualizar horários disponíveis"]
    C["Selecionar disponibilidade"]
    D{"Dados válidos?"}

    E["Salvar resposta localmente"]
    F{"Online?"}

    G["Enviar resposta ao servidor"]
    H["Adicionar à fila de sincronização"]

    I{"Servidor confirmou?"}
    J["Marcar como sincronizado"]
    K["Manter como pendente"]

    END((Fim))

    START --> A
    A --> B
    B --> C
    C --> D

    D -->|Não| B
    D -->|Sim| E

    E --> F

    F -->|Não| H
    F -->|Sim| G

    G --> I

    I -->|Sim| J
    I -->|Não| K

    H --> END
    J --> END
    K --> END
```

---

## 5.3 Envio de mensagem

```mermaid
flowchart TD

    START((Início))

    A["Usuário escreve mensagem"]
    B["Validar mensagem"]
    C{"Mensagem válida?"}

    D["Enviar pelo Socket.io"]
    E["Salvar mensagem local"]
    F{"Conexão disponível?"}

    G["Mensagem pendente"]
    H["Servidor valida sessão"]
    I["Servidor valida participação"]
    J{"Autorizado?"}

    K["Persistir no PostgreSQL"]
    L["Emitir mensagem pelo Socket.io"]
    M["Atualizar clientes"]
    N["Exibir erro"]

    END((Fim))

    START --> A
    A --> B
    B --> C

    C -->|Não| A
    C -->|Sim| E

    E --> F

    F -->|Não| G
    G --> END

    F -->|Sim| D
    D --> H
    H --> I
    I --> J

    J -->|Não| N
    N --> END

    J -->|Sim| K
    K --> L
    L --> M
    M --> END
```

---

## 5.4 Sincronização

```mermaid
flowchart TD

    START((Início))

    A["Detectar conexão"]
    B{"Conexão disponível?"}

    C["Aguardar conexão"]
    D["Ler alterações locais"]
    E["Enviar alterações ao servidor"]

    F{"Servidor aceitou?"}

    G["Resolver conflito"]
    H["Aplicar confirmação local"]
    I["Baixar alterações remotas"]
    J["Atualizar WatermelonDB"]

    K["Sincronização concluída"]

    END((Fim))

    START --> A
    A --> B

    B -->|Não| C
    C --> A

    B -->|Sim| D
    D --> E
    E --> F

    F -->|Não| G
    G --> E

    F -->|Sim| H
    H --> I
    I --> J
    J --> K
    K --> END
```

---

# 📁 Organização recomendada

```text
synple/
│
├── mobile/
│   ├── android/
│   ├── ios/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── db/
│   │   │   ├── models/
│   │   │   ├── schema.ts
│   │   │   └── sync/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── App.tsx
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── socket/
│   │   ├── middleware/
│   │   ├── db/
│   │   └── types/
│   ├── drizzle/
│   └── package.json
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── pm2/
│
├── docs/
│   └── diagramas/
│       ├── README.md
│       ├── casos-de-uso.md
│       ├── implantacao.md
│       ├── classes.md
│       ├── sequencia/
│       │   ├── criar-reuniao.md
│       │   ├── responder-convite.md
│       │   ├── chat.md
│       │   └── sincronizacao.md
│       └── atividades/
│           ├── criar-reuniao.md
│           ├── disponibilidade.md
│           ├── chat.md
│           └── sincronizacao.md
│
└── README.md
```

---

# 🔗 Relação entre os diagramas

```mermaid
flowchart LR

    UC["Casos de Uso"]
    CLASS["Classes"]
    DEP["Implantação"]
    SEQ["Sequência"]
    ACT["Atividades"]

    UC -->|"define funcionalidades"| SEQ
    UC -->|"define comportamentos"| ACT
    UC -->|"identifica entidades"| CLASS

    CLASS -->|"objetos envolvidos"| SEQ
    CLASS -->|"operações do domínio"| ACT

    SEQ -->|"executa sobre"| DEP
    ACT -->|"é implementado por"| CLASS
```

Essa relação é importante porque os diagramas deixam de ser apenas desenhos isolados: **casos de uso → classes → atividades/sequências → implantação** representam diferentes perspectivas do mesmo sistema.
