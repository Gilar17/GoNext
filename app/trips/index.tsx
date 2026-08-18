import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { listTrips } from '@/src/db';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { UI } from '@/src/theme/ui';
import { formatDateLabel } from '@/src/utils/dates';
import { useLocalizedUserText } from '@/src/utils/localizeUserText';
import type { Trip } from '@/src/types';
import type { TFunction } from 'i18next';

function tripDatesLabel(trip: Trip, t: TFunction): string | null {
  if (!trip.startDate && !trip.endDate) {
    return null;
  }
  const start = formatDateLabel(trip.startDate);
  const end = formatDateLabel(trip.endDate);
  if (trip.startDate && trip.endDate) {
    return `${start} — ${end}`;
  }
  if (trip.startDate) {
    return t('trips.datesFrom', { date: start });
  }
  return t('trips.datesUntil', { date: end });
}

export default function TripsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const loc = useLocalizedUserText();
  const insets = useSafeAreaInsets();
  const { surfaces, accent } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listMaxHeight = Math.max(
    96,
    windowHeight - insets.top - insets.bottom - 260,
  );

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTrips();
      setTrips(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.loadTripsFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadTrips();
    }, [loadTrips]),
  );

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      if (a.current === b.current) {
        return 0;
      }
      return a.current ? -1 : 1;
    });
  }, [trips]);

  return (
    <View style={styles.root}>
      <ScreenScaffold
        title={t('trips.title')}
        titleIcon="bag-suitcase"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
          {loading ? (
            <Text style={styles.message}>{t('common.loading')}</Text>
          ) : sortedTrips.length === 0 ? (
            <Text style={styles.message}>{t('trips.empty')}</Text>
          ) : (
            <FlatList
              data={sortedTrips}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const dates = tripDatesLabel(item, t);
                const placesCount = item.places.length;
                const visitedCount = item.places.filter((p) => p.visited).length;
                return (
                  <Pressable
                    onPress={() => router.push(`/trips/${item.id}`)}
                    style={[
                      styles.listItem,
                      { backgroundColor: surfaces.cardItem },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.openItem', { name: loc(item.title) })}
                  >
                    <MaterialCommunityIcons
                      name="bag-suitcase"
                      size={24}
                      color={accent}
                      style={styles.tripIcon}
                    />
                    <View style={styles.listText}>
                      <View style={styles.titleRow}>
                        <Text
                          variant="titleMedium"
                          numberOfLines={1}
                          style={styles.tripTitle}
                        >
                          {loc(item.title)}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={accent}
                        />
                      </View>
                      {item.current ? (
                        <Text variant="bodySmall" style={[styles.currentBadge, { color: accent }]}>
                          {t('trips.currentTrip')}
                        </Text>
                      ) : null}
                      {dates ? (
                      <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={[styles.meta, { color: surfaces.mutedText }]}
                      >
                          {dates}
                        </Text>
                      ) : null}
                      <Text
                        variant="bodySmall"
                        style={[styles.meta, { color: surfaces.mutedText }]}
                      >
                        {placesCount === 0
                          ? t('trips.placesNone')
                          : t('trips.placesCount', {
                              visited: visitedCount,
                              total: placesCount,
                            })}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          <PrimaryButton
            icon="plus"
            onPress={() => router.push('/trips/new')}
            style={styles.addButton}
          >
            {t('common.add')}
          </PrimaryButton>
        </View>
      </ScreenScaffold>

      <Snackbar visible={error != null} onDismiss={() => setError(null)}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingTop: 12,
  },
  panel: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tripIcon: {
    marginTop: 2,
    marginRight: UI.iconTextGap,
  },
  listText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripTitle: {
    flex: 1,
    minWidth: 0,
  },
  currentBadge: {
    color: UI.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  meta: {
    marginTop: 2,
  },
  message: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.75,
  },
  addButton: {
    marginTop: UI.buttonGap,
  },
});
