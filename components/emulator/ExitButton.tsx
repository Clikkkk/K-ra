import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/lib/theme/tokens';

export function ExitButton() {
  const insets = useSafeAreaInsets();

  function handlePress() {
    Alert.alert('¿Salir del juego?', 'El progreso sin guardar se va a perder.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  return (
    <Pressable
      style={[styles.button, { top: insets.top + spacing.sm, left: insets.left + spacing.sm }]}
      onPress={handlePress}
      hitSlop={spacing.sm}
    >
      <Ionicons name="close" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
});
