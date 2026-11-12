# Relatório do trabalho de 30/10/2026 e plano do Incremento 3 — Synple

**Data de referência:** 30/10/2026, fuso America/Sao_Paulo.  
**Projeto:** BRTPDS2 / Synple.  
**Objetivo:** registrar o trabalho realizado nesta conversa e no checkout local, as verificações disponíveis e o que falta desenvolver, documentar, decidir e testar diante das observações do professor.

Este relatório não declara o Incremento 3 concluído. A atividade que produziu este arquivo foi de inspeção e documentação; não implementou as novas funcionalidades pedidas abaixo. “Implementado” significa código presente; “testado automaticamente” exige evidência específica; “validado em aparelho/com a comunidade” exige outra evidência. As alterações locais não foram publicadas ou transformadas em APK nesta atividade.

## 1. Resumo do dia

Foram feitas três frentes de trabalho: orientação e preparação para executar o projeto em outro computador; correções de segurança, persistência e regras de gestão; e reconstrução da documentação técnica principal com fontes UML e dicionários ligados ao código/DDL.

As correções resolveram parte das avaliações anteriores. Ainda faltam as regras de tempo da reunião, melhorias da interface móvel, novas modalidades de presença, PDF da lista de presença e o ajuste documental específico exigido na avaliação do Incremento 3. A renderização dos diagramas e a existência de fichas detalhadas não equivalem à aprovação do padrão pedido pelo professor.

## 2. O que foi feito hoje

### 2.1 Execução do projeto e diagnóstico em outro computador

| Trabalho | Resultado / limite |
| --- | --- |
| Identificar os comandos reais do mobile | Conferidos os scripts de Expo Go, development build e túnel em package.json. npm start usa development build. |
| Separar o papel do Docker e do Expo | Docker executa PostgreSQL/API; o QR do app é gerado pelo Metro/Expo. |
| Corrigir a orientação sobre Google | Google nativo requer o development build do Synple instalado, Client IDs e assinatura/SHA-1 correspondentes; Expo Go não habilita esse módulo. |
| Diagnosticar falha cloudflared ENOENT | O executável não era localizado; orientada instalação e disponibilização em LOCALAPPDATA/Synple/cloudflared.exe, caminho já suportado pelo script. |
| Identificar configuração OAuth ausente | Mensagem do app indicava Client IDs Web/plataforma ausentes no mobile/.env. Copiar o projeto não cria esses valores automaticamente. |
| Criar inicializador portátil | iniciar.ps1 usa a pasta do próprio script, verifica Node/Docker, inicia serviços, espera /health, prepara exemplos .env quando ausentes e inicia os dois túneis. |
| Atualizar atalhos .bat | Passam a chamar o inicializador, sem parar automaticamente serviços PostgreSQL de outros projetos. |

**Arquivos principais:** [iniciar.ps1](../iniciar.ps1), [README](../README.md), [dev-tunnel.js](../Synple/scripts/dev-tunnel.js), [guia Google](guias/LOGIN_COM_GOOGLE.md).

Não foi comprovada uma inicialização completa, com envio real de e-mail e login Google em outro computador/celular. Para isso é necessário transportar a versão atualizada do código, configurar ambientes e instalar o build compatível.

### 2.2 Segurança da API e autenticação

| Alteração implementada | Efeito |
| --- | --- |
| Remover senhas alternativas de demonstração | O backend compara a senha real por bcrypt. A senha de uma conta fictícia não é mais alternativa para autenticar qualquer conta. |
| Autenticar por sessão no servidor | Token opaco aleatório; banco guarda SHA-256 e validade de sete dias. Rotas privadas exigem sessão. |
| Vincular identidade ao token | Campos de ator nas operações privadas são substituídos pela identidade autenticada, em vez de confiar em userId/actorId enviados pelo cliente. |
| Autorizar por papel/propriedade | Controle de administrador e proprietário para operações de gestão; /system é administrativo. Permanecem limites de consistência descritos na seção 7. |
| Filtrar sincronização | Snapshot autorizado por papel, vínculo e histórico; não é entregue como coleção global irrestrita para todo usuário. |
| Introduzir ativação de conta | Conta local nova exige código por e-mail, hash e expiração de 15 minutos. Falha de SMTP não é sucesso de cadastro. |
| Melhorar recuperação | Código enviado por SMTP, hash, prazo, consumo condicionado, limitação de tentativas e revogação de sessões após mudança de senha. |
| Limitar tentativas | Contadores persistentes por endpoint/IP e, quando fornecido, e-mail. Resposta 429 ao exceder a janela. |
| Reduzir exposição de informação operacional | /health público é mínimo; detalhes ficam em /system. Logs HTTP não incluem a query inteira com ticket de download. |
| Proteger download de PDF | HEAD com sessão; navegador usa ticket restrito à rota, ligado à sessão e válido por 60 segundos. Não é ticket de uso único. |

