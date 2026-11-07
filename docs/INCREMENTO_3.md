# Synple — Incremento 3

Revisão: 06/11/2026. Este documento registra os requisitos implementados a partir dos slides 5–12 do material do Incremento 3. Os requisitos descrevem o comportamento; as fichas de caso de uso abaixo registram a interação com o sistema.

## Escopo e decisões de produto

O incremento adiciona votações independentes da aprovação de ata, relatório individual das reuniões frequentadas, manual digital dentro do aplicativo e migração do mobile para Expo SDK 58.

Regras adotadas para a primeira versão da votação: cada votação é uma pergunta de escolha única com 2 a 8 opções; somente coordenador da comissão ou proprietário da organização pode abrir/encerrar; somente pessoa com entrada registrada pode votar; enquanto aberta, a pessoa pode trocar seu voto; encerrada, nenhum voto pode ser alterado. Resultados e contagem de votos são visíveis aos convidados históricos da reunião. A votação não substitui aprovação ou rejeição da ata.

O relatório individual é derivado exclusivamente de entradas registradas no servidor para a sessão autenticada. Não inclui reuniões em que a pessoa só recebeu convite.

## Requisitos funcionais

| ID | Requisito declarativo |
| --- | --- |
| RF03.01 | O sistema deve permitir que o coordenador da comissão ou proprietário da organização abra uma votação em uma reunião, informando pergunta e opções distintas. |
| RF03.02 | O sistema deve permitir que participantes com entrada registrada selecionem uma opção e alterem seu voto enquanto a votação estiver aberta. |
| RF03.03 | O sistema deve permitir que o coordenador da comissão ou proprietário da organização encerre uma votação aberta e preserve sua apuração. |
| RF03.04 | O sistema deve apresentar ao usuário autenticado o relatório de reuniões em que sua entrada foi registrada, com organização, comissão, horários de reunião e presença e situação da ata. |
| RF03.05 | O sistema deve oferecer no aplicativo um manual digital de consulta às funções de acesso, organizações, comissões, reuniões, votações, atas e relatórios. |
| RNF03.01 | As operações privadas devem derivar a identidade do usuário da sessão validada; IDs enviados pelo cliente não definem o autor do voto ou do relatório. |
| RNF03.02 | Votações, opções e votos devem persistir no PostgreSQL e respeitar chaves estrangeiras e unicidade de voto por participante. |
| RNF03.03 | O aplicativo deve manter compatibilidade de dependências com Expo SDK 58 e React Native 0.88. |

## Casos de uso

### UC03.01 — Abrir votação

| Campo | Descrição |
| --- | --- |
| Ator | Coordenador da comissão ou proprietário da organização |
| Gatilho / tela | Em Reuniões, preenche pergunta e opções e seleciona Abrir votação |
| Pré-condições | Sessão autenticada; acesso de gestão à reunião; ao menos uma entrada de presença registrada |
| Entradas | Pergunta com até 500 caracteres; de duas a oito opções distintas de até 160 caracteres cada |
| Fluxo principal | O app envia POST `/api/meetings/:meetingId/votes`; o servidor valida autorização e campos; cria votação e opções na mesma transação; devolve os registros persistidos |
| Exceções | Usuário sem autorização recebe 403; reunião sem presentes, pergunta/opções inválidas ou duplicadas não geram gravação |
| Pós-condição | Votação OPEN e opções visíveis aos convidados históricos da reunião |

### UC03.02 — Votar ou alterar voto

| Campo | Descrição |
| --- | --- |
| Ator | Participante com entrada registrada |
| Gatilho / tela | Em Reuniões, escolhe uma opção de votação aberta |
| Pré-condições | Sessão autenticada; votação OPEN; presença do usuário registrada naquela reunião |
| Entradas | Identificador da reunião, votação e opção |
| Fluxo principal | POST `/api/meetings/:meetingId/votes/:voteId/ballot`; servidor confirma reunião, presença, status e opção; insere ou atualiza o voto único da pessoa |
| Exceções | Votação encerrada retorna 409; usuário sem presença retorna 403; opção pertencente a outra votação é recusada |
| Pós-condição | A contagem da opção reflete o voto atual da pessoa |

### UC03.03 — Encerrar votação

| Campo | Descrição |
| --- | --- |
| Ator | Coordenador da comissão ou proprietário da organização |
| Gatilho / tela | Confirma Encerrar votação em Reuniões |
| Pré-condições | Sessão autenticada; votação aberta; acesso de gestão à reunião |
| Entradas | Identificadores da reunião e votação |
| Fluxo principal | PATCH `/api/meetings/:meetingId/votes/:voteId/close`; servidor verifica a gestão e altera OPEN para CLOSED, gravando `closed_at` com o relógio do banco |
| Exceções | A votação não pertence à reunião ou já foi encerrada: conflito sem alteração |
| Pós-condição | Apuração fica imutável; contagens permanecem disponíveis |

### UC03.04 — Consultar relatório individual

