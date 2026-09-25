const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let transporter = null;
let etherealAccount = null;

async function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  if (hasSmtpConfig) {
    const isGmail = (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) ||
                    (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com')) ||
                    process.env.SMTP_SERVICE === 'gmail';

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
        },
      });
      console.log(`📧 [Mailer] Serviço Gmail SMTP configurado para ${process.env.SMTP_USER}`);
      return transporter;
    }

    // Provedor SMTP configurado genérico (Outlook, Resend, SendGrid, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.trim(),
      },
    });
    console.log(`📧 [Mailer] Serviço SMTP configurado com ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
    return transporter;
  }

  // Modo Desenvolvimento / Teste: usa Ethereal Email para gerar preview real na web
  try {
    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    console.log('📧 [Mailer] SMTP não configurado no .env. Utilizando conta de teste Ethereal.');
    return transporter;
  } catch (err) {
    console.warn('⚠️ [Mailer] Não foi possível criar conta Ethereal, usando fallback de console:', err.message);
    return null;
  }
}

/**
 * Envia código de 6 dígitos para o e-mail do usuário
 */
async function sendPasswordResetEmail(toEmail, code) {
  const fromAddress = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"Synple App" <${process.env.SMTP_USER}>` : '"Synple App" <no-reply@synple.com>');
  const subject = `Código de recuperação de senha: ${code} - Synple`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #F8FAFC; border-radius: 14px; border: 1px solid #E2E8F0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 800;">Synple</h1>
        <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Recuperação de Acesso</p>
      </div>

      <div style="background-color: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #E2E8F0; text-align: center;">
        <h2 style="color: #1E293B; font-size: 18px; margin-top: 0;">Código de Verificação</h2>
        <p style="color: #475569; font-size: 14px; line-height: 22px;">
          Você solicitou a redefinição de senha para a conta <strong>${toEmail}</strong>.<br />
          Utilize o código abaixo no aplicativo para definir sua nova senha:
        </p>

        <div style="display: inline-block; margin: 20px auto; padding: 14px 28px; background-color: #EEF2FF; border: 2px dashed #6366F1; border-radius: 10px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338CA;">${code}</span>
        </div>

        <p style="color: #94A3B8; font-size: 12px; margin-top: 14px;">
          ⏰ Este código é válido por <strong>15 minutos</strong>.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 18px;">
        <p>Se você não solicitou esta redefinição, nenhuma ação é necessária. Sua senha permanece a mesma.</p>
        <p style="margin-top: 8px;">© ${new Date().getFullYear()} Synple. Todos os direitos reservados.</p>
      </div>
    </div>
  `;

  const textContent = `Synple - Recuperação de Senha\n\nSeu código de verificação é: ${code}\n\nEste código é válido por 15 minutos.\nSe você não solicitou, ignore esta mensagem.`;

  console.log(`\n======================================================`);
  console.log(`🔑 [Recuperação de Senha] Código para ${toEmail}: ${code}`);
  console.log(`======================================================`);

  try {
    const activeTransporter = await getTransporter();
    if (!activeTransporter) {
      return { success: true, simulated: true, code };
    }

    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🌐 [Ethereal Preview] Visualize o e-mail enviado: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (err) {
    console.error('❌ [Mailer] Erro ao disparar e-mail:', err.message);
    // Em caso de falha no envio SMTP externo, não quebra a requisição do usuário, registra no log
    return { success: false, error: err.message, fallbackCode: code };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