**Fontes:** [security.js](../Synple/backend/src/services/security.js), [authorization.js](../Synple/backend/src/services/authorization.js), [auth.js](../Synple/backend/src/routes/auth.js), [server.js](../Synple/backend/src/server.js).

Não foi certificada segurança de produção. Os testes não substituem revisão de implantação HTTPS, retenção, dependências e consistência de todas as regras.

### 2.3 Sessão no celular, cache e perfil

- Removida autenticação por senha mantida em estado/cache local.
- Adicionados expo-secure-store e expo-local-authentication, com configuração nativa no app.json.
- Token fica em memória; quando há suporte/enrollment, pode ser guardado no SecureStore protegido por autenticação do SO. A chave é synple.session.v1.
- Reabertura solicita sessão protegida e valida /auth/me; não há garantia de login offline.
- Biometria forte local passou a ser solicitada para editar nome/telefone no formulário de perfil. Sem suporte ou com cancelamento, esse formulário não envia alteração. E-mail fica somente leitura.
- Cache antigo é sanitizado; AsyncStorage na chave @synple:incremento-1 não recebe senhas/tokens. Snapshot remoto substitui o anterior, sem reinjetar automaticamente registros locais removidos no servidor.
- Cadastros e alterações tratados passaram a aguardar confirmação da API; falha não deve ser apresentada como cadastro offline concluído.

**Limite importante para o Incremento 3:** a biometria existente é de sessão/perfil. Ela **não foi aplicada à entrada ou saída de reunião**. Confirmação biométrica local também não é uma prova biométrica enviada e validada pelo backend.

**Fontes:** [session.js](../Synple/mobile/src/services/session.js), [cacheSafety.js](../Synple/mobile/src/services/cacheSafety.js), [storage.js](../Synple/mobile/src/services/storage.js), [useSynpleData.js](../Synple/mobile/src/hooks/useSynpleData.js), [App.js](../Synple/mobile/App.js).

### 2.4 Organizações, comissões e operação

| Alteração | Resultado / limite |
| --- | --- |
| Transferência de proprietário | Corrigido acesso ao pool; transação, verificação do dono atual e sucessor com vínculo aprovado. Antigo proprietário permanece membro. |
| Duplicidade de organização | Índices normalizados para nome e CNPJ. Conflitos antigos não são resolvidos apagando dados automaticamente. |
| Coordenação de comissão | Um coordenador por comissão nas rotas; promoção transfere o cargo em transação; índice parcial impede dois. Migração atribui o proprietário a comissão antiga sem coordenador. A regra precisa de validação com a comunidade. |
| Convites de organização | Proprietário convida conta ativa; destinatário aceita/recusa no aplicativo. Não é envio de e-mail de convite. |
| Escritas de comissão | Criação/edição/situação/exclusão integradas à API; criação transacional e exclusão de comissão com reunião bloqueada. |
| Data de inicialização | Marco persistido em system_metadata, separado do início do processo. Em instalação antiga representa a aplicação da migração, não uma data histórica recuperada. |
| Reinício simulado | Removido o comportamento que apenas mudava estado local e marcava online após temporizador. A interface agora verifica disponibilidade real. |
| Limpeza/restauração | Ação passa a ser Limpar cache e sair. Não promete restauração de backup nem reset do PostgreSQL. |

**Fontes:** [organizations.js](../Synple/backend/src/routes/organizations.js), [commissions.js](../Synple/backend/src/routes/commissions.js), [system.js](../Synple/backend/src/routes/system.js), [DDL](../Synple/backend/src/db/schema.sql).

### 2.5 Infraestrutura, dependências e compatibilidade

