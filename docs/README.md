# Central de documentação — Synple

Organização revisada em 12/11/2026. Esta pasta `BRTPDS2/docs` é o ponto central dos documentos. Código, configurações de execução e arquivos de banco permanecem junto aos componentes que os utilizam.

## Comece aqui

| Preciso de… | Documento |
| --- | --- |
| Iniciar em outro computador | [Como rodar com Docker e túneis](guias/COMO_RODAR_DOCKER.md) e [README do projeto](../README.md) |
| Usar o aplicativo | [Manual do usuário](guias/MANUAL_DO_USUARIO.md) |
| Encontrar um arquivo | [Mapa das pastas](ORGANIZACAO_DO_PROJETO.md) e [inventário completo](INVENTARIO_ARQUIVOS.md) |
| Decidir o que excluir | [Revisão de limpeza — aguardando aprovação](REVISAO_DE_LIMPEZA.md) |
| Conferir a entrega do incremento 3 | [Verificação dos slides e votação](VERIFICACAO_INCREMENTO_3.md), [estado da entrega](ENTREGA_INCREMENTO_3.md) e [testes em aparelhos](VALIDACAO_EM_APARELHOS.md) |

## Configuração e operação

- [Google OAuth e development build](guias/LOGIN_COM_GOOGLE.md).
- [SMTP e recuperação de senha](guias/EMAIL_RECOVERY_SETUP.md).
- [Guia detalhado de uso e inicialização de outubro](guias/GUIA_USO_E_INICIALIZACAO.md): referência complementar; em divergências de inicialização, use o guia Docker atual acima.
- [Contas fictícias de demonstração](usuarios-de-teste.md): só existem após a preparação explícita dos dados de demonstração; não são criadas a cada inicialização.
- [Documentação técnica e contratos](DOCUMENTACAO_SOFTWARE.md).

## Requisitos, modelos e interfaces

**Para entregar os diagramas ao professor: [ENTREGA DEFINITIVA](Diagramas/ENTREGA_DEFINITIVA/README.md).** [Versões anteriores](Diagramas/VERSOES_ANTERIORES/README.md) ficam separadas para consulta histórica.

- [Índice acadêmico do projeto](Documentacao_do_ProjetoSynple.md).
- [Especificação principal e fichas dos requisitos](incremento-1-especificacao-completa.md).
- [Incremento 2](INCREMENTO_2.md) e [complemento de reuniões](incremento-2-reunioes.md).
- [Incremento 3](INCREMENTO_3.md).
- [Catálogo de diagramas](Diagramas/Diagramas_Casos_de_Uso.md): fontes em `Diagramas/ENTREGA_DEFINITIVA/fontes`, imagens em `Diagramas/ENTREGA_DEFINITIVA/renderizados`.
- [Dicionário de classes](dicionario-classes.md) e [dicionário do banco](dicionario-banco-dados.md).
- [Interfaces](INTERFACES.md), [padrões de desenvolvimento](PADROES_DESENVOLVIMENTO.md) e [versões utilizadas](tecnologias-versoes.md).
- [Análise de mercado](Analise_de_Mercado.md).
- Snapshots estruturados: [requisitos](requisitos.snapshot.json) e [modelo físico](modelo-fisico.snapshot.json).

## Revisões e evidências

- [Correções da avaliação](CORRECOES_AVALIACAO.md) e [sua verificação](VERIFICACAO_CORRECOES.md).
- [Verificação do incremento 2](VERIFICACAO_INCREMENTO_2.md).
- [Verificação do incremento 3](VERIFICACAO_INCREMENTO_3.md).
- [Revisão documental](VERIFICACAO_DOCUMENTACAO.md).
- [Comentários do professor de 06/11](REVISAO_COMENTARIOS_PROFESSOR_2026-11-06.md).
- [Relatório de 30/10 e planejamento](RELATORIO_2026-10-30_E_PLANO_INCREMENTO_3.md).

## Histórico preservado

Os documentos abaixo guardam instruções antigas e não são o procedimento atual de execução. Foram realocados, não descartados:

- [Docker antigo](historico/COMO_RODAR_DOCKER_ANTIGO.md).
- [Entrega Docker — versão da raiz](historico/ENTREGA_DOCKER_PROFESSOR_RAIZ.md).
- [Entrega Docker — versão de Synple](historico/ENTREGA_DOCKER_PROFESSOR_ANTIGO.md).
- [Ponto de retomada de 06/11](historico/CONTINUAR_DEPOIS.md).

## Manter a organização

Novos manuais ficam em `docs/guias`; evidências antigas em `docs/historico`; modelos no catálogo de diagramas. Atualize este índice ao adicionar um documento. Não copie o mesmo manual para a raiz e para `Synple`.

Na raiz `BRTPDS2`, valide com `node Synple/scripts/validate-documentation.cjs`. Atualize o inventário com `node Synple/scripts/inventory-project.cjs --write`. Esses comandos não excluem arquivos. A [lista de realocações](../Synple/scripts/documentation-locations.json) registra os caminhos anteriores e atuais.
