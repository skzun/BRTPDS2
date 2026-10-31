import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

let token = null;
const KEY = 'synple.session.v1';
const options = { requireAuthentication: true, authenticationPrompt: 'Confirme sua identidade para abrir o Synple', keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const getSessionToken = () => token;
export const setSessionToken = value => { token = value; };

export async function rememberSession(value) {
  token = value;
  if (Platform.OS === 'web') return;
  try {
    if (await LocalAuthentication.hasHardwareAsync() && await LocalAuthentication.isEnrolledAsync()) {
      await SecureStore.setItemAsync(KEY, value, options);
    }
  } catch { /* A sessão continua apenas em memória se o armazenamento protegido não estiver disponível. */ }
}
export async function restoreSession() {
  if (Platform.OS === 'web') return null;
  try { token = await SecureStore.getItemAsync(KEY, options); return token; }
  catch { return null; }
}
export async function clearSession() {
  token = null;
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(KEY).catch(() => {});
}
export async function confirmBiometric() {
  if (Platform.OS === 'web') return false;
  if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return false;
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Autorizar alteração do perfil', disableDeviceFallback: true, biometricsSecurityLevel: 'strong', cancelLabel: 'Cancelar' });
  return result.success;
}
