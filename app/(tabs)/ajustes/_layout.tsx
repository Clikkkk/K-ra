import { Stack } from 'expo-router';

export default function AjustesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#15140F',
        },
        headerTintColor: '#C9834A',
        headerTitleStyle: {
          color: '#F4F2EE',
          fontWeight: '600',
          fontSize: 16,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="theme" options={{ title: 'Tema' }} />
    </Stack>
  );
}
