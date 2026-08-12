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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { listTrips } from '@/src/db';
import { UI } from '@/src/theme/ui';
import { formatDateLabel } from '@/src/utils/dates';
import type { Trip } from '@/src/types';

function tripDatesLabel(trip: Trip): string | null {
  if (!trip.startDate && !trip.endDate) {
    return null;
  }
  const start = formatDateLabel(trip.startDate);
  const end = formatDateLabel(trip.endDate);
  if (trip.startDate && trip.endDate) {
    return `${start} — ${end}`;
  }
  if (trip.startDate) {
    return `с ${start}`;
  }
  return `до ${end}`;
}

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      setError(e instanceof Error ? e.message : 'Не удалось загрузить поездки');
    } finally {
      setLoading(false);
    }
  }, []);

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
        title="Поездки"
        titleIcon="bag-suitcase"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={styles.panel}>
          {loading ? (
            <Text style={styles.message}>Загрузка…</Text>
          ) : sortedTrips.length === 0 ? (
            <Text style={styles.message}>Пока нет сохранённых поездок</Text>
          ) : (
            <FlatList
              data={sortedTrips}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const dates = tripDatesLabel(item);
                const placesCount = item.places.length;
                const visitedCount = item.places.filter((p) => p.visited).length;
                return (
                  <Pressable
                    onPress={() => router.push(`/trips/${item.id}`)}
                    style={styles.listItem}
                    accessibilityRole="button"
                    accessibilityLabel={`Открыть ${item.title}`}
                  >
                    <MaterialCommunityIcons
                      name="bag-suitcase"
                      size={24}
                      color={UI.primary}
                      style={styles.tripIcon}
                    />
                    <View style={styles.listText}>
                      <View style={styles.titleRow}>
                        <Text
                          variant="titleMedium"
                          numberOfLines={1}
                          style={styles.tripTitle}
                        >
                          {item.title}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={UI.primary}
                        />
                      </View>
                      {item.current ? (
                        <Text variant="bodySmall" style={styles.currentBadge}>
                          Текущая поездка
                        </Text>
                      ) : null}
                      {dates ? (
                        <Text
                          variant="bodySmall"
                          numberOfLines={1}
                          style={styles.meta}
                        >
                          {dates}
                        </Text>
                      ) : null}
                      <Text variant="bodySmall" style={styles.meta}>
                        {placesCount === 0
                          ? 'Мест пока нет'
                          : `Мест: ${visitedCount}/${placesCount}`}
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
            Добавить
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
    color: UI.mutedText,
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
