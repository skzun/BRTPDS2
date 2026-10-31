# Verificação da revisão documental — 30/10/2026

## Escopo da revisão

A especificação principal foi substituída integralmente para refletir as telas, funções, rotas, middleware de sessão/autorização e DDL do checkout atual. Os índices principais e o módulo de reuniões apontam para os mesmos contratos, sem manter um segundo formulário divergente. Não houve alteração de comportamento do aplicativo nesta etapa documental.

Base Git observada: `871a739fd289e3be68514ea4734da2338284e939`, com alterações locais não commitadas. Esse identificador é a base do checkout, não um commit publicado contendo as correções. O snapshot físico também registra SHA-256 do DDL, conferido pelo validador para detectar desatualização.

## Artefatos produzidos e conferência

| Artefato | Procedimento | Resultado |
| --- | --- | --- |
| Dicionário físico | Aplicar schema.sql com migrateSchema em schema temporário PostgreSQL; consultar catálogo de colunas, constraints e índices; remover schema temporário em finally | 15 tabelas, 99 colunas, 53 restrições e 39 índices inventariados, sem consultar/apagar dados pessoais da instalação |
| Versões | Ler package.json e package-lock.json de mobile/backend | Todas as dependências diretas com faixa declarada e versão resolvida; tags flutuantes/runtime/SO identificados separadamente |
| Classes/operações | Mapear conceitos ao dicionário físico; analisar exports JS/CommonJS e parâmetros com parser Babel | 15 modelos de dados e 60 operações exportadas documentadas com retorno/efeitos; sem declarar classes JavaScript inexistentes |
| UML/modelo relacional | Fontes PlantUML geradas e renderizadas localmente em SVG | 24 diagramas: quatro casos de uso, três classes/projeto, três relacionais, treze sequências e uma implantação |
| Renderizador | PlantUML oficial executado com Java21 | PlantUML1.2026.9, publicado em17/10/2026; layout Smetana, sem envio dos diagramas a servidor externo |
| Inspeção visual | PNGs locais dos diagramas, amostragem de casos de uso, classes, relacional e sequência | Legibilidade e distinção de notações conferidas; erro inicial de atributos VARCHAR interpretados como métodos foi corrigido com marcação explícita de campos |
| Requisitos | Confrontar funções/telas e rotas; preservar IDs e separar funcionalidades de qualidade | 38 fichas RF com tela/gatilho, pré-condição, fluxo, exceções, dados, contrato e sequência; 17 RNFs com critério/condições/evidência |
| Referências internas | Validador documental: arquivos, fragmentos, cobertura dos RFs em casos de uso, SVGs e inventário de colunas/exports | Executar node Synple/scripts/validate-documentation.cjs; saída do comando determina aprovação |

Renderizar sem erro valida sintaxe, mas não certifica sozinho semântica UML. A revisão também conferiu atores externos/fronteira, associações, especializações de papel, multiplicidades, distinção entre domínio/módulos/tabelas e correspondência dos fluxos com o código.

## Evidências de software preexistentes

O [relatório da revisão de código](../Synple/docs/VERIFICACAO_CORRECOES.md) registra35 testes backend,23 mobile, exportação Android/iOS/Web e migração. Esses resultados pertencem àquela execução; não foram apresentados como nova bateria de testes nesta revisão de Markdown/diagramas. A geração de diagramas e o parser de documentos não validam funcionamento de um APK.

## Pendências e limites

- Não foram executados testes novos em celulares, login Google/biometria reais, envio real de e-mail, medição de desempenho ou contraste/leitor de tela em dispositivo.
- A documentação registra divergências de implementação ainda observadas: mínimo local de senha na recuperação, validação de e-mail nesse fluxo, domínios sem CHECK, nome de comissão sem UNIQUE, revogação organizacional sem remoção automática de toda a equipe e diferenças de situação entre interface/rotas.
- Não foram inventadas entrevistas, aprovação da comunidade, formulário institucional ou avaliação manual de concorrentes. O modelo institucional deve ser aplicado quando fornecido pelo professor.
- Fontes UML e scripts de geração são versionáveis; JAR e previews locais ficam em .verification-build, ignorado pelo Git. O snapshot do catálogo não contém dados de usuários.

## Como reproduzir

1. Com PostgreSQL configurado: node Synple/scripts/generate-data-dictionary.cjs.
2. node Synple/scripts/generate-class-dictionary.cjs.
3. node Synple/scripts/generate-main-spec.cjs.
4. node Synple/scripts/generate-uml.cjs.
5. Renderizar fontes com PlantUML: java -jar plantuml.jar -charset UTF-8 -tsvg -o ../renderizados "docs/Diagramas/fontes/*.puml".
6. node Synple/scripts/validate-documentation.cjs.

Alterar código/DDL exige regenerar e revisar contratos; o conteúdo narrativo é explicitamente mantido no gerador da especificação. A geração não substitui revisão humana das regras e novas evidências de execução.
