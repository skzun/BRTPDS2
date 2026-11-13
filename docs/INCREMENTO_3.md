# Synple — Incremento 3

Revisão: 13/11/2026. Este documento registra os requisitos implementados a partir dos slides 5–12 do material do Incremento 3. Os requisitos descrevem o comportamento; as fichas de caso de uso abaixo registram a interação com o sistema.

## Escopo e decisões de produto

O incremento adiciona a ata de reunião com aprovação ou reprovação pelos participantes, votações independentes da aprovação de ata, relatório individual das reuniões frequentadas, manual digital dentro do aplicativo e migração do mobile para Expo SDK 58.

Regras adotadas para a primeira versão da votação: cada votação é uma pergunta de escolha única com 2 a 8 opções; somente coordenador da comissão ou proprietário da organização pode abrir/encerrar; somente pessoa com entrada registrada pode votar; enquanto aberta, a pessoa pode trocar seu voto; encerrada, nenhum voto pode ser alterado. Resultados e contagem de votos são visíveis aos convidados históricos da reunião. A votação não substitui aprovação ou rejeição da ata.

O relatório individual é derivado exclusivamente de entradas registradas no servidor para a sessão autenticada. Não inclui reuniões em que a pessoa só recebeu convite.

## Requisitos funcionais

| ID | Requisito declarativo |
| --- | --- |
| RF02.07 | O sistema deve permitir que o presidente da comissão (coordenador ou proprietário) escreva e salve o texto da ata da reunião, com 1 a 50.000 caracteres, na situação Rascunho. Ao salvar uma correção de ata em aprovação ou reprovada, o sistema deve criar uma nova versão, descartar as decisões da versão anterior e voltar a situação para Rascunho. Uma ata aprovada não pode ser alterada. |
| RF02.08 | O sistema deve permitir que o presidente envie o rascunho da ata para aprovação somente quando houver pelo menos um participante com entrada registrada. No envio, o sistema deve fixar como aprovadores todas as pessoas com entrada registrada naquele instante, mudar a situação para Em aprovação e bloquear novas entradas na reunião enquanto a ata estiver em aprovação ou aprovada. |
| RF02.09 | O sistema deve permitir que cada aprovador fixado no envio aprove ou reprove a versão atual da ata, com comentário opcional de até 2.000 caracteres. Uma reprovação deve mudar a situação para Reprovada; a aprovação de todos os aprovadores deve mudar a situação para Aprovada e registrar a data. Decisões sobre uma versão desatualizada ou de quem não é aprovador devem ser recusadas. |
| RF02.10 | O sistema deve gerar o PDF da versão salva da ata, com reunião, comissão, organização, versão, situação, presentes e decisões no fuso horário do aparelho, para convidados e gestores da reunião, por meio de link de download vinculado à sessão e válido por 60 segundos. |
| RF03.01 | O sistema deve permitir que o presidente da comissão abra uma votação na reunião, informando uma pergunta de até 500 caracteres e de 2 a 8 opções diferentes de até 160 caracteres cada, somente depois que houver pelo menos uma entrada registrada. A votação deve ser independente da aprovação da ata. |
| RF03.02 | O sistema deve permitir que o participante com entrada registrada escolha uma única opção em uma votação aberta e altere sua escolha enquanto a votação estiver aberta, mantendo um voto por pessoa. O participante deve ver a contagem de cada opção e somente o próprio voto. |
| RF03.03 | O sistema deve permitir que o presidente da comissão encerre uma votação aberta, após confirmação, registrando a data de encerramento. Depois de encerrada, nenhum voto pode ser registrado ou alterado e o resultado permanece disponível para consulta. |
| RF03.04 | O sistema deve exibir ao usuário autenticado a lista das reuniões em que ele teve entrada registrada, com título, organização, comissão, início e término previstos, horário de entrada, horário de saída e situação da ata, da mais recente para a mais antiga, usando somente a identidade da sessão. |
| RF03.05 | O sistema deve disponibilizar, na aba Manual do aplicativo, um manual de utilização com instruções sobre acesso e perfil, organizações, comissões, reuniões e presença, arquivos, votações, atas, relatório de participação e ajuda, consultável sem conexão com a API. |
| RF03.06 | O sistema deve permitir que o presidente da comissão edite título, pauta, horários, opção de dia todo, local e detalhes de uma reunião que ainda não começou e não tem presença registrada, solicitando nova confirmação aos convidados. |
| RF03.07 | O sistema deve permitir agendar reunião de dia todo, abrangendo pelo menos um dia de calendário, e informar local (até 300 caracteres) e detalhes (até 4.000 caracteres) opcionais, recusando início no passado e término anterior ao início, com a mensagem de erro exibida junto ao campo. |
| RF03.08 | O sistema deve permitir que o presidente da comissão anexe à reunião até 10 arquivos PDF, PNG, JPEG ou TXT de até 5 MB cada, conferindo o tipo pelo conteúdo do arquivo, e que convidados e gestores da reunião baixem esses arquivos. |
| RF03.09 | O sistema deve permitir que o presidente da comissão gere, durante a reunião, um código de presença de 6 dígitos válido por até 10 minutos ou até o término da reunião, e que o convidado com convite aceito registre sua entrada informando esse código. |
| RF03.10 | O sistema deve permitir que o presidente da comissão registre a entrada e a saída de convidados que aceitaram o convite, somente durante o horário da reunião, gravando quem fez o registro e o método utilizado. |
| RF03.11 | O sistema deve gerar a lista de presença da reunião em PDF, com cada convidado, a situação do convite e os horários de entrada e saída, para convidados e gestores da reunião. |
| RNF03.01 | As operações privadas devem derivar a identidade do usuário da sessão validada; IDs enviados pelo cliente não definem o autor do voto ou do relatório. |
| RNF03.02 | Votações, opções e votos devem persistir no PostgreSQL e respeitar chaves estrangeiras e unicidade de voto por participante. |
| RNF03.04 | Aprovação da ata e votos devem ser processados em transação com bloqueio da reunião; decisão sobre versão antiga da ata, voto após encerramento e encerramento duplicado devem ser recusados (HTTP 409) sem alterar dados, conforme `meetings.test.js` e `voting.test.js`. |
| RNF03.05 | O PDF da ata deve ser gerado em memória no servidor, em português legível, identificando versão, situação e fuso horário, e só pode ser baixado com sessão válida ou ticket de 60 segundos vinculado à sessão e ao caminho. |
| RNF03.03 | O aplicativo deve manter compatibilidade de dependências com Expo SDK 58 e React Native 0.88. |

