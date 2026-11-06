import { getSessionToken, rememberSession } from './session';
// ============================================================================
// CLIENTE DE API E SINCRONIZAÇÃO COM POSTGRESQL (SYNPLE)
// Compatível com Expo Go (dispositivo físico), Web e Emuladores
// ============================================================================

import { NativeModules, Platform } from 'react-native';
import networkConfig from '../constants/network.json';

/**
 * Determina dinamicamente a URL base da API
 * Funciona localmente em qualquer máquina, sem depender de IP fixo no código:
 * 1. EXPO_PUBLIC_API_URL (se definido)
 * 2. IP do Metro (Expo Go na mesma rede)
 * 3. Web -> http://localhost:3001/api
 * 4. Emuladores Android -> http://10.0.2.2:3001/api
 * 5. IP detectado no início do Expo Go ou localhost
 */
export function getApiBaseUrl() {
  // 1. Variável de ambiente explícita
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const defaultPort = networkConfig?.port || 3001;

  // 2. Web
  if (Platform?.OS === 'web') {
    const webHost = typeof window !== 'undefined' && window?.location?.hostname ? window.location.hostname : 'localhost';
    return `http://${webHost}:${defaultPort}/api`;
  }

  // 3. Em execução LAN, o Metro informa o IP do computador no scriptURL.
  // O túnel do Expo expõe apenas o Metro; não encaminha a API na porta 3001.
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
    if (scriptURL) {
      const match = scriptURL.match(/^([a-zA-Z]+):\/\/([^/:]+)(?::(\d+))?/);
      if (match) {
        const host = match[2];
        const isExpoTunnel = host.includes('exp.direct') || host.includes('ngrok');
        const isLoopback = host === 'localhost' || host === '127.0.0.1';

        if (!isExpoTunnel && !isLoopback) {
          return `http://${host}:${defaultPort}/api`;
        }
      }
    }
  } catch (err) {
    // Continua para a próxima estratégia
  }

  // 4. Emulador Android (o host do PC é mapeado para 10.0.2.2)
  if (Platform?.OS === 'android') {
    return `http://10.0.2.2:${defaultPort}/api`;
  }

  // 5. Fallback seguro quando não há URL pública, Metro LAN ou .env.local.
  return `http://${networkConfig?.serverIp || 'localhost'}:${defaultPort}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Wrapper de fetch com timeout padrão para evitar travamento em redes externas sem rota para IP privado
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, ...(getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {}) },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Verifica a saúde e conectividade com a API e o PostgreSQL
 */
export async function checkBackendHealth() {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, 3500);

    if (!response.ok) return { online: false, error: 'API retornou erro' };
    const data = await response.json();
    return {
      online: true,
      database: data.database?.status || 'UNKNOWN',
      dbName: data.database?.name,
      latencyMs: data.database?.latencyMs,
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Obtém todos os dados sincronizados do PostgreSQL
 */
export async function fetchRemoteData() {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/sync`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, 3500);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.log('[API Sync] Servidor offline ou indisponível em:', getApiBaseUrl(), err.message);
    return null;
  }
}

/**
 * Realiza autenticação diretamente no PostgreSQL
 */
export async function loginWithApi(email, password) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 4000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Credenciais inválidas' };
    }

    const user = await response.json();
    await rememberSession(user.token);
    const { token, ...profile } = user;
    return { success: true, user: profile };
  } catch (err) {
    return { success: false, error: 'Falha na comunicação com o servidor.' };
  }
}

/**
 * Envia ao backend o ID token emitido pelo Google. O token é validado no
 * servidor antes de criar ou acessar a conta do usuário.
 */
export async function loginWithGoogleApi(idToken) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }, 10000);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || 'Não foi possível entrar com Google.' };
    }

    const { token, ...user } = await response.json();
    await rememberSession(token);
    return { success: true, user };
  } catch (err) {
    return { success: false, error: 'Não foi possível conectar ao servidor para validar a conta Google.' };
  }
}

/**
 * Cadastra novo usuário no PostgreSQL
 */
export async function registerWithApi({ name, email, phone, password }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    }, 45000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Falha ao cadastrar' };
    }

    return { success: true, ...await response.json() };
  } catch (err) {
    return { success: false, error: 'Falha na comunicação com o servidor.' };
  }
}

/**
 * Solicitação de entrada em organização
 */
export async function requestAccessWithApi(organizationId, userId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${organizationId}/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }, 4000);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

/**
 * Sincroniza usuários criados localmente com o PostgreSQL (apenas pendências explícitas)
 */
/**
 * Atualiza dados pessoais / tema no PostgreSQL
 */
export async function updateUserWithApi(userId, payload) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 4000);

    if (!response.ok) return { success: false };
    const user = await response.json();
    return { success: true, user };
  } catch (err) {
    return { success: false };
  }
}

/**
 * Altera senha com validação no PostgreSQL
 */
