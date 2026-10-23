# Diagramas — Incremento 2

Atualizado em 23/10/2026. Reuniões, convites, presença, atas, aprovação e PDF.

[Índice dos diagramas](Diagramas_Casos_de_Uso.md) · [Especificação completa e regras de acesso](../../Synple/docs/INCREMENTO_2.md)

O presidente da comissão ou proprietário gerencia reuniões e atas. Todos os convidados com entrada registrada até a submissão precisam aprovar a versão, inclusive o presidente quando presente. Convidados históricos preservam acesso e voto quando elegíveis. Gerar PDF não aprova a ata. Os diagramas de classes representam responsabilidades de domínio, sem exigir classes JavaScript formais.

## 3. Diagrama de casos de uso

```mermaid
flowchart LR
    P["Presidente da comissão"]
    I["Integrante da comissão"]
    O["Proprietário da organização"]
    subgraph Sistema["Synple — reuniões"]
        RF01(["RF02.01 Agendar reunião"])
        RF02(["RF02.02 Convidar integrantes"])
        RF03(["RF02.03 Aceitar ou recusar convite"])
        RF04(["RF02.04 Registrar entrada"])
        RF05(["RF02.05 Registrar saída"])
        RF06(["RF02.06 Gerar lista de presença"])
        RF07(["RF02.07 Criar ou corrigir ata"])
        RF08(["RF02.08 Submeter ata"])
        RF09(["RF02.09 Aprovar ou solicitar correção"])
        RF10(["RF02.10 Gerar ata em PDF"])
        RF01 -. "inclui" .-> RF02
    end
    P --> RF01
    P --> RF06
    P --> RF07
    P --> RF08
    P --> RF03
    P --> RF04
    P --> RF05
    P --> RF09
    P --> RF10
    I --> RF03
    I --> RF04
    I --> RF05
    I --> RF06
    I --> RF09
    I --> RF10
    O --> RF01
    O --> RF06
    O --> RF07
    O --> RF08
    O --> RF04
    O --> RF05
    O --> RF09
    O --> RF10
```

## 5. Regras de negócio

```mermaid
stateDiagram-v2
    [*] --> DRAFT: criar ata
    DRAFT --> DRAFT: salvar / incrementar versão se mudar texto
    DRAFT --> IN_REVIEW: submeter / fixar presentes
    IN_REVIEW --> IN_REVIEW: aprovar / ainda faltam decisões
    IN_REVIEW --> APPROVED: todas as decisões aprovam
    IN_REVIEW --> REJECTED: uma decisão reprova
    IN_REVIEW --> DRAFT: corrigir / nova versão e remover votos
    REJECTED --> DRAFT: corrigir / nova versão
    APPROVED --> [*]: texto encerrado
```

## 6. Diagrama de classes

