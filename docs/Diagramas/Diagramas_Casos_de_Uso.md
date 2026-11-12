# Diagramas do Synple — revisão de 06/11/2026

> Pacote vigente: [Entrega definitiva](ENTREGA_DEFINITIVA/README.md). Modelos antigos preservados em [Versões anteriores](VERSOES_ANTERIORES/README.md). Organização revisada em 12/11/2026.


Notação UML para casos de uso, classes, sequências e implantação. O modelo físico é relacional, com entidades/tabelas, e não é apresentado como UML. Fontes PlantUML versionadas em `ENTREGA_DEFINITIVA/fontes/`; SVGs renderizados localmente em `ENTREGA_DEFINITIVA/renderizados/`. Não dependem de servidor externo para abrir.

Atores estão fora da fronteira Synple. As associações ator/caso de uso são linhas; especializações usam triângulo vazio voltado ao ator geral. Autenticação é pré-condição de operações privadas; não foi inserido `include` de login em todos os casos. Os papéis de proprietário/coordenador são contextuais. Campos que não aparecem nos recortes de classes constam no dicionário físico completo.

[Especificação principal](../incremento-1-especificacao-completa.md) · [Dicionário físico](../dicionario-banco-dados.md) · [Dicionário de classes e operações](../dicionario-classes.md).

## uc-autenticacao

![uc-autenticacao](ENTREGA_DEFINITIVA/renderizados/uc-autenticacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/uc-autenticacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/uc-autenticacao.svg)

## uc-organizacoes

![uc-organizacoes](ENTREGA_DEFINITIVA/renderizados/uc-organizacoes.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/uc-organizacoes.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/uc-organizacoes.svg)

## uc-reunioes

![uc-reunioes](ENTREGA_DEFINITIVA/renderizados/uc-reunioes.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/uc-reunioes.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/uc-reunioes.svg)

## uc-operacao

![uc-operacao](ENTREGA_DEFINITIVA/renderizados/uc-operacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/uc-operacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/uc-operacao.svg)

## classes-cadastro

![classes-cadastro](ENTREGA_DEFINITIVA/renderizados/classes-cadastro.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/classes-cadastro.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/classes-cadastro.svg)

## classes-reunioes

![classes-reunioes](ENTREGA_DEFINITIVA/renderizados/classes-reunioes.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/classes-reunioes.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/classes-reunioes.svg)

## classes-servicos

![classes-servicos](ENTREGA_DEFINITIVA/renderizados/classes-servicos.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/classes-servicos.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/classes-servicos.svg)

## relacional-cadastro

![relacional-cadastro](ENTREGA_DEFINITIVA/renderizados/relacional-cadastro.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/relacional-cadastro.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/relacional-cadastro.svg)

## relacional-reunioes

![relacional-reunioes](ENTREGA_DEFINITIVA/renderizados/relacional-reunioes.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/relacional-reunioes.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/relacional-reunioes.svg)

## relacional-seguranca

![relacional-seguranca](ENTREGA_DEFINITIVA/renderizados/relacional-seguranca.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/relacional-seguranca.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/relacional-seguranca.svg)

## relacional-incremento-3

![relacional-incremento-3](ENTREGA_DEFINITIVA/renderizados/relacional-incremento-3.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/relacional-incremento-3.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/relacional-incremento-3.svg)

## seq-cadastro

![seq-cadastro](ENTREGA_DEFINITIVA/renderizados/seq-cadastro.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-cadastro.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-cadastro.svg)

## seq-login

![seq-login](ENTREGA_DEFINITIVA/renderizados/seq-login.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-login.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-login.svg)

## seq-comando

![seq-comando](ENTREGA_DEFINITIVA/renderizados/seq-comando.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-comando.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-comando.svg)

## seq-recuperacao

![seq-recuperacao](ENTREGA_DEFINITIVA/renderizados/seq-recuperacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-recuperacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-recuperacao.svg)

