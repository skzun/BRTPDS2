# Verificação do incremento 2

Data: 22/10/2026. Requisitos e roteiro manual: [INCREMENTO_2.md](INCREMENTO_2.md).

## Resultado automatizado

Na raiz do repositório, `npm test` terminou com sucesso após a extensão de PDF: **48 testes aprovados**, sendo 22 do mobile e 26 do backend, sem falhas ou testes ignorados.

| Área | O que foi verificado |
| --- | --- |
| Agendamento | Datas válidas/inválidas, período, campos, permissão do presidente/proprietário, deduplicação e convidados restritos à comissão. |
| Atomicidade | Pedido inválido não deixa reunião ou convites parcialmente criados. |
| Convites/presença | Aceite/recusa; entrada exige aceite; saída exige entrada; horários e lista de convidados/presentes/ausentes. |
| Atas | Gestor autorizado; rascunho; submissão exige presentes; correção abre nova versão e invalida decisões. |
| Aprovação | Unanimidade, incluindo presidente presente; conjunto de aprovadores fixado no envio; votos concorrentes; voto de versão antiga negado. |
| Integrantes | Inclusão, alteração de cargo e remoção persistidas no PostgreSQL; ex-integrante mantém acesso aos convites históricos sem conservar o cargo de gestor. |
| Preservação | Exclusão de conta requerida por ata em revisão/aprovada é bloqueada; corrida entre submissão e exclusão não deixa aprovador inexistente. |
| Migração | Aplicação repetida do esquema preserva usuários e senhas, sem inserir contas de demonstração. |
| PDF | HEAD valida acesso/versão sem gerar o arquivo; GET retorna PDF completo nos quatro estados; acesso histórico e conflitos; liberação do lock antes da geração; resposta JSON em falha; fontes incorporadas e conteúdo de 50 mil caracteres. |
| Abertura do PDF | URL da API com versão/fuso codificados, checagem HEAD/MIME, tratamento de conflito, acesso negado, servidor antigo e timeout antes de abrir o navegador. |

Os novos testes HTTP/SQL de reuniões e migração utilizam schemas temporários exclusivos do PostgreSQL, removidos ao terminar. A suíte legada continua consultando a conexão de desenvolvimento e cria/remove somente seus usuários temporários de teste.

## Compilação e API local

O comando abaixo produziu os bundles Hermes de Android e iOS e o bundle Web sem erros, com saída em diretório temporário fora do repositório:

```powershell
Set-Location mobile
npx expo export --platform android --platform ios --platform web --output-dir "$env:TEMP\synple-ata-pdf-export-check"
```

Essa exportação valida a geração do JavaScript para as duas plataformas; não gera um APK/IPA assinado nem comprova execução em aparelho físico.

A API local foi reiniciada com o código atualizado. `/api/health` respondeu `OK`, com PostgreSQL `ONLINE`. `/api/sync` respondeu com as cinco coleções do módulo: `meetings`, `meetingInvitations`, `meetingAttendance`, `meetingMinutes` e `meetingMinutesApprovals`.

O esquema foi aplicado ao banco de desenvolvimento existente. Uma comparação antes/depois confirmou a preservação de IDs, hashes de senha e vínculos Google dos usuários existentes. A aplicação do esquema não executou `init-db` nem seeds.

## Inspeção dos PDFs

Foram geradas duas fixtures fictícias com o serviço real: uma ata aprovada de duas páginas e um rascunho extenso de quatro páginas. Todas as páginas foram renderizadas para imagens e conferidas visualmente; acentos, aviso de documento não final, cabeçalhos, rodapés e numeração foram verificados. A extração do texto confirmou os acentos e a numeração em todas as páginas; não foram encontrados caracteres fora das margens. Uma falha inicial que criava páginas extras no rodapé foi corrigida e coberta por teste.

Os PDFs são gerados em memória na API com `pdfkit` e fontes Noto Sans incorporadas. As fixtures e imagens de inspeção ficaram em diretório temporário e não contêm dados reais de reuniões. Não houve geração de APK/IPA novo; a funcionalidade utiliza o navegador já disponível no dispositivo.

## Verificações que ainda exigem execução manual

- Executar os cenários de aceitação do [incremento](INCREMENTO_2.md#12-critérios-e-roteiro-de-aceitação) em Android e iOS físicos, incluindo compartilhamento, teclado, troca de contas e sincronização entre dois aparelhos.
- Executar CA17–CA20 da extensão de PDF: salvar/baixar pelo navegador em Android, iOS e computador; conferir a ata em cada situação, o aviso de documento não final, texto longo com acentos, versão, fuso e decisões. Registrar navegador/aparelho e evidências. A geração automatizada do arquivo, quando registrada, não substitui esse teste do download no dispositivo.
- Confirmar a atualização de uma instalação já existente: `npm --prefix backend install` e reinício da API, ou `docker compose up -d --build`, seguidos do recarregamento do JavaScript no Expo/Metro. A opção de PDF não requer novo módulo nativo nem outro APK. Consulte [Gerar ata em PDF](../GUIA_USO_E_INICIALIZACAO.md#gerar-ata-em-pdf).
- Registrar as evidências da equipe e os responsáveis por requisito.
- Conferir o formulário institucional exigido pelo professor: o arquivo original do formulário não acompanhou a apresentação. As fichas existentes usam um modelo uniforme documentado.
- Validar com a comunidade os dados adicionais de reunião; nenhum levantamento foi inventado.

O limite de autenticação do backend herdado do projeto está descrito no documento principal: as rotas ainda recebem o identificador do ator do cliente. A sessão de servidor e a filtragem da sincronização por identidade continuam necessárias antes de uso público em produção.