export async function changePasswordWithApi(userId, currentPassword, nextPassword) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, nextPassword }),
    }, 4000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Servidor offline.' };
  }
}

/**
 * Solicita código de verificação de 6 dígitos via e-mail no PostgreSQL
 */
export async function requestPasswordResetWithApi(email) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    // O backend só responde depois que o provedor SMTP aceita o e-mail.
    // Em redes externas/túneis esse envio pode levar mais que o timeout padrão.
    }, 45000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Falha ao solicitar código' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: 'Falha na comunicação com o servidor.' };
  }
}

/**
 * Valida o código recebido por e-mail e redefine a senha no PostgreSQL
 */
export async function resetPasswordWithApi({ email, code, newPassword }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    }, 20000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Código incorreto ou expirado' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: 'Falha na comunicação com o servidor.' };
  }
}

/**
 * Exclui usuário no PostgreSQL (por ID ou e-mail)
 */
export async function deleteUserWithApi(userIdOrEmail) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/users/${encodeURIComponent(userIdOrEmail)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }, 4000);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Não foi possível excluir o usuário.' };
    }
    return await response.json();
  } catch (err) {
    return { success: false, error: 'Servidor indisponível. O usuário não foi removido.' };
  }
}

/**
 * Exclui organização no PostgreSQL
 */
export async function deleteOrganizationWithApi(organizationId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }, 4000);

    if (!response.ok) return { success: false };
    return await response.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Altera status de aprovação de organização no PostgreSQL
 */
export async function updateOrganizationStatusWithApi(organizationId, status) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, 4000);

    if (!response.ok) return { success: false };
    return await response.json();
  } catch (err) {
    return { success: false };
  }
}

export async function transferOrganizationOwnershipWithApi(organizationId, currentOwnerId, newOwnerId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}/owner`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentOwnerId, newOwnerId }),
    }, 4000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível transferir a organização.' };
    return { success: true, organization: await response.json() };
  } catch {
    return { success: false, error: 'Servidor offline. A transferência não foi realizada.' };
  }
}

export async function updateOrganizationWithApi(organizationId, { name, document, ownerId }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, document, ownerId }),
    }, 4000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível atualizar a organização.' };
    return { success: true, organization: await response.json() };
  } catch {
    return { success: false, error: 'Servidor offline. A alteração não foi realizada.' };
  }
}

async function commissionMemberRequest(path, method, payload) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/commissions/${path}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }, 10000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível atualizar os membros da comissão.' };
    const result = await response.json();
    return { success: true, member: method === 'DELETE' ? null : result };
  } catch { return { success: false, error: 'Servidor offline. A equipe da comissão não foi alterada.' }; }
}

export function addCommissionMemberWithApi(commissionId, actorId, userId, role) {
  return commissionMemberRequest(`${encodeURIComponent(commissionId)}/members`, 'POST', { actorId, userId, role });
}

export function updateCommissionMemberRoleWithApi(commissionId, actorId, userId, role) {
  return commissionMemberRequest(`${encodeURIComponent(commissionId)}/members/${encodeURIComponent(userId)}`, 'PATCH', { actorId, role });
}

export function removeCommissionMemberWithApi(commissionId, actorId, userId) {
  return commissionMemberRequest(`${encodeURIComponent(commissionId)}/members/${encodeURIComponent(userId)}`, 'DELETE', { actorId });
}

export async function scheduleMeetingWithApi(meeting) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meeting),
    }, 5000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível agendar.' };
    return { success: true, meeting: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. A reunião não foi agendada.' }; }
}

export async function respondToMeetingInvitationWithApi(meetingId, userId, status) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/invitation`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, status }),
    }, 5000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível responder ao convite.' };
    return { success: true, invitation: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. A resposta não foi salva.' }; }
}

export async function recordMeetingAttendanceWithApi(meetingId, userId, action) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/attendance`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action }),
    }, 5000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível registrar a presença.' };
    return { success: true, attendance: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. A presença não foi salva.' }; }
}

export async function fetchMeetingAttendanceWithApi(meetingId, userId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/attendance?userId=${encodeURIComponent(userId)}`, { method: 'GET' }, 10000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível gerar a lista de presença.' };
    return { success: true, attendance: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. A lista de presença não foi atualizada.' }; }
}

export async function saveMeetingMinutesWithApi(meetingId, userId, content) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/minutes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, content }),
    }, 10000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível salvar a ata.' };
    return { success: true, minutes: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. O texto da ata foi preservado para tentar novamente.' }; }
}

export async function submitMeetingMinutesWithApi(meetingId, userId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/minutes/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
    }, 10000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível enviar a ata para aprovação.' };
    return { success: true, minutes: await response.json() };
  } catch { return { success: false, error: 'Servidor offline. Confira a situação da ata ao reconectar antes de tentar novamente.' }; }
}

