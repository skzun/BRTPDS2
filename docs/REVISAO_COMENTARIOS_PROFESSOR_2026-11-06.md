> Registro histórico, anterior às correções atuais. Para o estado verificado, consulte [Entrega do incremento 3](ENTREGA_INCREMENTO_3.md).

# Conferência das observações do professor

Revisão: 06/11/2026, America/Sao_Paulo. Fonte: texto anexado pelo usuário com comentários de 21/08, 09/10 e 29/10/2026. Verificação do checkout local BRTPDS2/Synple. Esta revisão não implementa as correções listadas.

## Resultado

Não está tudo resolvido. Há implementação efetiva de autenticação/autorização, recuperação por código, ativação por e-mail, transferência de propriedade, restrições de organização/comissão e funcionalidades do incremento 3. Permanecem falhas funcionais reproduzidas nas regras de horário e pendências de interface, documentação e validação humana.

As sugestões expressas como “poderia” estão inventariadas como melhorias sugeridas; sua inclusão no escopo obrigatório deve ser combinada com o professor. Não foram tratadas como requisitos formalmente aprovados sem essa evidência.

Legenda:

- **Implementado**: mecanismo encontrado no código ou documento indicado; não significa aprovado em aparelho.
- **Parcial**: há parte da solução, divergências ou mudança de escopo que não atende integralmente ao comentário.
- **Ausente**: não foi encontrada a funcionalidade correspondente nas telas, contratos e rotas atuais.
- **Não comprovado**: exige execução em aparelho, teste manual, evidência externa ou aprovação do padrão institucional.

## 1. Observações de 21/08

| Item | Situação | Evidência e limite |
| --- | --- | --- |
| Analisar um aplicativo adicional | Implementado no documento | [Análise de mercado](../Analise_de_Mercado.md), seção 5: Nextcloud Calendar, além de Cal.com, Calendly, Doodle e Rallly. |
| Avaliar os aplicativos manualmente | Não comprovado | O próprio documento declara análise documental e mantém todos os resultados do protocolo manual como “Pendente”. |
| Rever tecnologias antigas | Parcial | [Versões](tecnologias-versoes.md) registra Expo 58, React Native 0.88, Node e PostgreSQL. O documento ainda diz React Native 0.88.0, enquanto o pacote atual fixa 0.88.1; trechos antigos da análise de mercado também citam outra arquitetura. |
| Informar versão mínima do sistema operacional | Implementado como configuração | [app.json](../Synple/mobile/app.json) declara Android API 24 e iOS 16.4 em BuildProperties. Esses mínimos declarados não comprovam compatibilidade real do APK/IPA ou de todos os módulos do SDK 58. |
| Testar identidade visual no tema escuro | Não comprovado | Há [tema](../Synple/mobile/src/styles/theme.js) e preferência persistida. Não foram localizadas evidências de aprovação visual em Android/iOS; os relatórios existentes registram esse teste como pendente. |
| Produzir interfaces | Parcial | As telas existem em `Synple/mobile/src/screens` e há [contrato de interfaces](../Synple/docs/INTERFACES.md). Isso não equivale a protótipos ou avaliação visual aprovada pelo professor. |
| Padrões de programação com práticas do dia a dia | Implementado no documento | [Padrões de desenvolvimento](../Synple/docs/PADROES_DESENVOLVIMENTO.md): transações, autorização, erros, concorrência, cache, testes, migrações e revisão. Há exceção: `backend.test.js` ainda consulta/escreve no schema da instalação, contrariando a regra de testes isolados. |
| Projeto de testes menos genérico | Parcial | Testes concretos de segurança, concorrência de atas, migração e PDF existem. A cobertura permanente de votação/relatório ainda não está nas suítes versionadas; nesta revisão foram usados probes isolados adicionais. Testes físicos/manuais permanecem sem evidência. |
| Mais RNFs e melhor especificação | Implementado no documento; validação parcial | [Especificação principal](incremento-1-especificacao-completa.md), seção 8: 17 RNFs com condições, medidas e método. Metas de desempenho, acessibilidade e compatibilidade não estão comprovadas por medições/aparelhos. |

## 2. Código e comportamento comentados em 09/10

