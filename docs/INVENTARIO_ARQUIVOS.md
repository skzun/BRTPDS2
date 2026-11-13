# Inventário dos arquivos do projeto

Gerado por `node Synple/scripts/inventory-project.cjs --write`. Caminhos relativos à raiz BRTPDS2. Consulte [o mapa](ORGANIZACAO_DO_PROJETO.md) para a finalidade das pastas e [a revisão de limpeza](REVISAO_DE_LIMPEZA.md) antes de remover arquivos.

Arquivos próprios e configurações por caminho/tamanho; sem ler valores de .env. Dependências, Git, caches e projetos nativos gerados excluídos da listagem individual.

Dependências já versionadas: **6496 arquivos**. Configurações locais versionadas: `Synple/backend/.env`.

## Arquivos próprios

| Caminho | Bytes | Situação no índice Git |
| --- | ---: | --- |
| [.gitignore](../.gitignore) | 278 | Versionado |
| [docker-compose.yml](../docker-compose.yml) | 1719 | Versionado |
| [docs/Analise_de_Mercado.md](../docs/Analise_de_Mercado.md) | 9902 | Movido; origem versionada |
| [docs/CORRECOES_AVALIACAO.md](../docs/CORRECOES_AVALIACAO.md) | 11298 | Movido; origem versionada |
| [docs/Diagramas/Diagramas_Casos_de_Uso.md](../docs/Diagramas/Diagramas_Casos_de_Uso.md) | 9346 | Versionado |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-cadastro.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-cadastro.puml) | 1689 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-incremento-3.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-incremento-3.puml) | 1325 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-reunioes.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-reunioes.puml) | 1607 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-servicos.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/classes-servicos.puml) | 2475 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/implantacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/implantacao.puml) | 1405 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-cadastro.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-cadastro.puml) | 2857 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-incremento-3.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-incremento-3.puml) | 3552 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-reunioes.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-reunioes.puml) | 4124 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-seguranca.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/relacional-seguranca.puml) | 2167 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-agendamento.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-agendamento.puml) | 933 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-anexos.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-anexos.puml) | 914 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-ata.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-ata.puml) | 1250 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-biometria.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-biometria.puml) | 1290 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-cadastro.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-cadastro.puml) | 1253 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-comando.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-comando.puml) | 1161 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-convite-org.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-convite-org.puml) | 970 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-editar-reuniao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-editar-reuniao.puml) | 864 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-login.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-login.puml) | 1245 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-manual-consulta.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-manual-consulta.puml) | 368 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-pdf.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-pdf.puml) | 1041 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca-pdf.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca-pdf.puml) | 745 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-presenca.puml) | 999 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-recuperacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-recuperacao.puml) | 1265 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-relatorio-participacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-relatorio-participacao.puml) | 586 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-sincronizacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-sincronizacao.puml) | 915 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-sistema.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-sistema.puml) | 1013 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-transferencia.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-transferencia.puml) | 935 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-votacoes.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/seq-votacoes.puml) | 1374 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-autenticacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-autenticacao.puml) | 1217 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-incremento-3.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-incremento-3.puml) | 1471 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-operacao.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-operacao.puml) | 991 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-organizacoes.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-organizacoes.puml) | 1418 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-reunioes.puml](../docs/Diagramas/ENTREGA_DEFINITIVA/fontes/uc-reunioes.puml) | 1588 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/manifesto.json](../docs/Diagramas/ENTREGA_DEFINITIVA/manifesto.json) | 9530 | Local/novo |
| [docs/Diagramas/ENTREGA_DEFINITIVA/README.md](../docs/Diagramas/ENTREGA_DEFINITIVA/README.md) | 5438 | Local/novo |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-cadastro.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-cadastro.svg) | 23649 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg) | 19438 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-reunioes.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-reunioes.svg) | 22670 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-servicos.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/classes-servicos.svg) | 24430 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/implantacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/implantacao.svg) | 21937 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-cadastro.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-cadastro.svg) | 23580 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-incremento-3.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-incremento-3.svg) | 32512 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-reunioes.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-reunioes.svg) | 35820 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-seguranca.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/relacional-seguranca.svg) | 17922 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-agendamento.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-agendamento.svg) | 14164 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-anexos.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-anexos.svg) | 14911 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-ata.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-ata.svg) | 17792 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-biometria.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-biometria.svg) | 18355 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-cadastro.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-cadastro.svg) | 18647 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-comando.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-comando.svg) | 15673 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-convite-org.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-convite-org.svg) | 12316 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-editar-reuniao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-editar-reuniao.svg) | 13999 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-login.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-login.svg) | 20316 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-manual-consulta.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-manual-consulta.svg) | 7447 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-pdf.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-pdf.svg) | 15462 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca-pdf.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca-pdf.svg) | 12280 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-presenca.svg) | 15331 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-recuperacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-recuperacao.svg) | 18383 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-relatorio-participacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-relatorio-participacao.svg) | 10072 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-sincronizacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-sincronizacao.svg) | 13927 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-sistema.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-sistema.svg) | 13196 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-transferencia.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-transferencia.svg) | 12776 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-votacoes.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/seq-votacoes.svg) | 19361 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-autenticacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-autenticacao.svg) | 12995 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-incremento-3.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-incremento-3.svg) | 15888 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-operacao.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-operacao.svg) | 7574 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-organizacoes.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-organizacoes.svg) | 13839 | Movido; origem versionada |
| [docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-reunioes.svg](../docs/Diagramas/ENTREGA_DEFINITIVA/renderizados/uc-reunioes.svg) | 14788 | Movido; origem versionada |
| [docs/Diagramas/README.md](../docs/Diagramas/README.md) | 678 | Local/novo |
| [docs/Diagramas/VERSOES_ANTERIORES/fontes/classes-incremento-3.puml](../docs/Diagramas/VERSOES_ANTERIORES/fontes/classes-incremento-3.puml) | 786 | Movido; origem versionada |
| [docs/Diagramas/VERSOES_ANTERIORES/fontes/relacional-incremento-3.puml](../docs/Diagramas/VERSOES_ANTERIORES/fontes/relacional-incremento-3.puml) | 1006 | Movido; origem versionada |
| [docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-manual-consulta.puml](../docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-manual-consulta.puml) | 333 | Movido; origem versionada |
| [docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-relatorio-participacao.puml](../docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-relatorio-participacao.puml) | 582 | Movido; origem versionada |
| [docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-votacoes.puml](../docs/Diagramas/VERSOES_ANTERIORES/fontes/seq-votacoes.puml) | 1010 | Movido; origem versionada |
| [docs/Diagramas/VERSOES_ANTERIORES/README.md](../docs/Diagramas/VERSOES_ANTERIORES/README.md) | 664 | Local/novo |
| [docs/dicionario-banco-dados.md](../docs/dicionario-banco-dados.md) | 37976 | Versionado |
| [docs/dicionario-classes.md](../docs/dicionario-classes.md) | 32309 | Versionado |
| [docs/Documentacao_do_ProjetoSynple.md](../docs/Documentacao_do_ProjetoSynple.md) | 3814 | Movido; origem versionada |
| [docs/DOCUMENTACAO_SOFTWARE.md](../docs/DOCUMENTACAO_SOFTWARE.md) | 3750 | Movido; origem versionada |
| [docs/ENTREGA_INCREMENTO_3.md](../docs/ENTREGA_INCREMENTO_3.md) | 6679 | Versionado |
| [docs/guias/COMO_RODAR_DOCKER.md](../docs/guias/COMO_RODAR_DOCKER.md) | 2663 | Movido; origem versionada |
| [docs/guias/EMAIL_RECOVERY_SETUP.md](../docs/guias/EMAIL_RECOVERY_SETUP.md) | 1665 | Movido; origem versionada |
| [docs/guias/GUIA_USO_E_INICIALIZACAO.md](../docs/guias/GUIA_USO_E_INICIALIZACAO.md) | 17139 | Movido; origem versionada |
| [docs/guias/LOGIN_COM_GOOGLE.md](../docs/guias/LOGIN_COM_GOOGLE.md) | 7132 | Movido; origem versionada |
| [docs/guias/MANUAL_DO_USUARIO.md](../docs/guias/MANUAL_DO_USUARIO.md) | 3669 | Local/novo |
| [docs/historico/COMO_RODAR_DOCKER_ANTIGO.md](../docs/historico/COMO_RODAR_DOCKER_ANTIGO.md) | 6110 | Movido; origem versionada |
| [docs/historico/CONTINUAR_DEPOIS.md](../docs/historico/CONTINUAR_DEPOIS.md) | 12375 | Movido; origem versionada |
| [docs/historico/ENTREGA_DOCKER_PROFESSOR_ANTIGO.md](../docs/historico/ENTREGA_DOCKER_PROFESSOR_ANTIGO.md) | 6230 | Movido; origem versionada |
| [docs/historico/ENTREGA_DOCKER_PROFESSOR_RAIZ.md](../docs/historico/ENTREGA_DOCKER_PROFESSOR_RAIZ.md) | 4854 | Movido; origem versionada |
| [docs/INCREMENTO_2.md](../docs/INCREMENTO_2.md) | 12026 | Movido; origem versionada |
| [docs/INCREMENTO_3.md](../docs/INCREMENTO_3.md) | 10213 | Versionado |
| [docs/incremento-1-especificacao-completa.md](../docs/incremento-1-especificacao-completa.md) | 108426 | Versionado |
| [docs/incremento-2-reunioes.md](../docs/incremento-2-reunioes.md) | 897 | Versionado |
| [docs/INTERFACES.md](../docs/INTERFACES.md) | 2566 | Movido; origem versionada |
| [docs/modelo-fisico.snapshot.json](../docs/modelo-fisico.snapshot.json) | 49631 | Versionado |
| [docs/ORGANIZACAO_DO_PROJETO.md](../docs/ORGANIZACAO_DO_PROJETO.md) | 7634 | Local/novo |
| [docs/PADROES_DESENVOLVIMENTO.md](../docs/PADROES_DESENVOLVIMENTO.md) | 2510 | Movido; origem versionada |
| [docs/README.md](../docs/README.md) | 4149 | Local/novo |
| [docs/RELATORIO_2026-10-30_E_PLANO_INCREMENTO_3.md](../docs/RELATORIO_2026-10-30_E_PLANO_INCREMENTO_3.md) | 36181 | Versionado |
| [docs/requisitos.snapshot.json](../docs/requisitos.snapshot.json) | 48373 | Versionado |
| [docs/REVISAO_COMENTARIOS_PROFESSOR_2026-11-06.md](../docs/REVISAO_COMENTARIOS_PROFESSOR_2026-11-06.md) | 22311 | Versionado |
| [docs/REVISAO_DE_LIMPEZA.md](../docs/REVISAO_DE_LIMPEZA.md) | 4830 | Local/novo |
| [docs/tecnologias-versoes.md](../docs/tecnologias-versoes.md) | 3705 | Versionado |
| [docs/usuarios-de-teste.md](../docs/usuarios-de-teste.md) | 2858 | Versionado |
| [docs/VALIDACAO_EM_APARELHOS.md](../docs/VALIDACAO_EM_APARELHOS.md) | 2348 | Versionado |
| [docs/VERIFICACAO_CORRECOES.md](../docs/VERIFICACAO_CORRECOES.md) | 3228 | Movido; origem versionada |
| [docs/VERIFICACAO_DOCUMENTACAO.md](../docs/VERIFICACAO_DOCUMENTACAO.md) | 5226 | Versionado |
| [docs/VERIFICACAO_INCREMENTO_2.md](../docs/VERIFICACAO_INCREMENTO_2.md) | 5679 | Movido; origem versionada |
| [docs/VERIFICACAO_INCREMENTO_3.md](../docs/VERIFICACAO_INCREMENTO_3.md) | 11323 | Movido; origem versionada |
| [iniciar_docker.bat](../iniciar_docker.bat) | 110 | Versionado |
| [iniciar.ps1](../iniciar.ps1) | 2907 | Versionado |
| [package-lock.json](../package-lock.json) | 92 | Versionado |
| [README.md](../README.md) | 4441 | Versionado |
| [Synple/backend/.dockerignore](../Synple/backend/.dockerignore) | 53 | Versionado |
| [Synple/backend/.env](../Synple/backend/.env) | 783 | Versionado |
| [Synple/backend/.env.example](../Synple/backend/.env.example) | 264 | Versionado |
| [Synple/backend/.gitignore](../Synple/backend/.gitignore) | 82 | Versionado |
| [Synple/backend/Dockerfile](../Synple/backend/Dockerfile) | 484 | Versionado |
| [Synple/backend/package-lock.json](../Synple/backend/package-lock.json) | 55124 | Versionado |
| [Synple/backend/package.json](../Synple/backend/package.json) | 631 | Versionado |
| [Synple/backend/src/assets/fonts/NotoSans-Bold.ttf](../Synple/backend/src/assets/fonts/NotoSans-Bold.ttf) | 575740 | Versionado |
| [Synple/backend/src/assets/fonts/NotoSans-Regular.ttf](../Synple/backend/src/assets/fonts/NotoSans-Regular.ttf) | 569208 | Versionado |
| [Synple/backend/src/assets/fonts/OFL.txt](../Synple/backend/src/assets/fonts/OFL.txt) | 4377 | Versionado |
| [Synple/backend/src/assets/fonts/SOURCES.txt](../Synple/backend/src/assets/fonts/SOURCES.txt) | 585 | Versionado |
| [Synple/backend/src/db/connection.js](../Synple/backend/src/db/connection.js) | 1265 | Versionado |
| [Synple/backend/src/db/init-db.js](../Synple/backend/src/db/init-db.js) | 7763 | Versionado |
| [Synple/backend/src/db/migrate.js](../Synple/backend/src/db/migrate.js) | 1008 | Versionado |
| [Synple/backend/src/db/schema.sql](../Synple/backend/src/db/schema.sql) | 13121 | Versionado |
| [Synple/backend/src/db/seed.sql](../Synple/backend/src/db/seed.sql) | 3170 | Versionado |
| [Synple/backend/src/routes/auth.js](../Synple/backend/src/routes/auth.js) | 16015 | Versionado |
| [Synple/backend/src/routes/commissions.js](../Synple/backend/src/routes/commissions.js) | 11795 | Versionado |
| [Synple/backend/src/routes/health.js](../Synple/backend/src/routes/health.js) | 373 | Versionado |
| [Synple/backend/src/routes/meetings.js](../Synple/backend/src/routes/meetings.js) | 39371 | Versionado |
| [Synple/backend/src/routes/organizations.js](../Synple/backend/src/routes/organizations.js) | 14070 | Versionado |
| [Synple/backend/src/routes/sync.js](../Synple/backend/src/routes/sync.js) | 5116 | Versionado |
| [Synple/backend/src/routes/system.js](../Synple/backend/src/routes/system.js) | 849 | Versionado |
| [Synple/backend/src/routes/users.js](../Synple/backend/src/routes/users.js) | 5954 | Versionado |
| [Synple/backend/src/server.js](../Synple/backend/src/server.js) | 3553 | Versionado |
| [Synple/backend/src/services/attendancePdf.js](../Synple/backend/src/services/attendancePdf.js) | 1804 | Versionado |
| [Synple/backend/src/services/authorization.js](../Synple/backend/src/services/authorization.js) | 2461 | Versionado |
| [Synple/backend/src/services/mailer.js](../Synple/backend/src/services/mailer.js) | 4922 | Versionado |
| [Synple/backend/src/services/meetingMinutesPdf.js](../Synple/backend/src/services/meetingMinutesPdf.js) | 11327 | Versionado |
| [Synple/backend/src/services/security.js](../Synple/backend/src/services/security.js) | 5962 | Versionado |
| [Synple/backend/src/utils/network.js](../Synple/backend/src/utils/network.js) | 979 | Versionado |
| [Synple/backend/test/backend.test.js](../Synple/backend/test/backend.test.js) | 4139 | Versionado |
| [Synple/backend/test/fixtures/minutesPdfSnapshot.js](../Synple/backend/test/fixtures/minutesPdfSnapshot.js) | 2058 | Versionado |
| [Synple/backend/test/meetingMinutesPdf.test.js](../Synple/backend/test/meetingMinutesPdf.test.js) | 1778 | Versionado |
| [Synple/backend/test/meetings.test.js](../Synple/backend/test/meetings.test.js) | 32309 | Versionado |
| [Synple/backend/test/migrate.test.js](../Synple/backend/test/migrate.test.js) | 2405 | Versionado |
| [Synple/backend/test/security.test.js](../Synple/backend/test/security.test.js) | 12300 | Versionado |
| [Synple/backend/test/voting.test.js](../Synple/backend/test/voting.test.js) | 13809 | Versionado |
| [Synple/docker-compose.yml](../Synple/docker-compose.yml) | 2052 | Versionado |
| [Synple/docs/README.md](../Synple/docs/README.md) | 421 | Local/novo |
| [Synple/dump_banco_synple.sql](../Synple/dump_banco_synple.sql) | 13941 | Versionado |
| [Synple/iniciar_docker.bat](../Synple/iniciar_docker.bat) | 113 | Versionado |
| [Synple/mobile/.claude/settings.json](../Synple/mobile/.claude/settings.json) | 76 | Versionado |
| `Synple/mobile/.env` | 325 | Local/novo |
| [Synple/mobile/.env.example](../Synple/mobile/.env.example) | 242 | Versionado |
| `Synple/mobile/.env.local` | 49 | Local/novo |
| [Synple/mobile/.gitignore](../Synple/mobile/.gitignore) | 487 | Versionado |
| [Synple/mobile/AGENTS.md](../Synple/mobile/AGENTS.md) | 121 | Versionado |
| [Synple/mobile/App.js](../Synple/mobile/App.js) | 43397 | Versionado |
| [Synple/mobile/app.json](../Synple/mobile/app.json) | 2039 | Versionado |
| [Synple/mobile/assets/android-icon-background.png](../Synple/mobile/assets/android-icon-background.png) | 17549 | Versionado |
| [Synple/mobile/assets/android-icon-foreground.png](../Synple/mobile/assets/android-icon-foreground.png) | 78796 | Versionado |
| [Synple/mobile/assets/android-icon-monochrome.png](../Synple/mobile/assets/android-icon-monochrome.png) | 4140 | Versionado |
| [Synple/mobile/assets/favicon.png](../Synple/mobile/assets/favicon.png) | 1129 | Versionado |
| [Synple/mobile/assets/icon.png](../Synple/mobile/assets/icon.png) | 393493 | Versionado |
| [Synple/mobile/assets/splash-icon.png](../Synple/mobile/assets/splash-icon.png) | 17547 | Versionado |
| [Synple/mobile/assets/synple-icon.png](../Synple/mobile/assets/synple-icon.png) | 93254 | Versionado |
| [Synple/mobile/assets/synple-splash.png](../Synple/mobile/assets/synple-splash.png) | 157871 | Versionado |
| [Synple/mobile/CLAUDE.md](../Synple/mobile/CLAUDE.md) | 12 | Versionado |
| [Synple/mobile/eas.json](../Synple/mobile/eas.json) | 343 | Versionado |
| [Synple/mobile/index.js](../Synple/mobile/index.js) | 106 | Versionado |
| [Synple/mobile/LICENSE](../Synple/mobile/LICENSE) | 1127 | Versionado |
| [Synple/mobile/metro.config.js](../Synple/mobile/metro.config.js) | 1655 | Versionado |
| [Synple/mobile/package-lock.json](../Synple/mobile/package-lock.json) | 275611 | Versionado |
| [Synple/mobile/package.json](../Synple/mobile/package.json) | 1808 | Versionado |
| [Synple/mobile/scripts/detect-ip.js](../Synple/mobile/scripts/detect-ip.js) | 1792 | Versionado |
| [Synple/mobile/src/components/ActionPressable.js](../Synple/mobile/src/components/ActionPressable.js) | 715 | Versionado |
| [Synple/mobile/src/components/AppHeader.js](../Synple/mobile/src/components/AppHeader.js) | 863 | Versionado |
| [Synple/mobile/src/components/FormControls.js](../Synple/mobile/src/components/FormControls.js) | 5837 | Versionado |
| [Synple/mobile/src/components/KeyboardScrollView.js](../Synple/mobile/src/components/KeyboardScrollView.js) | 1598 | Versionado |
| [Synple/mobile/src/components/MeetingEditor.js](../Synple/mobile/src/components/MeetingEditor.js) | 4291 | Versionado |
| [Synple/mobile/src/components/MeetingResources.js](../Synple/mobile/src/components/MeetingResources.js) | 5046 | Versionado |
| [Synple/mobile/src/components/NavigationTabs.js](../Synple/mobile/src/components/NavigationTabs.js) | 1910 | Versionado |
| [Synple/mobile/src/constants/data.js](../Synple/mobile/src/constants/data.js) | 1716 | Versionado |
| [Synple/mobile/src/constants/network.json](../Synple/mobile/src/constants/network.json) | 90 | Versionado |
| [Synple/mobile/src/constants/status.js](../Synple/mobile/src/constants/status.js) | 562 | Versionado |
| [Synple/mobile/src/hooks/useSynpleData.js](../Synple/mobile/src/hooks/useSynpleData.js) | 1822 | Versionado |
| [Synple/mobile/src/screens/AdminManagementScreen.js](../Synple/mobile/src/screens/AdminManagementScreen.js) | 3980 | Versionado |
| [Synple/mobile/src/screens/CommissionsScreen.js](../Synple/mobile/src/screens/CommissionsScreen.js) | 12055 | Versionado |
| [Synple/mobile/src/screens/LoginScreen.js](../Synple/mobile/src/screens/LoginScreen.js) | 19075 | Versionado |
| [Synple/mobile/src/screens/ManualScreen.js](../Synple/mobile/src/screens/ManualScreen.js) | 3530 | Versionado |
| [Synple/mobile/src/screens/MeetingParticipationScreen.js](../Synple/mobile/src/screens/MeetingParticipationScreen.js) | 2757 | Versionado |
| [Synple/mobile/src/screens/MeetingsScreen.js](../Synple/mobile/src/screens/MeetingsScreen.js) | 26318 | Versionado |
| [Synple/mobile/src/screens/MyOrganizationScreen.js](../Synple/mobile/src/screens/MyOrganizationScreen.js) | 13339 | Versionado |
| [Synple/mobile/src/screens/OrganizationsScreen.js](../Synple/mobile/src/screens/OrganizationsScreen.js) | 3441 | Versionado |
| [Synple/mobile/src/screens/ProfileScreen.js](../Synple/mobile/src/screens/ProfileScreen.js) | 3388 | Versionado |
| [Synple/mobile/src/screens/SystemScreen.js](../Synple/mobile/src/screens/SystemScreen.js) | 3681 | Versionado |
| [Synple/mobile/src/services/api.js](../Synple/mobile/src/services/api.js) | 27097 | Versionado |
| [Synple/mobile/src/services/cacheSafety.js](../Synple/mobile/src/services/cacheSafety.js) | 470 | Versionado |
| [Synple/mobile/src/services/formatters.js](../Synple/mobile/src/services/formatters.js) | 1106 | Versionado |
| [Synple/mobile/src/services/meetingMinutesPdf.js](../Synple/mobile/src/services/meetingMinutesPdf.js) | 2420 | Versionado |
| [Synple/mobile/src/services/meetings.js](../Synple/mobile/src/services/meetings.js) | 5905 | Versionado |
| [Synple/mobile/src/services/session.js](../Synple/mobile/src/services/session.js) | 2046 | Versionado |
| [Synple/mobile/src/services/storage.js](../Synple/mobile/src/services/storage.js) | 482 | Versionado |
| [Synple/mobile/src/services/validation.js](../Synple/mobile/src/services/validation.js) | 2190 | Versionado |
| [Synple/mobile/src/styles/theme.js](../Synple/mobile/src/styles/theme.js) | 10823 | Versionado |
| [Synple/mobile/test/cacheSafety.test.js](../Synple/mobile/test/cacheSafety.test.js) | 570 | Versionado |
| [Synple/mobile/test/meetingMinutesPdf.test.js](../Synple/mobile/test/meetingMinutesPdf.test.js) | 2593 | Versionado |
| [Synple/mobile/test/meetings.test.js](../Synple/mobile/test/meetings.test.js) | 6500 | Versionado |
| [Synple/mobile/test/session.test.js](../Synple/mobile/test/session.test.js) | 2542 | Versionado |
| [Synple/mobile/test/validation.test.js](../Synple/mobile/test/validation.test.js) | 3790 | Versionado |
| [Synple/package.json](../Synple/package.json) | 792 | Versionado |
| [Synple/README.md](../Synple/README.md) | 645 | Local/novo |
| [Synple/scripts/check-source.cjs](../Synple/scripts/check-source.cjs) | 1566 | Versionado |
| [Synple/scripts/consolidate-documentation.cjs](../Synple/scripts/consolidate-documentation.cjs) | 19893 | Versionado |
| [Synple/scripts/delivery-requirements.cjs](../Synple/scripts/delivery-requirements.cjs) | 6643 | Versionado |
| [Synple/scripts/delivery-uml.cjs](../Synple/scripts/delivery-uml.cjs) | 7605 | Versionado |
| [Synple/scripts/dev-tunnel.js](../Synple/scripts/dev-tunnel.js) | 5496 | Versionado |
| [Synple/scripts/dev.js](../Synple/scripts/dev.js) | 992 | Versionado |
| [Synple/scripts/diagram-locations.json](../Synple/scripts/diagram-locations.json) | 8417 | Local/novo |
| [Synple/scripts/documentation-locations.json](../Synple/scripts/documentation-locations.json) | 1316 | Local/novo |
| [Synple/scripts/documentation-paths.cjs](../Synple/scripts/documentation-paths.cjs) | 1116 | Local/novo |
| [Synple/scripts/generate-class-dictionary.cjs](../Synple/scripts/generate-class-dictionary.cjs) | 17007 | Versionado |
| [Synple/scripts/generate-data-dictionary.cjs](../Synple/scripts/generate-data-dictionary.cjs) | 18105 | Versionado |
| [Synple/scripts/generate-main-spec.cjs](../Synple/scripts/generate-main-spec.cjs) | 58288 | Versionado |
| [Synple/scripts/generate-uml.cjs](../Synple/scripts/generate-uml.cjs) | 24596 | Versionado |
| [Synple/scripts/index-diagrams.cjs](../Synple/scripts/index-diagrams.cjs) | 4722 | Local/novo |
| [Synple/scripts/inventory-project.cjs](../Synple/scripts/inventory-project.cjs) | 4307 | Local/novo |
| [Synple/scripts/organize-diagrams.cjs](../Synple/scripts/organize-diagrams.cjs) | 3413 | Local/novo |
| [Synple/scripts/organize-documentation.cjs](../Synple/scripts/organize-documentation.cjs) | 2195 | Local/novo |
| [Synple/scripts/validate-documentation.cjs](../Synple/scripts/validate-documentation.cjs) | 4547 | Versionado |
| [Synple/synple-backend.tar](../Synple/synple-backend.tar) | 51041280 | Versionado |

## Duplicatas exatas por SHA-256

Arquivos com conteúdo diferente não são considerados duplicatas só porque têm o mesmo nome. Não foi executada nenhuma exclusão. O inventário muda após commit ou novas gerações.
