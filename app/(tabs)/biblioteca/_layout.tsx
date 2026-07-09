import { Stack } from 'expo-router';

export default function BibliotecaLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="import" options={{ title: 'Importar ROM' }} />
    </Stack>
  );
}