## seq-sincronizacao

![seq-sincronizacao](ENTREGA_DEFINITIVA/renderizados/seq-sincronizacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-sincronizacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-sincronizacao.svg)

## seq-convite-org

![seq-convite-org](ENTREGA_DEFINITIVA/renderizados/seq-convite-org.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-convite-org.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-convite-org.svg)

## seq-transferencia

![seq-transferencia](ENTREGA_DEFINITIVA/renderizados/seq-transferencia.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-transferencia.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-transferencia.svg)

## seq-agendamento

![seq-agendamento](ENTREGA_DEFINITIVA/renderizados/seq-agendamento.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-agendamento.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-agendamento.svg)

## seq-presenca

![seq-presenca](ENTREGA_DEFINITIVA/renderizados/seq-presenca.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-presenca.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-presenca.svg)

## seq-ata

![seq-ata](ENTREGA_DEFINITIVA/renderizados/seq-ata.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-ata.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-ata.svg)

## seq-pdf

![seq-pdf](ENTREGA_DEFINITIVA/renderizados/seq-pdf.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-pdf.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-pdf.svg)

## seq-biometria

![seq-biometria](ENTREGA_DEFINITIVA/renderizados/seq-biometria.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-biometria.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-biometria.svg)

## seq-sistema

![seq-sistema](ENTREGA_DEFINITIVA/renderizados/seq-sistema.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-sistema.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-sistema.svg)

## implantacao

![implantacao](ENTREGA_DEFINITIVA/renderizados/implantacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/implantacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/implantacao.svg)

## uc-incremento-3

![uc-incremento-3](ENTREGA_DEFINITIVA/renderizados/uc-incremento-3.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/uc-incremento-3.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/uc-incremento-3.svg)

## classes-incremento-3

![classes-incremento-3](ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/classes-incremento-3.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/classes-incremento-3.svg)

## seq-votacoes

![seq-votacoes](ENTREGA_DEFINITIVA/renderizados/seq-votacoes.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-votacoes.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-votacoes.svg)

## seq-relatorio-participacao

![seq-relatorio-participacao](ENTREGA_DEFINITIVA/renderizados/seq-relatorio-participacao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-relatorio-participacao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-relatorio-participacao.svg)

## seq-manual-consulta

![seq-manual-consulta](ENTREGA_DEFINITIVA/renderizados/seq-manual-consulta.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-manual-consulta.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-manual-consulta.svg)

## seq-editar-reuniao

![seq-editar-reuniao](ENTREGA_DEFINITIVA/renderizados/seq-editar-reuniao.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-editar-reuniao.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-editar-reuniao.svg)

## seq-anexos

![seq-anexos](ENTREGA_DEFINITIVA/renderizados/seq-anexos.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-anexos.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-anexos.svg)

## seq-presenca-pdf

![seq-presenca-pdf](ENTREGA_DEFINITIVA/renderizados/seq-presenca-pdf.svg)

[Fonte editável](ENTREGA_DEFINITIVA/fontes/seq-presenca-pdf.puml) · [SVG](ENTREGA_DEFINITIVA/renderizados/seq-presenca-pdf.svg)

## Reprodução

Gerar fontes: `node Synple/scripts/generate-uml.cjs` após gerar o snapshot do DDL. Renderizar com Java e o PlantUML oficial: `java -jar plantuml.jar -tsvg -o ../renderizados docs/Diagramas/ENTREGA_DEFINITIVA/fontes/*.puml`. O JAR não é dependência do app nem foi incluído no repositório. Referências: [UML 2.5.1 — OMG](https://www.omg.org/spec/UML/2.5.1/About-UML), [casos de uso PlantUML](https://plantuml.com/use-case-diagram), [classes PlantUML](https://plantuml.com/class-diagram). Renderização sem erro comprova sintaxe; a conferência de atores, multiplicidades e comportamento exige confrontar o modelo com o código.
