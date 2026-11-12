# Manual de uso do Synple

Revisão: 12/11/2026. Para preparar o computador e abrir o aplicativo, consulte [Como rodar](COMO_RODAR_DOCKER.md). Este manual descreve o uso após a abertura do app.

## Acesso

Informe e-mail e senha e toque em **Entrar**, ou use **Continuar com Google**. Não há seleção de administrador na tela de login. O servidor identifica o papel da conta e abre a área administrativa ou as organizações. Criar uma conta comum não concede administração.

No cadastro por e-mail, confirme o código de ativação recebido. Para recuperar a senha, use **Esqueci minha senha** na tela de acesso e informe o código enviado por e-mail. Esses envios dependem do SMTP configurado no servidor. O login Google usa as configurações OAuth e um build nativo compatível.

## Organizações e comissões

Em **Organizações**, procure uma organização e solicite ingresso. Em **Minha organização**, o proprietário cadastra e gerencia sua organização, integrantes e convites conforme suas permissões. Organizações novas aguardam aprovação do administrador do sistema.

O proprietário gerencia comissões e define sua coordenação. O coordenador exerce o papel de presidente nas reuniões. Um usuário comum não ganha essas permissões selecionando uma opção na interface.

## Reuniões e presença

Abra **Reuniões**, selecione a comissão e use **Nova reunião** quando tiver permissão. Informe período, pauta e convidados; uma reunião futura elegível pode ser editada. Ao abrir o cartão, escolha **Presença**, **Arquivos**, **Votações** ou **Ata**.

O convidado responde ao convite e registra entrada e saída no período permitido. A presença pode exigir confirmação biométrica ou o código temporário emitido pelo presidente; o gestor também pode registrar a presença de convidados aceitos. A lista de presença pode ser gerada em PDF.

## Votações

O presidente ou proprietário abre uma pergunta com **2 a 8 opções diferentes** depois de existir ao menos uma entrada registrada na reunião. Quem registrou entrada escolhe uma opção. Trocar a escolha enquanto a votação está aberta atualiza o mesmo voto, sem somar outro voto.

O gestor confirma **Encerrar votação**. Depois disso, não é permitido votar ou trocar a escolha. Atualize os dados para consultar os resultados mais recentes de outros participantes. A votação é independente da aprovação da ata.

## Atas

O gestor escreve e salva o rascunho, depois envia para aprovação. Os presentes registrados no envio — inclusive o presidente, se presente — aprovam ou rejeitam a versão. A aprovação exige unanimidade. Rejeição exige comentário; uma correção cria nova versão e exige nova aprovação. A ata salva pode ser exportada em PDF com seu estado real.

## Relatório, perfil e administração

**Meu relatório** apresenta reuniões em que sua entrada foi registrada, organização, comissão, período previsto, entrada/saída e situação da ata. **Atualizar relatório** consulta novamente o servidor.

No **Perfil**, atualize os dados e preferências disponíveis. Ações protegidas podem pedir confirmação biométrica. A conta administrativa acessa **Gestão** e **Sistema** automaticamente após entrar. Excluir usuário com votos registrados é bloqueado para preservar os resultados.

O **Manual** da navegação também contém instruções locais. Se a API ficar indisponível, confira a conexão e atualize os dados; a interface não deve ser usada como confirmação de uma alteração que o servidor recusou. Para problemas de QR, portas e rede, consulte o [guia de inicialização](COMO_RODAR_DOCKER.md).