- Backend Docker usa Node22 e boot com migração, sem executar seed/redefinir senhas automaticamente em toda inicialização.
- Compose da raiz passou a carregar backend/.env quando presente; SMTP/OAuth continuam exigindo valores reais. A porta publicada do PostgreSQL foi limitada ao loopback local.
- Foram declarados mínimos Android7/API24 e iOS16.4 no app.json; Node22.13+ é requisito documentado.
- Aplicadas atualizações compatíveis de dependências, sem forçar downgrade incompatível do Expo.
- A verificação anterior do backend terminou com zero vulnerabilidades conhecidas na auditoria daquela execução. O mobile ainda tinha 11 alertas documentados: 6 baixos, 2 moderados e 3 altos, associados à cadeia Expo/configuração/zod/ngrok/uuid. Não foi executada nova consulta de auditoria ao redigir este relatório.

**Situação do desconto do Expo, conferida agora:**

| Fonte | Versão/faixa |
| --- | --- |
| mobile/package.json | ~57.0.24 |
| mobile/package-lock.json | 57.0.31 |
| node_modules/expo instalado neste PC | 57.0.31 |

Portanto, o patch instalado neste checkout já é 57.0.31. A faixa ~57.0.24 aceita esse patch, mas ainda permite instalações a partir de um mínimo antigo. Falta alinhar explicitamente o manifest/lockfile ao mínimo pretendido, conferir dependências com o CLI e repetir a instalação/build no computador da apresentação. Isso não é prova de que outro PC ou APK já foi atualizado.

### 2.6 Documentação principal e diagramas

| Entrega documental | Quantidade / conteúdo |
| --- | --- |
| Especificação principal substituída | 38 fichas identificadas como RF, com tela, ação, pré-condição, fluxo, exceções, dados, contrato e sequência; 17 RNFs com critério, condição e método |
| Diagramas renderizados | 24: quatro casos de uso, três classes/projeto, três relacionais, treze sequências e uma implantação |
| Fontes editáveis | PlantUML versionado e SVGs locais, sem depender de servidor para visualizar |
| Dicionário físico | 15 tabelas, 99 colunas, 53 restrições e 39 índices, extraídos de schema temporário criado pelo DDL |
| Dicionário de classes/operações | 15 modelos de dados e 60 operações exportadas, com parâmetros/retornos/responsabilidades |
| Versões | Dependências diretas com faixa declarada e versão resolvida do lockfile; SO/runtime e tags flutuantes distinguidos |
| Referências | 268 referências locais conferidas no conjunto principal de dez documentos |
| Consistência | Substituída a página antiga que dizia que atas não estavam implementadas; índices e módulo do incremento2 consolidados |
| Evidências | Separados resultados anteriores de software, validação documental e atividades não executadas |

**Ressalva diante da nova avaliação do professor:** as 38 fichas não substituem automaticamente uma lista independente de requisitos funcionais declarativos; os diagramas conceituais de dados não substituem a visão do código; e mensagens narrativas nas sequências ainda precisam virar chamadas/retornos compatíveis com as operações reais. Esses três ajustes estão no plano documental da seção 5.

## 3. Verificações realizadas e o que elas comprovam

| Verificação | Resultado registrado | O que não comprova |
| --- | --- | --- |
| Testes backend | 35 aprovados, zero falhas/ignorados na revisão de código de hoje | Funcionamento completo no celular, envio real de e-mail ou segurança absoluta |
| Testes mobile | 23 aprovados, zero falhas/ignorados na mesma revisão | Renderização/teclado/biometria em hardware real |
| Bundles Android/iOS/Web | Exportação JavaScript/Hermes concluída | APK/IPA compilado, assinado e instalado |
| Configuração Expo prebuild | Processada sem erro | Execução nativa do login Google/Face ID/impressão digital |
| Migração | Aplicada ao banco local e testada de forma idempotente; senhas preservadas | Migração em outro PC ou base de produção |
| Compose e PowerShell | Configuração Compose e sintaxe do script verificadas | Inicialização completa de Docker e túneis em todos os computadores |
| Dicionário físico | Catálogo SQL extraído em schema temporário e removido ao final | Ausência de toda lacuna de integridade entre tabelas/rotas |
| PlantUML | 24 SVGs renderizados, com inspeção visual por amostra | Aceite semântico de toda a modelagem pelo professor |
| Validador documental | Dez documentos, 268 referências locais,38 RFs únicos,24 SVGs/fontes e99 colunas conferidos | Formato institucional aprovado ou entrevistas/testes manuais concluídos |