## Casos de uso

Fichas no formulário usado pela equipe (ator, gatilho, pré-condições, entradas, fluxo principal, exceções e pós-condição). A especificação principal tem as fichas completas de RF02.07–RF02.10 e RF03.06–RF03.11.

### UC02.07 — Criar ou corrigir ata

| Campo | Descrição |
| --- | --- |
| Ator | Presidente da comissão (coordenador ou proprietário) |
| Gatilho / tela | Reuniões → cartão da reunião → aba Ata → Salvar rascunho da ata ou Salvar correção da ata |
| Pré-condições | Sessão autenticada; gestão da reunião; ata não aprovada |
| Entradas | Texto da ata com 1 a 50.000 caracteres |
| Fluxo principal | `saveMeetingMinutesWithApi` envia POST `/api/meetings/:meetingId/minutes`; o servidor confere `requireManager`, grava `meeting_minutes` como DRAFT (nova versão se já estava em aprovação ou reprovada) e apaga as decisões da versão anterior |
| Exceções | Texto vazio ou longo demais: 400; não gestor: 403; ata aprovada: 409 |
| Pós-condição | Ata em Rascunho com versão atual; nova aprovação exigida |

### UC02.08 — Submeter ata para aprovação

| Campo | Descrição |
| --- | --- |
| Ator | Presidente da comissão |
| Gatilho / tela | Aba Ata → Enviar ata para aprovação → confirmação |
| Pré-condições | Ata em Rascunho; pelo menos uma entrada registrada |
| Entradas | Identificador da reunião |
| Fluxo principal | POST `/api/meetings/:meetingId/minutes/submit`; o servidor lê as entradas registradas, fixa `required_approver_ids` e muda a situação para IN_REVIEW |
| Exceções | Sem rascunho: 404/409; sem presentes: 409; não gestor: 403 |
| Pós-condição | Ata Em aprovação; novas entradas bloqueadas |

### UC02.09 — Aprovar ou reprovar ata

