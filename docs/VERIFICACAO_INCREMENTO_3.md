# Verificação da votação e do Incremento 3

Verificação executada em 11/11/2026; documentação concluída em 12/11/2026 (America/Sao_Paulo).

Material conferido: `e0ca21650091-5199762dcb7a42b7896695ea24cd3d46.pptx`, apresentação de 12 slides enviada pelo usuário. O arquivo recebido é PowerPoint, não PDF. Os slides foram usados como especificação para comparação com o projeto.

## Resultado

As funcionalidades pedidas nos slides 5–9 estão implementadas. A votação e as atas passaram nos testes automatizados descritos abaixo. Foi reproduzida e corrigida uma falha que permitia excluir um votante e, por cascata, alterar a apuração já encerrada. A documentação exigida no slide 12 existe e passou na validação estrutural.

Isso não constitui aceite completo em Android/iOS: a exportação passou, mas não houve instalação nem interação em aparelhos nesta verificação. Também estão pendentes a equivalência com o formulário institucional, a atribuição de requisitos aos integrantes e a confirmação de envio da versão final ao repositório remoto.

## Conferência do material

| Slides | Exigência | Situação e evidência |
| --- | --- | --- |
| 1–4 | Contexto da disciplina, calendário, objetivos e peso do incremento | Informações acadêmicas; não representam funcionalidades adicionais. |
| 5 | Presidente cria ata; participantes aprovam/reprovam | Implementado em [rotas de reuniões](../Synple/backend/src/routes/meetings.js), [interface de reuniões](../Synple/mobile/src/screens/MeetingsScreen.js) e [testes de atas](../Synple/backend/test/meetings.test.js). Unanimidade dos presentes, presidente incluído quando presente; aprovadores congelados ao enviar; rejeição exige nova versão. |
| 6 | Presidente abre votação; participantes votam | Implementado e testado. Coordenação da comissão representa o presidente. O proprietário também pode gerenciar, conforme decisão explícita em [INCREMENTO_3](INCREMENTO_3.md). Votação independente da aprovação da ata. |
| 7 | Relatar reuniões em que o usuário participou | API usa a sessão autenticada e inclui somente entradas registradas; [tela de relatório](../Synple/mobile/src/screens/MeetingParticipationScreen.js) mostra organização, comissão, início/término previstos, entrada/saída e situação da ata. |
| 8 | Manual digital de utilização | Presente na navegação do app: [ManualScreen](../Synple/mobile/src/screens/ManualScreen.js). Conteúdo local sobre acesso, organizações, comissões, presença, arquivos, votações, atas e relatórios. |
| 9 | Migrar para Expo SDK 58 | Manifesto e lockfile usam Expo 58.0.23, React Native 0.88.1 e React 19.3.0. Exportação de Android/iOS/web aprovada. Há atualizações corretivas sugeridas pelo verificador online, registradas abaixo. |
| 10 | Documentação coerente, software funcional e execução em Android/iOS | Código, testes e documentação conferidos; execução física permanece pendente no [roteiro de aparelhos](VALIDACAO_EM_APARELHOS.md). Domínio da apresentação deve ser demonstrado pela equipe. |
| 10 | Cada integrante responsável por um requisito | Não foi localizada uma atribuição nominal atual do Incremento 3 nos documentos de entrega consultados. A equipe precisa registrá-la. |
| 11 | Entrega/apresentação em 13/11/2026; envio até 18h por GitHub/GitLab | Prazo informado no slide. Não foi realizado commit, push ou confirmação de entrega remota nesta verificação. |
| 12 | Diagrama de casos de uso | [UC do incremento 3](Diagramas/ENTREGA_DEFINITIVA/fontes/uc-incremento-3.puml), incluindo atas e os RF03; fontes e SVGs disponíveis. |
| 12 | Descrição dos casos de uso como RF, no formulário padrão | [Especificação consolidada](incremento-1-especificacao-completa.md) com 49 RFs e fichas. O modelo institucional original não acompanha o material; equivalência exata ainda não comprovada. |
| 12 | Classes e dicionário de dados | [Modelo de classes](Diagramas/ENTREGA_DEFINITIVA/fontes/classes-incremento-3.puml) e [dicionário de classes](dicionario-classes.md), com mapeamento para módulos JavaScript. |
| 12 | Modelo relacional e dicionário de dados | [Modelo relacional](Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-incremento-3.puml) e [dicionário físico](dicionario-banco-dados.md), conferidos contra o snapshot/hash do DDL. |
| 12 | Requisitos não funcionais | Presentes na [especificação consolidada](incremento-1-especificacao-completa.md) e em [INCREMENTO_3](INCREMENTO_3.md). |
| 12 | Diagramas de sequência para todos os requisitos | Os 49 RFs possuem referência a sequência existente; 33 pares fonte/SVG no conjunto documental. Fluxos relacionados compartilham diagramas, como abrir/votar/encerrar em [seq-votacoes](Diagramas/ENTREGA_DEFINITIVA/fontes/seq-votacoes.puml). |

