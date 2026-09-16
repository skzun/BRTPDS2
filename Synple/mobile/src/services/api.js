// ============================================================================
// CLIENTE DE API E SINCRONIZAÇÃO COM POSTGRESQL (SYNPLE)
// ============================================================================

// Porta e host padrão do backend Synple
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Verifica a saúde e conectividade com a API e o PostgreSQL
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${API_BASE_URL}/health`, {
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
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[API Sync] Servidor indisponível, utilizando dados locais:', err.message);
    return null;
  }
}

/**
 * Realiza autenticação diretamente no PostgreSQL
 */
export async function loginWithApi(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
 * Atualiza dados pessoais / tema no PostgreSQL
 */
export async function updateUserWithApi(userId, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
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
