import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { UI } from '@/src/theme/ui';

const APP_VERSION = Constants.expoConfig?.version?.trim() || null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenScaffold
      title="Настройки"
      titleIcon="cog"
      contentStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={styles.panel}>
        <Text variant="titleSmall" style={styles.section}>
          О приложении
        </Text>
        <Text style={styles.brand}>GoNext</Text>
        <Text style={styles.subtitle}>Дневник туриста</Text>
        <Text style={styles.body}>
          Планирование поездок и личный дневник путешественника.
        </Text>
        <Text style={styles.muted}>
          Данные хранятся локально на устройстве.
        </Text>
        {APP_VERSION ? (
          <Text style={styles.version}>Версия {APP_VERSION}</Text>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    opacity: 0.7,
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: UI.primary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 12,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: UI.mutedText,
    marginTop: 12,
  },
  version: {
    fontSize: 14,
    color: UI.mutedText,
    marginTop: 8,
  },
});