## Votação: cenários executados

A nova suíte [voting.test.js](../Synple/backend/test/voting.test.js) executa a API real, incluindo autenticação e autorização, contra schemas PostgreSQL temporários. Usa contas fictícias, portas HTTP efêmeras e não envia e-mails.

| Cenário | Resultado |
| --- | --- |
| Pergunta vazia/inválida, mais de 500 caracteres | HTTP 400, sem votação parcial. |
| Menos de 2 ou mais de 8 opções, vazias, repetidas com caixa/espaços diferentes, mais de 160 caracteres | HTTP 400, sem opções parciais. Limites válidos aceitos. |
| Abrir/encerrar como presidente ou proprietário | Permitido. |
| Abrir/encerrar como participante comum, estranho ou administrador sem papel de gestor | HTTP 403. Sem sessão: 401. |
| Abrir sem nenhuma entrada registrada | HTTP 409. |
| Votar sem presença ou tentando falsificar `userId` | Recusado; o autor é definido pela sessão. |
| Reenviar o mesmo voto e trocar a opção | Um registro por pessoa; contagem move corretamente, sem duplicar. |
| Opção de outra votação, identificador inválido ou votação de outra reunião | Recusado sem modificar o voto anterior. |
| Privacidade da sincronização | Contagens agregadas e somente a escolha do titular da sessão; estranho não recebe dados da reunião. |
| Doze votos/trocas simultâneos por três participantes | Permanecem três votos, um por pessoa. |
| Dois encerramentos simultâneos | Um sucesso e um conflito; resultado preservado. |
| Voto concorrente com encerramento | Aceito antes do fechamento ou recusado com 409; novas tentativas após fechamento não alteram apuração. |
| Participante removido da comissão | Mantém consulta ao resultado pelo convite histórico. |
| Relatório com tentativa de consultar outro `userId` | Retorna somente presenças da sessão; convite sem entrada não aparece. |
| Exclusão administrativa de um votante | Após a correção: HTTP 409, conta e contagem preservadas. Conta fictícia sem histórico continua removível. |

## Correções realizadas

1. **Histórico da votação:** em [users.js](../Synple/backend/src/routes/users.js), a exclusão agora verifica votos registrados dentro da transação e sob locks compatíveis com a votação. Antes, `DELETE /users/:id` retornava 200 para um votante e a FK com `ON DELETE CASCADE` apagava seu voto. O teste de regressão falhou antes da correção e passou depois. A API agora retorna 409 com uma explicação ao administrador. A proteção vale para votos abertos e encerrados; a regressão reproduz explicitamente o encerrado.
2. **Relatório:** a interface passou a mostrar também `endsAt`, que a API já fornecia e a documentação previa.
3. **Instalação local:** havia arquivos ausentes em dependências do Expo (`NubPackageManager` e `mergeConfig`). A reinstalação com `npm ci` restaurou as versões do lockfile. Não houve alteração de versões nos manifestos/lockfile.

