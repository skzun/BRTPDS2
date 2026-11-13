# Atendimento às solicitações do professor

Revisão de 13/11/2026. Fontes: [registro dos comentários de 21/08, 09/10 e 29/10]({{SOURCE}}docs/REVISAO_COMENTARIOS_PROFESSOR_2026-11-06.md), pedidos transcritos na conversa e [conferência dos slides do incremento 3](Verificacao-Incremento-3). Não foram inventadas exigências de um formulário institucional não fornecido.

**Documentado** significa artefato disponível; **implementado** significa mecanismo encontrado no código; **validado** exige evidência do cenário. Nenhuma dessas classificações substitui aceite do professor. Observações históricas de ausência não descrevem necessariamente o código atual.

## Artefatos da entrega

| Solicitação | Entrega e evidência | Limite/pendência |
| --- | --- | --- |
| Casos de uso UML com atores e fronteira | [34 pares fonte/SVG](Diagramas). Incremento 3 refeito em 13/11: atores detalhados, fronteira, «include»/«extend», separado em requisitos do slide (ata, votação, relatório, manual) e ajustes das avaliações | Aprovação visual/institucional ainda pendente. |
| RFs separados de fichas detalhadas | [49 RFs](Rastreabilidade) e fichas em [Incremento 1](Incremento-1). Em 13/11 os 15 RFs do Incremento 3 (inclusive a ata, slide 5) ganharam texto declarativo concreto, e a ata passou a ter fichas em [Incremento 3](Incremento-3) | RFs dos incrementos 1–2 ainda usam a frase declarativa genérica; comparar com o formulário da disciplina. |
| Classes, métodos e dicionário | Diagrama do Incremento 3 refeito a partir do código (componentes com estado e métodos, módulos com funções reais, `RequestError`) e [dicionário de classes](Dicionario-de-Classes) | Arquitetura modular JavaScript; não declarar classes OO inexistentes. |
| Modelo relacional e dicionário completo | [Dicionário físico](Dicionario-do-Banco) com finalidade de cada tabela e campo, seção de chaves primárias (nenhuma auto incrementável, logo sem seed/incremento) e tabela dos 31 relacionamentos com cardinalidade e ação ao excluir | 131 colunas conferidas. |
| RNFs específicos e verificáveis | RNFs na [especificação](Incremento-1), critérios e condições de medição | Desempenho/acessibilidade ainda requerem medidas reais; não declarar meta de 100 ms comprovada. |
| Sequências para os requisitos | Cada RF referencia uma sequência. Em 13/11, 12 sequências (ata, PDF, votação, relatório, manual, cadastro, login, recuperação, convites, transferência, sincronização, requisição protegida) passaram a usar os arquivos reais como participantes e chamadas reais como mensagens | Imagens desses 12 e dos UC/classes do Incremento 3 geradas localmente; visual levemente diferente dos demais. |
| Tecnologias atuais e mínimos de SO | [Versões extraídas dos manifests/locks](Versoes), [arquitetura](Arquitetura-e-Tecnologias) | Mínimos declarados não comprovam instalação em aparelhos. |
| Padrões de programação/nomenclatura | [Padrões](Padroes-de-Codigo), transações, autorização, cache, erros e testes | Consistência semântica exige revisão além de links. |
| Testes específicos e documentados | [Testes](Testes), reexecutados em 13/11 para votação e reuniões; cenários de voto, presença, ata, segurança, migração/PDF | Testes físicos e cenários recentes indicados nas pendências. |
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
| Convidar pessoas para a reunião | Ao agendar, todos os integrantes da comissão vêm marcados e podem ser desmarcados; o convidado aceita ou recusa no cartão da reunião até o término. Testado em 13/11. Não há como convidar alguém depois de a reunião criada. |
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
