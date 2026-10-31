# Correções da avaliação do professor

Revisão em 30/10/2026. Este registro diferencia código implementado de validação em dispositivo e levantamento com pessoas. Não comprova entrevistas, testes manuais de concorrentes ou execução em celulares.

## Arquitetura e compatibilidade

O cliente usa Expo SDK 57, React Native 0.86 e React 19.2.3. A API usa Express 4, Node.js 22 e SQL parametrizado com `pg`; não usa Lucia Auth, Sequelize, MMKV, Zod, React Navigation ou React Native Paper. Os testes usam `node:test` e HTTP real contra schemas isolados no PostgreSQL. O tema e os componentes são próprios.

Versões mínimas: Node.js 22.13, Android 7/API 24 e iOS 16.4. `app.json` aplica os mínimos pelo plugin `expo-build-properties`. Compilar iOS depende do ambiente EAS/Xcode compatível; um bundle JavaScript não comprova execução nativa. Fonte: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

O PostgreSQL 16 foi mantido por compatibilidade dos dados e por receber suporte até 09/11/2028, conforme a [política oficial](https://www.postgresql.org/support/versioning/). Atualizações menores devem ser aplicadas com backup e validação. Uma atualização principal exige migração planejada; trocar apenas a imagem com o mesmo volume pode impedir a inicialização.

## Segurança e autenticação

- Login por senha consulta o servidor; foram removidas senhas alternativas de demonstração e autenticação local.
- Sessões opacas de 256 bits, validade de sete dias; o servidor armazena somente SHA-256 do token. Logout e troca/recuperação de senha revogam sessões.
- Rotas privadas exigem Bearer token. Autor, proprietário atual e participante de operações de reunião vêm da sessão, não da identidade declarada no JSON.
- Administração e alterações de organização/comissão são autorizadas no servidor. `/sync` restringe coleções ao vínculo e histórico permitido; organizações aprovadas formam um diretório básico para solicitar acesso.
- A rota pública `/health` responde disponibilidade sem expor versão, nome do banco ou detalhes de exceção. `/system` exige administrador.
- Cadastro local de usuário foi removido. Cadastro novo exige SMTP e código de ativação, com hash e validade de 15 minutos. Falha de envio não é apresentada como cadastro concluído. Contas já existentes são preservadas; novas contas Google usam o e-mail verificado pelo provedor.
- Limites persistentes por IP e por conta: login/Google, dez tentativas em 15 minutos; recuperação/reenvio, três; validação de códigos, cinco. A limitação usa o endereço observado pelo servidor, sem confiar em cabeçalhos de proxy arbitrários.
- Tokens não são salvos no AsyncStorage. Em celulares com biometria cadastrada, SecureStore exige autenticação para recuperar a sessão. Sem armazenamento protegido, a sessão permanece somente em memória. Logout apaga a sessão local. Web exige novo login ao recarregar.
- Edição de nome/telefone solicita biometria forte no aparelho. E-mail permanece somente leitura: trocar e-mail requer um fluxo de nova verificação. Biometria é uma proteção local, não uma prova enviada pelo servidor; a API continua exigindo sessão.
- PDF: HEAD usa sessão; o navegador recebe um ticket limitado à rota, ligado à sessão e válido por 60 segundos. As permissões da reunião são conferidas novamente no download.

O cache antigo é regravado sem senhas/tokens. Dados removidos no servidor não são mesclados de volta pelo cache. Escritas precisam de confirmação da API. Leitura offline durante uma sessão já aberta continua mostrando o último estado em memória; reabertura exige validar a sessão no servidor. Não há autenticação offline por senha.

## Regras funcionais

| Observação | Alteração ou limite |
| --- | --- |
| Transferir administrador | Rota corrigida para `db.pool.connect()`, transação e exigência de membro aprovado. Identidade do proprietário vem da sessão. |
| Quantidade de coordenadores | Exatamente um coordenador por comissão. Criação inclui o coordenador; promoção transfere o cargo em transação. Não se remove/rebaixa o atual antes de escolher sucessor. Índice impede dois coordenadores. Na migração, comissão antiga sem coordenador recebe o proprietário como responsável; conflitos com múltiplos coordenadores não são resolvidos apagando dados. Esta decisão deve ser validada com a comunidade. |
| Organizações duplicadas | Unicidade por nome normalizado e CNPJ sem pontuação no banco; conflitos antigos bloqueiam a migração sem apagar dados. Corrigir os conflitos conscientemente antes de reaplicar. |
| Convites de organização | Proprietário convida conta ativa pelo e-mail; destinatário aceita/recusa. O proprietário não pode aprovar o próprio convite em nome do destinatário. |
| Data de inicialização | Instante persistido em `system_metadata`, estável entre sincronizações. Em instalação antiga, representa a aplicação desta migração, não uma data histórica desconhecida. |
| Reiniciar subsistema | Removida a simulação de sucesso. A interface verifica disponibilidade real. Reinício de processo é feito pelo operador no Docker, fora do aplicativo. |
| Informações administrativas | Inicialização da instalação/processo, uptime, versão da API/Node, versão do PostgreSQL, latência e relógio do banco. |
| Reset/restauração | Ação renomeada para “Limpar cache e sair”; preserva o banco. Não oferece restauração fictícia de backup ou reinicialização de serviço. |
| Cadastro/erros | Erros do servidor impedem sucesso e não criam usuário offline. Senhas novas exigem oito caracteres. |
| Interface/teclado | Campos nativos com `defaultValue`, sincronização externa por ref, rolagem e KeyboardAvoidingView. Tema do login acompanha o dispositivo; tema autenticado segue o perfil. Validar máscaras, foco e teclado em dispositivos. |
| Ícone | Ícone e adaptive icon próprios permanecem em `app.json`. Conferir instalação nova/atualização do APK; o ícone do Expo Go não representa o aplicativo final. |

## Requisitos não funcionais verificáveis

| ID | Critério de aceite | Método |
| --- | --- | --- |
| RNF-SEC01 | Nenhuma rota privada aceita requisição sem sessão válida; ator do JSON não concede acesso a outra conta. | Testes HTTP de segurança e permissão. |
| RNF-SEC02 | Senhas/tokens não aparecem no JSON do cache; token bruto não é persistido no banco. | Teste do sanitizador e consulta ao schema isolado. |
| RNF-SEC03 | Código de ativação expira em 15 minutos, uso único; tentativa acima do limite retorna 429. | Testes HTTP/SQL, sem envio real de e-mail. |
| RNF-INT01 | Falha da API não cria usuário/comissão nem confirma alteração local. | Desligar API e tentar operações; registrar mensagem e banco. |
| RNF-INT02 | Transferência de proprietário é atômica; comissão mantém um coordenador após promoção concorrente. | Testes de transação/índice e cenário de concorrência. |
| RNF-PRIV01 | Usuário sem vínculo não recebe usuários, presenças ou atas de outra organização. | Testes com duas contas/organizações. |
| RNF-COMP01 | Instalação e fluxos essenciais em Android 7+ e iOS 16.4+. | Registrar modelo/SO/APK/IPA e resultados; pendente em aparelhos. |
| RNF-UX01 | Campo focado e mensagem de validação visíveis com teclado em tela de 360×640 e com fonte ampliada. | Teste manual Android/iOS; claro/escuro. |
| RNF-UX02 | Textos essenciais legíveis nos dois temas; controles principais com alvo de toque de pelo menos 44 pontos. | Inspeção visual e de componentes. |
| RNF-OPS01 | Reiniciar API não altera a data da instalação nem redefine senhas. | Migração idempotente e consulta após reinício. |
| RNF-PERF01 | Medir abertura e resposta de lista com 100 registros: registrar p50/p95, aparelho e rede; meta de abertura p95 ≤ 3 s e resposta de lista p95 ≤ 500 ms. | Medição em aparelho, ainda pendente; não declarar atingido sem resultado. |
| RNF-MAN01 | Toda correção de regra inclui teste de comportamento e atualização do contrato/documento correspondente. | Revisão de alteração e execução das suítes. |
| RNF-DEP01 | API publicada usa HTTPS, URL estável e configuração fora do código. Túnel temporário é restrito à demonstração. | Conferir implantação; não implica disponibilidade de produção. |

## Roteiro de teste em aparelhos

Para cada linha registrar: responsável, data, modelo, SO, versão/assinatura do APK, pré-condições, passos, resultado esperado/obtido e evidência. Estado inicial de todos: **não executado nesta revisão**.

1. Instalar novo development build, conferir ícone no launcher e atualização sobre instalação anterior.
2. Abrir login em claro/escuro, fonte ampliada e teclado aberto; preencher/limpar máscaras e alternar abas sem texto residual.
3. Cadastrar com e-mail inválido, senha curta, e-mail repetido, SMTP indisponível e API desligada: nenhum falso sucesso.
4. Cadastrar conta válida, receber e-mail, errar código, reenviar, ativar e tentar reutilizar o código.
5. Entrar por senha e Google no APK correto; testar conta não ativada e credenciais inválidas.
6. Encerrar/reabrir app com biometria cadastrada; cancelar biometria; testar troca de biometria e sessão expirada.
7. Editar nome/telefone com confirmação biométrica; cancelar e conferir que os dados não mudaram.
8. Recuperar senha, exceder tentativas, expirar código, redefinir e confirmar invalidação das sessões anteriores.
9. Duas contas em dois aparelhos: convidar para organização; só destinatário aceita/recusa; conferir persistência após atualização.
10. Transferir proprietário; novo dono gerencia e antigo perde a propriedade, permanecendo membro.
11. Promover coordenador: anterior vira membro; não permitir remoção do único coordenador. Tentar duas promoções simultâneas.
12. Repetir CNPJ com/sem pontuação e nome com caixa/espaços diferentes; conferir conflito sem duplicar registro.
13. Conferir data da instalação antes/depois de sincronizar e reiniciar API; consulta de status reflete falha real.
14. Limpar cache e sair; entrar novamente e confirmar que dados do PostgreSQL continuam presentes.
15. Executar os cenários do incremento 2, inclusive PDF autenticado, ticket expirado, presença e aprovação concorrente.

## Pendências que exigem pessoas ou ambiente externo

- Entrevistar representantes da comunidade e registrar consentimento, necessidades, prioridades e validação da regra de coordenador. Não inventar resultados.
- Executar avaliação manual de concorrentes conforme `../../Analise_de_Mercado.md`.
- Executar o roteiro em Android/iOS físicos; comprovar ícone, teclado, tema, biometria e login Google.
- Configurar SMTP real, credenciais OAuth, assinatura/SHA-1 e contas de teste. Não versionar senhas SMTP/chaves privadas.
- Avaliar percepção da interface com usuários antes de afirmar que ela atende ao critério “parecer aplicativo”.
