import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthToken } from '../utils/Auth';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const token = await getAuthToken();
      if (token) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    };
    checkSession();
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
