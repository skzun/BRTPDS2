# Diagramas do Synple — revisão de 06/11/2026

Notação UML para casos de uso, classes, sequências e implantação. O modelo físico é relacional, com entidades/tabelas, e não é apresentado como UML. Fontes PlantUML versionadas em `fontes/`; SVGs renderizados localmente em `renderizados/`. Não dependem de servidor externo para abrir.

Atores estão fora da fronteira Synple. As associações ator/caso de uso são linhas; especializações usam triângulo vazio voltado ao ator geral. Autenticação é pré-condição de operações privadas; não foi inserido `include` de login em todos os casos. Os papéis de proprietário/coordenador são contextuais. Campos que não aparecem nos recortes de classes constam no dicionário físico completo.

[Especificação principal](../incremento-1-especificacao-completa.md) · [Dicionário físico](../dicionario-banco-dados.md) · [Dicionário de classes e operações](../dicionario-classes.md).

## Incremento 3

Fontes PlantUML editáveis adicionadas para os casos de uso, modelo de classes, modelo relacional, votação e relatório individual. SVGs renderizados dessas fontes ainda não foram gerados.

- [Casos de uso](fontes/uc-incremento-3.puml)
- [Modelo de classes](fontes/classes-incremento-3.puml)
- [Modelo relacional](fontes/relacional-incremento-3.puml)
- [Sequência de votação](fontes/seq-votacoes.puml)
- [Sequência do relatório individual](fontes/seq-relatorio-participacao.puml)
- [Sequência do manual digital](fontes/seq-manual-consulta.puml)

## uc-autenticacao

![uc-autenticacao](renderizados/uc-autenticacao.svg)

[Fonte editável](fontes/uc-autenticacao.puml) · [SVG](renderizados/uc-autenticacao.svg)

## uc-organizacoes

![uc-organizacoes](renderizados/uc-organizacoes.svg)

[Fonte editável](fontes/uc-organizacoes.puml) · [SVG](renderizados/uc-organizacoes.svg)

## uc-reunioes

![uc-reunioes](renderizados/uc-reunioes.svg)

[Fonte editável](fontes/uc-reunioes.puml) · [SVG](renderizados/uc-reunioes.svg)

## uc-operacao

![uc-operacao](renderizados/uc-operacao.svg)

[Fonte editável](fontes/uc-operacao.puml) · [SVG](renderizados/uc-operacao.svg)

## classes-cadastro

![classes-cadastro](renderizados/classes-cadastro.svg)

[Fonte editável](fontes/classes-cadastro.puml) · [SVG](renderizados/classes-cadastro.svg)

## classes-reunioes

![classes-reunioes](renderizados/classes-reunioes.svg)

[Fonte editável](fontes/classes-reunioes.puml) · [SVG](renderizados/classes-reunioes.svg)

## classes-servicos

![classes-servicos](renderizados/classes-servicos.svg)

[Fonte editável](fontes/classes-servicos.puml) · [SVG](renderizados/classes-servicos.svg)

## relacional-cadastro

![relacional-cadastro](renderizados/relacional-cadastro.svg)

[Fonte editável](fontes/relacional-cadastro.puml) · [SVG](renderizados/relacional-cadastro.svg)

## relacional-reunioes

![relacional-reunioes](renderizados/relacional-reunioes.svg)

[Fonte editável](fontes/relacional-reunioes.puml) · [SVG](renderizados/relacional-reunioes.svg)

## relacional-seguranca

![relacional-seguranca](renderizados/relacional-seguranca.svg)

[Fonte editável](fontes/relacional-seguranca.puml) · [SVG](renderizados/relacional-seguranca.svg)

## seq-cadastro

![seq-cadastro](renderizados/seq-cadastro.svg)

[Fonte editável](fontes/seq-cadastro.puml) · [SVG](renderizados/seq-cadastro.svg)

## seq-login

![seq-login](renderizados/seq-login.svg)

[Fonte editável](fontes/seq-login.puml) · [SVG](renderizados/seq-login.svg)

## seq-comando

![seq-comando](renderizados/seq-comando.svg)

[Fonte editável](fontes/seq-comando.puml) · [SVG](renderizados/seq-comando.svg)

## seq-recuperacao

![seq-recuperacao](renderizados/seq-recuperacao.svg)

[Fonte editável](fontes/seq-recuperacao.puml) · [SVG](renderizados/seq-recuperacao.svg)

## seq-sincronizacao

![seq-sincronizacao](renderizados/seq-sincronizacao.svg)

[Fonte editável](fontes/seq-sincronizacao.puml) · [SVG](renderizados/seq-sincronizacao.svg)

## seq-convite-org

![seq-convite-org](renderizados/seq-convite-org.svg)

[Fonte editável](fontes/seq-convite-org.puml) · [SVG](renderizados/seq-convite-org.svg)

## seq-transferencia

![seq-transferencia](renderizados/seq-transferencia.svg)

[Fonte editável](fontes/seq-transferencia.puml) · [SVG](renderizados/seq-transferencia.svg)

## seq-agendamento

![seq-agendamento](renderizados/seq-agendamento.svg)

[Fonte editável](fontes/seq-agendamento.puml) · [SVG](renderizados/seq-agendamento.svg)

## seq-presenca

![seq-presenca](renderizados/seq-presenca.svg)

[Fonte editável](fontes/seq-presenca.puml) · [SVG](renderizados/seq-presenca.svg)

## seq-ata

![seq-ata](renderizados/seq-ata.svg)

[Fonte editável](fontes/seq-ata.puml) · [SVG](renderizados/seq-ata.svg)

## seq-pdf

![seq-pdf](renderizados/seq-pdf.svg)

[Fonte editável](fontes/seq-pdf.puml) · [SVG](renderizados/seq-pdf.svg)

## seq-biometria

![seq-biometria](renderizados/seq-biometria.svg)

[Fonte editável](fontes/seq-biometria.puml) · [SVG](renderizados/seq-biometria.svg)

## seq-sistema

![seq-sistema](renderizados/seq-sistema.svg)

[Fonte editável](fontes/seq-sistema.puml) · [SVG](renderizados/seq-sistema.svg)

## implantacao

![implantacao](renderizados/implantacao.svg)

[Fonte editável](fontes/implantacao.puml) · [SVG](renderizados/implantacao.svg)

## Reprodução

Gerar fontes: `node Synple/scripts/generate-uml.cjs` após gerar o snapshot do DDL. Renderizar com Java e o PlantUML oficial: `java -jar plantuml.jar -tsvg -o ../renderizados docs/Diagramas/fontes/*.puml`. O JAR não é dependência do app nem foi incluído no repositório. Referências: [UML 2.5.1 — OMG](https://www.omg.org/spec/UML/2.5.1/About-UML), [casos de uso PlantUML](https://plantuml.com/use-case-diagram), [classes PlantUML](https://plantuml.com/class-diagram). Renderização sem erro comprova sintaxe; a conferência de atores, multiplicidades e comportamento exige confrontar o modelo com o código.
