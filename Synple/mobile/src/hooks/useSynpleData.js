import { useEffect, useState, useCallback } from 'react';

import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';
import { fetchRemoteData, syncPendingData } from '../services/api';

const DEMO_PASSWORDS = {
  'admin@synple.com': 'Admin@123',
  'admin@synple.app': 'Admin@123',
  'marina@synple.com': 'Marina@123',
  'marina@synple.app': 'Marina@123',
  'joao@synple.com': 'Joao@123',
  'joao@email.com': 'Joao@123',
};

function mergeAllUsers(savedUsers = [], remoteUsers = null) {
  const map = new Map();

  // Quando o banco remoto está online, PostgreSQL é a autoridade máxima
  if (Array.isArray(remoteUsers)) {
    // 1. Inicia com todos os usuários oficiais do PostgreSQL
    remoteUsers.forEach((u) => {
      if (u && u.email) map.set(u.email.toLowerCase(), u);
    });

    // 2. Mescla dados conhecidos de demonstração
    INITIAL_DATA.users.forEach((u) => {
      const key = u.email.toLowerCase();
      if (map.has(key)) {
        map.set(key, { ...u, ...map.get(key) });
      }
    });

    // 3. Mescla dados salvos localmente, garantindo que nenhum usuário criado no aparelho seja descartado
    (Array.isArray(savedUsers) ? savedUsers : []).forEach((u) => {
      if (!u || !u.email) return;
      const key = u.email.toLowerCase();
      if (map.has(key)) {
        map.set(key, { ...u, ...map.get(key) });
      } else {
        map.set(key, u);
      }
    });
  } else {
    // Modo offline: inicia com demonstração e adiciona dados salvos localmente
    INITIAL_DATA.users.forEach((u) => map.set(u.email.toLowerCase(), u));
    (Array.isArray(savedUsers) ? savedUsers : []).forEach((u) => {
      if (u && u.email) map.set(u.email.toLowerCase(), { ...(map.get(u.email.toLowerCase()) || {}), ...u });
    });
  }

  return Array.from(map.values());
}

function mergeAccessRequests(savedRequests = [], remoteRequests = null) {
  if (Array.isArray(remoteRequests)) {
    return remoteRequests;
  }
  return Array.isArray(savedRequests) ? savedRequests : INITIAL_DATA.accessRequests;
}

function mergeOrganizations(savedOrgs = [], remoteOrgs = null) {
  const map = new Map();
  if (Array.isArray(remoteOrgs)) {
    remoteOrgs.forEach((o) => {
      if (o && o.document) map.set(o.document, o);
      else if (o && o.id) map.set(o.id, o);
    });
  }
  (Array.isArray(savedOrgs) ? savedOrgs : []).forEach((o) => {
    if (!o) return;
    const key = o.document || o.id;
    if (map.has(key)) {
      map.set(key, { ...o, ...map.get(key) });
    } else {
      map.set(key, o);
    }
  });
  return Array.from(map.values());
}

function mergeCommissions(savedComms = [], remoteComms = null) {
  const map = new Map();
  if (Array.isArray(remoteComms)) {
    remoteComms.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
  }
  (Array.isArray(savedComms) ? savedComms : []).forEach((c) => {
    if (!c) return;
    if (!map.has(c.id)) {
      map.set(c.id, c);
    }
  });
  return Array.from(map.values());
}

function mergeData(savedData, remoteData = null) {
  const baseData = remoteData || savedData || {};
  const users = mergeAllUsers(savedData?.users, remoteData?.users);
  const organizations = mergeOrganizations(savedData?.organizations, remoteData?.organizations);
  const accessRequests = mergeAccessRequests(savedData?.accessRequests, remoteData?.accessRequests);
  const commissions = mergeCommissions(savedData?.commissions, remoteData?.commissions);
  const commissionMembers = remoteData?.commissionMembers || savedData?.commissionMembers || INITIAL_DATA.commissionMembers;

  return {
    ...INITIAL_DATA,
    ...savedData,
    ...baseData,
    schemaVersion: 3,
    organizations,
    commissions,
    commissionMembers,
    users: users.map((user) => ({
      ...user,
      password: user.password && user.password !== 'admin' ? user.password : (DEMO_PASSWORDS[user.email] || user.password || 'Admin@123'),
    })),
    accessRequests,
    system: {
      ...INITIAL_DATA.system,
      ...(savedData?.system || {}),
      ...(remoteData?.system || {}),
      database: {
        status: remoteData ? 'ONLINE' : 'OFFLINE',
        name: 'Banco_synple',
      },
    },
  };
}

export function useSynpleData() {
  const [data, setData] = useState(INITIAL_DATA);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [dbStatus, setDbStatus] = useState('CHECKING');

  const syncWithRemote = useCallback(async () => {
    try {
      // 1. Sincroniza primeiro as pendências locais com o banco PostgreSQL
      if (data) {
        await syncPendingData(data);
      }
      // 2. Busca dados atualizados do banco (já refletindo os novos itens persistidos)
      const remote = await fetchRemoteData();
      if (remote) {
        setData((current) => mergeData(current, remote));
        setDbStatus('ONLINE');
      } else {
        setDbStatus('OFFLINE');
      }
    } catch {
      setDbStatus('OFFLINE');
    }
  }, [data]);

  useEffect(() => {
    async function loadData() {
      try {
        const savedData = await loadStoredData();
        if (savedData) setData(mergeData(savedData));
      } catch {
        setStorageError('Não foi possível recuperar os dados locais.');
      } finally {
        setIsReady(true);
      }

      // Sincroniza em segundo plano com o PostgreSQL (Banco_synple)
      try {
        const currentLocal = await loadStoredData();
        if (currentLocal) {
          await syncPendingData(currentLocal);
        }
        const remote = await fetchRemoteData();
        if (remote) {
          setData((current) => mergeData(current, remote));
          setDbStatus('ONLINE');
        } else {
          setDbStatus('OFFLINE');
        }
      } catch {
        setDbStatus('OFFLINE');
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveData(data).catch(() => setStorageError('Não foi possível salvar os dados locais.'));
  }, [data, isReady]);

  return { data, isReady, setData, storageError, dbStatus, syncWithRemote };
}