| Item | Situação | Evidência e limite |
| --- | --- | --- |
| Ícone sendo sobrescrito | Parcial / não comprovado em APK | [app.json](../Synple/mobile/app.json) aponta para `synple-icon.png` e ícone adaptativo próprio. Não há comprovação de instalação/atualização do APK corrigindo o launcher; Expo Go usa seu próprio ícone. |
| Justificar PostgreSQL antigo | Parcial | O Compose continua em `postgres:16-alpine`. [Versões](tecnologias-versoes.md) justifica compatibilidade com dados existentes. Não houve atualização principal nem comprovação de que o professor aceitou manter 16. |
| Proteger a API | Implementado | [server.js](../Synple/backend/src/server.js), [security.js](../Synple/backend/src/services/security.js) e [authorization.js](../Synple/backend/src/services/authorization.js): Bearer validado, identidade vinculada à sessão e autorização no servidor. Saúde/login/ativação/recuperação são exceções públicas deliberadas. |
| Configuração de comunicação com a API | Implementado | [api.js](../Synple/mobile/src/services/api.js) lê `EXPO_PUBLIC_API_URL`; há `.env.example`, `.env.local` gerado e [inicializador de túnel](../Synple/scripts/dev-tunnel.js). Código de fallback continua existindo, mas o endereço principal é configuração externa. |
| Melhorar mensagens de erro no cadastro | Parcial | [App.js](../Synple/mobile/App.js), `registerUser`, diferencia validação, erro da API e ativação; [auth.js](../Synple/backend/src/routes/auth.js) retorna erros de duplicidade/envio. A apresentação continua por `Alert.alert`, sem erros por campo. |
| Estado sem componentes controlados | Implementado no componente comum | [FormControls.js](../Synple/mobile/src/components/FormControls.js), `Field`: `defaultValue`, ref e `setNativeProps`; estado React continua recebendo as mudanças. Máscaras, reset e cursor ainda exigem teste físico. |
| Teclado cobre o campo | Parcial / não comprovado | Há `KeyboardAvoidingView` e `ScrollView` no app/login. Não há evidência suficiente de todos os campos visíveis com teclado em Android e iOS. |
| Diversificar login | Implementado; integração real pendente | Senha e Google estão em [LoginScreen.js](../Synple/mobile/src/screens/LoginScreen.js) e são validados no backend. Google exige Client IDs, assinatura correta e development build; presença de código não prova login real no aparelho. |
| Biometria depois da primeira autenticação | Parcial | [session.js](../Synple/mobile/src/services/session.js) salva e restaura token via SecureStore com autenticação quando há módulos e biometria cadastrada. Sem suporte a sessão fica em memória. Não há comprovação de funcionamento biométrico no APK atual. |
| Biometria na edição do perfil | Implementado como proteção local | `updateProfile` em [App.js](../Synple/mobile/App.js) chama `confirmBiometric` antes de atualizar nome/telefone. E-mail é somente leitura. Biometria não substitui a sessão e não é uma prova biométrica enviada ao backend. |
| E-mail de ativação no cadastro | Implementado; entrega real não comprovada | [auth.js](../Synple/backend/src/routes/auth.js) e [mailer.js](../Synple/backend/src/services/mailer.js): código, hash, prazo e verificação. Testes usam SMTP simulado; envio real depende da configuração do ambiente e não foi realizado nesta revisão. |
| Rever fallback AsyncStorage / exigir banco | Implementado | Login depende da API; [useSynpleData.js](../Synple/mobile/src/hooks/useSynpleData.js) não autentica por cache; [storage.js](../Synple/mobile/src/services/storage.js) remove credenciais. Falha de rede não vira cadastro/login offline. |
| Recuperação insegura | Parcial | Backend usa código aleatório, SHA-256, 15 minutos, consumo condicionado, limites e revogação de sessões. Ainda há inconsistência: `resetPasswordFromLogin` em App.js aceita mínimo de 6 caracteres e backend exige 8; o pedido de recuperação valida apenas e-mail não vazio, sem formato. |
| Trocar administrador da organização | Implementado | [organizations.js](../Synple/backend/src/routes/organizations.js), `PATCH /:id/owner`: transação, propriedade atual, novo proprietário aprovado e manutenção do vínculo do anterior. Coberto pelos testes isolados. |
| Zero ou vários coordenadores | Implementado; validação de negócio pendente | [commissions.js](../Synple/backend/src/routes/commissions.js) cria coordenador, transfere cargo e impede remover/rebaixar o atual sem sucessor; [schema.sql](../Synple/backend/src/db/schema.sql) tem índice único parcial e migração. A escolha de exatamente um ainda consta como pendente de validação com a comunidade. |
| Nome/CNPJ de organização duplicados | Implementado | [schema.sql](../Synple/backend/src/db/schema.sql): índices únicos por `LOWER(TRIM(name))` e CNPJ normalizado. Testes de segurança verificam conflito. |
| Convidar pessoa cadastrada para organização | Implementado | [organizations.js](../Synple/backend/src/routes/organizations.js): convite por e-mail de conta existente, aceite/recusa pelo destinatário e vinculação. Testes impedem que o proprietário aceite pelo convidado. |
| Data de inicialização incorreta | Implementado com limite histórico | `system_metadata.initialized_at` é persistido uma vez e consultado no backend. Em banco antigo marca a aplicação dessa migração, não uma data original desconhecida. |
| Reinicialização não funciona / status errado | Parcial: operação substituída | [SystemScreen.js](../Synple/mobile/src/screens/SystemScreen.js) oferece “Verificar” e “Consultar disponibilidade real”. `restartSubsystem` apenas consulta `/system`; não reinicia processos. Reinício real fica no Docker/operador. Não afirmar que reinício pelo aplicativo foi implementado. |
| Mais informações para o administrador | Implementado | [system.js](../Synple/backend/src/routes/system.js): instalação/processo, uptime, API/Node/PostgreSQL, relógio e latência. A tela apresenta parte desses dados e contadores. |
| Diferenciar resetar e restaurar | Parcial: fluxo removido/renomeado | Interface oferece “Limpar cache e sair”, preservando o servidor. Não há restauração de backup nem reset do banco pelo aplicativo. |
| Levantamento com comunidade e concorrentes | Não comprovado | Há roteiro em [Análise de mercado](../Analise_de_Mercado.md) e pendências explícitas em [Correções](../Synple/docs/CORRECOES_AVALIACAO.md). Não foram localizados registros de entrevistas, respostas, aceite de requisitos ou testes manuais de concorrentes. |
| Interface agradável de aplicativo, sem parecer site | Parcial / não comprovado | Componentes React Native, temas e áreas roláveis existem. Reuniões ainda agrupa agendamento, presença, votos e atas em uma tela longa. Não há aprovação de usabilidade em aparelho/comunidade. |

