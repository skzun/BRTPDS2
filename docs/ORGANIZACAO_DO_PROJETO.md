# Onde está cada coisa

Revisão: 12/11/2026. Todos os caminhos abaixo partem da raiz **BRTPDS2**, que contém a pasta `.git`. A pasta **Synple** é o workspace Node do aplicativo, não outro repositório.

```text
BRTPDS2/
├── README.md                    entrada do projeto e comandos atuais
├── iniciar.ps1                  inicializador Windows
├── iniciar_docker.bat           atalho CMD para iniciar.ps1
├── docker-compose.yml          configuração Docker usada pelo inicializador
├── docs/                       documentação central
│   ├── README.md                índice por assunto
│   ├── guias/                  operação, uso, OAuth e e-mail
│   ├── historico/               documentos antigos preservados
│   ├── Diagramas/ENTREGA_DEFINITIVA/fontes/        PlantUML editável
│   └── Diagramas/ENTREGA_DEFINITIVA/renderizados/  SVGs para consulta
└── Synple/
    ├── README.md                entrada para quem abriu só este workspace
    ├── package.json             comandos npm do workspace
    ├── backend/                 servidor Express, SQL e testes
    ├── mobile/                  aplicativo Expo/React Native
    ├── scripts/                 inicialização e ferramentas documentais
    └── docs/                    ponte para a documentação central
```

## Código do servidor

| Caminho | Finalidade |
| --- | --- |
| `Synple/backend/src/server.js` | Monta o Express, middlewares, rotas e inicialização. |
| `Synple/backend/src/routes/auth.js` | Login único, Google, ativação, recuperação e sessões. O papel é lido da conta no servidor. |
| `Synple/backend/src/routes/organizations.js`, `commissions.js`, `users.js` | Organizações, comissões, perfis e administração de contas. |
| `Synple/backend/src/routes/meetings.js` | Reuniões, presença, anexos, votação, atas e relatório. |
| `Synple/backend/src/routes/sync.js`, `system.js`, `health.js` | Sincronização autorizada, informações administrativas e disponibilidade. |
| `Synple/backend/src/services/` | Autenticação/autorização, SMTP e geração de PDFs. |
| `Synple/backend/src/db/connection.js` | Conexão PostgreSQL. |
| `Synple/backend/src/db/schema.sql`, `migrate.js` | Estrutura e migrações idempotentes do banco. Não são backups descartáveis. |
| `Synple/backend/src/db/seed.sql`, `init-db.js` | Preparação explícita de dados de demonstração. |
| `Synple/backend/src/assets/fonts/` | Fontes incorporadas nos PDFs e suas licenças. |
| `Synple/backend/test/` | Testes e fixtures; as suítes de integração usam schemas isolados. |
| `Synple/backend/Dockerfile`, `.dockerignore` | Construção da imagem da API. |

## Código do aplicativo

| Caminho | Finalidade |
| --- | --- |
| `Synple/mobile/index.js`, `App.js` | Entrada, sessão, navegação e integração das telas. |
| `Synple/mobile/src/screens/` | Telas de acesso, organizações, comissões, reuniões, relatório, manual, perfil e administração. |
| `Synple/mobile/src/components/` | Campos, botões, teclado, navegação, editor e recursos das reuniões. |
| `Synple/mobile/src/services/` | Cliente HTTP, sessão, armazenamento, validação, datas/presença e downloads. |
| `Synple/mobile/src/hooks/useSynpleData.js` | Estado e sincronização com a API. |
| `Synple/mobile/src/constants/` | Valores compartilhados e endereço de rede local gerado. |
| `Synple/mobile/src/styles/theme.js` | Tema e estilos. |
| `Synple/mobile/assets/` | Imagens do aplicativo. |
| `Synple/mobile/test/` | Testes das regras utilitárias e serviços. |
| `Synple/mobile/app.json`, `eas.json`, `metro.config.js` | Configuração Expo, builds EAS e bundler. |
| `Synple/mobile/AGENTS.md`, `CLAUDE.md`, `.claude/` | Instruções/configuração de ferramentas de desenvolvimento; permanecem junto ao código a que se aplicam. |

