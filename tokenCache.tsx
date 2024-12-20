import * as SecureStore from 'expo-secure-store';

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void;
}

export const tokenCache: TokenCache = {
  async getToken(key) {
    try {
      const token = await SecureStore.getItemAsync(key);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
  async saveToken(key, token) {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },
  async clearToken(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  },
};