| Campo | Descrição |
| --- | --- |
| Ator | Usuário autenticado |
| Gatilho / tela | Abre Meu relatório ou seleciona Atualizar relatório |
| Pré-condições | Sessão válida |
| Entradas | Nenhuma identificação de usuário fornecida pelo cliente |
| Fluxo principal | GET `/api/meetings/participation/report`; servidor usa `req.auth.id`, filtra `entered_at IS NOT NULL` e junta reunião, organização, comissão e status da ata |
| Exceções | Sessão ausente/expirada é recusada; indisponibilidade da API exibe mensagem de erro |
| Pós-condição | Tela apresenta somente reuniões do titular da sessão em ordem decrescente |

### UC03.05 — Consultar manual digital

| Campo | Descrição |
| --- | --- |
| Ator | Usuário autenticado |
| Gatilho / tela | Seleciona Manual na navegação |
| Pré-condições | Aplicativo aberto |
| Entradas | Nenhuma |
| Fluxo principal | A tela renderiza localmente instruções das áreas de acesso, organizações, comissões, reuniões, votações, atas e relatórios |
| Exceções | Não depende de conexão com o backend |
| Pós-condição | Orientações disponíveis para consulta dentro do app |

## Dados e contratos

| Tabela | Chave e campos | Regras |
| --- | --- | --- |
| `meeting_votes` | `id` UUID PK; `meeting_id` FK; `question`; `status`; `created_by` FK; `created_at`; `closed_at` | `status` OPEN/CLOSED; UUID gerado por `gen_random_uuid()`; pergunta não vazia. |
| `meeting_vote_options` | `id` UUID PK; `vote_id` FK; `label`; `position` | Posição única por votação; 2–8 opções são validadas na rota. |
| `meeting_vote_ballots` | `id` UUID PK; `vote_id` FK; `option_id` FK composta com `vote_id`; `user_id` FK; `cast_at` | Um registro por pessoa/votação; opção deve pertencer à votação; atualização permitida apenas enquanto aberta. |

API privada com prefixo `/api` e Bearer de sessão. Rotas: POST `/meetings/:meetingId/votes`, POST `/meetings/:meetingId/votes/:voteId/ballot`, PATCH `/meetings/:meetingId/votes/:voteId/close` e GET `/meetings/participation/report`. GET `/sync` inclui votação, opções, contagens agregadas e somente o voto do usuário autenticado, apenas para reuniões visíveis segundo o escopo de segurança existente. As escolhas dos demais participantes não são enviadas ao app. O relatório consulta `req.auth.id` diretamente.

## Diagramas e dicionários

- Casos de uso: [fonte UML](Diagramas/fontes/uc-incremento-3.puml).
- Modelo de classes: [fonte UML](Diagramas/fontes/classes-incremento-3.puml).
- Modelo relacional: [fonte PlantUML](Diagramas/fontes/relacional-incremento-3.puml).
- Sequência de votação: [fonte UML](Diagramas/fontes/seq-votacoes.puml).
- Sequência do relatório: [fonte UML](Diagramas/fontes/seq-relatorio-participacao.puml).
- Sequência do manual: [fonte UML](Diagramas/fontes/seq-manual-consulta.puml).
- [Dicionário físico](dicionario-banco-dados.md#tabela-meeting_votes) e [dicionário de classes](dicionario-classes.md#votacao).

## Rastreabilidade e aceite

| Requisito | Interface | Operação/persistência | Critério de aceite |
| --- | --- | --- | --- |
| RF03.01 | Reuniões → Votações | POST votes; `meeting_votes`, `meeting_vote_options` | Gestor abre pergunta válida com 2–8 opções; pessoa não gestora não abre. |
| RF03.02 | Reuniões → Votações | POST ballot; `meeting_vote_ballots` | Presente vota e pode alterar antes do encerramento; ausente ou votação fechada não altera dados. |
| RF03.03 | Reuniões → Votações | PATCH close; atualização de `meeting_votes` | Gestor encerra; não gestor é negado; nova tentativa não muda apuração. |
| RF03.04 | Meu relatório | GET participation/report; `meeting_attendance` + reuniões/organização/comissão/ata | Conta A vê somente presenças próprias, sem reuniões convidadas mas não frequentadas nem dados de conta B. |
| RF03.05 | Manual | Conteúdo empacotado no mobile | Manual acessível na navegação e inclui as novas funções. |
| RNF03.03 | Build mobile | `package.json` e `package-lock.json` | Manifesto e lockfile declaram Expo 58, React Native 0.88 e React 19.3; build de Android e iOS precisa ser feito antes da publicação. |

A verificação atual e os limites de entrega estão em [ENTREGA_INCREMENTO_3.md](ENTREGA_INCREMENTO_3.md). Há testes automatizados e exportação Android/iOS/web; testes físicos e validação comunitária continuam separados.

## Complementos de entrega

Os requisitos RF03.06–RF03.11 acrescentam edição de reunião futura, dia todo/local/detalhes, anexos privados, código temporário de presença, registro pelo presidente e PDF da lista de presença. Consulte as fichas completas na [especificação principal](incremento-1-especificacao-completa.md#requisitos-funcionais-declarativos) e o [índice de diagramas](Diagramas/Diagramas_Casos_de_Uso.md). As regras temporais são aplicadas no backend. As instruções atualizadas estão no manual dentro do aplicativo.
