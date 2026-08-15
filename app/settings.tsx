import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterToggleButton } from '@/src/components/FilterToggleButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import {
  normalizeLanguage,
  setAppLanguage,
  type AppLanguage,
} from '@/src/i18n';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { PRIMARY_COLORS } from '@/src/theme/primaryColors';
import {
  TRIP_BUTTON,
  tripButtonContentStyle,
  tripButtonTheme,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
  useAccentStyles,
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
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme, primary, setPrimary, surfaces } =
    useAppTheme();
  const accent = useAccentStyles();
  const [error, setError] = useState<string | null>(null);
  const language = normalizeLanguage(i18n.language);

  const handleOpenAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setError(t('errors.openSettingsFailed'));
    }
  };

  const handleLanguageChange = (next: AppLanguage) => {
    void setAppLanguage(next);
  };

  return (
    <>
      <ScreenScaffold
        title={t('settings.title')}
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
          <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
            <Text variant="titleSmall" style={styles.section}>
              {t('settings.about')}
            </Text>
            <Text style={[styles.brand, { color: primary }]}>{t('app.name')}</Text>
            <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            <Text style={styles.body}>
              {t('app.aboutBody')}
            </Text>

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              {t('settings.language')}
            </Text>
            <View style={styles.themeRow}>
              <FilterToggleButton
                label="Русский"
                active={language === 'ru'}
                onPress={() => handleLanguageChange('ru')}
              />
              <FilterToggleButton
                label="English"
                active={language === 'en'}
                onPress={() => handleLanguageChange('en')}
              />
            </View>

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              {t('settings.theme')}
            </Text>
            <View style={styles.themeRow}>
              <FilterToggleButton
                label={t('settings.themeLight')}
                icon="white-balance-sunny"
                active={colorScheme === 'light'}
                onPress={() => setColorScheme('light')}
              />
              <FilterToggleButton
                label={t('settings.themeDark')}
                icon="moon-waning-crescent"
                active={colorScheme === 'dark'}
                onPress={() => setColorScheme('dark')}
              />
            </View>

            <View style={styles.swatchRow}>
              {PRIMARY_COLORS.map((color) => {
                const selected = primary === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setPrimary(color)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('settings.choosePrimaryColor')}
                    style={styles.swatchHit}
                  >
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: color },
                        selected ? styles.swatchSelected : null,
                      ]}
                    >
                      {selected ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color="#FFFFFF"
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              {t('settings.data')}
            </Text>
            <Text style={[styles.info, { color: surfaces.mutedText }]}>
              {t('settings.dataLocal')}
            </Text>
            <Text style={[styles.infoFollow, { color: surfaces.mutedText }]}>
              {t('settings.dataBackup')}
            </Text>

            <Text variant="titleSmall" style={styles.sectionSpaced}>
              {t('settings.permissions')}
            </Text>
            <Text style={[styles.info, { color: surfaces.mutedText }]}>
              {t('settings.permissionsHint')}
            </Text>

            <Button
              mode="outlined"
              icon={settingsIcon('cellphone-cog')}
              onPress={() => void handleOpenAppSettings()}
              textColor={accent.primary}
              theme={tripButtonTheme}
              style={[
                tripOutlineButtonStyle,
                accent.outline,
                styles.settingsButton,
              ]}
              contentStyle={tripButtonContentStyle}
              labelStyle={[tripOutlineIconLabelStyle, accent.label]}
            >
              {t('settings.openPermissions')}
            </Button>

            {APP_VERSION ? (
              <Text style={[styles.version, { color: surfaces.mutedText }]}>
                {t('common.version', { version: APP_VERSION })}
              </Text>
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
  themeRow: {
    flexDirection: 'row',
    gap: UI.filterGap,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  swatchHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  info: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoFollow: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  settingsButton: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 16,
  },
});
