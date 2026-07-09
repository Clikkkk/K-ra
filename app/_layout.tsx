import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider as KoraThemeProvider, useTheme } from '@/lib/theme/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on a modal route keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <KoraThemeProvider>
      <RootLayoutNav />
    </KoraThemeProvider>
  );
}

function NavigationWrapper() {
  const { colors } = useTheme();

  const CustomTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.accent,
      background: '#15140F',
      card: '#15140F',
      text: '#F4F2EE',
      border: '#302E26',
      notification: colors.accent,
    },
  };

  return (
    <ThemeProvider value={CustomTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#15140F',
          },
          headerTintColor: colors.accent,
          headerTitleStyle: {
            color: '#F4F2EE',
            fontWeight: '600',
            fontSize: 16,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="homebrew/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  return <NavigationWrapper />;
}