| Campo | Descrição |
| --- | --- |
| Ator | Participante com entrada registrada no envio da ata |
| Gatilho / tela | Aba Ata → Aprovar ata ou Rejeitar ata → confirmação |
| Pré-condições | Ata Em aprovação; usuário entre os aprovadores fixados |
| Entradas | Decisão APPROVED ou REJECTED; comentário opcional até 2.000 caracteres; versão lida |
| Fluxo principal | PATCH `/api/meetings/:meetingId/minutes/approval`; o servidor confere versão e aprovador, grava a decisão e recalcula a situação: REJECTED se alguém reprovar, APPROVED quando todos aprovarem |
| Exceções | Versão desatualizada ou ata fora de aprovação: 409; usuário fora da lista: 403 |
| Pós-condição | Decisão registrada; ata Reprovada, Aprovada ou ainda Em aprovação |

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

- Casos de uso — ata, votação, relatório e manual: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-incremento-3.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/uc-incremento-3.puml)
- Casos de uso — ajustes pedidos nas avaliações: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-incremento-3-ajustes.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/uc-incremento-3-ajustes.puml)
- Classes de projeto (código): [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/classes-incremento-3.puml)
- Modelo relacional: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-incremento-3.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-incremento-3.puml)
- Sequência — ata: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-ata.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-ata.puml)
- Sequência — PDF da ata: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-pdf.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-pdf.puml)
- Sequência — votação: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-votacoes.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-votacoes.puml)
- Sequência — relatório individual: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-relatorio-participacao.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-relatorio-participacao.puml)
- Sequência — manual: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-manual-consulta.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-manual-consulta.puml)
- Sequência — editar reunião: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-editar-reuniao.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-editar-reuniao.puml)
- Sequência — anexos: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-anexos.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-anexos.puml)
- Sequência — presença (código e presidente): [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca.puml)
- Sequência — PDF da lista de presença: [imagem](Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca-pdf.svg) · [fonte](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca-pdf.puml)
- [Dicionário de classes](dicionario-classes.md#classes-de-projeto-do-incremento-3) e [dicionário físico](dicionario-banco-dados.md#tabela-meeting_minutes).

## Rastreabilidade e aceite

| Requisito | Interface | Operação/persistência | Critério de aceite |
| --- | --- | --- | --- |
| RF02.07 | Reuniões → Ata | POST minutes; `meeting_minutes` | Presidente salva rascunho; correção gera nova versão; ata aprovada não muda. |
| RF02.08 | Reuniões → Ata | POST minutes/submit; `required_approver_ids` | Envio fixa os presentes; sem presentes é recusado. |
| RF02.09 | Reuniões → Ata | PATCH minutes/approval; `meeting_minutes_approvals` | Uma reprovação reprova; aprovação de todos aprova; versão antiga é recusada. |
| RF03.01 | Reuniões → Votações | POST votes; `meeting_votes`, `meeting_vote_options` | Gestor abre pergunta válida com 2–8 opções; pessoa não gestora não abre. |
| RF03.02 | Reuniões → Votações | POST ballot; `meeting_vote_ballots` | Presente vota e pode alterar antes do encerramento; ausente ou votação fechada não altera dados. |
| RF03.03 | Reuniões → Votações | PATCH close; atualização de `meeting_votes` | Gestor encerra; não gestor é negado; nova tentativa não muda apuração. |
| RF03.04 | Meu relatório | GET participation/report; `meeting_attendance` + reuniões/organização/comissão/ata | Conta A vê somente presenças próprias, sem reuniões convidadas mas não frequentadas nem dados de conta B. |
| RF03.05 | Manual | Conteúdo empacotado no mobile | Manual acessível na navegação e inclui as novas funções. |
| RNF03.03 | Build mobile | `package.json` e `package-lock.json` | Manifesto e lockfile declaram Expo 58, React Native 0.88 e React 19.3; build de Android e iOS precisa ser feito antes da publicação. |

A verificação atual e os limites de entrega estão em [ENTREGA_INCREMENTO_3.md](ENTREGA_INCREMENTO_3.md). Há testes automatizados e exportação Android/iOS/web; testes físicos e validação comunitária continuam separados.

## Complementos de entrega

Os requisitos RF03.06–RF03.11 acrescentam edição de reunião futura, dia todo/local/detalhes, anexos privados, código temporário de presença, registro pelo presidente e PDF da lista de presença. Consulte as fichas completas na [especificação principal](incremento-1-especificacao-completa.md#requisitos-funcionais-declarativos) e o [índice de diagramas](Diagramas/Diagramas_Casos_de_Uso.md). As regras temporais são aplicadas no backend. As instruções atualizadas estão no manual dentro do aplicativo.
