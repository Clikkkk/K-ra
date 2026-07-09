import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player</Text>
      <Text>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