## 3. Documentação comentada em 09/10 e 29/10

| Item | Situação | Evidência e limite |
| --- | --- | --- |
| Casos de uso UML e atores detalhados | Parcial | [uc-reunioes.puml](Diagramas/fontes/uc-reunioes.puml) tem fronteira, atores por papel e especializações. O [incremento 3](Diagramas/fontes/uc-incremento-3.puml) existe, mas não tem SVG renderizado e deixa criação/aprovação de ata na documentação anterior. Aprovação do padrão solicitado não comprovada. |
| Classes relativas ao código, com métodos | Parcial | [classes-servicos.puml](Diagramas/fontes/classes-servicos.puml) e [dicionário](dicionario-classes.md) descrevem módulos/funções reais. Diagramas de domínio e `classes-incremento-3.puml` continuam principalmente entidades/atributos. A abordagem declarada de módulos JS deve ser confrontada com a exigência do professor. |
| Tabelas, campos, finalidade, relacionamentos e restrições | Implementado no conteúdo; atualização parcial | [Dicionário físico](dicionario-banco-dados.md) descreve colunas, defaults, nulabilidade, FKs, restrições, índices e tabelas de votação. O snapshot gerado está desatualizado em relação ao DDL, confirmado pelo validador. |
| Seed e incremento de chave primária | Documentado quando aplicável | Chaves de domínio são UUID com `gen_random_uuid()`, não sequências auto incrementais. Não se deve inventar seed/incremento numérico para UUID. |
| RNFs genéricos, tema/máscaras tratados como qualidade e meta de 100 ms | Melhorado no documento; validação parcial | [Especificação](incremento-1-especificacao-completa.md), seção 8: separa funcionalidade e qualidade; usa metas p95 com condições e reconhece medições pendentes. RNFs não estão todos demonstrados na prática. |
| Versão documental divergente do código | Parcial | [Versões](tecnologias-versoes.md) já diz Expo 58, mas ainda diz React Native 0.88.0 em vez de 0.88.1. [Análise de mercado](../Analise_de_Mercado.md) ainda promete React Native CLI, Redis, MinIO, Nginx, offline-first e chat, ausentes da implementação atual. |
| Requisitos funcionais separados da descrição de casos de uso | Parcial | [INCREMENTO_3.md](INCREMENTO_3.md) tem tabela declarativa RF03 e fichas UC03 separadas. A especificação principal combina requisitos e fichas detalhadas; não há prova de conformidade com o formulário institucional solicitado. |
| RF detalhado: tela, controle, validação, chave e valores | Melhorado; restam inconsistências | Há contratos de tela/rota, exceções, `@synple:incremento-1` para cache e LIGHT/DARK para tema. Recuperação ainda diverge 6/8 caracteres e valida e-mail só por preenchimento. |
| Sequências com classes e mensagens corretas | Parcial | [seq-agendamento.puml](Diagramas/fontes/seq-agendamento.puml) ainda usa mensagens como “Valida período e convidados” e “BEGIN; confere gestor e lock da comissão”; [seq-presenca.puml](Diagramas/fontes/seq-presenca.puml) usa “Verifica convite, presença e situação da ata”. Não é o detalhamento de chamadas concretas solicitado. As novas sequências do incremento 3 misturam chamadas concretas e descrições narrativas. |
| Documentação completa e referências válidas | Pendente | `node Synple/scripts/validate-documentation.cjs` falhou: cinco fontes referenciadas na pasta errada, SVG de `uc-incremento-3` ausente e snapshot físico desatualizado. Fontes estão em parte sob `Synple/docs/Diagramas/fontes`, mas os links apontam para `docs/Diagramas/fontes`. |
| Documentação no padrão e padrões de código/nomenclatura | Parcial / não comprovado | Há [padrões](../Synple/docs/PADROES_DESENVOLVIMENTO.md) e revisão documental. O próprio [relatório](VERIFICACAO_DOCUMENTACAO.md) registra falta do formulário institucional; existência de documentação não comprova aceite do padrão. |
| Documentar testes realizados | Parcial | Existem relatórios de verificações anteriores com limites declarados. Quantidades, dependências e versões são históricas; faltam evidências atuais em Android/iOS, SMTP real, Google e biometria. A suíte legada ainda depende de seeds e atua no banco da instalação. |

