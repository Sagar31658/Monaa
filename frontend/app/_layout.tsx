import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
