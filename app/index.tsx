import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.composition}>
          <View style={styles.hero}>
            <Text style={styles.brand}>GoNext</Text>
            <Text style={styles.subtitle}>Дневник туриста</Text>
            <Text style={styles.tagline}>Путешествия начинаются с плана</Text>
          </View>

          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={() => router.push('/places')}
              style={styles.button}
            >
              Места
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/trips')}
              style={styles.button}
            >
              Поездки
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/next')}
              style={styles.button}
            >
              Следующее место
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/settings')}
              style={styles.button}
            >
              Настройки
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  composition: {
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  buttons: {
    gap: 12,
  },
  button: {
    borderRadius: 4,
  },
});
