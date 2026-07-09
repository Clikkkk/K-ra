import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { insertImportedGame } from '@/lib/db/games';
import { detectSystemFromFileName } from '@/lib/rom/detectSystem';
import { storeRom } from '@/lib/rom/storeRom';
import { spacing } from '@/lib/theme/tokens';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
}

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export default function ImportRomScreen() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleImportPress() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*',
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const file = result.assets[0];
    const detection = detectSystemFromFileName(file.name);

    if (!detection.ok) {
      showToast(detection.reason);
      return;
    }

    setImporting(true);
    try {
      const id = generateId();
      const fileUri = storeRom(file.uri, id, getExtension(file.name));
      await insertImportedGame({
        id,
        title: titleFromFileName(file.name),
        system: detection.system,
        file_uri: fileUri,
      });
      router.back();
    } catch {
      showToast('No pudimos importar este archivo. Probá con otro o intentá de nuevo.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Importar ROM</Text>
      <Text style={styles.subtitle}>Elegí un archivo .nes, .sfc o .gba de tu dispositivo.</Text>
      <Button
        label={importing ? 'Importando...' : 'Elegir archivo'}
        onPress={handleImportPress}
        disabled={importing}
      />
      <Toast message={toastMessage ?? ''} visible={!!toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
  },
});
