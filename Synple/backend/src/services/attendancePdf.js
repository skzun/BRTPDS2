const PDFDocument = require('pdfkit');
const path = require('node:path');

function generateAttendancePdf({ meeting, attendance }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', b => chunks.push(b));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      doc.font(path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf'));
      const date = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não registrada';
      doc.fontSize(20).text('Synple — Lista de presença');
      doc.moveDown().fontSize(12).text(meeting.title);
      doc.text(`${meeting.organizationName} / ${meeting.commissionName}`);
      doc.fontSize(10).text(`Início: ${date(meeting.startsAt)} · Término: ${date(meeting.endsAt)}`);
      doc.text('Horários no fuso America/Sao_Paulo. Sem assinatura digital.');
      doc.moveDown().text(`Presentes: ${attendance.filter(row => row.enteredAt).length} de ${attendance.length} convidados`);
      const invitationLabels = { ACCEPTED:'Aceito', INVITED:'Aguardando resposta', DECLINED:'Recusado' };
      for (const row of attendance) {
        if (doc.y > doc.page.height - 145) doc.addPage();
        doc.moveDown().fontSize(11).text(row.name);
        doc.fontSize(9).text(`Convite: ${invitationLabels[row.invitationStatus] || row.invitationStatus} · Entrada: ${date(row.enteredAt)} · Saída: ${date(row.leftAt)}`);
      }
      doc.moveDown().text(`Gerado em ${date(new Date())}. Registros refletem o instante da consulta.`);
      doc.end();
    } catch (error) { doc.destroy(); reject(error); }
  });
}
module.exports = { generateAttendancePdf };
