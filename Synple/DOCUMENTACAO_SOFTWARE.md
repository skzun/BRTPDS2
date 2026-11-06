# Documentação técnica — Synple

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

## Guias e evidências

- [Como iniciar e preparar outro computador](../README.md), [Docker](../COMO_RODAR_DOCKER.md), [tutorial do app](GUIA_USO_E_INICIALIZACAO.md).
- [Google](LOGIN_COM_GOOGLE.md), [SMTP/recuperação](backend/EMAIL_RECOVERY_SETUP.md).
- [Dicionário físico completo](../docs/dicionario-banco-dados.md), [classes/operações](../docs/dicionario-classes.md), [diagramas](../docs/Diagramas/Diagramas_Casos_de_Uso.md).
- [Resultados da revisão de código](docs/VERIFICACAO_CORRECOES.md), [verificação documental](../docs/VERIFICACAO_DOCUMENTACAO.md).

O boot normal aplica migrações e preserva senhas, sem seed automático. Novos módulos de biometria/SecureStore exigem novo development build; alterações só de PDF não devem ser confundidas com essa atualização. Túnel temporário não é hospedagem estável. Os limites de autorização, validação, cascatas e retenção estão na seção11 da especificação, sem prometer proteções não implementadas.
