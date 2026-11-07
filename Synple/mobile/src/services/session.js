import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Check the installed binary before importing wrappers that require native modules.
const SecureStore = Platform.OS !== 'web' && requireOptionalNativeModule('ExpoSecureStore')
  ? require('expo-secure-store') : null;
const LocalAuthentication = Platform.OS !== 'web' && requireOptionalNativeModule('ExpoLocalAuthentication')
  ? require('expo-local-authentication') : null;

let token = null;
const KEY = 'synple.session.v1';
const options = { requireAuthentication: true, authenticationPrompt: 'Confirme sua identidade para abrir o Synple', keychainAccessible: SecureStore?.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const getSessionToken = () => token;
export const setSessionToken = value => { token = value; };

export async function rememberSession(value) {
  token = value;
  if (!SecureStore || !LocalAuthentication) return;
  try {
    if (await LocalAuthentication.hasHardwareAsync() && await LocalAuthentication.isEnrolledAsync()) {
      await SecureStore.setItemAsync(KEY, value, options);
    }
  } catch { /* A sessão continua apenas em memória se o armazenamento protegido não estiver disponível. */ }
}
export async function restoreSession() {
  if (!SecureStore) return null;
  try { token = await SecureStore.getItemAsync(KEY, options); return token; }
  catch { return null; }
}
export async function clearSession() {
  token = null;
  if (SecureStore) await SecureStore.deleteItemAsync(KEY).catch(() => {});
}
export async function confirmBiometric() {
  if (!LocalAuthentication) return false;
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return false;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Autorizar alteração do perfil', disableDeviceFallback: true, biometricsSecurityLevel: 'strong', cancelLabel: 'Cancelar' });
    return result.success;
  } catch { return false; }
}
