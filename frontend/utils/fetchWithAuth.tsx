import { getAuthToken, logoutUser } from './Auth';
import { refreshAccessToken } from './refresh';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<Response | null> => {
  let token = await getAuthToken();

  const buildHeaders = (t?: string) => ({
    ...(options.headers || {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
  });

  // Initial request
  let response = await fetch(url, {
    ...options,
    headers: buildHeaders(token || undefined),
    credentials: 'include',
  });

  if (response.status !== 401 || !retry) return response;

  // Attempt token refresh
  const refreshed = await refreshAccessToken();

  if (refreshed) {
    token = await getAuthToken();
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(token || undefined),
      credentials: 'include',
    });

    if (response.status !== 401) return response;
  }

  // If still unauthorized
  Alert.alert('Session Expired', 'Please log in again.');
  await logoutUser();
  router.replace('/login');
  return null;
};
