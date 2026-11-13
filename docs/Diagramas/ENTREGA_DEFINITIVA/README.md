# Diagramas — Entrega definitiva

Pacote vigente selecionado e organizado em 12/11/2026: **34 diagramas**, com fontes PlantUML editáveis e imagens SVG. Use esta pasta na entrega ao professor.

## Revisão de 13/11/2026

Revisados a partir do código, conforme a avaliação de 29/10 (classes e mensagens de sequência devem ser as reais): `uc-incremento-3` (dividido em requisitos do slide e `uc-incremento-3-ajustes`), `classes-incremento-3` e as sequências `seq-ata`, `seq-pdf`, `seq-votacoes`, `seq-relatorio-participacao`, `seq-manual-consulta`, `seq-cadastro`, `seq-login`, `seq-recuperacao`, `seq-convite-org`, `seq-transferencia`, `seq-sincronizacao` e `seq-comando`. Nesses diagramas os participantes são os arquivos/módulos do código e cada mensagem é uma chamada existente (função, rota HTTP ou consulta SQL). As imagens SVG desses diagramas foram geradas localmente a partir das fontes `.puml` (Graphviz para casos de uso e classes; gerador de sequência do projeto para as sequências), por isso o visual difere levemente dos demais. `Synple/scripts/generate-uml.cjs` não sobrescreve essas fontes.

## Critério de seleção

Este é o conjunto completo usado pela especificação atual: cobre os 49 requisitos documentados, inclui os incrementos 2 e 3 e está associado aos dicionários e ao snapshot do DDL. As cinco fontes antigas isoladas não substituem esse conjunto e foram preservadas em [Versões anteriores](../VERSOES_ANTERIORES/README.md). A seleção usa cobertura e correspondência com a documentação/código, não somente a data de modificação do arquivo.

As imagens e fontes foram realocadas sem alterar o conteúdo, com conferência SHA-256. “Entrega definitiva” identifica a versão escolhida para entregar; futuras mudanças de requisitos ou código exigem revisão dos diagramas correspondentes.

## Casos de uso (6)

| Diagrama | Visualizar | Editar |
| --- | --- | --- |
| uc-autenticacao | [SVG](renderizados/uc-autenticacao.svg) | [PlantUML](fontes/uc-autenticacao.puml) |
| uc-incremento-3 | [SVG](renderizados/uc-incremento-3.svg) | [PlantUML](fontes/uc-incremento-3.puml) |
| uc-incremento-3-ajustes | [SVG](renderizados/uc-incremento-3-ajustes.svg) | [PlantUML](fontes/uc-incremento-3-ajustes.puml) |
| uc-operacao | [SVG](renderizados/uc-operacao.svg) | [PlantUML](fontes/uc-operacao.puml) |
| uc-organizacoes | [SVG](renderizados/uc-organizacoes.svg) | [PlantUML](fontes/uc-organizacoes.puml) |
| uc-reunioes | [SVG](renderizados/uc-reunioes.svg) | [PlantUML](fontes/uc-reunioes.puml) |

## Classes e módulos (4)

| Diagrama | Visualizar | Editar |
| --- | --- | --- |
| classes-cadastro | [SVG](renderizados/classes-cadastro.svg) | [PlantUML](fontes/classes-cadastro.puml) |
| classes-incremento-3 | [SVG](renderizados/classes-incremento-3.svg) | [PlantUML](fontes/classes-incremento-3.puml) |
| classes-reunioes | [SVG](renderizados/classes-reunioes.svg) | [PlantUML](fontes/classes-reunioes.puml) |
| classes-servicos | [SVG](renderizados/classes-servicos.svg) | [PlantUML](fontes/classes-servicos.puml) |

## Modelo relacional (4)

| Diagrama | Visualizar | Editar |
| --- | --- | --- |
| relacional-cadastro | [SVG](renderizados/relacional-cadastro.svg) | [PlantUML](fontes/relacional-cadastro.puml) |
| relacional-incremento-3 | [SVG](renderizados/relacional-incremento-3.svg) | [PlantUML](fontes/relacional-incremento-3.puml) |
| relacional-reunioes | [SVG](renderizados/relacional-reunioes.svg) | [PlantUML](fontes/relacional-reunioes.puml) |
| relacional-seguranca | [SVG](renderizados/relacional-seguranca.svg) | [PlantUML](fontes/relacional-seguranca.puml) |

