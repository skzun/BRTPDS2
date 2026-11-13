# Contas de demonstração

Os seeds são opcionais, destinados a uma instalação de demonstração. Iniciar normalmente aplica migrações, sem recriar usuários nem redefinir suas senhas. Não executar seed para recuperar uma conta pessoal.

Em uma instalação de demonstração nova, na raiz BRTPDS2, execute `docker compose exec backend npm run init-db` para preparar as contas. O script contém as credenciais fictícias utilizadas pela equipe; consulte o [seed de demonstração]({{SOURCE}}Synple/backend/src/db/init-db.js). Esses dados não são credenciais de pessoas reais.

| Conta fictícia | Senha inicial de demonstração | Papel |
| --- | --- | --- |
| `admin@synple.com` | `Admin@123` | Administrador do sistema: aprova organizações e consulta Sistema. Não recebe automaticamente a presidência de todas as reuniões. |
| `marina@synple.com` | `Marina@123` | Usuária; gestão depende de propriedade da organização e coordenação da comissão. |
| `joao@synple.com` | `Joao@123` | Usuário; consulta e participação dependem dos vínculos e convites persistidos. |

As senhas diferenciam maiúsculas e minúsculas. São os valores iniciais definidos no seed para contas novas. Se uma senha já foi alterada, use a senha atual: executar o seed novamente não redefine a senha de contas existentes.

Roteiro: cadastrar organização como usuário, aprovar como administrador, adicionar integrante à comissão, agendar reunião e selecionar explicitamente o convidado. Entrar com a segunda conta, atualizar reuniões, selecionar a comissão, aceitar o convite e registrar presença no horário. Depois testar votação, ata e relatório. Registrar versão do APK, identidades fictícias, passos e resultado em [Validação em aparelhos](Validacao-em-Aparelhos).

Recuperação envia código por e-mail quando SMTP está configurado; não simula link. As integrações Google/SMTP devem ser testadas com contas autorizadas apropriadas, não presumidas a partir de e-mails fictícios `@synple.com`.
