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
    return { success: true, user };
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

    return { success: true, user: await response.json() };
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
    }, 7000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Falha ao cadastrar' };
    }

    const user = await response.json();
    return { success: true, user };
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
export async function syncPendingUsers(localUsers = []) {
  if (!Array.isArray(localUsers) || localUsers.length === 0) return [];
  const synced = [];

  for (const user of localUsers) {
    if (user && user.pendingSync && user.email) {
      try {
        const res = await registerWithApi({
          name: user.name || 'Usuário',
          email: user.email,
          phone: user.phone || null,
          password: user.password || 'Synple@123',
        });
        if (res && res.success && res.user) {
          user.pendingSync = false;
          user.id = res.user.id;
          synced.push(res.user);
        }
      } catch {
        // continua para o próximo
      }
    }
  }
  return synced;
}

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
 * Validação de identidade por E-mail + Telefone cadastrado (Custo Zero e 100% Open Source)
 */
export async function verifyPhoneResetWithApi({ email, phone }) {
  try {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/verify-phone-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    }, 8000);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || 'Dados informados não conferem com o cadastro.' };
    }

    const data = await response.json();
    return { success: true, message: data.message, resetToken: data.resetToken };
  } catch (err) {
    return { success: false, error: 'Falha na comunicação com o servidor.' };
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
    }, 8000);

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Falha ao solicitar código' };
    }

    const data = await response.json();
    return { success: true, message: data.message, previewUrl: data.previewUrl, debugCode: data.debugCode };
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
    }, 8000);

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

    if (!response.ok) return { success: false };
    return await response.json();
  } catch (err) {
    return { success: false };
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
    return { success: false, error: 'Servidor offline, comissão salva localmente.' };
  }
}

/**
 * Sincroniza em lote todos os itens pendentes gerados localmente (offline ou rede externa) com o PostgreSQL
 */
export async function syncPendingData(data = {}) {
  if (!data) return;

  // 1. Usuários pendentes
  if (Array.isArray(data.users)) {
    await syncPendingUsers(data.users);
  }

  // 2. Organizações pendentes
  if (Array.isArray(data.organizations)) {
    for (const org of data.organizations) {
      if (org && org.pendingSync) {
        try {
          const res = await createOrganizationWithApi({
            name: org.name,
            document: org.document,
            ownerId: org.ownerId,
            status: org.status || 'PENDING',
          });
          if (res && res.success && res.organization) {
            org.pendingSync = false;
            org.id = res.organization.id;
          }
        } catch {}
      }
    }
  }

  // 3. Comissões pendentes
  if (Array.isArray(data.commissions)) {
    for (const comm of data.commissions) {
      if (comm && comm.pendingSync) {
        try {
          const res = await createCommissionWithApi({
            organizationId: comm.organizationId,
            name: comm.name,
            type: comm.type,
            description: comm.description,
          });
          if (res && res.success && res.commission) {
            comm.pendingSync = false;
            comm.id = res.commission.id;
          }
        } catch {}
      }
    }
  }

  // 4. Solicitações de acesso pendentes
  if (Array.isArray(data.accessRequests)) {
    for (const req of data.accessRequests) {
      if (req && req.pendingSync) {
        try {
          const res = await requestAccessWithApi(req.organizationId, req.userId);
          if (res && res.id) {
            req.pendingSync = false;
            req.id = res.id;
          }
        } catch {}
      }
    }
  }
}

