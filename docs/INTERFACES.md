# Contrato das interfaces do Synple

As telas implementadas em `mobile/src/screens` são a referência executável. Este documento descreve estrutura e estados para revisão; não representa teste com usuários.

| Tela | Estrutura principal | Estados obrigatórios |
| --- | --- | --- |
| Login | Marca, e-mail/senha, Google, recuperação, acesso a código de ativação | Campo inválido, enviando, credencial recusada, API indisponível, conta pendente |
| Cadastro/ativação | Nome, e-mail, telefone, senha/confirmar; código e reenvio em etapa separada | E-mail duplicado, senha curta, SMTP indisponível, código inválido/expirado, ativado |
| Organizações | Pesquisa, cartões com nome/CNPJ/situação e ação contextual | Lista vazia, solicitação pendente, convite recebido com aceitar/recusar, membro aprovado |
| Minha organização | Dados básicos, membros, convite por e-mail, transferência de propriedade | Sem permissão, conflito de CNPJ/nome, alvo não cadastrado, transferência confirmada |
| Comissões | Seleção de comissão, cadastro/edição, situação e integrantes | Criando, indisponível, histórico preservado, um coordenador, transferência de coordenação |
| Reuniões | Agendamento, convite, presença, ata, aprovação e PDF | Sem convite, aceito/recusado, presente/ausente, rascunho/revisão/aprovado, conflito de versão |
| Perfil | Nome, e-mail verificado somente leitura, telefone, senha e tema | Biometria pendente/cancelada, erro de rede, senha incorreta, confirmação do servidor |
| Sistema | Data da instalação, estado real, versões, uptime, latência, contadores, limpar cache | Acesso exclusivo de administrador, falha de consulta, banco indisponível |

Fluxo de cadastro: Cadastro → envio de e-mail → Código de ativação → Login. Fluxo Google: development build → provedor → validação no backend → sessão. Fluxo de convite: proprietário → conta ativa → destinatário aceita/recusa → vínculo aprovado/rejeitado.

Claro/escuro usam `ThemeContext` e `getThemeStyles`. O login acompanha o sistema operacional, e o perfil autenticado usa a preferência persistida. A área rolável e o teclado devem manter o campo focado visível. Evitar acrescentar painéis e tabelas densas a telas pequenas; apresentar uma ação principal por contexto.

As evidências visuais finais devem registrar os estados acima em Android e iOS. A avaliação de aparência e facilidade de uso depende da execução com pessoas, não apenas da existência de componentes React Native.