## 4. Reuniões e presença comentadas em 29/10

| Item | Situação | Evidência e limite |
| --- | --- | --- |
| Todos os erros de validação na tela, sem alert | Ausente | [MeetingsScreen.js](../Synple/mobile/src/screens/MeetingsScreen.js), `submitMeeting`, recebe uma mensagem de `buildMeetingPayload` e usa `Alert.alert`. Não há lista por campo. |
| Componente amigável de data/hora | Parcial | [DateTimeField](../Synple/mobile/src/components/FormControls.js) separa data/hora, mascara e usa teclado numérico. Não há seletor de calendário/relógio nativo. Aceitabilidade não foi testada com usuários. |
| Campo visível com teclado | Parcial / não comprovado | Há KeyboardAvoidingView/ScrollView, mas sem evidência física dos cenários citados pelo professor. |
| Reunião de dia todo | Ausente como modo específico | Não há `allDay`, seletor “Dia todo” ou contrato equivalente; é obrigatório informar horas e término maior que início. Intervalo manual de 24 horas não equivale à funcionalidade solicitada. |
| Compartilhar arquivos para apreciação | Ausente | Não há upload, tabela de anexos, rota ou componente de anexos de reunião. Compartilhar texto de ata/lista não é anexar arquivo para participantes. |
| Local opcional ou detalhes opcionais | Ausente como campo próprio | Reunião persiste título, pauta, comissão, autor, início/término. Pauta obrigatória pode conter texto livre, mas não substitui um campo opcional de local/detalhes. |
| Interface menor e amigável para celular | Parcial / não comprovado | A tela de reunião continua longa, agregando formulário, convites, presença, votações e ata. Não foi localizado teste de usabilidade demonstrando resolução do comentário. |
| Impedir criar reunião no passado | Não corrigido; reproduzido | Backend exige apenas datas válidas e fim maior que início. No probe isolado, uma reunião de 01/01/2001 foi criada com HTTP 201. |
| Editar reunião existente | Ausente | Não há PUT/PATCH de título, horários ou pauta de reunião em [meetings.js](../Synple/backend/src/routes/meetings.js), nem fluxo de edição no mobile. Edição de ata é outra função. |
| Impedir aceitar/rejeitar convite após reunião | Não corrigido; aceite reproduzido | A rota de convite não verifica término. Aceitar convite da reunião de 2001 retornou HTTP 200. O caminho de recusa também não tem verificação temporal, apenas restrição para quem já registrou entrada. |
| Impedir entrada após término | Não corrigido; reproduzido | A rota de presença verifica convite/ata, mas não horário. Entrada na reunião de 2001 retornou HTTP 200. |
| Biometria para entrada/saída | Ausente | Os botões chamam `onAttendance` sem `confirmBiometric`; biometria está na sessão/perfil. |
| Formas alternativas/automatizadas de presença | Ausente como mecanismo adicional | Há autorregistro de entrada/saída com clique. Não há QR de presença, proximidade, integração ou outro fator de comprovação. O QR do Expo serve para carregar o aplicativo, não comprovar presença. |
| Presidente registrar entrada de terceiros | Ausente | A rota vincula `req.body.userId` à sessão e a interface só oferece presença própria. Não há operação de gestão de presença por terceiro. |
| Impedir saída antes do início | Não corrigido; reproduzido | Foi possível registrar entrada e saída em reunião de 2099, com HTTP 200, antes de seu início. A rota exige entrada prévia, mas não compara o relógio com a agenda. |
| Presidente registrar saída de terceiros | Ausente | Mesma limitação de identidade vinculada à sessão; sem rota/interface para atuação do presidente por participante. |
| Lista de presença em PDF | Ausente | `generateAttendance` gera e compartilha texto com `buildAttendanceText`. O PDF existente é o da ata em `/minutes/pdf`; não é PDF da lista de presença. |
| Atualizar Expo | Implementado no código | [package.json](../Synple/mobile/package.json): Expo 58.0.23 / React Native 0.88.1. A verificação de compatibilidade passou na revisão anterior desta mesma conversa. APK/IPA precisa corresponder aos módulos/SDK atuais. |