## Sequências (19)

| Diagrama | Visualizar | Editar |
| --- | --- | --- |
| seq-agendamento | [SVG](renderizados/seq-agendamento.svg) | [PlantUML](fontes/seq-agendamento.puml) |
| seq-anexos | [SVG](renderizados/seq-anexos.svg) | [PlantUML](fontes/seq-anexos.puml) |
| seq-ata | [SVG](renderizados/seq-ata.svg) | [PlantUML](fontes/seq-ata.puml) |
| seq-biometria | [SVG](renderizados/seq-biometria.svg) | [PlantUML](fontes/seq-biometria.puml) |
| seq-cadastro | [SVG](renderizados/seq-cadastro.svg) | [PlantUML](fontes/seq-cadastro.puml) |
| seq-comando | [SVG](renderizados/seq-comando.svg) | [PlantUML](fontes/seq-comando.puml) |
| seq-convite-org | [SVG](renderizados/seq-convite-org.svg) | [PlantUML](fontes/seq-convite-org.puml) |
| seq-editar-reuniao | [SVG](renderizados/seq-editar-reuniao.svg) | [PlantUML](fontes/seq-editar-reuniao.puml) |
| seq-login | [SVG](renderizados/seq-login.svg) | [PlantUML](fontes/seq-login.puml) |
| seq-manual-consulta | [SVG](renderizados/seq-manual-consulta.svg) | [PlantUML](fontes/seq-manual-consulta.puml) |
| seq-pdf | [SVG](renderizados/seq-pdf.svg) | [PlantUML](fontes/seq-pdf.puml) |
| seq-presenca-pdf | [SVG](renderizados/seq-presenca-pdf.svg) | [PlantUML](fontes/seq-presenca-pdf.puml) |
| seq-presenca | [SVG](renderizados/seq-presenca.svg) | [PlantUML](fontes/seq-presenca.puml) |
| seq-recuperacao | [SVG](renderizados/seq-recuperacao.svg) | [PlantUML](fontes/seq-recuperacao.puml) |
| seq-relatorio-participacao | [SVG](renderizados/seq-relatorio-participacao.svg) | [PlantUML](fontes/seq-relatorio-participacao.puml) |
| seq-sincronizacao | [SVG](renderizados/seq-sincronizacao.svg) | [PlantUML](fontes/seq-sincronizacao.puml) |
| seq-sistema | [SVG](renderizados/seq-sistema.svg) | [PlantUML](fontes/seq-sistema.puml) |
| seq-transferencia | [SVG](renderizados/seq-transferencia.svg) | [PlantUML](fontes/seq-transferencia.puml) |
| seq-votacoes | [SVG](renderizados/seq-votacoes.svg) | [PlantUML](fontes/seq-votacoes.puml) |

## Implantação (1)

| Diagrama | Visualizar | Editar |
| --- | --- | --- |
| implantacao | [SVG](renderizados/implantacao.svg) | [PlantUML](fontes/implantacao.puml) |

## Documentos que acompanham os diagramas

- [Especificação dos requisitos](../../incremento-1-especificacao-completa.md).
- [Dicionário de classes](../../dicionario-classes.md).
- [Dicionário do banco](../../dicionario-banco-dados.md).
- [Catálogo com imagens incorporadas](../Diagramas_Casos_de_Uso.md).
- [Manifesto de integridade](manifesto.json).

## Manutenção

Na raiz BRTPDS2, execute `node Synple/scripts/validate-documentation.cjs`. Os geradores já apontam para esta pasta; após atualizar fontes e renderizar SVGs, revise os diagramas antes de regenerar o índice/manifesto com `node Synple/scripts/index-diagrams.cjs`. Não substitua este pacote pelas fontes de versões anteriores.
