import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';

export default function PlacesScreen() {
  const router = useRouter();

  return (
    <ScreenScaffold title="Места">
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => router.push('/places/new')}>
          Добавить место
        </Button>
        <Button mode="outlined" onPress={() => router.push('/places/1')}>
          Пример карточки места
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
