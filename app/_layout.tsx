import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider } from '@/src/theme';
import { getDatabase } from '@/src/db/schema';
import { resumePendingPipelines } from '@/src/services/pipeline';
import { useAppStore } from '@/src/stores/useAppStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Manrope': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold': require('../assets/fonts/Manrope-ExtraBold.ttf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Pretendard': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
  });

  const setApiKeyConfigured = useAppStore(s => s.setApiKeyConfigured);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function init() {
      await getDatabase();
      const apiKey = await SecureStore.getItemAsync('google_cloud_api_key');
      setApiKeyConfigured(!!apiKey);
      resumePendingPipelines().catch(console.error);
    }
    init();
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="record" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="flashcard" options={{ presentation: 'card' }} />
        <Stack.Screen name="recording/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="quiz/multiple-choice" options={{ presentation: 'card' }} />
        <Stack.Screen name="quiz/fill-blank" options={{ presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}
