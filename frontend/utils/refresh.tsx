import { getUserFromSecureStore, saveAuthToSecureStore } from './Auth';
import { Backend } from '../constants/backendUri';

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${Backend}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include', // 🔐 sends cookie
    });

    const data = await res.json();

    if (!res.ok || !data?.accessToken) return false;

    const user = await getUserFromSecureStore();
    await saveAuthToSecureStore(data.accessToken, user || {});
    return true;
  } catch {
    return false;
  }
};
