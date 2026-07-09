import { Modal, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/lib/theme/tokens';

type QuickMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExit: () => void;
  hasSaveState: boolean;
  smoothing: boolean;
  onToggleSmoothing: (value: boolean) => void;
};

export function QuickMenu({
  visible,
  onClose,
  onSave,
  onLoad,
  onExit,
  hasSaveState,
  smoothing,
  onToggleSmoothing,
}: QuickMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <Text style={styles.title}>Menú</Text>

          <Button label="Guardar partida" onPress={onSave} />
          <Button label="Cargar partida" onPress={onLoad} disabled={!hasSaveState} />

          <View style={styles.smoothingRow}>
            <Text style={styles.smoothingLabel}>Suavizado de píxeles</Text>
            <Switch value={smoothing} onValueChange={onToggleSmoothing} />
          </View>

          <Button label="Volver al juego" variant="secondary" onPress={onClose} />
          <Button label="Salir" variant="ghost" onPress={onExit} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: 280,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  smoothingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  smoothingLabel: {
    color: colors.text,
    fontSize: typography.size.sm,
  },
});