Os números de testes vêm do [relatório de execução de código](VERIFICACAO_CORRECOES.md). A [revisão documental](VERIFICACAO_DOCUMENTACAO.md) registra seus próprios procedimentos. **Não foi repetida a suíte de58 testes apenas para redigir este relatório.**

## 4. Incremento 3 — pendências de código por comentário do professor

Prioridade proposta: **P0** = integridade/autorização e regras de tempo; **P1** = correção central de interface/funcionalidade/documentação; **P2** = expansão sugerida que precisa de decisão de escopo. As prioridades são planejamento, não aprovação da comunidade ou do professor.

| ID | Observação / situação atual | Trabalho pendente | Critério de aceite proposto | Prioridade |
| --- | --- | --- | --- | --- |
| I3-C01 | Validação de agendamento ainda retorna um erro e usa Alert.alert | Produzir coleção de erros por campo e resumo acessível, exibidos junto ao formulário; normalizar erros do backend | Enviar formulário com vários erros: todos aparecem simultaneamente nos campos, preservando os dados; leitor de tela anuncia o resumo; não usar alert para esses erros | P1 |
| I3-C02 | DateTimeField separa data/horário, mas continua sendo digitação numérica com máscara | Substituir/complementar por seletor nativo amigável, mantendo alternativa acessível e fuso explícito | Selecionar data/hora sem digitar formato manual; cancelar não altera valor; testar Android/iOS e formato brasileiro | P1 |
| I3-C03 | Já existem KeyboardAvoidingView e rolagem, mas não há evidência de que resolveram todos os campos | Reproduzir em aparelhos, ajustar foco, rolagem, altura/insets e área de ação | Em360×640, fonte ampliada e teclado aberto, cada campo focado e mensagem fica visível, incluindo pauta/ata/comentário | P1 |
| I3-C04 | Cartão/formulário de reunião reúne muitas seções na mesma tela | Separar lista/resumo e detalhe; organizar agendamento em etapas ou tela compacta; recolher seções secundárias | Usuário localiza ação principal sem atravessar ata/presença completas; fluxo avaliado com participantes e capturas em aparelho | P1 |
| I3-C05 | Há criação, mas não endpoint/fluxo completo para editar agendamento | Implementar edição autorizada e versionada; definir efeitos sobre convites, horários e presença existente | Gestor altera reunião permitida; convidado não altera; edição concorrente gera conflito; participantes veem atualização | P1 |
| I3-C06 | A API exige fim posterior ao início, mas não rejeita datas passadas por relógio atual | Definir política para criação/edição e validar temporalidade no servidor e na interface | Criação nova com início passado ou período totalmente passado é negada; teste usa relógio controlado e mesmo fuso/regra | P0 |
| I3-C07 | Não existe opção de reunião de dia todo no modelo/contrato/tela | Definir allDay/fuso e semântica de intervalo de datas; implementar migração, API, formulário e exibição | Reunião de dia todo pode ser criada/exibida/editada sem horário artificial; testar limite de dia e horário de verão | P1 |
| I3-C08 | Não há anexos de reunião | Definir armazenamento, autorização, tipos/tamanhos, retenção e upload/download; implementar interface e persistência | Só pessoa autorizada envia/consulta; arquivos inválidos/tamanho excedido são recusados; falha não deixa metadado órfão | P2 |
| I3-C09 | Pauta existe; campo específico de local/detalhes adicionais não existe | Decidir se haverá local opcional, detalhes ou ambos; atualizar tela/API/modelo/PDF | Reunião salva sem local; quando preenchido, dado aparece no detalhe e nas exportações previstas | P2 |
| I3-C10 | Resposta a convite verifica pessoa/situação, mas não bloqueia depois do término agendado | Definir encerramento/janela e rejeitar resposta tardia no servidor | Após encerramento, aceite/recusa retorna conflito e não muda responded_at/status; botão informa motivo | P0 |
| I3-C11 | Entrada exige aceite e ata aberta, mas não confere janela de horário da reunião | Definir antecedência/tolerância/encerramento e aplicar na API | Entrada fora da janela, inclusive após término, é negada mesmo por chamada direta; entrada válida usa relógio do servidor | P0 |
| I3-C12 | Biometria implementada é de sessão/perfil, não presença | Aplicar confirmação local apropriada na entrada; definir mecanismo adicional se for necessária prova verificável no servidor | Cancelamento não envia presença; ausência de biometria tem alternativa aprovada; API continua exigindo identidade e janela | P1 |
| I3-C13 | Participante já registra a própria entrada sem confirmação individual do presidente | Estudar aprimoramentos de automação: QR temporário, token de encontro ou outra alternativa validada | Solução escolhida documenta expiração, vínculo à reunião/conta e prevenção de replay; não pressupõe que apenas um clique/biometria local prove presença física | P2 |
| I3-C14 | Não existe ação do presidente para registrar entrada de outro participante | Criar operação específica com ator autenticado distinto do participante alvo, autorização e trilha de auditoria | Apenas gestor autorizado registra por terceiro elegível; sistema armazena quem registrou, por quem, quando, origem e justificativa; erro não altera presença | P1 |
| I3-C15 | Saída exige entrada anterior, mas não verifica início agendado; uma entrada precoce permite saída antes da reunião | Aplicar janela coerente às duas operações e prever política explícita de correção | Saída antes do início é recusada pelo servidor; não se registra saída sem entrada; horário sempre vem do servidor | P0 |
| I3-C16 | Não há biometria específica ou alternativa segura automatizada para saída | Definir confirmação/alternativa e reutilizar o serviço de presença de forma coerente | Cancelamento não grava; janela e identidade são conferidas; comportamento sem hardware é definido/testado | P1 |
| I3-C17 | Presidente não pode registrar saída em nome de participante | Criar operação administrativa própria e auditada, com regras de correção | Ator autorizado consegue registrar pelo alvo; usuário comum não consegue; ação aparece no histórico e respeita regras da ata | P1 |
| I3-C18 | Lista de presença exporta texto; PDF existente é da ata | Criar serviço e endpoint específicos de PDF da lista de presença e botão no app | PDF contém reunião, organização/comissão, convidados, ausentes, entradas/saídas e fuso; download autorizado funciona em Android/iOS/web | P1 |
| I3-C19 | Expo instalado/lock já estão em57.0.31; manifest ainda permite desde57.0.24 | Alinhar faixa mínima, conferir compatibilidade e instalação/build da apresentação | Manifest/lock coerentes, instalação limpa usa patch pretendido e teste/build identificado; não confundir dependência do PC com APK instalado | P1 |

