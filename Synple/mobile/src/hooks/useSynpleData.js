import { useEffect, useState } from 'react';

import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';

function mergeData(savedData) {
  return {
    ...INITIAL_DATA,
    ...savedData,
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
