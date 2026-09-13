import { useEffect, useState } from 'react';

import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';

const DEMO_PASSWORDS = {
  'admin@synple.com': 'Admin@123',
  'admin@synple.app': 'Admin@123',
  'marina@synple.com': 'Marina@123',
  'marina@synple.app': 'Marina@123',
  'joao@synple.com': 'Joao@123',
  'joao@email.com': 'Joao@123',
};

function mergeDemoUsers(savedUsers) {
  const users = Array.isArray(savedUsers) ? savedUsers : [];
  const demoUsers = INITIAL_DATA.users.map((demoUser) => {
    const savedUser = users.find((user) => user.id === demoUser.id);
    return savedUser ? { ...demoUser, ...savedUser } : demoUser;
  });
  const registeredUsers = users.filter((user) => !INITIAL_DATA.users.some((demoUser) => demoUser.id === user.id));

  return [...demoUsers, ...registeredUsers];
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

function mergeData(savedData) {
  const users = mergeDemoUsers(savedData.users);
  const organizations = migrateOrganizations(savedData.organizations, savedData.schemaVersion || 0);

  return {
    ...INITIAL_DATA,
    ...savedData,
    schemaVersion: 3,
    organizations,
    users: users.map((user) => ({
      ...user,
      password: user.password && user.password !== 'admin' ? user.password : (DEMO_PASSWORDS[user.email] || user.password || 'admin123'),
    })),
    system: { ...INITIAL_DATA.system, ...(savedData.system || {}) },
  };
}

export function useSynpleData() {
  const [data, setData] = useState(INITIAL_DATA);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(null);

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
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveData(data).catch(() => setStorageError('Não foi possível salvar os dados locais.'));
  }, [data, isReady]);

  return { data, isReady, setData, storageError };
}
