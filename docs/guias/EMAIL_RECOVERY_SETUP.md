# Configurar recuperação de senha por e-mail

O envio usa Gmail SMTP, sem custo de serviço para este volume de desenvolvimento. O backend precisa de uma **Senha de app** do Google; não use a senha normal da conta.

1. Na Conta Google que enviará as mensagens, ative a verificação em duas etapas.
2. Gere uma Senha de app para o Synple em [Senhas de app](https://myaccount.google.com/apppasswords). O Google pode não mostrar essa opção em contas com políticas de segurança incompatíveis.
3. No arquivo `backend/.env` (ignorado pelo Git), configure:

   ```dotenv
   SMTP_SERVICE=gmail
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-de-app-de-16-digitos
   EMAIL_FROM="Synple <seu-email@gmail.com>"
   ```

4. Reinicie o backend. A tela **Esqueci minha senha** enviará um código de 6 dígitos ao e-mail da conta. O código expira em 15 minutos e só é armazenado no banco como hash. O app aguarda até 45 segundos para o servidor confirmar o envio; se pedir outro código, use o mais recente.

Redefinir a senha altera apenas a senha de acesso por e-mail do Synple. O vínculo de login Google permanece ativo; entre com Google escolhendo a mesma conta vinculada, sem digitar a nova senha do Synple na tela do Google.

As mesmas variáveis devem ser configuradas no ambiente do servidor que hospeda o backend quando o app for publicado. Configurá-las em `mobile/.env` ou no EAS não funciona, porque quem envia a mensagem é o backend.

O remetente Gmail precisa ter a verificação em duas etapas para gerar Senhas de app. Consulte a [ajuda oficial do Google sobre Senhas de app](https://support.google.com/accounts/answer/185833?hl=pt-BR).
