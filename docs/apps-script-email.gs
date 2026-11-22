// Script do Google Apps Script que envia os e-mails do Cidade Ativa pelo Gmail.
// 1) Em script.google.com, crie um projeto e cole este código.
// 2) Troque SEGREDO por um texto longo e aleatório (o mesmo vai em EMAIL_WEBHOOK_SEGREDO no Render).
// 3) Implantar > Nova implantação > App da Web:
//    "Executar como": Eu  |  "Quem pode acessar": Qualquer pessoa.
// 4) Copie a URL gerada (termina em /exec) para EMAIL_WEBHOOK_URL no Render.

const SEGREDO = 'TROQUE-POR-UM-TEXTO-LONGO-E-ALEATORIO';

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    if (dados.segredo !== SEGREDO) {
      return resposta({ ok: false, erro: 'não autorizado' });
    }

    MailApp.sendEmail({
      to: dados.para,
      subject: dados.assunto,
      htmlBody: dados.html,
      name: 'Cidade Ativa'
    });

    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  }
}

function resposta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
