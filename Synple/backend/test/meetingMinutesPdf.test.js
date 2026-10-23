const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateMeetingMinutesPdf } = require('../src/services/meetingMinutesPdf');
const { minutesPdfSnapshot } = require('./fixtures/minutesPdfSnapshot');

const pageCount = pdf => (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;

test('gera PDF com fontes incorporadas e mapa Unicode para português', async () => {
  const pdf = await generateMeetingMinutesPdf(minutesPdfSnapshot());
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.toString('latin1').includes('/FontFile2'), 'O documento incorpora as fontes');
  assert.ok(pdf.toString('latin1').includes('/ToUnicode'), 'O texto mantém mapa Unicode para copiar e pesquisar');
  assert.equal(pageCount(pdf), 2, 'O rodapé não cria páginas extras vazias');
});

test('pagina conteúdo de 50.000 caracteres, incluindo palavras sem espaços', async () => {
  const snapshot = minutesPdfSnapshot();
  snapshot.minutes.content = `${'Discussão, decisão e ação com transparência. '.repeat(700)}\n\n${'EncaminhamentoSemEspaçosÇã'.repeat(700)}`.slice(0, 50000);
  const pdf = await generateMeetingMinutesPdf(snapshot);
  assert.ok(pageCount(pdf) > 8, 'A ata extensa é distribuída em várias páginas');
  assert.ok(pdf.subarray(-20).toString().includes('%%EOF'), 'O PDF termina corretamente');
});

test('gera ata em rascunho sem presentes ou aprovadores', async () => {
  const snapshot = minutesPdfSnapshot({ attendance: [], approvals: [] });
  snapshot.minutes = { ...snapshot.minutes, status: 'DRAFT', submittedAt: null, approvedAt: null };
  const pdf = await generateMeetingMinutesPdf(snapshot);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pageCount(pdf) >= 1);
});