### 4.1 Decisões que precisam ser definidas antes da implementação

| Tema | Decisão necessária |
| --- | --- |
| Janela de presença | Entrada permite quantos minutos antes? Qual tolerância após início? Encerramento é horário agendado ou ação explícita de gestor? |
| Saída e atraso real | Como registrar saída quando a reunião ultrapassa o horário? Como corrigir um esquecimento sem falsificar o relógio ou permitir abuso? |
| Convite tardio | A regra deve usar término agendado, encerramento explícito ou ambos? Reunião adiada reabre respostas? |
| Edição de agendamento | Até quando pode editar? Quem é avisado? Alterar horário exige novo aceite? O que fica bloqueado após presença/ata? |
| Dia todo | Qual fuso vale? Intervalo de datas tem fim exclusivo? É permitido criar para hoje quando a meia-noite já passou, e como isso se concilia com a proibição de datas passadas? Como exibir/exportar em outro fuso? |
| Gestão por terceiros | Além do coordenador, proprietário pode registrar presença por terceiros? Qual justificativa e confirmação ficam auditadas? |
| Biometria indisponível | Qual alternativa atende acessibilidade e segurança sem impedir participação? Não inventar uma prova remota a partir de um booleano do app. |
| Arquivos | Tipos/tamanho máximo, cota, armazenamento, retenção, remoção e acesso histórico após saída da comissão. |
| Local/detalhes | Local físico, link remoto, texto livre ou campos separados? Tudo é opcional? Qual dado pode aparecer na exportação? |

Essas decisões devem virar regras aprovadas e critérios de teste, sem preencher respostas da comunidade por suposição.

### 4.2 Cuidado com a presença registrada pelo presidente

Hoje, o middleware substitui o userId de operações de reunião pelo usuário da sessão. Isso protege o autorregistro e impede representar outra pessoa apenas trocando o JSON. **Não remover essa proteção para atender ao pedido de registrar por terceiros.**

A solução deve distinguir actorId (obtido da sessão) e participantId (alvo autorizado), preferencialmente em operação específica, validando vínculo e permissão no servidor. O modelo atual de meeting_attendance não possui campos para operador/origem/justificativa de correção; será necessária migração ou tabela de eventos/auditoria. Definir também o efeito sobre o conjunto de aprovadores de uma ata já submetida, para não alterar retroativamente uma versão em votação/aprovada sem regra explícita.

