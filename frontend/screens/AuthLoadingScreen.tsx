import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { refreshAccessToken } from '../utils/refresh';

export default function AuthLoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const bootstrapAsync = async () => {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        router.replace('/home'); //
      } else {
        router.replace('/login'); //
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
