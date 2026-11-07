const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadSession(modules = {}, os = 'android') {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/session.js'), 'utf8')
    .replace("import { Platform } from 'react-native';", '')
    .replace("import { requireOptionalNativeModule } from 'expo';", '')
    .replace(/export /g, '');
  const context = {
    Platform: { OS: os },
    requireOptionalNativeModule: name => modules[name] || null,
    require: name => {
      const value = modules[name];
      if (!value) throw new Error(`Cannot find native module ${name}`);
      return value;
    },
  };
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.api = { rememberSession, restoreSession, clearSession, confirmBiometric, getSessionToken };`, context);
  return context.api;
}

test('missing native modules do not crash startup or session operations', async () => {
  const session = loadSession();
  await session.rememberSession('temporary-token');
  assert.equal(session.getSessionToken(), 'temporary-token');
  assert.equal(await session.restoreSession(), null);
  assert.equal(await session.confirmBiometric(), false);
  await session.clearSession();
  assert.equal(session.getSessionToken(), null);
});

test('available modules preserve protected persistence and biometric checks', async () => {
  let stored;
  const secure = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    setItemAsync: async (key, value, options) => {
      assert.equal(options.requireAuthentication, true);
      stored = value;
    },
    getItemAsync: async () => stored,
    deleteItemAsync: async () => { stored = null; },
  };
  const biometric = {
    hasHardwareAsync: async () => true,
    isEnrolledAsync: async () => true,
    authenticateAsync: async () => ({ success: true }),
  };
  const session = loadSession({ ExpoSecureStore: {}, ExpoLocalAuthentication: {},
    'expo-secure-store': secure, 'expo-local-authentication': biometric });
  await session.rememberSession('protected-token');
  assert.equal(await session.restoreSession(), 'protected-token');
  assert.equal(await session.confirmBiometric(), true);
  biometric.authenticateAsync = async () => { throw new Error('Unavailable'); };
  assert.equal(await session.confirmBiometric(), false);
  await session.clearSession();
  assert.equal(stored, null);
});
