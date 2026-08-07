graph TB
    subgraph "Sistema Synple"
        UC1[Criar Evento]
        UC2[Convidar Participantes]
        UC3[Confirmar Disponibilidade]
        UC4[Chat do Evento]
        UC5[Visualizar Agenda]
        UC6[Criar Grupo]
        UC7[Gerenciar Perfil]
        UC8[Receber Notificações]
        UC9[Login/Registro]
        UC10[Sincronizar Offline]
    end

    subgraph "Atores"
        USER[👤 Usuário]
        ADMIN[👨‍💼 Admin]
        TIME[⏰ Sistema]
    end

    USER --> UC9
    USER --> UC1
    USER --> UC2
    USER --> UC3
    USER --> UC4
    USER --> UC5
    USER --> UC6
    USER --> UC7
    USER --> UC8

    UC1 -.->|include| UC2
    UC1 -.->|include| UC9
    UC4 -.->|extend| UC8
    UC3 -.->|extend| UC8
    UC10 -.->|include| UC1
    UC10 -.->|include| UC3
    UC10 -.->|include| UC4

    ADMIN --- UC7
    TIME --- UC10

    style UC1 fill:#4A90E2,color:#fff
    style UC4 fill:#FF6B6B,color:#fff
    style UC10 fill:#10B981,color:#fff
    style UC9 fill:#F59E0B,color:#fff
    
Caso de Uso	Ator	Descrição	Pré-condições	Pós-condições
UC01 - Criar Evento	Usuário	Cria novo evento com datas propostas	Autenticado	Evento criado, participantes notificados
UC02 - Convidar Participantes	Usuário	Seleciona contatos/grupos para evento	Evento criado	Participantes convidados
UC03 - Confirmar Disponibilidade	Usuário	Indica datas que pode comparecer	Convidado para evento	Disponibilidade registrada
UC04 - Chat do Evento	Usuário	Envia mensagens no chat do evento	Participante do evento	Mensagem entregue
UC05 - Visualizar Agenda	Usuário	Vê lista/calendário de eventos	Autenticado	Agenda exibida
UC06 - Criar Grupo	Usuário	Cria grupo de contatos	Autenticado	Grupo criado
UC07 - Gerenciar Perfil	Usuário/Admin	Edita dados pessoais	Autenticado	Perfil atualizado
UC08 - Receber Notificações	Usuário	Recebe push de eventos/mensagens	Permissão concedida	Notificação exibida
UC09 - Login/Registro	Usuário	Autentica no sistema	App instalado	Sessão iniciada
UC10 - Sincronizar Offline	Sistema	Sincroniza dados locais ↔ servidor	Conexão disponível	Dados sincronizados

    
    
    
    
    
Caso de Uso	Ator	Descrição	Pré-condições	Pós-condições
UC01 - Criar Evento	Usuário	Cria novo evento com datas propostas	Autenticado	Evento criado, participantes notificados
UC02 - Convidar Participantes	Usuário	Seleciona contatos/grupos para evento	Evento criado	Participantes convidados
UC03 - Confirmar Disponibilidade	Usuário	Indica datas que pode comparecer	Convidado para evento	Disponibilidade registrada
UC04 - Chat do Evento	Usuário	Envia mensagens no chat do evento	Participante do evento	Mensagem entregue
UC05 - Visualizar Agenda	Usuário	Vê lista/calendário de eventos	Autenticado	Agenda exibida
UC06 - Criar Grupo	Usuário	Cria grupo de contatos	Autenticado	Grupo criado
UC07 - Gerenciar Perfil	Usuário/Admin	Edita dados pessoais	Autenticado	Perfil atualizado
UC08 - Receber Notificações	Usuário	Recebe push de eventos/mensagens	Permissão concedida	Notificação exibida
UC09 - Login/Registro	Usuário	Autentica no sistema	App instalado	Sessão iniciada
UC10 - Sincronizar Offline	Sistema	Sincroniza dados locais ↔ servidor	Conexão disponível	Dados sincronizados
