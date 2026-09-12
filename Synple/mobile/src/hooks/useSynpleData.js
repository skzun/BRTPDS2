import { useEffect, useState } from 'react';

import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';

const DEMO_PASSWORDS = {
  'admin@synple.app': 'admin123',
  'marina@synple.app': 'marina123',
  'joao@email.com': 'joao123',
};

function mergeData(savedData) {
  return {
    ...INITIAL_DATA,
    ...savedData,
    users: (savedData.users || INITIAL_DATA.users).map((user) => ({
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