A correção de exclusão pertence à API; reinicie o processo do backend em execução para carregá-la. Não exige migração de banco. Não recupera votos que tenham sido apagados anteriormente. Exclusão deliberada de uma organização ainda segue as cascatas já documentadas; esta correção não implementa arquivamento geral de todas as entidades.

## Verificações executadas

Comandos executados a partir de `Synple`, exceto os do Expo, executados em `Synple/mobile`:

| Comando | Resultado em 11/11/2026 |
| --- | --- |
| `npm --prefix mobile test` | 27 aprovados. |
| `npm --prefix backend test` | 51 aprovados, incluindo os 9 novos testes. |
| `node scripts/check-source.cjs` | Sem referências livres inesperadas no código do app. |
| `node scripts/validate-documentation.cjs` | Revalidado em 12/11/2026: 13 documentos, 345 referências locais, 49 RFs, 33 pares SVG/fonte e 131 colunas aprovados. Validação estrutural, não aceite acadêmico ou teste visual em aparelho. |
| `npx expo export --platform all --output-dir .expo/voting-audit-export` | Pacotes web, Android e iOS exportados com sucesso; bundles nativos Hermes gerados. Não é compilação/instalação de APK/IPA. |
| `npx expo install --check` online | SDK 58 identificado; indica 9 atualizações corretivas disponíveis. Não foi tratado como aprovação completa de compatibilidade. |

As restrições do sandbox impediram inicialmente a conexão com o banco e a geração Hermes. As verificações correspondentes foram repetidas com acesso local permitido e passaram. Nenhuma conta ou reunião real foi usada nos testes.

### Atualizações indicadas pelo Expo

O verificador offline informou compatibilidade com o mapa instalado, mas o online encontrou estas recomendações mais recentes. São pendências de manutenção separadas da implementação do SDK 58:

| Pacote | Instalado | Faixa recomendada pelo verificador |
| --- | --- | --- |
| expo | 58.0.23 | ~58.0.24 |
| expo-auth-session | 58.0.17 | ~58.0.18 |
| expo-dev-client | 58.0.18 | ~58.0.19 |
| expo-document-picker | 58.0.4 | ~58.0.5 |
| expo-local-authentication | 58.0.2 | ~58.0.3 |
| expo-secure-store | 58.0.2 | ~58.0.3 |
| expo-splash-screen | 58.0.13 | ~58.0.14 |
| expo-status-bar | 58.0.4 | ~58.0.5 |
| expo-web-browser | 58.0.7 | ~58.0.8 |

Referência oficial consultada: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/). Ao atualizar bibliotecas nativas, gerar/testar um build correspondente antes da entrega.

## O que falta comprovar para a entrega

- Executar o [roteiro de aparelhos](VALIDACAO_EM_APARELHOS.md) em Android e iOS com build atualizado e duas contas: presidente e participante. Testar criar, votar, trocar, atualizar resultados no outro aparelho e tentar votar após fechar; executar também aprovação/rejeição de atas.
- Conferir as fichas com o formulário padrão do professor. O material exige esse padrão, mas não fornece o modelo.
- Registrar integrante → requisito sob sua responsabilidade e preparar a demonstração individual.
- Resolver/avaliar as atualizações corretivas indicadas pelo Expo e registrar o build efetivamente testado.
- Enviar código/documentação finais ao GitHub ou GitLab dentro do prazo da apresentação. Esta verificação não publicou as alterações.

As regras de escolha única, 2–8 opções, possibilidade de trocar voto e gestão também pelo proprietário são decisões já documentadas do projeto; os slides não detalham essas regras. Devem ser explicadas na apresentação, sem atribuí-las ao professor.
