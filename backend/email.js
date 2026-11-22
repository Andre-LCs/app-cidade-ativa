// Envio de e-mail por HTTPS (o plano gratuito do Render bloqueia as portas SMTP).
// Usa um relay no Google Apps Script, que envia pelo Gmail do grupo
// (código em docs/apps-script-email.gs).
// Variáveis de ambiente: EMAIL_WEBHOOK_URL e EMAIL_WEBHOOK_SEGREDO.

async function enviarPeloWebhook({ para, assunto, html }) {
  const resposta = await fetch(process.env.EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segredo: process.env.EMAIL_WEBHOOK_SEGREDO,
      para,
      assunto,
      html
    }),
    redirect: 'follow',
    signal: AbortSignal.timeout(20000)
  });

  const texto = await resposta.text();
  let dados = null;

  try {
    dados = JSON.parse(texto);
  } catch (_) {
    // resposta que não é JSON (por exemplo, página de erro do Google)
  }

  if (!resposta.ok || !dados || dados.ok !== true) {
    throw new Error(`Relay de e-mail respondeu ${resposta.status}: ${texto.slice(0, 200)}`);
  }
}

async function enviarEmail(mensagem) {
  if (!process.env.EMAIL_WEBHOOK_URL || !process.env.EMAIL_WEBHOOK_SEGREDO) {
    throw new Error('envio de e-mail não configurado (EMAIL_WEBHOOK_URL e EMAIL_WEBHOOK_SEGREDO)');
  }

  return enviarPeloWebhook(mensagem);
}

module.exports = { enviarEmail };
