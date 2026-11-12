# Arquivos para decisão antes de excluir

Revisão: 12/11/2026. **Nenhum item desta lista foi excluído nem retirado do Git.** Os 18 documentos reorganizados foram movidos com seu conteúdo preservado; isso é diferente de descartar uma versão.

## Decisões propostas

| Grupo | Arquivos/pastas | Evidência | Proposta para aprovação | Efeito e cuidado |
| --- | --- | --- | --- | --- |
| A | `Synple/backend/node_modules/` e `Synple/mobile/node_modules/` | 6.496 arquivos dessas dependências estão no índice Git. | **Retirar apenas do versionamento**, mantendo a instalação local. | Reduz arquivos do repositório. Novos clones precisam instalar as dependências. `.gitignore` sozinho não retira o que já foi versionado. |
| B | `Synple/backend/.env` | Está versionado apesar da regra de ignore. Seus valores não foram copiados para esta documentação. | **Retirar apenas do versionamento**, manter localmente e conservar `.env.example`. | Configurações locais não devem ser distribuídas como configuração da equipe. A retirada futura não apaga versões anteriores do histórico Git. |
| C | `Synple/synple-backend.tar` | Exportação Docker de 51.041.280 bytes, aproximadamente 48,7 MiB; Dockerfile e código continuam presentes. | Decidir se ainda é necessário para entrega offline; se não, autorizar remoção ou arquivamento fora do repositório. | Excluir impede usar esta imagem exportada específica. Reconstruir não garante imagem binariamente idêntica. |
| D | `Synple/dump_banco_synple.sql` | Backup SQL de 13.941 bytes, não é a estrutura/migração oficial. | Manter até confirmar existência de outro backup e necessidade da entrega. | Pode conter dados que não são reproduzidos pelo seed. Não apagar como arquivo temporário. |
| E | `package-lock.json` da raiz BRTPDS2 | `packages: {}` e ausência de `package.json` nessa raiz; workspace npm está em Synple. | Candidato a exclusão após aprovação. | Não inclui os lockfiles de backend/mobile, que devem ficar. |
| F | `docs/historico/` | Guias Docker e nota de retomada antigos, preservados na reorganização. | Manter como histórico, ou autorizar remoção nominal dos documentos dispensáveis. | Há diferenças de conteúdo; não são duplicatas exatas. O guia atual é `docs/guias/COMO_RODAR_DOCKER.md`. |
| G | `docs/Diagramas/VERSOES_ANTERIORES/fontes/` | Cinco diagramas com nomes também existentes em `docs/Diagramas/ENTREGA_DEFINITIVA/fontes`, mas hashes/conteúdos diferentes. | Manter até decidir se os modelos de análise antigos ainda serão usados. | O catálogo atual usa a pasta da raiz. O diagrama de classes antigo é de análise; o novo representa módulos de projeto. Não excluir automaticamente só pelo nome. |
| H | `Synple/docker-compose.yml` | Configuração alternativa com caminhos, montagem de volume e ambiente diferentes do Compose da raiz. | Manter por enquanto; uma futura consolidação precisa migrar os consumidores e avaliar os volumes. | Trocar o diretório/projeto Compose pode selecionar outro volume. Não apagar volumes nem aplicar `down -v`. |
| I | `Synple/iniciar_docker.bat` | Atalho de dentro do workspace que chama `../iniciar.ps1`; o da raiz chama `iniciar.ps1`. | Recomendo manter os dois atalhos curtos. | São pontos de entrada úteis em diretórios diferentes, não cópias concorrentes do inicializador. |
| J | Pastas `.expo` e bundles temporários, `state/` vazio | Artefatos de ambiente ou pasta vazia; não são fontes do sistema. | Limpeza local opcional, após encerrar ferramentas e confirmar o escopo. | Caches serão recriados; builds usados em validação podem deixar de estar disponíveis. Não inclui `.git`, banco ou configurações. |

## Resultado da comparação

A comparação por SHA-256 não encontrou duplicatas exatas entre os arquivos próprios analisados. Foram excluídos da comparação conteúdo de `.env`, dependências, caches, projetos nativos gerados e arquivos acima de 2 MiB. Nomes iguais não são prova de redundância.

Recomendo aprovar primeiro **A e B somente para retirada do Git**, sem apagar do computador. Os demais grupos exigem sua decisão de retenção. Nenhuma dessas operações foi executada nesta organização.

## Arquivos a preservar

Manter código de `backend/src` e `mobile/src`, testes, `schema.sql`, migrações, seeds de demonstração, lockfiles dos componentes, exemplos de ambiente, fontes/licenças de PDF, assets, configurações Expo/EAS, instruções de ferramentas e documentos exigidos pelo professor. Snapshots JSON e SVGs renderizados têm finalidades distintas das fontes; não são descartáveis por parecerem repetidos.

Consulte [o mapa](ORGANIZACAO_DO_PROJETO.md), [o inventário](INVENTARIO_ARQUIVOS.md) e [as realocações](../Synple/scripts/documentation-locations.json) antes de decidir.
