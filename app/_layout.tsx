import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { initDatabase } from '@/src/db';
import i18n, { initI18n, normalizeLanguage } from '@/src/i18n';
import { AppThemeProvider, useAppTheme } from '@/src/theme/AppThemeProvider';

function PaperIcon({
  name,
  color,
  size,
}: {
  name: string;
  color?: string;
  size: number;
}) {
  return (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color}
      size={size}
    />
  );
}

function ThemedApp() {
  const { i18n: i18nInstance } = useTranslation();
  const language = normalizeLanguage(i18nInstance.language);
  const { ready: themeReady, colorScheme, paperTheme, surfaces } =
    useAppTheme();
  const [bootReady, setBootReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initI18n();
        await initDatabase();
        if (!cancelled) {
          setBootReady(true);
        }
      } catch {
        if (!cancelled) {
          setError(i18n.t('errors.appStartFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ready = bootReady && themeReady;

  const content = error ? (
    <View style={styles.center}>
      <Text variant="bodyLarge">{error}</Text>
    </View>
  ) : !ready ? (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  ) : (
    <Stack
      key={language}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );

  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        icon: (props) => <PaperIcon {...props} />,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'auto'} />
      {isDark ? (
        <View
          style={[
            styles.background,
            { backgroundColor: surfaces.appBackground },
          ]}
        >
          {content}
        </View>
      ) : (
        <ImageBackground
          source={require('../assets/backgrounds/gonext-bg.png')}
          style={styles.background}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      )}
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AppThemeProvider>
          <ThemedApp />
        </AppThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
});
