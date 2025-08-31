const nodemailer = require('nodemailer');

async function buildTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
}

exports.sendFeedback = async (req, res) => {
  try {
    const { rating, category, message, email, page, extras } = req.body || {};
    if (!message || String(message).trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const to = process.env.FEEDBACK_TO || 'gabriel.silva.3@academico.ifpb.edu.br';
    const subject = `[ROVA] Feedback (${rating || 's/nota'}) - ${category || 'geral'}`;

    const safeMsg = String(message).replace(/[<>]/g, c => ({'<':'&lt;','>':'&gt;'}[c]));
    const html = `
      <h2>Feedback do site</h2>
      <p><b>Rating:</b> ${rating || '-'}</p>
      <p><b>Categoria:</b> ${category || '-'}</p>
      <p><b>Página:</b> ${page || '-'}</p>
      <p><b>Email do usuário:</b> ${email ? `<a href="mailto:${email}">${email}</a>` : '-'}</p>
      <p><b>Mensagem:</b><br/>${safeMsg.replace(/\n/g,'<br/>')}</p>
      <hr/>
      <pre style="background:#f5f5f5;padding:8px;border-radius:6px;white-space:pre-wrap">
${JSON.stringify({
  ...extras,
  ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
  referer: req.headers.referer || null,
}, null, 2)}
      </pre>
    `;

    const text = [
      'Feedback do site',
      `Rating: ${rating || '-'}`,
      `Categoria: ${category || '-'}`,
      `Página: ${page || '-'}`,
      `Email do usuário: ${email || '-'}`,
      '',
      'Mensagem:',
      String(message),
      '',
      'Extras:',
      JSON.stringify(extras || {}, null, 2),
    ].join('\n');

    const transporter = await buildTransport();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ROVA" <no-reply@rova>',
      to,
      subject,
      html,
      text,
      replyTo: email || undefined,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    res.json({ ok: true, previewUrl });
  } catch (e) {
    console.error('sendFeedback error:', e);
    res.status(500).json({ error: 'Falha ao enviar feedback' });
  }
};
