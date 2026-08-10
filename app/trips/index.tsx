import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';

export default function TripsScreen() {
  const router = useRouter();

  return (
    <ScreenScaffold title="Поездки">
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => router.push('/trips/new')}>
          Создать поездку
        </Button>
        <Button mode="outlined" onPress={() => router.push('/trips/1')}>
          Пример деталей поездки
        </Button>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
