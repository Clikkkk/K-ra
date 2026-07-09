import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { AccentTheme, ControllerSkin, useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

const ACCENT_OPTIONS: { id: AccentTheme; label: string; color: string }[] = [
  { id: 'terracotta', label: 'Terracota', color: '#C9834A' },
  { id: 'glacier', label: 'Verde Glaciar', color: '#4AC998' },
  { id: 'cyberpunk', label: 'Azul Cyberpunk', color: '#00E5FF' },
];

const SKIN_OPTIONS: { id: ControllerSkin; label: string; desc: string }[] = [
  { id: 'minimalist', label: 'Minimalist', desc: 'Diseño oscuro, moderno y sutil' },
  { id: 'retro', label: 'Retro (Famicom)', desc: 'Botones clásicos bordo con letras doradas' },
  { id: 'translucent', label: 'Translucent Glass', desc: 'Botones escarchados con relieve blanco' },
];

export default function ThemeSettingsScreen() {
  const { accentTheme, controllerSkin, colors, changeAccentTheme, changeControllerSkin } =
    useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Color de Acento</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          Define el tono principal para botones, pestañas y llamadas a la acción.
        </Text>

        <View style={styles.colorGrid}>
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = accentTheme === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[
                  styles.colorCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? opt.color : colors.border,
                  },
                ]}
                onPress={() => changeAccentTheme(opt.id)}
              >
                <View style={[styles.colorBubble, { backgroundColor: opt.color }]} />
                <Text
                  style={[
                    styles.colorLabel,
                    {
                      color: isSelected ? colors.text : colors.textMuted,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Skins de Mando Táctil</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          Personaliza la estética visual del gamepad virtual en pantalla.
        </Text>

        <View style={styles.skinList}>
          {SKIN_OPTIONS.map((opt) => {
            const isSelected = controllerSkin === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[
                  styles.skinCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => changeControllerSkin(opt.id)}
              >
                <View style={styles.skinInfo}>
                  <Text
                    style={[
                      styles.skinLabel,
                      {
                        color: isSelected ? colors.accent : colors.text,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.skinDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    marginBottom: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },
  colorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  colorBubble: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
  },
  colorLabel: {
    fontSize: 11,
  },
  skinList: {
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },
  skinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  skinInfo: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 2,
  },
  skinLabel: {
    fontSize: typography.size.sm,
  },
  skinDesc: {
    fontSize: 10,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginLeft: spacing.sm,
  },
});
