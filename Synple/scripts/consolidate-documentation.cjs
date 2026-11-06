const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'../..');
const write=(file,text)=>fs.writeFileSync(path.join(root,file),text);
const edit=(file,fn)=>write(file,fn(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n')));
edit('Synple/scripts/generate-main-spec.cjs',s=>s.replace('RF19–RF26 explicitam contas/sessão/convites antes misturados a outros fluxos.','RF19–RF28 explicitam contas/sessão/convites e gestão antes misturados a outros fluxos.'));
write('Documentacao_do_ProjetoSynple.md',`# Documentação do projeto Synple

Revisão consolidada: 06/11/2026. Este é o índice da documentação; a especificação técnica principal e os anexos abaixo descrevem a implementação presente no checkout, inclusive limites conhecidos.

## Documento principal e anexos

| Artefato | Conteúdo |
| --- | --- |
| [Relatório do dia e plano do Incremento 3](docs/RELATORIO_2026-10-30_E_PLANO_INCREMENTO_3.md) | Trabalho de 30/10/2026, evidências e pendências por comentário do professor |
| [Especificação do Incremento 3](docs/INCREMENTO_3.md) | Votações independentes, relatório individual, manual digital, persistência, API e rastreabilidade |
| [Especificação principal](docs/incremento-1-especificacao-completa.md) | Atores, arquitetura, 38 RFs, 17 RNFs, fluxos, exceções, dados, contratos e rastreabilidade |
| [Diagramas UML e modelo relacional](docs/Diagramas/Diagramas_Casos_de_Uso.md) | Diagramas existentes em SVG e novas fontes PlantUML do Incremento 3 |
| [Dicionário de classes e operações](docs/dicionario-classes.md) | Modelos de dados e operações exportadas com parâmetros, retornos, efeitos e correspondência com o código |
| [Dicionário físico](docs/dicionario-banco-dados.md) | Tabelas, colunas, restrições, índices, nulabilidade, defaults e ações de exclusão |
| [Tecnologias e versões](docs/tecnologias-versoes.md) | Todas as dependências diretas, faixas declaradas, versões resolvidas e requisitos de SO/runtime |
| [Verificação documental](docs/VERIFICACAO_DOCUMENTACAO.md) | Procedimentos executados nesta revisão e atividades não comprovadas |
| [Incremento 2](Synple/docs/INCREMENTO_2.md) | Índice do módulo de reuniões/atas e roteiro CA01–CA20, referenciando a especificação canônica |

## Proposta e identidade visual

Synple associa sincronização e pessoas para gerir organizações, comissões, reuniões, presença e aprovação de atas. A marca, ícone e splash próprios estão em Synple/mobile/assets e app.json. Tema claro/escuro usa índigo, superfícies contrastantes e componentes React Native próprios. Testes com usuários e avaliação de aparência em aparelhos ainda precisam de evidências; não se declara aprovação apenas por existir uma paleta.

## Arquitetura vigente

Aplicativo Expo SDK 58 / React Native 0.88 / React 19.3, JavaScript; API Node.js 22 e Express 4 com pg/SQL parametrizado; PostgreSQL 16; bcryptjs, Google OAuth, Nodemailer e PDFKit. Sessões opacas verificadas no servidor; SecureStore/biometria no aparelho; cache AsyncStorage sanitizado sem senha/token. Não há Sequelize, Lucia Auth ou MMKV no código atual.

Android mínimo 7/API24; iOS16.4+; Node22.13+. Consultar a tabela de versões para faixas, lockfiles e tags flutuantes. PostgreSQL16 permanece em suporte até novembro de 2028 segundo a [política oficial](https://www.postgresql.org/support/versioning/); a escolha preserva compatibilidade e não dispensa atualizações menores/backup.

## Operação, padrões e evidências

- [README e inicialização em outro PC](README.md).
- [Interfaces e estados](Synple/docs/INTERFACES.md).
- [Padrões de programação usados no dia a dia](Synple/docs/PADROES_DESENVOLVIMENTO.md).
- [Análise de mercado e roteiro de avaliação manual](Analise_de_Mercado.md).
- [Google e development build](Synple/LOGIN_COM_GOOGLE.md).
- [Correções de implementação e roteiro em aparelhos](Synple/docs/CORRECOES_AVALIACAO.md).
- [Resultados automatizados da revisão de código](Synple/docs/VERIFICACAO_CORRECOES.md).

Custos/licenças de bibliotecas não garantem hospedagem ou publicação gratuitas. OAuth/SMTP precisam ser configurados; não versionar senhas. Entrevistas, avaliação manual de concorrentes, envio real de e-mail e validação Android/iOS permanecem atividades externas a registrar.
`);
write('Synple/DOCUMENTACAO_SOFTWARE.md',`# Documentação técnica — Synple

Revisão consolidada: 06/11/2026. A referência técnica é a [especificação principal](../docs/incremento-1-especificacao-completa.md), complementada pelo [Incremento 3](../docs/INCREMENTO_3.md). Esta página funciona como índice operacional.

## Estrutura implementada

- mobile: Expo58/React Native0.88, JavaScript, componentes próprios, API cliente, cache sanitizado e sessão protegida quando disponível.
- backend: Express4/Node22, pg/SQL parametrizado, bcryptjs, Google OAuth, SMTP e PDFKit.
- PostgreSQL16: esquema/migrações idempotentes e volume Docker persistente.
- scripts: detecção de IP, inicialização e dois túneis de desenvolvimento.

Android7/API24+ e iOS16.4+. [Todas as versões declaradas/resolvidas](../docs/tecnologias-versoes.md). Não há Sequelize, JWT de sessão ou autenticação por senha no AsyncStorage.

## Contratos atuais

Todas as rotas privadas exigem sessão; a identidade vem do token. Snapshot é filtrado por sessão/vínculo/histórico. Cadastro local exige código de ativação por e-mail; Google exige e-mail verificado. Recuperação usa código de seis dígitos, hash e expiração, não link simulado. Senha nova no servidor exige oito caracteres; a divergência remanescente na checagem local de recuperação está registrada na especificação principal.

Tema é funcionalidade do perfil: users.theme=LIGHT/DARK, confirmado pela API e refletido no cache JSON da chave @synple:incremento-1. SecureStore usa synple.session.v1 para token protegido. Nenhum desses mecanismos é garantia universal de funcionamento offline; reabertura precisa validar a sessão online.

Biometria confirma a liberação local da sessão e o formulário de perfil; não é prova biométrica validada pelo backend. E-mail de acesso é somente leitura nesse formulário. Sem biometria disponível, a edição pelo fluxo atual não avança.

Sistema mostra marco persistido da instalação, início do processo, uptime e consulta real ao banco. Não reinicia processos nem restaura backup. Limpar cache e sair preserva o PostgreSQL. A tabela system_subsystems é legado, não monitor de disponibilidade.

Reuniões/atas usam transações, presença do servidor, conjunto fixado de aprovadores e voto por versão. PDF usa HEAD autenticado e ticket curto ligado à sessão/rota; não tem assinatura digital nem altera a ata. [Incremento2](docs/INCREMENTO_2.md).

Votações independentes da ata permitem ao coordenador/proprietário abrir e encerrar perguntas de escolha única; participantes com entrada registrada podem votar enquanto a votação estiver aberta. O relatório individual consulta apenas presenças da sessão autenticada. O manual de utilização também está disponível no aplicativo.

Votações independentes da ata permitem ao coordenador/proprietário abrir e encerrar perguntas de escolha única; participantes com entrada registrada podem votar enquanto a votação estiver aberta. O relatório individual consulta apenas presenças da sessão autenticada. O manual de utilização também está disponível no aplicativo.

## Guias e evidências

- [Como iniciar e preparar outro computador](../README.md), [Docker](../COMO_RODAR_DOCKER.md), [tutorial do app](GUIA_USO_E_INICIALIZACAO.md).
- [Google](LOGIN_COM_GOOGLE.md), [SMTP/recuperação](backend/EMAIL_RECOVERY_SETUP.md).
- [Dicionário físico completo](../docs/dicionario-banco-dados.md), [classes/operações](../docs/dicionario-classes.md), [diagramas](../docs/Diagramas/Diagramas_Casos_de_Uso.md).
- [Resultados da revisão de código](docs/VERIFICACAO_CORRECOES.md), [verificação documental](../docs/VERIFICACAO_DOCUMENTACAO.md).

O boot normal aplica migrações e preserva senhas, sem seed automático. Novos módulos de biometria/SecureStore exigem novo development build; alterações só de PDF não devem ser confundidas com essa atualização. Túnel temporário não é hospedagem estável. Os limites de autorização, validação, cascatas e retenção estão na seção11 da especificação, sem prometer proteções não implementadas.
`);
const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/requisitos.snapshot.json'),'utf8')).filter(r=>r.id.startsWith('RF02.'));
let inc=`# Synple — Incremento 2: reuniões das comissões

Revisão: 30/10/2026. Este documento é o índice de módulo e roteiro de aceite. Os contratos completos são mantidos na [especificação principal](../../docs/incremento-1-especificacao-completa.md), para não repetir versões divergentes.

## 1. Fontes, escopo e decisões

A documentação anterior identifica como fonte os slides4–10 de f2b56f41bcb6-5d9f38abce32442c931a4ff49a379768.pptx: agendamento, convites, entrada/saída, presença e ata. O arquivo original não está sendo declarado como revalidado nesta revisão. A exigência de aprovar por todos com entrada registrada e a exportação PDF foram registradas na revisão de22/10/2026. Levantamento adicional com a comunidade permanece pendente, sem entrevistas inventadas.

Não há edição/cancelamento de agendamento, reentrada múltipla, anexos, chat ou prazo de votação implementados. O período agendado é informativo; instantes de entrada/saída vêm do servidor. Conteúdos/votos antigos substituídos não têm histórico completo.

## 2. Atores e termos

Coordenador atual da comissão ou proprietário da organização gere reunião/ata. Convidado responde e registra própria presença. Aprovador é pessoa com entrada até a submissão, fixada no conjunto da versão. Gestor presente também precisa votar; seu cargo não aprova automaticamente. Ex-integrante mantém consulta por convite histórico e voto fixado, mas não cargo de gestor anterior. A identidade vem da sessão validada.

## 3. Diagrama de casos de uso

![Casos de uso](../../docs/Diagramas/renderizados/uc-reunioes.svg)

## 4. Requisitos funcionais no formulário de caso de uso

Cada ficha tem campos/ações de interface, pré-condições, entradas, fluxo, exceções, persistência e sequência. Referências canônicas:

| ID | Nome | Contrato |
| --- | --- | --- |
`;
for(const r of rows) inc+=`| [${r.id}](../../docs/incremento-1-especificacao-completa.md#${r.id.toLowerCase().replaceAll('.','')}) | ${r.name} | ${r.api} |\n`;
inc+=`
## 5. Regras de negócio

1. Somente coordenador atual ou proprietário agenda/gera/corrige/submete ata; o cliente não escolhe identidade no JSON.
2. Agendamento exige título/pauta e período válido. Convidados, exceto organizador, pertencem à comissão. Criação é transacional e deduplica convites.
3. Convite aceito é pré-condição de entrada; aceite sozinho não conta presença. Saída exige entrada; primeira entrada permanece registrada.
4. Submissão exige rascunho salvo e pelo menos um presente; fixa todos com entrada, inclusive quem já saiu. Novas entradas bloqueiam durante revisão e após aprovação; saídas continuam possíveis.
5. Voto exige versão atual e pertencimento ao conjunto fixado. Rejeição solicita comentário e correção. Aprovação requer unanimidade; aprovado não é editável.
6. Correção de revisão/rejeição gera nova versão/rascunho e invalida decisões anteriores. Não há histórico completo de conteúdo/votos substituídos.
7. PDF representa os dados atuais, com situação/versão/fuso. Rascunho/revisão/rejeição recebem aviso não final. Não é assinatura digital nem aprovação.
8. Um coordenador por comissão é mantido pelas rotas/índice parcial/migração; a regra requer validação de negócio com a comunidade.

## 6. Diagrama de classes

![Classes do domínio](../../docs/Diagramas/renderizados/classes-reunioes.svg)

![Operações dos módulos](../../docs/Diagramas/renderizados/classes-servicos.svg)

### 6.1. Dicionário das classes

[Classes, todos os atributos e operações exportadas](../../docs/dicionario-classes.md). As entidades são conceitos de análise; funções reais ficam nos módulos. Não há classes ORM ou métodos de instância inventados.

## 7. Diagrama relacional

![Tabelas de reunião](../../docs/Diagramas/renderizados/relacional-reunioes.svg)

### 7.1. Dicionário relacional

[Dicionário físico completo](../../docs/dicionario-banco-dados.md) e [snapshot extraído do DDL](../../docs/modelo-fisico.snapshot.json). Inclui FKs compostas, ações de exclusão, UNIQUE, CHECK e índices. O conjunto UUID[] de aprovadores não tem FK individual; coerência depende das rotas. Não há CHECK SQL de ordem de presença; há validação na API.

## 8. Contrato da API e sincronização

Prefixo /api e sessão Bearer obrigatórios. POST /meetings; PATCH /meetings/:meetingId/invitation e /attendance; GET /attendance; POST /minutes e /minutes/submit; PATCH /minutes/approval; HEAD/GET /minutes/pdf. Identificadores de ator do body/query são substituídos pela sessão. PDF em navegador usa ticket de sessenta segundos restrito ao caminho e ligado à sessão, criado por POST /auth/download-ticket.

GET /sync retorna coleções autorizadas por papel/vínculo/histórico. O app substitui o snapshot e sanitiza credenciais no cache; não autentica por senha offline nem reinjeta dados removidos. Filtro de acesso não equivale a uma política de retenção já aprovada pela comunidade.

## 9. Requisitos não funcionais

[RNF01–RNF17 na especificação](../../docs/incremento-1-especificacao-completa.md#8-requisitos-não-funcionais): autenticação/autorização, integridade/concorrência, persistência confirmada, privacidade, compatibilidade, acessibilidade, desempenho medido, operação e PDF. Metas não medidas são declaradas pendentes; máscaras e seleção de tema ficam como funcionalidades.

## 10. Diagramas de sequência

| Fluxo | Diagrama |
| --- | --- |
| RF02.01–02.03: agendar, convidar e responder | [SQ08](../../docs/Diagramas/renderizados/seq-agendamento.svg) |
| RF02.04–02.06: entrada, saída e consulta de presença | [SQ09](../../docs/Diagramas/renderizados/seq-presenca.svg) |
| RF02.07–02.09: rascunho, submissão e decisão | [SQ10](../../docs/Diagramas/renderizados/seq-ata.svg) |
| RF02.10: PDF, acesso, versão e ticket | [SQ11](../../docs/Diagramas/renderizados/seq-pdf.svg) |

Consulta/compartilhamento de presença não é a mesma escrita de entrada/saída: ler a lista usa GET, com autorização por gestão/convite, e não altera presença. Fontes UML em ../../docs/Diagramas/fontes.

## 11. Matriz de rastreabilidade

| Origem declarada | RF | Dados principais | Evidência automatizada existente |
| --- | --- | --- | --- |
| Slide5 | RF02.01–02.02 | meetings, meeting_invitations | backend/test/meetings.test.js; mobile/test/meetings.test.js |
| Slide6 | RF02.03–02.05 | meeting_invitations, meeting_attendance | backend/test/meetings.test.js |
| Slide7 | RF02.06–02.09 | attendance, minutes, approvals | backend/test/meetings.test.js; mobile/test/meetings.test.js |
| Extensão registrada em22/10/2026 | RF02.10 | Consulta das coleções e download_tickets | Testes PDF mobile/backend e security.test.js |
| Slides8/10 | Compatibilidade/documentos | Diagramas, fichas, dicionários e testes | Exportação JS registrada; aparelhos pendentes |

## 12. Critérios e roteiro de aceitação

Estado de todos os cenários abaixo nesta revisão documental: **roteiro, não executado em aparelho**. Registrar modelo/SO, build/assinatura, conta fictícia, esperado/obtido, data, responsável e evidência.

| CA | Cenário | Resultado esperado |
| --- | --- | --- |
| CA01 | Gestor agenda com título/datas/pauta e dois integrantes | Uma reunião e convites deduplicados; organizador aceito |
| CA02 | Integrante comum tenta agendar | 403 e nenhuma escrita parcial |
| CA03 | Término antes do início ou convidado externo | 400 sem reunião/convites parciais |
| CA04 | Convidado aceita/recusa pela própria conta | Situação e hora da resposta confirmadas |
| CA05 | Tenta entrada sem aceite; depois aceita e entra | Negação antes; horário do servidor depois |
| CA06 | Tenta saída sem entrada; registra saída válida | Negação antes; presença permanece após sair |
| CA07 | Consulta lista e compartilha texto | Aceite não conta presença; ausentes e horários identificados |
| CA08 | Gestor salva rascunho e corrige texto | Texto persistido, erro de rede não vira sucesso |
| CA09 | Submete sem presentes e depois com presença | Negação antes; conjunto fixado depois |
| CA10 | Gestor presente e outro participante votam | Ambos precisam decidir; ausência de voto impede unanimidade |
| CA11 | Dois aprovadores votam simultaneamente | Versão/conjunto preservados e estado correto |
| CA12 | Rejeita, corrige e tenta voto da versão antiga | Nova versão/rascunho; voto antigo negado |
| CA13 | Recarrega app e consulta PostgreSQL | Operações confirmadas permanecem; versão e estados coincidem |
| CA14 | Executa Android/iOS com teclado, fonte e temas | Sem campo focado oculto; registrar problemas, não presumir aprovação |
| CA15 | Remove integrante já convidado/aprovador | Histórico e voto fixado preservados; cargo antigo não concede gestão |
| CA16 | Submete ata enquanto exclui conta de aprovador | Proteções transacionais não deixam aprovador obrigatório inexistente |
| CA17 | Baixa PDF em Android, iOS e computador | Arquivo abre/salva pelo navegador autorizado |
| CA18 | Exporta em cada situação da ata | Status/versão e aviso não final corretos |
| CA19 | Exporta texto longo, acentos e fuso identificado | Paginação e português legíveis, sem cortes |
| CA20 | Tenta versão antiga, usuário sem acesso e ticket expirado | Conflito/negação/expiração sem baixar dado não autorizado |

## 13. Preparar e demonstrar o incremento

1. Atualizar checkout/dependências, preencher .env real de API/OAuth/SMTP e iniciar banco/API conforme [README](../../README.md). Boot migra sem seed automático; dados fictícios são preparação explícita.
2. Instalar novo development build por causa de SecureStore/biometria. Google exige assinatura/SHA-1 e Client IDs compatíveis. Não usar Expo Go para autenticação Google nativa.
3. Preparar contas distintas e organização aprovada; confirmar vínculos e coordenador no banco. Não usar estado local antigo como prova de permissão.
4. Em mobile, executar npm run tunnel, manter processo aberto e usar QR atual no Synple. Túnel Expo sozinho não expõe a API.
5. Demonstrar CA01–CA20 e registrar resultado real. [Verificação anterior de código](VERIFICACAO_CORRECOES.md); [revisão documental](../../docs/VERIFICACAO_DOCUMENTACAO.md).

### Pendências externas ao código

Validar regra de coordenador, dados adicionais de reunião, retenção e acessibilidade com a comunidade; preencher o formulário institucional quando fornecido; testar aparelhos/envio real de e-mail/Google/biometria. Não registrar entrevista ou teste manual como feito sem evidência.
`;
write('Synple/docs/INCREMENTO_2.md',inc);
console.log('Entradas principais e incremento 2 consolidados.');
