import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';

export default function AuthLoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // try refreshing token
        const res = await fetch(`${Backend}/auth/refresh-access-token`, {
          method: 'POST',
          credentials: 'include', // 🔐 important for cookies!
        });

        if (!res.ok) throw new Error('Token expired or invalid');

        // save new access token (if needed in secure storage or state)
        router.replace('/home'); // ✅ auth successful
      } catch (err) {
        router.replace('/login'); // ❌ refresh failed
      }
    };

    bootstrapAsync();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#50c878" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
