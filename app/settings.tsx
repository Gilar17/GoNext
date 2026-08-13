import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import {
  TRIP_BUTTON,
  tripButtonContentStyle,
  tripButtonTheme,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
} from '@/src/theme/tripButtons';
import { UI } from '@/src/theme/ui';

const APP_VERSION = Constants.expoConfig?.version?.trim() || null;

function settingsIcon(name: keyof typeof MaterialCommunityIcons.glyphMap) {
  return ({ color }: { color: string }) => (
    <MaterialCommunityIcons
      name={name}
      size={TRIP_BUTTON.iconSize}
      color={color}
    />
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);

  const handleOpenAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setError('Не удалось открыть настройки приложения');
    }
  };

  return (
    <>
      <ScreenScaffold
        title="Настройки"
        titleIcon="cog"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator
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

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              Данные
            </Text>
            <Text style={styles.info}>
              Данные хранятся локально на устройстве.
            </Text>
            <Text style={styles.infoFollow}>
              Резервное копирование и синхронизация пока не поддерживаются.
            </Text>

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              Разрешения
            </Text>
            <Text style={styles.info}>
              Геолокация используется только для уточнения координат при
              редактировании места.
            </Text>

            <Button
              mode="outlined"
              icon={settingsIcon('cellphone-cog')}
              onPress={() => void handleOpenAppSettings()}
              textColor={UI.primary}
              theme={tripButtonTheme}
              style={[tripOutlineButtonStyle, styles.settingsButton]}
              contentStyle={tripButtonContentStyle}
              labelStyle={tripOutlineIconLabelStyle}
            >
              Настройки разрешений
            </Button>

            {APP_VERSION ? (
              <Text style={styles.version}>Версия {APP_VERSION}</Text>
            ) : null}
          </View>
        </ScrollView>
      </ScreenScaffold>

      <Snackbar visible={error != null} onDismiss={() => setError(null)}>
        {error}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
  scroll: {
    paddingBottom: 24,
    flexGrow: 1,
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
  sectionSpaced: {
    opacity: 0.7,
    marginTop: 20,
    marginBottom: 8,
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
  info: {
    fontSize: 14,
    lineHeight: 20,
    color: UI.mutedText,
  },
  infoFollow: {
    fontSize: 14,
    lineHeight: 20,
    color: UI.mutedText,
    marginTop: 6,
  },
  settingsButton: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
    color: UI.mutedText,
    marginTop: 16,
  },
});
