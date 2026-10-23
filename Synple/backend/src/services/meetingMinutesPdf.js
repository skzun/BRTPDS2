const path = require('node:path');
const PDFDocument = require('pdfkit');

const statusLabels = {
  DRAFT: 'RASCUNHO', IN_REVIEW: 'EM APROVAÇÃO', REJECTED: 'REJEITADA', APPROVED: 'APROVADA',
};
const colors = { ink: '#17243C', muted: '#52617A', primary: '#343079', line: '#DCE2EC', warning: '#824808', success: '#176547' };
const fontDirectory = path.join(__dirname, '../assets/fonts');

function cleanText(value) {
  // Retira apenas controles invisíveis que não representam conteúdo da ata.
  return String(value ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** Gera um documento autocontido a partir de um snapshot já liberado pelo banco. */
function generateMeetingMinutesPdf(snapshot) {
  return new Promise((resolve, reject) => {
    const { meeting, minutes, attendance = [], approvals = [], timeZone = 'America/Sao_Paulo' } = snapshot;
    const generatedAt = new Date(snapshot.generatedAt || Date.now());
    const doc = new PDFDocument({
      size: 'A4', margins: { top: 102, bottom: 64, left: 50, right: 50 }, bufferPages: true,
      info: { Title: `Ata - ${meeting.title} - versão ${minutes.version}`, Author: 'Synple',
        Subject: `Ata de reunião - ${statusLabels[minutes.status] || minutes.status}`, CreationDate: generatedAt },
    });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      doc.registerFont('Regular', path.join(fontDirectory, 'NotoSans-Regular.ttf'));
      doc.registerFont('Bold', path.join(fontDirectory, 'NotoSans-Bold.ttf'));
      const left = 50;
      const width = doc.page.width - 100;
      let cursor = 102;
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone, day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      });
      const date = value => value && Number.isFinite(new Date(value).getTime()) ? formatter.format(new Date(value)) : 'Não registrado';
      const font = (name = 'Regular', size = 10) => doc.font(name).fontSize(size);
      const fitPrefix = (characters, availableWidth, offset = 0) => {
        const remaining = characters.length - offset;
        let low = 0;
        let high = Math.min(32, remaining);
        // A busca crescente mede somente uma linha, mesmo em um token de 50 mil caracteres.
        while (doc.widthOfString(characters.slice(offset, offset + high).join('')) <= availableWidth) {
          low = high;
          if (high === remaining) return high;
          high = Math.min(remaining, high * 2);
        }
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          if (doc.widthOfString(characters.slice(offset, offset + middle).join('')) <= availableWidth) low = middle;
          else high = middle - 1;
        }
        return Math.max(1, low);
      };
      const singleLine = (value, availableWidth) => {
        const text = cleanText(value).replace(/\s+/g, ' ');
        if (doc.widthOfString(text) <= availableWidth) return text;
        const characters = Array.from(text);
        return `${characters.slice(0, fitPrefix(characters, availableWidth - doc.widthOfString('...'))).join('')}...`;
      };
      const pageHeader = () => {
        const savedY = doc.y;
        font('Bold', 20).fillColor(colors.primary).text('Synple', left, 31, { lineBreak: false });
        font('Bold', 8).fillColor(colors.muted).text(`ATA DE REUNIÃO | VERSÃO ${minutes.version}`, left, 41, { width, align: 'right', lineBreak: false });
        font('Regular', 8).fillColor(colors.muted).text(singleLine(meeting.title, width), left, 65, { lineBreak: false });
        doc.moveTo(left, 86).lineTo(left + width, 86).lineWidth(0.7).strokeColor(colors.line).stroke();
        doc.y = savedY;
        cursor = 102;
      };
      doc.on('pageAdded', pageHeader);
      pageHeader();
      const space = height => {
        if (cursor + height > doc.page.height - 64) doc.addPage();
      };
      const lines = (value, availableWidth) => {
        const result = [];
        for (const paragraph of cleanText(value).split('\n')) {
          let line = '';
          for (const token of paragraph.match(/\S+|\s+/gu) || []) {
            if (/^\s+$/u.test(token)) {
              // Mantém o separador até a próxima palavra decidir a quebra de linha.
              if (line) line += ' ';
              continue;
            }
            if (doc.widthOfString(line + token) <= availableWidth) {
              line += token;
              continue;
            }
            if (line.trim()) result.push(line.trimEnd());
            line = '';
            const characters = Array.from(token);
            let offset = 0;
            while (offset < characters.length) {
              const count = fitPrefix(characters, availableWidth, offset);
              const chunk = characters.slice(offset, offset + count).join('');
              offset += count;
              if (offset < characters.length) result.push(chunk);
              else line = chunk;
            }
          }
          result.push(line.trimEnd());
        }
        return result;
      };
      const text = (value, options = {}) => {
        const size = options.size || 10;
        const lineHeight = options.lineHeight || size * 1.5;
        font(options.bold ? 'Bold' : 'Regular', size);
        const wrapped = lines(value, width - (options.indent || 0));
        for (const line of wrapped) {
          space(lineHeight);
          // O cabeçalho de uma nova página muda a fonte; restaura antes de cada linha.
          font(options.bold ? 'Bold' : 'Regular', size).fillColor(options.color || colors.ink);
          if (line) doc.text(line, left + (options.indent || 0), cursor, { lineBreak: false });
          cursor += lineHeight;
        }
        cursor += options.after ?? 5;
      };
      const section = (value, minimumSpace = 52) => {
        space(minimumSpace);
        cursor += 13;
        doc.moveTo(left, cursor - 4).lineTo(left + width, cursor - 4).lineWidth(0.5).strokeColor(colors.line).stroke();
        text(value, { size: 12, bold: true, color: colors.primary, after: 9 });
      };

      text('Ata de reunião', { size: 22, bold: true, after: 11 });
      const final = minutes.status === 'APPROVED';
      const label = `${statusLabels[minutes.status] || minutes.status} | VERSÃO ${minutes.version}${final ? '' : ' | DOCUMENTO NÃO FINAL'}`;
      doc.roundedRect(left, cursor, width, 32, 4).fill(final ? '#EAF5EE' : '#FFF3DE');
      font('Bold', 9).fillColor(final ? colors.success : colors.warning).text(label, left + 11, cursor + 9, { lineBreak: false });
      cursor += 45;
      if (!final) text('Este documento reproduz uma ata ainda não aprovada por todos os presentes. Consulte o status atual no Synple.', { size: 9, color: colors.warning, after: 11 });
      text(meeting.title, { size: 16, bold: true, after: 11 });
      text(`Organização: ${meeting.organizationName}`);
      text(`Comissão: ${meeting.commissionName}`);
      text(`Início previsto: ${date(meeting.startsAt)} | Fim previsto: ${date(meeting.endsAt)}`);
      text(`Fuso horário de todos os registros: ${timeZone}`, { size: 9, color: colors.muted });
      text(`Autor do primeiro registro: ${meeting.authorName}`);
      text(`Última edição: ${meeting.editorName}`);
      text(`Criada em: ${date(minutes.createdAt)} | Atualizada em: ${date(minutes.updatedAt)}`, { size: 9, color: colors.muted });
      if (minutes.submittedAt) text(`Enviada para aprovação em: ${date(minutes.submittedAt)}`, { size: 9, color: colors.muted });
      if (minutes.approvedAt) text(`Aprovada em: ${date(minutes.approvedAt)}`, { size: 10, bold: true, color: colors.success });

      section('1. Pauta');
      text(meeting.agenda, { after: 6 });
      section('2. Registro da reunião');
      text(minutes.content, { after: 6 });
      section('3. Lista de presença', attendance.length ? 150 : 52);
      text('Participantes com entrada registrada nesta reunião. A ausência de saída significa que ela ainda não foi registrada.', { size: 9, color: colors.muted, after: 10 });
      if (!attendance.length) text('Nenhuma entrada registrada.');
      for (const [index, participant] of attendance.entries()) {
        space(56);
        text(`${index + 1}. ${participant.name}`, { bold: true, after: 3 });
        text(`Entrada: ${date(participant.enteredAt)}`, { size: 9, indent: 12, after: 1 });
        text(`Saída: ${participant.leftAt ? date(participant.leftAt) : 'Não registrada'}`, { size: 9, indent: 12, after: 10 });
      }
      section('4. Aprovação da versão', approvals.length ? 150 : 52);
      text('A aprovação exige a concordância de todos os participantes com entrada registrada antes do envio da versão para revisão, incluindo o presidente quando presente.', { size: 9, color: colors.muted, after: 10 });
      if (!approvals.length) text('Esta versão ainda não foi enviada para aprovação.');
      for (const [index, approval] of approvals.entries()) {
        space(52);
        text(`${index + 1}. ${approval.name}`, { bold: true, after: 3 });
        const decision = approval.decision === 'APPROVED' ? 'Aprovou' : approval.decision === 'REJECTED' ? 'Rejeitou' : 'Aguardando decisão';
        text(`${decision}${approval.decidedAt ? ` em ${date(approval.decidedAt)}` : ''}`, { size: 9, indent: 12, after: approval.comment ? 3 : 10 });
        if (approval.comment) text(`Comentário: ${approval.comment}`, { size: 9, indent: 12, after: 10 });
      }
      section('5. Identificação do registro');
      text(`Reunião: ${meeting.id}`, { size: 8.5, color: colors.muted });
      text(`Ata: ${minutes.id} | Versão: ${minutes.version}`, { size: 8.5, color: colors.muted });
      text(`Documento gerado em: ${date(generatedAt)} (${timeZone}).`, { size: 8.5, color: colors.muted });
      text('As decisões acima são registros eletrônicos do Synple. Este PDF não contém assinatura digital com certificado. Nomes e horários refletem os dados disponíveis no momento da geração.', { size: 8.5, color: colors.muted });

      const pages = doc.bufferedPageRange();
      for (let index = pages.start; index < pages.start + pages.count; index++) {
        doc.switchToPage(index);
        const bottom = doc.page.height - 43;
        const originalMargin = doc.page.margins.bottom;
        // O rodapé ocupa a margem; o wrapper de alinhamento não deve criar outra página.
        doc.page.margins.bottom = 0;
        try {
          doc.moveTo(left, bottom - 9).lineTo(left + width, bottom - 9).lineWidth(0.5).strokeColor(colors.line).stroke();
          font('Regular', 8).fillColor(colors.muted).text(`Synple | Ata v${minutes.version} | ${statusLabels[minutes.status] || minutes.status}`, left, bottom, { lineBreak: false });
          doc.text(`Página ${index + 1} de ${pages.count}`, left, bottom, { width, align: 'right', lineBreak: false });
        } finally { doc.page.margins.bottom = originalMargin; }
      }
      doc.end();
    } catch (err) {
      doc.destroy();
      reject(err);
    }
  });
}

module.exports = { generateMeetingMinutesPdf };
