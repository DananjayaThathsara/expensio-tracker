import nodemailer from 'nodemailer';

let transport = null;
if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

export async function sendMail({ to, subject, text }) {
  if (!to?.length) return;
  if (!transport) {
    console.log('[mail:skipped no SMTP] ->', to.join(', '), '|', subject, '|', text);
    return;
  }
  await transport.sendMail({ from: process.env.MAIL_FROM || 'Expensio<no-reply@example.com>', to: to.join(','), subject, text });
}
