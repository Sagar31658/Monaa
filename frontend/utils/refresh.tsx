import { getAuthToken, saveAuthToSecureStore, getUserFromSecureStore } from './Auth';

export const refreshAccessToken = async () => {
  const user = await getUserFromSecureStore();
  const refreshToken = user?.refreshToken;

  if (!refreshToken) return false;

  try {
    const res = await fetch('http://192.168.X.X:3000/api/v1/user/refresh-access-token', {
      method: 'GET',
      headers: {
        'x-refresh-token': refreshToken,
      },
    });

    const data = await res.json();
    if (res.ok) {
      await saveAuthToSecureStore(data?.data?.accessToken, user); // update token only
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
};