### 4.3 PDF da presença não é PDF da ata

O serviço atual gera ata em PDF e pode incluir informações de presença no documento. Isso **não atende automaticamente** ao pedido de exportar a lista de presença como relatório próprio. O novo documento deve ter identificação e layout próprios, política de acesso, ordenação, ausentes e horários. Pode reutilizar PDFKit, autenticação e tickets de download, sem anunciar que já está pronto.

## 5. Incremento 3 — pendências documentais por comentário

| ID | Comentário | O que foi feito hoje | O que ainda falta para atender à nova avaliação | Prioridade |
| --- | --- | --- | --- | --- |
| I3-D01 | Caso de uso e atores | Fontes PlantUML, atores externos, fronteira e especializações; quatro diagramas renderizados | Conferir com o professor a decomposição por objetivo; detalhar condições dos papéis de presidente/proprietário/convidado e incorporar os novos casos do Incremento3 | P1 |
| I3-D02 | Classes devem representar código, não banco | Há diagrama de domínio separado e diagrama de módulos/serviços, mais60 operações extraídas de exports | Priorizar a visão do código: módulos/componentes/hooks/fábricas e dependências reais; distinguir explicitamente entidade conceitual, objeto JSON e classe efetivamente declarada. Não apresentar o diagrama de tabelas como diagrama do código nem inventar classes OO | P1 |
| I3-D03 | Definir tabela/campo, PK, seed/incremento e relações | Dicionário físico completo extraído do DDL, com defaults, PK/FK/UNIQUE/CHECK/índices e ações de exclusão | Acrescentar explicação explícita sobre geração das chaves e evolução do Incremento3. IDs UUID por gen_random_uuid() não têm seed/incremento numérico: marcar “não se aplica”; não inventar IDENTITY/SERIAL. Chaves textuais/booleanas e compostas também precisam de regra própria | P1 |
| I3-D04 | RFs foram confundidos com descrição de caso de uso | Há38 fichas detalhadas com identificação RF, fluxo e contrato | Criar catálogo separado de requisitos declarativos (“O sistema deve…”), sem repetir o caso inteiro. Identificar UC próprios e relacionar RF → UC → regra → operação → sequência → teste. Não renomear uma ficha como RF e considerar atendido | P1 |
| I3-D05 | Mensagens/classes de sequência incorretas | Há13 sequências renderizadas, mas ainda há rótulos narrativos de responsabilidade | Trocar mensagens como “Verifica papel…” por invocações reais com parâmetros/retorno, em lifelines compatíveis com o código. Ex.: chamar getMeeting(client,meetingId,userId) onde essa chamada existe; não inventar validatePresident() para ajustar o desenho | P1 |
| I3-D06 | Documentação fora do padrão solicitado | Índice principal, fichas uniformes, dicionários e relatórios de evidência consolidados | Obter o modelo/rubrica institucional exatos e adequar títulos, numeração, formulários, diagramas, rastreabilidade e identificação dos responsáveis. Sem o modelo não é possível afirmar conformidade final | P1 |
| I3-D07 | Documentar testes feitos | Relatórios distinguem58 testes anteriores, exportação, migração e validação documental | Acrescentar resultados dos cenários novos do Incremento3 e evidências de execução física; registrar build/commit, dados, esperado/obtido e responsável | P1 |

### 5.1 Exemplo da separação entre requisito e caso de uso

**Requisito proposto, ainda não implementado — I3-RF-TEMPO-01:** O sistema deve rejeitar o cadastro de uma nova reunião cujo instante de início seja anterior ao horário atual do servidor, sem persistir a reunião ou os convites.

**Caso de uso relacionado — I3-UC-AGENDAR:** descreve quem inicia o agendamento, em qual tela, quais campos são apresentados, os passos de envio, o fluxo alternativo quando a data está no passado e a mensagem junto ao campo. O caso de uso explica a interação; não substitui a declaração do comportamento obrigatório.

**Critério proposto:** com relógio do servidor controlado em T, enviar início T−1min deve produzir erro de validação e zero novas linhas de reunião/convites; início futuro e término posterior seguem o fluxo permitido. O código HTTP e a estrutura de errors devem ser definidos no contrato antes de implementar.

