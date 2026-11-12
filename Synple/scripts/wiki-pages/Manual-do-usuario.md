# Manual do usuário

## Acesso, ativação e recuperação

Use **Entrar** com e-mail/senha ou **Continuar com Google**. O servidor determina o perfil da conta; não há botão separado para login administrativo. No cadastro por e-mail, informe o código de ativação recebido. **Reenviar código** é usado pelo próprio usuário na tela de ativação. Em **Esqueci minha senha**, solicite o código, informe-o e defina nova senha de pelo menos oito caracteres. SMTP e backend devem estar configurados. A senha do Synple não altera a senha da conta Google.

Limites atuais: dez tentativas em dois minutos para login/Google/troca de senha; três em cinco minutos para recuperação/reenvio de ativação; cinco em cinco minutos para reset/verificação de e-mail. Os limites consideram IP e, quando informado, e-mail. São janelas de requisições, não apenas contagem de senhas erradas; aparelhos na mesma rede podem compartilhar o limite de IP.

## Organizações e comissões

O usuário cadastra nome e CNPJ em Minha organização e confirma o envio. O CNPJ tem máscara e validação de quantidade de dígitos; o código não comprova validade cadastral na Receita nem dígitos verificadores. A organização fica Pendente até a decisão do administrador do sistema.

Na Gestão, o administrador pode **Aprovar** ou **Recusar** pendentes e confirmar **Remover**. Organizações aprovadas mostram Remover; o botão Revogar foi retirado por solicitação do usuário. Remoção não equivale a revogação; essa diferença em relação ao requisito original está registrada nas [pendências](Estado-atual-e-pendencias).

O proprietário gerencia pedidos de acesso, convida contas cadastradas por e-mail e transfere a propriedade para um membro aprovado. Ingressar na organização e integrar uma comissão são vínculos diferentes. O proprietário cria a comissão e adiciona integrantes; sua coordenação exerce a presidência das reuniões.

## Reuniões, convites e presença

Na aba Reuniões, selecione a comissão. O proprietário/coordenador pode abrir Nova reunião, preencher título, pauta, início/término e selecionar convidados da comissão. Local e detalhes são opcionais. O início sugerido usa o relógio do aparelho mais um minuto e término uma hora depois; tudo é editável. Perto da meia-noite, a sugestão pode avançar para o dia seguinte.

Reuniões normais exigem início futuro no servidor. Em Dia todo, selecione primeiro e último dia; o mobile envia início à meia-noite e término exclusivo à meia-noite seguinte ao último dia. Hoje é permitido pela validação alterada; servidores e aparelhos em fusos diferentes ainda precisam do teste descrito nas pendências.

O convidado abre o cartão e responde ao convite. A participação deve ocorrer no período da reunião. Há autorregistro com confirmação biométrica local, código temporário e registro pelo gestor. O código de presença é diferente do código de ativação da conta. A aprovação da ata fecha a entrada de novos presentes conforme o fluxo do servidor.

As mudanças para ingresso sem convite não estão uniformes entre a lista, a API e os PDFs. Não interpretar organização/comissão vazia como prova de ausência de convite; verificar conexão, comissão selecionada e [pendências de acesso](Estado-atual-e-pendencias). O fluxo mais bem coberto pelos testes é criar a reunião com convidados explícitos da comissão. O convite de novos participantes após criação não tem uma tela dedicada implementada.

## Arquivos, votação e ata

O gestor anexa até dez arquivos PDF, PNG, JPEG ou TXT de até 5 MB por reunião. A lista de presença em PDF independe da existência de ata. Os downloads exigem acesso autorizado e links temporários.

O gestor abre votação com uma pergunta e de duas a oito opções distintas após existir entrada registrada. Cada presente tem um voto, alterável enquanto aberta. Encerrada, não se pode alterar. A aprovação da ata é outro processo: salvar rascunho, enviar para revisão e obter aprovação unânime dos participantes congelados no envio, incluindo o presidente quando presente. Rejeição requer comentário; nova versão exige nova aprovação. O PDF indica o estado da ata salva.

Meu relatório mostra reuniões com entrada registrada para a própria conta. Perfil contém dados pessoais, senha e tema; ações protegidas podem solicitar biometria. Sistema, exclusivo da administração, consulta informações de processo, host, memória, conexões, uploads e banco. Verificar disponibilidade não reinicia processos. Limpar cache e sair não restaura backup nem apaga o banco.