## Ferramentas e comandos

| Caminho | Finalidade |
| --- | --- |
| `Synple/scripts/dev-tunnel.js` | Inicia API/túnel e Expo conforme o fluxo do projeto. |
| `Synple/scripts/dev.js` | Desenvolvimento local. |
| `Synple/mobile/scripts/detect-ip.js` | Detecção de endereço para o modo local. |
| `Synple/scripts/check-source.cjs` | Checagem de referências JavaScript do app. |
| `Synple/scripts/validate-documentation.cjs` | Links, fichas, diagramas e correspondência do dicionário com o DDL. |
| `Synple/scripts/generate-*.cjs` | Geradores de dicionários, especificação e diagramas. Podem sobrescrever documentos; revisar o diff após executar. |
| `Synple/scripts/delivery-requirements.cjs`, `delivery-uml.cjs` | Dados auxiliares dos geradores para a entrega. |
| `Synple/scripts/consolidate-documentation.cjs` | Gerador dos índices consolidados e texto do incremento 2. |
| `Synple/scripts/documentation-locations.json`, `documentation-paths.cjs` | Mapa de realocações e adaptação de links dos templates legados. |
| `Synple/scripts/organize-documentation.cjs` | Migração documental desta organização. Sem `--apply`, só apresenta o plano; não é comando de inicialização. |
| `Synple/scripts/inventory-project.cjs` | Inventário por caminho/tamanho e duplicatas por hash, sem conteúdo de `.env`. |

Execute `npm run dev:tunnel` dentro de **Synple**; execute `iniciar.ps1` dentro de **BRTPDS2**. O procedimento completo está no [guia atual](guias/COMO_RODAR_DOCKER.md). Use o Compose da raiz com o inicializador; a configuração dentro de Synple está preservada para revisão e tem diferenças, portanto não é uma cópia intercambiável.

## Configurações, gerados e dados

- `.env` e `.env.local`: configurações locais nos respectivos componentes. Não foram movidos nem seus valores incluídos no inventário. `.env.example` é o modelo para outro computador.
- `node_modules`: dependências instaladas; podem ser recriadas pelo gerenciador. Há arquivos dessas pastas já versionados, mesmo com `.gitignore`: ver revisão de limpeza.
- `package-lock.json` do **backend** e do **mobile**: necessários para instalações reproduzíveis. O lockfile vazio da raiz é um caso diferente, listado para revisão.
- `.expo`, projetos nativos gerados e bundles: artefatos locais. A listagem individual os omite e registra as pastas omitidas no JSON do inventário.
- `Synple/synple-backend.tar`: imagem Docker exportada, 51.041.280 bytes; mantida onde estava até decisão de retenção.
- `Synple/dump_banco_synple.sql`: cópia SQL do banco, 13.941 bytes; não confundir com `schema.sql` ou `seed.sql`. Não foi restaurada nem inspecionada para expor dados.
- `state/`: pasta local encontrada vazia na revisão; não foi removida.
- `.git`: histórico e metadados do repositório; não remover como limpeza de arquivos.
- O banco em uso fica no volume Docker configurado, não na pasta `docs` nem no arquivo `.tar`. Não executar remoção de volumes para organizar o código.

O [inventário](INVENTARIO_ARQUIVOS.md) lista os arquivos próprios um a um; o [JSON](INVENTARIO_ARQUIVOS.json) permite consultar os mesmos metadados por ferramentas. O índice Git ainda pode mostrar caminhos antigos até que as movimentações sejam adicionadas ao próximo commit.

## Pacote dos diagramas para entrega

Use [ENTREGA_DEFINITIVA](Diagramas/ENTREGA_DEFINITIVA/README.md), com 33 fontes e 33 imagens. Os cinco modelos antigos estão em [VERSOES_ANTERIORES](Diagramas/VERSOES_ANTERIORES/README.md). O comando `node Synple/scripts/index-diagrams.cjs` atualiza o índice e o manifesto depois da revisão dos modelos. As realocações estão registradas em `Synple/scripts/diagram-locations.json`.
