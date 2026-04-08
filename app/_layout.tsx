import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider } from '@/src/theme';
import { getDatabase } from '@/src/db/schema';
import { resumePendingPipelines } from '@/src/services/pipeline';
import { auth, onAuthStateChanged, getMonthlyUsage } from '@/src/services/firebase';
import { configureRevenueCat, checkSubscription } from '@/src/services/subscription';
import { useAppStore } from '@/src/stores/useAppStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function useAuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAppStore();

  useEffect(() => {
    if (authLoading) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, segments]);
}

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

  const { setUser, setSubscription, setMonthlyUsage } = useAppStore();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        await getDatabase();

        // Configure RevenueCat with Firebase UID
        try {
          await configureRevenueCat(user.uid);
          const sub = await checkSubscription();
          setSubscription(sub);
        } catch (e) {
          console.error('RevenueCat config error:', e);
        }

        // Load monthly usage
        try {
          const usage = await getMonthlyUsage(user.uid);
          setMonthlyUsage(usage.recordingCount, usage.limit);
        } catch (e) {
          console.error('Usage load error:', e);
        }

        // Resume pending pipelines
        resumePendingPipelines().catch(console.error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <AuthGuardedStack />
    </ThemeProvider>
  );
}

function AuthGuardedStack() {
  useAuthGuard();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="auth/paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="record" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="flashcard" options={{ presentation: 'card' }} />
      <Stack.Screen name="recording/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="quiz/multiple-choice" options={{ presentation: 'card' }} />
      <Stack.Screen name="quiz/fill-blank" options={{ presentation: 'card' }} />
    </Stack>
  );
}
