import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { seedNestestGame } from '@/lib/emulator/devSeed';
import { clearProvisionedEmulatorAssets } from '@/lib/emulator/provision';
import { clearHomebrewCatalogCache } from '@/lib/homebrew/cache';
import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function AjustesScreen() {
  const [testRomError, setTestRomError] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleRunTestRom() {
    setTestRomError(null);
    try {
      const gameId = await seedNestestGame();
      router.push(`/player/${gameId}`);
    } catch (e) {
      setTestRomError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleGamepadMapping() {
    Alert.alert('Próximamente', 'El mapeo de mandos físicos todavía no está disponible.');
  }

  function handleClearCache() {
    Alert.alert(
      'Borrar caché',
      'Se van a liberar los archivos temporales del emulador y del catálogo homebrew. Tu biblioteca y tus partidas guardadas no se ven afectadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            setClearingCache(true);
            clearProvisionedEmulatorAssets();
            clearHomebrewCatalogCache();
            setClearingCache(false);
          },
        },
      ]
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <View style={styles.list}>
        <SettingsRow
          icon="game-controller-outline"
          label="Mapeo de mandos"
          onPress={handleGamepadMapping}
        />
        <SettingsRow
          icon="color-palette-outline"
          label="Tema"
          onPress={() => router.push('/ajustes/theme')}
        />
        <SettingsRow
          icon="trash-outline"
          label={clearingCache ? 'Borrando...' : 'Borrar caché'}
          onPress={handleClearCache}
        />
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutText}>Kōra v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Text style={styles.aboutSubtext}>
          Motor de emulación: EmulatorJS. Cores: fceumm, snes9x, mgba (libretro/RetroArch).
        </Text>
      </View>

      {__DEV__ && (
        <View style={styles.devSection}>
          <Button label="Dev: correr ROM de prueba (nestest)" onPress={handleRunTestRom} />
          {testRomError && <Text style={styles.error}>{testRomError}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.size.md,
  },
  aboutSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  aboutText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  aboutSubtext: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  devSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
  },
});