## 5. Verificações e evidências desta conversa

- Mobile: 25 testes passaram; `expo install --check` informou dependências compatíveis.
- Backend: 30 testes passaram nas quatro suítes isoladas de reuniões, segurança, migração e PDF, executadas no Docker. Os hashes de `meetings.js` e `schema.sql` no container foram comparados aos do checkout e coincidiram.
- Votação/relatório: 14 verificações HTTP/SQL adicionais em schema temporário passaram, incluindo permissões, identidade da sessão, troca de opção sem duplicar voto, bloqueio após encerramento, isolamento de sincronização e relatório próprio sem convidados ausentes.
- Regras temporais: quatro falhas foram reproduzidas com usuários/reuniões fictícios: criação no passado (201), aceite após término (200), entrada após término (200) e saída antes do início (200). Esses resultados são reprodução de defeitos, não critérios de aceite aprovados.
- Documentação: validador falhou nas referências/SVG/snapshot descritos acima. Não foram reparados nesta revisão.
- Suíte completa local: encontrou `pdfkit` e `nodemailer` ausentes nas dependências locais e um teste que exige as três contas seed. A suíte completa não foi repetida no Docker; foram executadas apenas as quatro suítes isoladas. Não criar contas de demonstração no banco real apenas para fazer teste passar.
- Os probes novos criaram schema exclusivo com prefixo `audit_increment3_` e o removeram ao final. Não foram feitos envios de e-mail, testes Google nem interações biométricas reais.
- Não foram realizados nesta revisão: teste Android/iOS físico, inspeção do launcher instalado, teclado/fonte ampliada, desempenho, avaliação manual de concorrentes, entrevista com comunidade ou aprovação do formulário do professor.

## 6. Ordem sugerida de correção

1. Validar horários no backend e refletir as mensagens no mobile; cobrir reunião passada, convite fora de prazo, entrada/saída fora do período e edição de reunião.
2. Trocar alertas de validação por mensagens por campo; melhorar data/hora e dividir a tela de reuniões; validar teclado em Android/iOS.
3. Combinar com o professor o escopo das melhorias sugeridas: dia todo, local/detalhes, anexos e modalidades de presença/presidente.
4. Implementar o PDF de presença e alinhar recuperação de senha a oito caracteres no cliente/servidor.
5. Corrigir links/renderizações/snapshot/versões e as divergências de arquitetura na análise de mercado; revisar UML/seq/formulário institucional.
6. Registrar testes físicos e integrações reais, avaliação manual de concorrentes e levantamento/validação com a comunidade. Não substituir evidências por declarações de implementação.
