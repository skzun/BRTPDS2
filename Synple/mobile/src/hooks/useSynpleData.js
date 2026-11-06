import { useEffect, useState, useCallback } from 'react';
import { INITIAL_DATA } from '../constants/data';
import { loadStoredData, saveData } from '../services/storage';
import { fetchRemoteData } from '../services/api';
import { getSessionToken } from '../services/session';
import { removeCredentials } from '../services/cacheSafety';

export const EMPTY_DATA = { ...removeCredentials(INITIAL_DATA), users: [], organizations: [], commissions: [], commissionMembers: [], accessRequests: [], meetings: [], meetingInvitations: [], meetingAttendance: [], meetingMinutes: [], meetingMinutesApprovals: [], meetingVotes: [], meetingVoteOptions: [], meetingVoteTallies: [], meetingVoteOwnBallots: [] };
export function useSynpleData() {
  const [data, setData] = useState(EMPTY_DATA);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [dbStatus, setDbStatus] = useState('CHECKING');
  const syncWithRemote = useCallback(async () => {
    if (!getSessionToken()) return false;
    const remote = await fetchRemoteData();
    if (!remote) { setDbStatus('OFFLINE'); return false; }
    setData(removeCredentials({ ...EMPTY_DATA, ...remote }));
    setDbStatus('ONLINE');
    return true;
  }, []);
  useEffect(() => {
    // Regrava o cache antigo sem senhas; conteúdo só é exibido após autenticação.
    loadStoredData().then(saved => saved && saveData(removeCredentials(saved)))
      .catch(() => setStorageError('Não foi possível limpar o cache antigo.'))
      .finally(() => setIsReady(true));
  }, []);
  useEffect(() => { if (isReady) saveData(data).catch(() => setStorageError('Não foi possível salvar o cache.')); }, [data, isReady]);
  return { data, isReady, setData, storageError, dbStatus, syncWithRemote };
}