Os IDs acima são exemplos do backlog e não alteram os IDs RF vigentes. O catálogo final deve ter convenção única aprovada para evitar conflito com RF02.01–RF02.10 e RF19–RF28 existentes.

### 5.2 Geração de chaves — situação real do DDL

| Tabelas/chaves | Geração atual | Seed / incremento |
| --- | --- | --- |
| users, organizations, access_requests, commissions, meetings, meeting_invitations, meeting_attendance, meeting_minutes e meeting_minutes_approvals: id | UUID com DEFAULT gen_random_uuid() | Não se aplica: não são inteiros sequenciais |
| commission_members | PK composta commission_id + user_id, ambos FKs | Não se aplica: valores vêm dos registros relacionados |
| system_subsystems.id | Texto fornecido pela aplicação/preparação | Não se aplica |
| auth_sessions.token_hash e download_tickets.token_hash | SHA-256 de valores aleatórios gerados na aplicação | Não se aplica |
| auth_rate_limits.key | SHA-256 da chave de contagem | Não se aplica |
| system_metadata.id | Booleano TRUE, DEFAULT TRUE com PK/CHECK | Não se aplica |

“Seed de dados de demonstração” em init-db.js significa inserir registros fictícios; não é seed/incremento de uma sequência de chave primária. updated_at também não é atualizado por trigger geral: as rotas são responsáveis por escrevê-lo.

## 6. Ordem recomendada de execução

| Etapa | Trabalho | Condição de encerramento |
| --- | --- | --- |
| 1. Fechar regras e padrão | Decidir janelas/edição/presença por terceiros/dia todo; obter rubrica/formulário institucional | Regras e decisões aprovadas, RFs declarativos e critérios identificados |
| 2. Corrigir tempo e autorização | I3-C06, C10, C11 e C15; manter proteção do autorregistro e projetar auditoria | API nega operações fora da janela inclusive em chamada direta; testes de fronteira/concorrência passam |
| 3. Refazer agendamento móvel | C01–C05 e C07; erros por campo, seletor, teclado e telas compactas | Fluxos exercitados em aparelhos, sem alert de validação nem campo oculto |
| 4. Expandir presença | C12–C17: biometria, alternativa aprovada e gestão por terceiros | Operações autorizadas e auditadas; impactos em ata/aprovadores resolvidos |
| 5. Exportar e enriquecer reunião | C18; C08/C09 conforme aprovação de escopo | PDF da presença aprovado; anexos/local só entram como entregues após implementação/teste |
| 6. Consolidar modelo e documentação | D01–D07 e versões | Diagramas de código/mensagens e catálogo RF/UC conforme padrão do professor |
| 7. Verificar apresentação | Instalação limpa, build novo, ambientes, duas contas/aparelhos e evidências | Sem dependência de cache antigo; código, banco, documentação e APK correspondentes |

Sem estimativa de prazo neste relatório: depende das decisões de regra, do padrão solicitado, de acesso a aparelhos e de quem executará cada tarefa. Registrar responsável e prazo na reunião de planejamento, sem inventar atribuições.

## 7. Pendências remanescentes das correções anteriores

Além do Incremento3, a revisão encontrou pontos que não devem desaparecer do planejamento:

1. Alinhar a recuperação: checagem local ainda menciona seis caracteres; backend exige oito. Reforçar validação de formato de e-mail na etapa de recuperação.
2. Revisar domínios sem CHECK SQL, unicidade concorrente de nome de comissão e normalização de e-mail, sem declarar garantias inexistentes.
3. Tornar coerente a revogação organizacional e os vínculos de comissão; repetir no servidor os filtros de situação que hoje existem apenas em partes da interface.
4. Revisar cascatas/exclusões e preservação histórica, sobretudo exclusão da organização, em vez de generalizar a proteção de ata/conta a toda entidade.
5. Definir reconvite após rejeição e política de retenção/histórico de atas/votos.
6. Acompanhar os11 alertas de dependências do mobile; não aplicar downgrade/--force sem análise e migração.
7. Configurar SMTP e OAuth reais; testar cadastro/ativação/recuperação/Google e biometria no novo build.
8. Conferir ícone, temas, acessibilidade, teclado e desempenho em Android/iOS físicos.
9. Executar avaliação manual dos concorrentes e levantamento/validação com representantes da comunidade.
10. Revisar as alterações, versionar/publicar pelo fluxo da equipe e levar essa versão ao outro computador. Criar um documento local não realiza commit/push nem atualiza automaticamente o PC da apresentação.

