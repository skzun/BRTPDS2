# Documentação do projeto Synple

Revisão consolidada: 30/10/2026. Este é o índice da documentação; a especificação técnica principal e os anexos abaixo substituem os diagramas/contratos antigos. O conteúdo descreve a implementação presente no checkout, inclusive limites conhecidos.

## Documento principal e anexos

| Artefato | Conteúdo |
| --- | --- |
| [Relatório do dia e plano do Incremento 3](docs/RELATORIO_2026-10-30_E_PLANO_INCREMENTO_3.md) | Trabalho de 30/10/2026, evidências, pendências por comentário do professor e critérios propostos |
| [Especificação principal](docs/incremento-1-especificacao-completa.md) | Atores, arquitetura, 38 RFs, 17 RNFs, fluxos, exceções, dados, contratos e rastreabilidade |
| [Diagramas UML e modelo relacional](docs/Diagramas/Diagramas_Casos_de_Uso.md) | 24 diagramas renderizados em SVG, com fontes PlantUML editáveis: casos de uso, classes, sequências, implantação e recortes relacionais |
| [Dicionário de classes e operações](docs/dicionario-classes.md) | 15 modelos de dados e 60 operações exportadas com parâmetros, retornos, efeitos e correspondência com o código |
| [Dicionário físico](docs/dicionario-banco-dados.md) | 15 tabelas, 99 colunas, 53 restrições, 39 índices; nulabilidade, defaults e ações de exclusão reais |
| [Tecnologias e versões](docs/tecnologias-versoes.md) | Todas as dependências diretas, faixas declaradas, versões resolvidas e requisitos de SO/runtime |
| [Verificação documental](docs/VERIFICACAO_DOCUMENTACAO.md) | Procedimentos executados nesta revisão e atividades não comprovadas |
| [Incremento 2](Synple/docs/INCREMENTO_2.md) | Índice do módulo de reuniões/atas e roteiro CA01–CA20, referenciando a especificação canônica |

## Proposta e identidade visual

Synple associa sincronização e pessoas para gerir organizações, comissões, reuniões, presença e aprovação de atas. A marca, ícone e splash próprios estão em Synple/mobile/assets e app.json. Tema claro/escuro usa índigo, superfícies contrastantes e componentes React Native próprios. Testes com usuários e avaliação de aparência em aparelhos ainda precisam de evidências; não se declara aprovação apenas por existir uma paleta.

## Arquitetura vigente

Aplicativo Expo SDK 57 / React Native 0.86 / React 19.2.3, JavaScript; API Node.js 22 e Express 4 com pg/SQL parametrizado; PostgreSQL 16; bcryptjs, Google OAuth, Nodemailer e PDFKit. Sessões opacas verificadas no servidor; SecureStore/biometria no aparelho; cache AsyncStorage sanitizado sem senha/token. Não há Sequelize, Lucia Auth ou MMKV no código atual.

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
