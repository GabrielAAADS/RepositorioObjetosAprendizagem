const nodemailer = require('nodemailer');

function buildTransport() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });
}

exports.sendFeedback = async (req, res) => {
  try {
    const {
      rating, 
      category, 
      message,
      email,   
      page,    
      extras  
    } = req.body || {};

    const to = process.env.FEEDBACK_TO || 'gabriel.silva.3@academico.ifpb.edu.br';
    const subject = `[ROVA] Feedback (${rating || 's/nota'}) - ${category || 'geral'}`;
    const html = `
      <h2>Feedback do site</h2>
      <p><b>Rating:</b> ${rating || '-'}</p>
      <p><b>Categoria:</b> ${category || '-'}</p>
      <p><b>Mensagem:</b><br/>${(message || '').replace(/\n/g,'<br/>')}</p>
      <p><b>Email do usuário:</b> ${email || '-'}</p>
      <p><b>Página:</b> ${page || '-'}</p>
      <pre style="background:#f5f5f5;padding:8px;border-radius:6px;">
${JSON.stringify(extras || {}, null, 2)}
      </pre>
    `;

    const transporter = buildTransport();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'rova@no-reply',
      to,
      subject,
      html
    });

    const preview = info.message ? info.message.toString() : undefined;

    res.json({ ok: true, preview: process.env.SMTP_HOST ? undefined : preview });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao enviar feedback' });
  }
};
