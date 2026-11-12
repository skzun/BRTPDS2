# Atendimento às solicitações do professor

Revisão de 12/11/2026. Fontes: [registro dos comentários de 21/08, 09/10 e 29/10]({{SOURCE}}docs/REVISAO_COMENTARIOS_PROFESSOR_2026-11-06.md), pedidos transcritos na conversa e [conferência dos slides do incremento 3](Verificacao-Incremento-3). Não foram inventadas exigências de um formulário institucional não fornecido.

**Documentado** significa artefato disponível; **implementado** significa mecanismo encontrado no código; **validado** exige evidência do cenário. Nenhuma dessas classificações substitui aceite do professor. Observações históricas de ausência não descrevem necessariamente o código atual.

## Artefatos da entrega

| Solicitação | Entrega e evidência | Limite/pendência |
| --- | --- | --- |
| Casos de uso UML com atores e fronteira | [33 pares fonte/SVG](Diagramas), incluindo UC dos incrementos 1–3 | Aprovação visual/institucional ainda pendente. |
| RFs separados de fichas detalhadas | [49 RFs](Rastreabilidade), tabela declarativa e fichas com ator, gatilho, pré-condições, entradas, passos, exceções, dados e API em [Incremento 1](Incremento-1) | Comparar com formulário original da disciplina. |
| Classes, métodos e dicionário | [Dicionário de classes](Dicionario-de-Classes), diagramas de domínio e serviços | Arquitetura modular JavaScript; não declarar classes OO inexistentes. |
| Modelo relacional e dicionário completo | [Dicionário físico](Dicionario-do-Banco), snapshot/DDL e diagramas | 131 colunas conferidas; UUID não tem seed/incremento numérico. |
| RNFs específicos e verificáveis | RNFs na [especificação](Incremento-1), critérios e condições de medição | Desempenho/acessibilidade ainda requerem medidas reais; não declarar meta de 100 ms comprovada. |
| Sequências para os requisitos | Cada RF referencia uma sequência existente | Fluxos correlatos compartilham diagramas. |
| Tecnologias atuais e mínimos de SO | [Versões extraídas dos manifests/locks](Versoes), [arquitetura](Arquitetura-e-Tecnologias) | Mínimos declarados não comprovam instalação em aparelhos. |
| Padrões de programação/nomenclatura | [Padrões](Padroes-de-Codigo), transações, autorização, cache, erros e testes | Consistência semântica exige revisão além de links. |
| Testes específicos e documentados | [79 testes atuais](Testes), cenários de voto, presença, ata, segurança, migração/PDF | Testes físicos e cenários recentes indicados nas pendências. |
| Interfaces e identidade visual | [Contratos de interface](Interface-e-UX), telas/temas e roteiro em aparelho | Screenshots fornecidas evidenciaram falhas anteriores nos botões; acabamento final precisa de confirmação. |
| Concorrentes, aplicativo adicional e comunidade | [Análise de mercado](Analise-de-Mercado), incluindo Nextcloud Calendar, roteiro de avaliação | Análise documental não é teste manual; entrevistas e aceite não comprovados. |
| Responsável por requisito e apresentação | Matriz abaixo para preenchimento pela equipe | Nomes/responsabilidades não informados; não atribuir autoria por suposição. |

## Funcionalidades e observações de uso

| Pedido | Estado conferido |
| --- | --- |
| Cadastro de organização; administração aprova/revoga e gerencia | Cadastro PENDING, aprovação/recusa e remoção presentes. Revogar foi removido da UI a pedido do usuário: requisito original está parcialmente atendido. |
| Teclado não cobrir campos; máscaras; botões e padding | Componentes de teclado, máscara CNPJ e ações existem. Campo CNPJ controlado é exceção aos campos não controlados; testar cursor, telas estreitas e fonte ampliada. |
| `.env`, configuração de IP e outro computador | [Execução](Como-executar) diferencia localhost, IP LAN, host Docker e túnel. Segredos permanecem na configuração local, sem cópia nesta Wiki. |
| E-mail para ativação; recuperação segura; Google | Fluxos implementados, código com validade e limite de tentativas; [manual](Manual-do-usuario), [Google](Login-com-Google) e [SMTP](Email-e-Recuperacao). Integração real depende do ambiente. |
| Login único identificando admin/usuário | Servidor retorna `systemRole`; tela de login sem seletor de perfil. |
| Proteger API / “só o app acessa” | Sessão Bearer e autorização no servidor. Não há garantia de exclusividade do binário: clientes autenticados também podem chamar HTTP. Biometria é local. |
| Confirmação e bloqueio de ações de organização | Diálogo e controle de operação presentes. Indicador de processamento ainda tem prop ligada à tela incorreta; ver [pendências](Estado-atual-e-pendencias). |
| Filtrar organização e várias comissões | Filtros/seleção presentes; acesso às reuniões sem convite ainda diverge entre camadas. |
| Transferir dono e convidar para organização | Rotas/telas presentes; transferência exige membro aprovado. Convite para organização é diferente de convite para reunião. |
| Atualizar puxando a tela | RefreshControl no app e atualização explícita em reuniões/relatório. |
| Remover recuperação após login; autenticar edição de perfil | Recuperação disponível no login; perfil protegido com confirmação local quando suportada. |
| Data de inicialização e informações do sistema | Metadados persistidos, versão/processo/host/uptime/memória/conexões/uploads/banco no endpoint administrativo. Em base antiga, data da migração não prova primeira instalação histórica. |
| Reiniciar/restaurar com confirmação | Interface consulta disponibilidade e limpa cache/sessão; reinício real e restauração de backup são operações externas. Não implementados como restauração pelo app. |
| Agendamento com data/hora amigável e erros por campo | MeetingEditor e DateTimeField; horário sugerido do aparelho +1 minuto, período editável; início passado rejeitado. |
| Dia todo, local, detalhes e edição | Implementados. Hoje em Dia todo foi alterado; divergência de fuso cliente/servidor ainda exige validação. Edição restrita a reunião futura sem presença. |
| Impedir convite/entrada após término e saída antes do início | Restrições temporais no servidor e cenários automatizados. |
| Presença por biometria, código e pelo presidente | Implementadas; código não prova proximidade física e biometria não é atestado remoto. |
| Compartilhar arquivos e PDF de presença | Anexos limitados, downloads autorizados e PDF da presença independente da ata. |
| Presidente cria ata; presentes aprovam/reprovam | Implementado; unanimidade do conjunto congelado, com testes de versões, rejeição e concorrência. |
| Votações, relatório individual, manual digital | Implementados no incremento 3 e cobertos por testes/roteiro. |
| Expo SDK 58 | Declarado no mobile; atualização de módulo nativo requer novo build. |

## Responsabilidade acadêmica a preencher

| Entrega | Responsável | Evidência de apresentação |
| --- | --- | --- |
| Organizações, acesso e comissões | A informar pela equipe | Pendente |
| Agendamento, convites e presença | A informar pela equipe | Pendente |
| Atas e PDFs | A informar pela equipe | Pendente |
| Votações e relatório individual | A informar pela equipe | Pendente |
| Modelos, testes e manual | A informar pela equipe | Pendente |

O slide registra apresentação em 13/11/2026 e envio até 18h. Publicar a Wiki não comprova apresentação, envio de APK nem aceite institucional.