```mermaid
classDiagram
    class Usuario {
        UUID id
        string name
        string email
    }
    class Organizacao {
        UUID id
        string name
        UUID ownerId
    }
    class Comissao {
        UUID id
        UUID organizationId
        string name
        string status
    }
    class VinculoComissao {
        UUID commissionId
        UUID userId
        string role
    }
    class Reuniao {
        UUID id
        UUID commissionId
        string title
        datetime startsAt
        datetime endsAt
        string agenda
        UUID createdBy
        datetime createdAt
        datetime updatedAt
        agendar()
        gerarListaPresenca()
    }
    class ConviteReuniao {
        UUID id
        UUID meetingId
        UUID userId
        string status
        datetime respondedAt
        datetime createdAt
        responder()
    }
    class PresencaReuniao {
        UUID id
        UUID meetingId
        UUID userId
        datetime enteredAt
        datetime leftAt
        registrarEntrada()
        registrarSaida()
    }
    class AtaReuniao {
        UUID id
        UUID meetingId
        string content
        string status
        int version
        UUID createdBy
        UUID updatedBy
        UUID[] requiredApproverIds
        datetime submittedAt
        datetime approvedAt
        datetime createdAt
        datetime updatedAt
        salvarRascunho()
        submeter()
        verificarUnanimidade()
        gerarPDF()
    }
    class DecisaoAta {
        UUID id
        UUID minutesId
        UUID meetingId
        UUID userId
        int version
        string decision
        string comment
        datetime decidedAt
        registrarDecisao()
    }
    Usuario "1" --> "0..*" Organizacao : possui
    Organizacao "1" --> "0..*" Comissao : contem
    Usuario "1" --> "0..*" VinculoComissao : integra
    Comissao "1" --> "0..*" VinculoComissao : tem
    Comissao "1" --> "0..*" Reuniao : agenda
    Usuario "1" --> "0..*" Reuniao : cria
    Reuniao "1" *-- "1..*" ConviteReuniao : convites
    Usuario "1" --> "0..*" ConviteReuniao : recebe
    Reuniao "1" *-- "0..*" PresencaReuniao : presencas
    Usuario "1" --> "0..*" PresencaReuniao : registra
    Reuniao "1" *-- "0..1" AtaReuniao : ata
    AtaReuniao "1" *-- "0..*" DecisaoAta : decisoes por versao
    Usuario "1" --> "0..*" DecisaoAta : decide
```

