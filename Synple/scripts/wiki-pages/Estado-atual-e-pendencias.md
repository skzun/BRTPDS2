# Estado atual e pendências

Revisão do código `{{REVISION}}`, em 12/11/2026. Esta página prevalece sobre descrições anteriores das áreas alteradas recentemente. As pendências abaixo foram identificadas por leitura do código; não foram corrigidas nesta atualização documental.

## Reuniões e participantes

A interface foi ampliada para mostrar reuniões aos integrantes de comissão, mas `scopeSnapshot` em `backend/src/services/security.js` ainda seleciona reuniões por convite, coordenação ou propriedade. Portanto, integrar a comissão sem convite não garante que a API entregue a reunião ao app. Isso explica uma lacuna concreta na alteração anterior, mas não comprova a causa específica do caso João sem examinar seu convite persistido e a sessão usada.

A rota de presença admite membro aprovado da organização, enquanto a lista e alguns PDFs usam critérios diferentes. As consultas de lista/PDF de presença partem de `meeting_invitations`; uma presença sem convite pode não entrar nessas consultas. A ata PDF ainda exige gestor ou convite. É necessário unificar a regra acordada de mesma comissão entre sincronização, tela, entrada/saída, arquivos e PDFs, com testes de usuário externo, membro e convidado histórico.

O agendamento permite selecionar convidados da comissão. Não existe fluxo dedicado para adicionar novos convidados a uma reunião já criada. Alterar o horário redefine os convites existentes, sem constituir inclusão de pessoas.

## Datas e dia todo

A sugestão atual é próximo minuto do relógio do aparelho, término uma hora depois. Não é o minuto atual exato. O servidor exige instante futuro para reunião normal. O ajuste Dia todo compara o dia no fuso do servidor; o mobile constrói o período no fuso do aparelho. Validar com servidor UTC e aparelho America/Sao_Paulo, virada de data e intervalo de múltiplos dias. A suíte existente não comprova todos esses casos.

## Administração e botões

O estado `organizationStatusPending` existe, mas está passado a OrganizationsScreen, e não a AdminManagementScreen no código revisado. Assim, a tela administrativa recebe o valor padrão e pode não refletir Processando/desabilitado. O ref reduz duplicidades durante a requisição; não cobre integralmente múltiplas confirmações abertas antes do envio. A apresentação final em tela estreita/fonte ampliada ainda requer teste.

Aprovadas mostram somente Remover porque Revogar foi retirado a pedido do usuário. A exigência original de revogação não deve ser marcada como integralmente concluída. A API aceita APPROVED, PENDING e REJECTED; remoção definitiva não é revogação de aprovação.

## Validação e aceite

Os 79 testes atuais passaram, mas não cobrem todos os problemas acima. A verificação documental confirma links/modelos/colunas, não a semântica de todas as permissões. Google, recebimento real de e-mails, biometria, ícone, teclado, layout, Android/iOS físicos, desempenho e acessibilidade exigem evidências próprias. O roteiro está em [Validação em aparelhos](Validacao-em-Aparelhos).

Ainda faltam a distribuição nominal de requisitos entre integrantes, registros de testes manuais de concorrentes/entrevistas e equivalência com o formulário institucional. A validação pelo professor não foi presumida.