export async function approveMeetingMinutesWithApi(meetingId, userId, decision, comment = '', version) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/minutes/approval`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, decision, comment, version }),
    }, 10000);
    if (!response.ok) return { success: false, error: (await response.json()).error || 'Não foi possível registrar sua decisão.' };
    const result = await response.json();
    return { success: true, minutes: result.minutes, approval: result.approval };
  } catch { return { success: false, error: 'Servidor offline. Sua decisão não foi confirmada; atualize a ata ao reconectar.' }; }
}

export async function createMeetingVoteWithApi(meetingId, userId, question, options) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/votes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, question, options }),
    }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, vote: result } : { success: false, error: result.error || 'Não foi possível abrir a votação.' };
  } catch { return { success: false, error: 'Servidor offline. A votação não foi aberta.' }; }
}

export async function castMeetingVoteWithApi(meetingId, voteId, userId, optionId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/votes/${encodeURIComponent(voteId)}/ballot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, optionId }),
    }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, ballot: result } : { success: false, error: result.error || 'Não foi possível registrar seu voto.' };
  } catch { return { success: false, error: 'Servidor offline. Seu voto não foi confirmado.' }; }
}

export async function closeMeetingVoteWithApi(meetingId, voteId, userId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/${encodeURIComponent(meetingId)}/votes/${encodeURIComponent(voteId)}/close`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
    }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, vote: result } : { success: false, error: result.error || 'Não foi possível encerrar a votação.' };
  } catch { return { success: false, error: 'Servidor offline. A votação continua aberta.' }; }
}

export async function fetchMeetingParticipationReportWithApi() {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/meetings/participation/report`, { method: 'GET' }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, meetings: result.meetings || [] } : { success: false, error: result.error || 'Não foi possível consultar o relatório.' };
  } catch { return { success: false, error: 'Servidor offline. O relatório não foi atualizado.' }; }
}

/**
 * Altera status de solicitação de acesso no PostgreSQL
 */
export async function updateAccessRequestStatusWithApi(requestId, status, role) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/access-requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, role }),
    }, 4000);

    if (!response.ok) return { success: false };
    return await response.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Cria organização no PostgreSQL
 */
export async function createOrganizationWithApi({ name, document, ownerId, status = 'PENDING' }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, document, ownerId, status }),
    }, 4000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Erro ao cadastrar organização' };
    }

    const org = await response.json();
    return { success: true, organization: org };
  } catch (err) {
    return { success: false, error: 'Servidor offline ou indisponível.' };
  }
}

/**
 * Cria comissão no PostgreSQL
 */
export async function createCommissionWithApi({ organizationId, name, type, description, memberIds = [] }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, name, type, description, memberIds }),
    }, 4000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Erro ao criar comissão' };
    }

    const commission = await response.json();
    return { success: true, commission };
  } catch (err) {
    return { success: false, error: 'Servidor indisponível. A comissão não foi criada.' };
  }
}

/**
 * Sincroniza em lote todos os itens pendentes gerados localmente (offline ou rede externa) com o PostgreSQL
 */
export async function syncPendingData() { /* Escritas precisam de confirmação explícita da API. */ }


export async function authRequest(endpoint, payload, method = 'POST') {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/${endpoint}`, { method,
      headers: { 'Content-Type': 'application/json' }, ...(method !== 'GET' ? { body: JSON.stringify(payload || {}) } : {}) }, 45000);
    const result = await response.json();
    return response.ok ? { success: true, ...result } : { success: false, error: result.error };
  } catch { return { success: false, error: 'Não foi possível conectar ao servidor.' }; }
}
export async function fetchSystemInfo() {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/system`, { method: 'GET' }, 10000);
  if (!response.ok) throw new Error('Não foi possível consultar o estado real do servidor.');
  return response.json();
}

export async function organizationInvitation(organizationId, payload, requestId) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/organizations/${organizationId}/invitations${requestId ? '/' + requestId : ''}`,
      { method: requestId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, ...result } : { success: false, error: result.error };
  } catch { return { success: false, error: 'Não foi possível confirmar o convite no servidor.' }; }
}
export const authenticatedFetch = (url, options = {}) => fetchWithTimeout(url, options, 15000);
export async function authorizePdfDownload(url) {
  const path = new URL(url).pathname.replace(/^\/api/, '');
  const result = await authRequest('download-ticket', { path });
  if (!result.success) throw new Error(result.error);
  return url + '&download=' + encodeURIComponent(result.ticket);
}

export async function commissionRequest(id, method, payload) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/commissions/${id}`, { method, headers: { 'Content-Type': 'application/json' }, ...(payload ? { body: JSON.stringify(payload) } : {}) }, 10000);
    const result = await response.json();
    return response.ok ? { success: true, ...result } : { success: false, error: result.error };
  } catch { return { success: false, error: 'A alteração não foi confirmada pelo servidor.' }; }
}