## 7. Diagrama relacional

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
    }
    organizations {
        UUID id PK
        UUID owner_id FK
        VARCHAR name
    }
    commissions {
        UUID id PK
        UUID organization_id FK
        VARCHAR name
        VARCHAR status
    }
    commission_members {
        UUID commission_id PK,FK
        UUID user_id PK,FK
        VARCHAR role
        TIMESTAMPTZ created_at
    }
    meetings {
        UUID id PK
        UUID commission_id FK
        VARCHAR title
        TIMESTAMPTZ starts_at
        TIMESTAMPTZ ends_at
        TEXT agenda
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    meeting_invitations {
        UUID id PK
        UUID meeting_id FK
        UUID user_id FK
        VARCHAR status
        TIMESTAMPTZ responded_at
        TIMESTAMPTZ created_at
    }
    meeting_attendance {
        UUID id PK
        UUID meeting_id FK
        UUID user_id FK
        TIMESTAMPTZ entered_at
        TIMESTAMPTZ left_at
    }
    meeting_minutes {
        UUID id PK
        UUID meeting_id FK,UK
        TEXT content
        VARCHAR status
        INTEGER version
        UUID created_by FK
        UUID updated_by FK
        UUID_ARRAY required_approver_ids
        TIMESTAMPTZ submitted_at
        TIMESTAMPTZ approved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    meeting_minutes_approvals {
        UUID id PK
        UUID minutes_id FK
        UUID meeting_id FK
        UUID user_id FK
        INTEGER version
        VARCHAR decision
        VARCHAR comment
        TIMESTAMPTZ decided_at
    }
    users ||--o{ organizations : owner_id
    organizations ||--o{ commissions : organization_id
    commissions ||--o{ commission_members : commission_id
    users ||--o{ commission_members : user_id
    commissions ||--o{ meetings : commission_id
    users ||--o{ meetings : created_by
    meetings ||--|{ meeting_invitations : meeting_id
    users ||--o{ meeting_invitations : user_id
    meetings ||--o{ meeting_attendance : meeting_id
    users ||--o{ meeting_attendance : user_id
    meetings ||--o| meeting_minutes : meeting_id
    users ||--o{ meeting_minutes : created_by_updated_by
    meeting_minutes ||--o{ meeting_minutes_approvals : minutes_id
    users ||--o{ meeting_minutes_approvals : user_id
```

## SD02.01 — Agendar reunião (RF02.01)

```mermaid
sequenceDiagram
    actor Gestor
    participant App
    participant API
    participant DB as PostgreSQL
    Gestor->>App: Informar título, período, pauta e convidados
    App->>API: POST /meetings
    API->>API: Validar campos e datas
    API->>DB: BEGIN e verificar gestor/comissão
    alt Dados ou permissão inválidos
        API->>DB: ROLLBACK
        API-->>App: Erro sem reunião criada
        App-->>Gestor: Explicar correção necessária
    else Pedido válido
        API->>DB: INSERT meetings
        Note over API,DB: Executar RF02.02 na mesma transação
        API->>DB: INSERT convites e COMMIT
        API-->>App: 201 e reunião
        App->>API: Sincronizar dados
        App-->>Gestor: Mostrar agendamento confirmado
    end
```

## SD02.02 — Convidar integrantes (RF02.02)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant DB as PostgreSQL
    actor Integrante
    Note over App,DB: Parte do POST de agendamento
    App->>API: inviteeIds selecionados
    API->>DB: Consultar vínculos da comissão
    alt Convidado não elegível
        API->>DB: ROLLBACK do agendamento
        API-->>App: Erro de convidado
    else Convidados elegíveis
        loop Cada integrante único
            API->>DB: INSERT convite INVITED
        end
        API->>DB: INSERT organizador ACCEPTED
        API->>DB: COMMIT do agendamento
        Integrante->>App: Abrir Reuniões e sincronizar
        App->>API: GET /sync
        API-->>App: Reunião e convite
        App-->>Integrante: Exibir convite pendente
    end
```

## SD02.03 — Responder convite (RF02.03)

```mermaid
sequenceDiagram
    actor Convidado
    participant App
    participant API
    participant DB as PostgreSQL
    Convidado->>App: Aceitar ou recusar
    App->>API: PATCH invitation (userId, status)
    API->>DB: Consultar convite e presença
    alt Convite inexistente ou entrada já registrada
        API-->>App: Erro
        App-->>Convidado: Manter situação confirmada
    else Resposta permitida
        API->>DB: UPDATE status e responded_at
        DB-->>API: Convite atualizado
        API-->>App: Convite confirmado
        App-->>Convidado: Mostrar aceite ou recusa
    end
```

## SD02.04 — Registrar entrada (RF02.04)

```mermaid
sequenceDiagram
    actor Participante
    participant App
    participant API
    participant DB as PostgreSQL
    Participante->>App: Registrar entrada
    App->>API: PATCH attendance (ENTER)
    API->>DB: BEGIN e bloquear reunião
    API->>DB: Conferir aceite e situação da ata
    alt Sem aceite ou ata em revisão/aprovada
        API->>DB: ROLLBACK
        API-->>App: Entrada negada
    else Entrada permitida
        API->>DB: Inserir primeira entrada ou preservar existente
        API->>DB: COMMIT
        API-->>App: Presença com enteredAt
        App-->>Participante: Exibir entrada confirmada
    end
```

## SD02.05 — Registrar saída (RF02.05)

```mermaid
sequenceDiagram
    actor Participante
    participant App
    participant API
    participant DB as PostgreSQL
    Participante->>App: Registrar saída
    App->>API: PATCH attendance (EXIT)
    API->>DB: Localizar entrada sem saída
    alt Sem entrada ou saída já registrada
        API-->>App: Conflito de estado
        App-->>Participante: Explicar marcação necessária
    else Entrada existente
        API->>DB: UPDATE left_at = hora do servidor
        DB-->>API: Registro atualizado
        API-->>App: Presença confirmada
        App-->>Participante: Mostrar entrada e saída
    end
```

## SD02.06 — Gerar lista de presença (RF02.06)

```mermaid
sequenceDiagram
    actor Solicitante
    participant App
    participant API
    participant DB as PostgreSQL
    Solicitante->>App: Abrir lista de presença
    App->>API: GET attendance (userId)
    API->>DB: Verificar acesso à reunião
    alt Sem acesso
        API-->>App: Acesso negado
    else Consulta permitida
        API->>DB: Consultar convidados e presença com nomes e horários
        DB-->>API: Registros, incluindo saídas e ausentes
        API-->>App: Lista estruturada
        App-->>Solicitante: Exibir lista/ausência de entradas
    end
```

## SD02.07 — Criar ou corrigir ata (RF02.07)

```mermaid
sequenceDiagram
    actor Gestor
    participant App
    participant API
    participant DB as PostgreSQL
    Gestor->>App: Escrever e salvar texto
    App->>API: POST minutes (userId, content)
    API->>DB: BEGIN, conferir gestor e bloquear ata
    alt Sem permissão, texto vazio ou ata aprovada
        API->>DB: ROLLBACK
        API-->>App: Erro sem mudar conteúdo
    else Ata nova ou editável
        alt Correção de texto ou reabertura de revisão/reprovação
            API->>DB: Atualizar conteúdo, nova versão e DRAFT
            API->>DB: Remover decisões e limpar aprovadores
        else Nova ata ou rascunho
            API->>DB: Inserir ou atualizar DRAFT
        end
        API->>DB: COMMIT
        API-->>App: Ata salva
        App-->>Gestor: Exibir rascunho e versão
    end
```

## SD02.08 — Submeter ata (RF02.08)

```mermaid
sequenceDiagram
    actor Gestor
    participant App
    participant API
    participant DB as PostgreSQL
    Gestor->>App: Enviar para aprovação
    App->>API: POST minutes/submit
    API->>DB: BEGIN, bloquear reunião e ata
    API->>DB: Conferir gestor, DRAFT e entradas
    alt Sem rascunho válido ou sem presentes
        API->>DB: ROLLBACK
        API-->>App: Submissão negada
    else Submissão válida
        API->>DB: Salvar required_approver_ids
        API->>DB: UPDATE status IN_REVIEW e submitted_at
        API->>DB: COMMIT
        API-->>App: Ata em revisão e conjunto de aprovadores
        App-->>Gestor: Mostrar decisões pendentes
    end
```

## SD02.09 — Aprovar ou solicitar correção (RF02.09)

```mermaid
sequenceDiagram
    actor Presente
    participant App
    participant API
    participant DB as PostgreSQL
    Presente->>App: Ler versão e decidir
    App->>API: PATCH minutes/approval (inclui versão lida)
    API->>DB: BEGIN e bloquear ata
    API->>API: Verificar IN_REVIEW, versão e aprovador obrigatório
    alt Não elegível, versão mudou ou estado incompatível
        API->>DB: ROLLBACK
        API-->>App: Decisão negada
    else Decisão válida
        API->>DB: Registrar decisão para a versão
        alt REJECTED
            API->>DB: Marcar ata REJECTED
        else APPROVED
            API->>DB: Contar aprovações dos IDs obrigatórios
            alt Todos aprovaram
                API->>DB: Marcar APPROVED e approved_at
            else Ainda faltam aprovações
                Note over API,DB: Preservar IN_REVIEW
            end
        end
        API->>DB: COMMIT
        API-->>App: Ata e decisão confirmadas
        App-->>Presente: Mostrar resultado e progresso
    end
```

## SD02.10 — Gerar ata em PDF (RF02.10)

```mermaid
sequenceDiagram
    actor Solicitante
    participant App
    participant Navegador
    participant API
    participant DB as PostgreSQL
    Solicitante->>App: Gerar ata em PDF
    App->>App: Exigir ata salva e ausência de edição pendente
    App->>API: HEAD minutes/pdf (userId, version, timeZone)
    API->>DB: Conferir acesso e versão atual
    alt Sem acesso, ata ausente ou versão divergente
        API-->>App: 403, 404 ou 409
        App-->>Solicitante: Informar falha e orientar atualização
    else Consulta permitida
        API-->>App: 200 e metadados da ata
        App->>Navegador: Abrir URL do PDF
        Navegador->>API: GET minutes/pdf (mesmos parâmetros)
        API->>DB: Revalidar e ler dados atuais da reunião/ata
        API->>API: Gerar PDF com versão, situação e aviso não final
        API-->>Navegador: application/pdf como attachment
        Navegador-->>Solicitante: Salvar, abrir ou compartilhar arquivo
    end
```