## 8. Cenários mínimos de teste para o Incremento 3

Estado inicial: **planejados, não executados**. Usar dados fictícios, relógio controlado e schema isolado nos testes automatizados. Não depender da data real da máquina para asserções de fronteira.

| Grupo | Cenários |
| --- | --- |
| Validação/interface | Vários campos inválidos ao mesmo tempo; erro junto ao campo; foco e resumo acessível; dados preservados após falha |
| Data/hora | Seletor, cancelamento, formato brasileiro, fuso, mudança de dia, horário de verão e reunião de dia todo |
| Agendamento | Passado, início igual a agora conforme regra aprovada, término anterior/igual, futuro válido; edição depois de convites/presença/ata |
| Convites | Responder antes/durante/depois da janela; pedido direto fora da UI; reunião adiada/encerrada; identidade de outra conta |
| Entrada/saída | Limites exatos da janela, repetição/replay, ausência de aceite, saída sem entrada, saída antes do início, entrada após fim |
| Biometria | Sucesso, cancelamento, falta de hardware/enrollment, troca de biometria e alternativa acessível definida |
| Presidente por terceiros | Gestor autorizado, pessoa comum negada, alvo de outra comissão negado, auditoria completa, concorrência com autorregistro |
| Ata e presença | Alteração/correção de presença após submissão, conjunto de aprovadores fixado, acesso histórico e votos concorrentes |
| Arquivos | Tipo/tamanho proibido, falta de permissão, upload interrompido, arquivo órfão, exclusão/retenção e download autorizado |
| PDF da presença | Convidados/ausentes/horários/fuso, paginação, português, lista extensa e link expirado; salvar/compartilhar em aparelhos |
| Instalação | Checkout limpo, npm ci, versão Expo resolvida, API/migração, .env, build assinado e teste em outro PC |

Para cada teste registrar: ID, RF/UC/regra vinculados, versão do código e do build, ambiente/aparelho, pré-condição, entrada, esperado, obtido, data, responsável e evidência. Sem esses registros, manter “pendente”, mesmo quando houver um botão implementado.

## 9. Total atual de código — métrica descritiva

Contagem em30/10/2026 de arquivos JS/CJS e linhas físicas, incluindo comentários e linhas vazias; excluídos node_modules, builds, assets, JSON/configuração, SQL, Markdown, PowerShell e .bat. Não é número de linhas escritas hoje, autoria individual, cobertura ou nota do professor.

| Área | Arquivos | Linhas físicas |
| --- | ---: | ---: |
| Backend src | 17 | 2.117 |
| Mobile src | 24 | 2.848 |
| Mobile App.js + index.js | 2 | 837 |
| Subtotal de aplicação JS | 43 | 5.802 |
| Backend test/fixtures | 6 | 738 |
| Mobile test | 4 | 228 |
| Scripts de desenvolvimento/verificação/geração documental | 9 | 1.564 |
| Total JS/CJS considerado | 62 | 8.332 |

Esses totais são um retrato do checkout e mudam com novas alterações. O Git já continha mudanças locais; diff não deve ser tratado como prova automática de autoria ou de trabalho apenas deste dia. A expressão “Total de código” no feedback não veio acompanhada de valor/nota, portanto nenhum resultado acadêmico foi inferido.

## 10. Arquivos e evidências para consultar

- [Índice principal](Documentacao_do_ProjetoSynple.md).
- [Especificação principal](incremento-1-especificacao-completa.md), [tecnologias/versões](tecnologias-versoes.md).
- [UML/modelo relacional e fontes](Diagramas/Diagramas_Casos_de_Uso.md).
- [Dicionário físico](dicionario-banco-dados.md) e [classes/operações](dicionario-classes.md).
- [Correções implementadas e limites](CORRECOES_AVALIACAO.md).
- [Testes da revisão de código](VERIFICACAO_CORRECOES.md) e [verificação documental](VERIFICACAO_DOCUMENTACAO.md).
- [Interfaces](INTERFACES.md), [padrões de programação](PADROES_DESENVOLVIMENTO.md), [incremento2](INCREMENTO_2.md).

**Situação final registrada:** há uma base de segurança, gestão e documentação melhorada e verificada nos limites indicados. O Incremento3 ainda precisa de implementação, adequação ao padrão documental específico, decisões de regra e evidências de execução antes de ser apresentado como concluído.
