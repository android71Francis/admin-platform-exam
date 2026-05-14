import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

const isSecureStoreAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

export const setItem = async (key: string, value: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memoryStore.set(key, value);
    try { localStorage.setItem(key, value); } catch { /* ignored */ }
  }
};

export const getItem = async (key: string): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  }
  try { return localStorage.getItem(key); } catch { return memoryStore.get(key) ?? null; }
};

export const deleteItem = async (key: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    memoryStore.delete(key);
    try { localStorage.removeItem(key); } catch { /* ignored */ }
  }
};
