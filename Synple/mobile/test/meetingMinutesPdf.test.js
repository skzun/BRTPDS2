const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMinutesPdfUrl, prepareMinutesPdf } = require('../src/services/meetingMinutesPdf');

const request = { apiBaseUrl: 'https://api.example.test/api/', meetingId: 'meeting/1', userId: 'ana@example.test', version: 2, timeZone: 'America/Sao_Paulo' };

test('PDF usa URL da API, versão lida e parâmetros codificados', () => {
  const url = new URL(buildMinutesPdfUrl(request.apiBaseUrl, request));
  assert.equal(url.pathname, '/api/meetings/meeting%2F1/minutes/pdf');
  assert.equal(url.searchParams.get('userId'), request.userId);
  assert.equal(url.searchParams.get('version'), '2');
  assert.equal(url.searchParams.get('timeZone'), 'America/Sao_Paulo');
  assert.throws(() => buildMinutesPdfUrl(request.apiBaseUrl, { ...request, version: 0 }), /salve a ata/);
  assert.throws(() => buildMinutesPdfUrl('javascript:alert(1)', request), /salve a ata/);
});

test('PDF só abre após preflight HEAD confirmar conteúdo PDF', async () => {
  let calls = 0;
  const url = await prepareMinutesPdf({ ...request, fetchImpl: async (target, options) => {
    calls++;
    assert.equal(options.method, 'HEAD');
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(target, buildMinutesPdfUrl(request.apiBaseUrl, request));
    return { ok: true, headers: new Headers({ 'Content-Type': 'application/pdf' }) };
  } });
  assert.equal(url, buildMinutesPdfUrl(request.apiBaseUrl, request));
  assert.equal(calls, 1);
});

test('PDF rejeita versão antiga e usuário sem acesso com mensagem útil', async () => {
  for (const [status, code, expected] of [[409, 'STALE_VERSION', /A ata mudou/], [403, 'FORBIDDEN', /permissão/], [404, 'NOT_FOUND', /não foi encontrada/]]) {
    await assert.rejects(prepareMinutesPdf({ ...request, fetchImpl: async () => ({ ok: false, status, headers: new Headers({ 'X-Pdf-Error': code }) }) }), expected);
  }
});

test('PDF detecta servidor antigo ou resposta HTML em vez do arquivo', async () => {
  await assert.rejects(prepareMinutesPdf({ ...request, fetchImpl: async () => ({ ok: true, headers: new Headers({ 'Content-Type': 'text/html' }) }) }), /Atualize o servidor/);
});

test('PDF encerra espera por servidor indisponível sem abrir download', async () => {
  await assert.rejects(prepareMinutesPdf({ ...request, timeoutMs: 10, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true });
  }) }), /API e o túnel continuam ativos/);
});
