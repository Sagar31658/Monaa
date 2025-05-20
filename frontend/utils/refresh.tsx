import {saveAuthToSecureStore, getUserFromSecureStore} from './Auth'
import {Backend} from '../constants/backendUri'
export const refreshAccessToken = async (): Promise<boolean> => {
    const user = await getUserFromSecureStore();
  
    try {
      const res = await fetch(`${Backend}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-refresh-token': user?.refreshToken || '',
        },
      });
  
      const data = await res.json();
      if (!res) throw new Error("Request failed");
      if (!res.ok || !data?.accessToken) return false;
  
      await saveAuthToSecureStore(data.accessToken, user!); // update token
      return true;
    } catch {
      return false;
    }
  };
  