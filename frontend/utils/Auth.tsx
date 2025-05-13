// ✅ auth.ts
import * as SecureStore from 'expo-secure-store';
import { refreshAccessToken } from './refresh';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export interface StoredUser {
  refreshToken?: string;
  email?: string;
  [key: string]: any;
}

export const saveAuthToSecureStore = async (accessToken: string, user: StoredUser) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getAuthToken = async (): Promise<string | null> => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) return token;

  const refreshed = await refreshAccessToken();
  if (refreshed) return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

  return null;
};

export const getUserFromSecureStore = async (): Promise<StoredUser | null> => {
  const user = await SecureStore.getItemAsync(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const logoutUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};
