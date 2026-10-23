function getMinutesPdfTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'; }
  catch { return 'America/Sao_Paulo'; }
}

function buildMinutesPdfUrl(apiBaseUrl, { meetingId, userId, version, timeZone = getMinutesPdfTimeZone() }) {
  if (typeof apiBaseUrl !== 'string' || !/^https?:\/\//i.test(apiBaseUrl)
    || !meetingId || !userId || !Number.isInteger(version) || version < 1) {
    throw new Error('Atualize a reunião e salve a ata antes de gerar o PDF.');
  }
  const base = apiBaseUrl.replace(/\/+$/, '');
  return `${base}/meetings/${encodeURIComponent(meetingId)}/minutes/pdf?userId=${encodeURIComponent(userId)}&version=${version}&timeZone=${encodeURIComponent(timeZone)}`;
}

function minutesPdfError(status, code) {
  if (status === 409 || code === 'STALE_VERSION') return 'A ata mudou. Toque em Atualizar reuniões e aprovações e confira a versão atual antes de gerar o PDF.';
  if (status === 403 || code === 'FORBIDDEN') return 'Você não tem permissão para gerar o PDF desta reunião.';
  if (status === 404 || code === 'NOT_FOUND') return 'A ata não foi encontrada. Salve a ata e atualize a reunião antes de gerar o PDF.';
  return 'O servidor não conseguiu preparar o PDF. Confira sua conexão e tente novamente.';
}

async function prepareMinutesPdf({ apiBaseUrl, meetingId, userId, version, timeZone, fetchImpl = fetch, timeoutMs = 15000 }) {
  const url = buildMinutesPdfUrl(apiBaseUrl, { meetingId, userId, version, timeZone });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { method: 'HEAD', signal: controller.signal });
    if (!response.ok) throw new Error(minutesPdfError(response.status, response.headers.get('X-Pdf-Error')));
    if (!(response.headers.get('Content-Type') || '').toLowerCase().startsWith('application/pdf')) {
      throw new Error('Atualize o servidor do Synple para habilitar a geração de PDF.');
    }
    return url;
  } catch (error) {
    if (error?.name === 'AbortError' || error instanceof TypeError) {
      throw new Error('Não foi possível conectar ao servidor para gerar o PDF. Confira se a API e o túnel continuam ativos.');
    }
    throw error;
  } finally { clearTimeout(timer); }
}

module.exports = { buildMinutesPdfUrl, getMinutesPdfTimeZone, minutesPdfError, prepareMinutesPdf };
