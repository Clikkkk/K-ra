import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

type QuickMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onRestart: () => void;
  onExit: () => void;
  saveSlotsExist: boolean[];
  smoothing: boolean;
  onToggleSmoothing: (value: boolean) => void;
};

export function QuickMenu({
  visible,
  onClose,
  onSave,
  onLoad,
  onRestart,
  onExit,
  saveSlotsExist,
  smoothing,
  onToggleSmoothing,
}: QuickMenuProps) {
  const [selectedSlot, setSelectedSlot] = useState(0);
  const { colors } = useTheme();

  function handleExitPress() {
    Alert.alert('¿Salir del juego?', 'El progreso sin guardar se va a perder.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: onExit },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Opciones</Text>

          <View style={styles.slotSection}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Slot de guardado</Text>
            <View style={styles.slotRow}>
              {[0, 1, 2].map((slot) => {
                const isActive = selectedSlot === slot;
                const hasState = saveSlotsExist[slot];
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.slotChip,
                      { borderColor: colors.border },
                      isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                      !isActive && hasState && { borderColor: colors.accent + '66' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        { color: colors.textMuted },
                        isActive && styles.slotTextActive,
                        !isActive && hasState && { color: colors.text },
                      ]}
                    >
                      Slot {slot + 1} {hasState && '•'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actionRow}>
            <Button
              label="Guardar"
              icon="save-outline"
              onPress={() => onSave(selectedSlot)}
              style={styles.actionButton}
            />
            <Button
              label="Cargar"
              icon="reload-outline"
              variant="secondary"
              onPress={() => onLoad(selectedSlot)}
              disabled={!saveSlotsExist[selectedSlot]}
              style={styles.actionButton}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Suavizado de píxeles</Text>
            <Switch
              value={smoothing}
              onValueChange={onToggleSmoothing}
              trackColor={{ false: '#35332C', true: colors.accentMuted }}
              thumbColor={smoothing ? colors.accent : '#6D6960'}
            />
          </View>

          <Button
            label="Reiniciar juego"
            icon="refresh-outline"
            variant="secondary"
            onPress={onRestart}
            style={styles.fullButton}
          />

          <View style={styles.divider} />

          <Button
            label="Volver a jugar"
            icon="play-outline"
            onPress={onClose}
            style={styles.fullButton}
          />
          <Button
            label="Salir"
            icon="exit-outline"
            variant="ghost"
            onPress={handleExitPress}
            style={styles.fullButton}
          />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 20, 15, 0.75)',
  },
  card: {
    width: 300,
    gap: spacing.md,
    backgroundColor: '#1E1D18',
    borderColor: '#35332C',
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  slotSection: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  slotChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: '#15140F',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontSize: 11,
  },
  slotTextActive: {
    color: '#15140F',
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.sm,
  },
  fullButton: {
    width: '100%',
    borderRadius: radii.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: typography.size.sm,
  },
});
