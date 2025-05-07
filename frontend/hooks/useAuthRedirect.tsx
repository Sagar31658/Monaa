import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAuthToken } from '../utils/Auth';

export const useAuthRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      if (!token) router.replace('/login');
    };
    checkAuth();
  }, []);
};
