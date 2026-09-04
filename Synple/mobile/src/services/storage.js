import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@synple:incremento-1';

export async function loadStoredData() {
  const savedData = await AsyncStorage.getItem(STORAGE_KEY);
  return savedData ? JSON.parse(savedData) : null;
}

export function saveData(data) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
