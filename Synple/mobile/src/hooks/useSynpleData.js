import { useEffect, useState, useCallback } from 'react';

import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';
import { fetchRemoteData } from '../services/api';

const DEMO_PASSWORDS = {
  'admin@synple.com': 'Admin@123',
  'admin@synple.app': 'Admin@123',
  'marina@synple.com': 'Marina@123',
  'marina@synple.app': 'Marina@123',
  'joao@synple.com': 'Joao@123',
  'joao@email.com': 'Joao@123',
};

function mergeDemoUsers(savedUsers, remoteUsers = []) {
  const users = Array.isArray(savedUsers) ? savedUsers : [];
  const sourceUsers = remoteUsers.length > 0 ? remoteUsers : users;

  const demoUsers = INITIAL_DATA.users.map((demoUser) => {
    const foundUser = sourceUsers.find((user) => user.email === demoUser.email || user.id === demoUser.id);
    return foundUser ? { ...demoUser, ...foundUser } : demoUser;
  });

  const additionalUsers = sourceUsers.filter(
    (user) => !INITIAL_DATA.users.some((demoUser) => demoUser.email === user.email || demoUser.id === user.id)
  );

  return [...demoUsers, ...additionalUsers];
}

function migrateOrganizations(savedOrganizations, schemaVersion) {
  const organizations = Array.isArray(savedOrganizations) ? savedOrganizations : INITIAL_DATA.organizations;

  if (schemaVersion >= 3) return organizations;

  return organizations.map((organization) => (
    organization.id === 'org-horizonte' && organization.ownerId === 'user-admin'
      ? { ...organization, ownerId: 'user-visitante' }
      : organization
  ));
}

function mergeData(savedData, remoteData = null) {
  const baseData = remoteData || savedData || {};
  const users = mergeDemoUsers(savedData?.users, remoteData?.users);
  const organizations = migrateOrganizations(baseData.organizations || savedData?.organizations, savedData?.schemaVersion || 0);

  return {
    ...INITIAL_DATA,
    ...savedData,
    ...baseData,
    schemaVersion: 3,
    organizations,
    users: users.map((user) => ({
      ...user,
      password: user.password && user.password !== 'admin' ? user.password : (DEMO_PASSWORDS[user.email] || user.password || 'Admin@123'),
    })),
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
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const savedData = await loadStoredData();
        if (savedData) setData(mergeData(savedData));

        // Sincroniza em segundo plano com o PostgreSQL (Banco_synple)
        const remote = await fetchRemoteData();
        if (remote) {
          setData((current) => mergeData(current, remote));
          setDbStatus('ONLINE');
        } else {
          setDbStatus('OFFLINE');
        }
      } catch {
        setStorageError('Não foi possível recuperar os dados locais.');
      } finally {
        setIsReady(true);
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
