const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[AVISO] SMTP não configurado — notificações por email não serão enviadas. Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env');
    }
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function notifyNewLead(data) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!to) return false;

  try {
    await transporter.sendMail({
      from: `"M. Oliveira Site" <${process.env.SMTP_USER}>`,
      to,
      subject: `Novo lead: ${data.name} - ${data.company}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f4fa;margin:0;padding:0">
          <table style="width:100%;max-width:560px;margin:0 auto">
            <tr><td style="padding:32px 0 8px">
              <h1 style="font-size:18px;font-weight:700;color:#0a1628;margin:0">M. Oliveira</h1>
              <span style="font-size:12px;color:#64748b">Segurança do Trabalho</span>
            </td></tr>
            <tr><td style="background:white;border-radius:12px;padding:28px 32px;border:1px solid #e2e8f0">
              <h2 style="font-size:16px;font-weight:700;color:#0a1628;margin:0 0 4px">Nova solicitação de orçamento</h2>
              <p style="font-size:13px;color:#64748b;margin:0 0 24px">Recebida em ${new Date().toLocaleString('pt-BR')}</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;width:100px;font-weight:600">Nome</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0a1628">${data.name}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600">Empresa</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0a1628">${data.company}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600">WhatsApp</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0a1628"><a href="https://wa.me/55${data.phone.replace(/\D/g,'')}" style="color:#10b981;text-decoration:none;font-weight:600">${data.phone}</a></td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600">Email</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0a1628">${data.email || '-'}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600">Serviço</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0a1628">${data.service}</td></tr>
                ${data.message ? '<tr><td style="padding:10px 0;color:#64748b;font-weight:600;vertical-align:top">Mensagem</td><td style="padding:10px 0;color:#0a1628;line-height:1.5;white-space:pre-wrap;word-break:break-word">' + data.message + '</td></tr>' : ''}
              </table>
              <p style="margin:24px 0 0;text-align:center"><a href="${process.env.DOMAIN ? 'https://' + process.env.DOMAIN : 'http://localhost:' + (process.env.PORT || 3001)}/admin/submissions" style="display:inline-block;padding:10px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Ver no painel →</a></p>
            </td></tr>
            <tr><td style="padding:16px 0 32px;text-align:center;font-size:11px;color:#94a3b8">
              Enviado automaticamente pelo site M. Oliveira Segurança do Trabalho
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    return true;
  } catch (e) {
    console.error('Erro ao enviar email de notificação:', e.message);
    return false;
  }
}

module.exports = { notifyNewLead };
