// ============================================================================
// CLIENTE DE API E SINCRONIZAÇÃO COM POSTGRESQL (SYNPLE)
// Compatível com Expo Go (dispositivo físico), Web e Emuladores
// ============================================================================

import { NativeModules, Platform } from 'react-native';

/**
 * Determina dinamicamente a URL base da API
 * No Expo Go, descobre o IP do computador a partir do scriptURL do Metro Bundler.
 */
export function getApiBaseUrl() {
  if (Platform?.OS === 'web') {
    return 'http://localhost:3001/api';
  }

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      // Exemplo: "http://192.168.1.17:8081/index.bundle..."
      const match = scriptURL.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
      if (match && match[1]) {
        const host = match[1];
        if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('ngrok') && !host.includes('exp.direct')) {
          return `http://${host}:3001/api`;
        }
      }
    }
  } catch (err) {
    // Ignora e usa fallback
  }

  // Fallback para o IP da máquina na rede local Wi-Fi / Ethernet
  return 'http://192.168.1.17:3001/api';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Verifica a saúde e conectividade com a API e o PostgreSQL
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${getApiBaseUrl()}/sync`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[API Sync] Servidor indisponível no IP:', getApiBaseUrl(), err.message);
    return null;
  }
}

/**
 * Realiza autenticação diretamente no PostgreSQL
 */
export async function loginWithApi(email, password) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Credenciais inválidas' };
    }

    const user = await response.json();
    return { success: true, user };
  } catch (err) {
    return { success: false, error: 'Servidor offline, utilizando validação local.' };
  }
}

/**
 * Cadastra novo usuário no PostgreSQL
 */
export async function registerWithApi({ name, email, phone, password }) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Falha ao cadastrar' };
    }

    const user = await response.json();
    return { success: true, user };
  } catch (err) {
    return { success: false, error: 'Servidor offline, cadastro salvo localmente.' };
  }
}

/**
 * Solicitação de entrada em organização
 */
export async function requestAccessWithApi(organizationId, userId) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/organizations/${organizationId}/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

/**
 * Sincroniza usuários criados localmente com o PostgreSQL
 */
export async function syncPendingUsers(localUsers = [], remoteUsers = []) {
  if (!Array.isArray(localUsers) || localUsers.length === 0) return [];
  const remoteEmails = new Set((remoteUsers || []).map((u) => (u.email || '').toLowerCase()));
  const synced = [];

  for (const user of localUsers) {
    const email = (user.email || '').toLowerCase();
    if (
      email &&
      !['admin@synple.com', 'marina@synple.com', 'joao@synple.com', 'admin@synple.app', 'marina@synple.app', 'joao@email.com'].includes(email) &&
      !remoteEmails.has(email)
    ) {
      try {
        const res = await registerWithApi({
          name: user.name || 'Usuário',
          email: user.email,
          phone: user.phone || null,
          password: user.password || 'Synple@123',
        });
        if (res && res.success && res.user) {
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
    const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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
    const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, nextPassword }),
    });

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
 * Exclui usuário no PostgreSQL (por ID ou e-mail)
 */
export async function deleteUserWithApi(userIdOrEmail) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/users/${encodeURIComponent(userIdOrEmail)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

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
    const response = await fetch(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

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
    const response = await fetch(`${getApiBaseUrl()}/organizations/${encodeURIComponent(organizationId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

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
    const response = await fetch(`${getApiBaseUrl()}/organizations/access-requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, role }),
    });

    if (!response.ok) return { success: false };
    return await response.json();
  } catch (err) {
    return { success: false };
  }
}

