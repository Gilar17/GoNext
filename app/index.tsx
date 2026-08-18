import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { UI } from '@/src/theme/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { surfaces, primary, accent } = useAppTheme();
  const appName = t('app.name');

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title={appName} />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.composition}>
          <View style={styles.hero}>
            <Text style={[styles.brand, { color: accent }]}>{appName}</Text>
            <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            <Text style={[styles.tagline, { color: surfaces.mutedText }]}>
              {t('app.tagline')}
            </Text>
          </View>

          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={() => router.push('/places')}
              buttonColor={primary}
              textColor={UI.onPrimary}
              style={styles.button}
            >
              {t('home.places')}
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/trips')}
              buttonColor={primary}
              textColor={UI.onPrimary}
              style={styles.button}
            >
              {t('home.trips')}
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/next')}
              buttonColor={primary}
              textColor={UI.onPrimary}
              style={styles.button}
            >
              {t('home.nextPlace')}
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/settings')}
              buttonColor={primary}
              textColor={UI.onPrimary}
              style={styles.button}
            >
              {t('home.settings')}
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
