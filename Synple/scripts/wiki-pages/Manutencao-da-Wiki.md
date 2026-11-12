# Manutenção da Wiki

Os documentos técnicos centrais permanecem em `BRTPDS2/docs`. `Synple/scripts/wiki-pages` contém as páginas editoriais da publicação. `Synple/scripts/export-wiki.cjs` converte os links relativos dos documentos selecionados para páginas da Wiki ou arquivos do repositório fixados na revisão informada. Não copia `.env`, tokens, dependências ou keystores.

Procedimento para a equipe, em Synple:

```powershell
git clone https://github.com/skzun/BRTPDS2.wiki.git CAMINHO_DA_COPIA_WIKI
node scripts/export-wiki.cjs CAMINHO_DA_COPIA_WIKI SHA_COMPLETO_DO_CODIGO
```

Revisar o diff na cópia da Wiki, conferir as pendências, datas e evidências. O exportador confere a existência de destinos locais e páginas internas e gera `fontes-documentais.json` com hashes dos documentos. Não executa commit nem push. Publicar somente após revisão; manter SHA e resultados alinhados à versão efetivamente conferida.

As páginas históricas do repositório preservam resultados antigos. Na Wiki, [Estado atual](Estado-atual-e-pendencias) concentra as divergências recentes. Atualizar essa página e os relatórios quando as correções forem implementadas/testadas. Nenhuma limpeza de `.env`, `node_modules` ou dados de usuário faz parte da publicação documental.
