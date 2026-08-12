import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { getCurrentTrip, getPlaceById } from '@/src/db';
import { openPlaceInNavigator, openPlaceOnMap } from '@/src/services';
import {
  TRIP_BUTTON,
  tripButtonContentStyle,
  tripButtonTheme,
  tripFilledButtonStyle,
  tripFilledIconLabelStyle,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
} from '@/src/theme/tripButtons';
import { UI } from '@/src/theme/ui';
import { isTripEnded } from '@/src/utils/dates';
import type { Place, Trip, TripPlace } from '@/src/types';

type EmptyKind = 'no-current' | 'ended' | 'no-places' | 'all-visited';

type NextPlaceData = {
  trip: Trip;
  tripPlace: TripPlace;
  place: Place | null;
};

function tripIcon(name: keyof typeof MaterialCommunityIcons.glyphMap) {
  return ({ color }: { color: string }) => (
    <MaterialCommunityIcons
      name={name}
      size={TRIP_BUTTON.iconSize}
      color={color}
    />
  );
}

export default function NextPlaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyKind, setEmptyKind] = useState<EmptyKind | null>(null);
  const [emptyTripId, setEmptyTripId] = useState<number | null>(null);
  const [nextPlace, setNextPlace] = useState<NextPlaceData | null>(null);

  const loadNextPlace = useCallback(async () => {
    setLoading(true);
    try {
      const trip = await getCurrentTrip();

      if (!trip) {
        setNextPlace(null);
        setEmptyTripId(null);
        setEmptyKind('no-current');
        setError(null);
        return;
      }

      if (isTripEnded(trip.endDate)) {
        setNextPlace(null);
        setEmptyTripId(null);
        setEmptyKind('ended');
        setError(null);
        return;
      }

      if (trip.places.length === 0) {
        setNextPlace(null);
        setEmptyTripId(trip.id);
        setEmptyKind('no-places');
        setError(null);
        return;
      }

      const tripPlace = trip.places.find((item) => !item.visited) ?? null;
      if (!tripPlace) {
        setNextPlace(null);
        setEmptyTripId(trip.id);
        setEmptyKind('all-visited');
        setError(null);
        return;
      }

      const place = await getPlaceById(tripPlace.placeId);
      setEmptyKind(null);
      setEmptyTripId(null);
      setNextPlace({ trip, tripPlace, place });
      setError(null);
    } catch (e) {
      setNextPlace(null);
      setEmptyKind(null);
      setEmptyTripId(null);
      setError(
        e instanceof Error
          ? e.message
          : 'Не удалось загрузить следующее место',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNextPlace();
    }, [loadNextPlace]),
  );

  const handleOpenMap = async () => {
    try {
      await openPlaceOnMap(nextPlace?.place?.dd ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Для этого места не указаны корректные координаты',
      );
    }
  };

  const handleOpenNavigator = async () => {
    try {
      await openPlaceInNavigator(nextPlace?.place?.dd ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Для этого места не указаны корректные координаты',
      );
    }
  };

  const orderNumber = nextPlace
    ? nextPlace.trip.places.findIndex(
        (item) => item.id === nextPlace.tripPlace.id,
      ) + 1
    : 0;
  const placeName =
    nextPlace?.place?.name ??
    (nextPlace ? `Место #${nextPlace.tripPlace.placeId}` : '');
  const description = nextPlace?.place?.description.trim() ?? '';
  const dd = nextPlace?.place?.dd ?? null;

  const emptyMessage =
    emptyKind === 'no-current'
      ? 'Нет текущей поездки'
      : emptyKind === 'ended'
        ? 'Активной текущей поездки сейчас нет'
        : emptyKind === 'no-places'
          ? 'В текущую поездку пока не добавлены места'
          : emptyKind === 'all-visited'
            ? 'Все места уже посещены'
            : null;

  const emptyAction =
    emptyKind === 'no-current' || emptyKind === 'ended'
      ? {
          label: 'К поездкам',
          onPress: () => router.push('/trips'),
        }
      : emptyKind === 'no-places' || emptyKind === 'all-visited'
        ? {
            label: 'Открыть поездку',
            onPress: () => {
              if (emptyTripId != null) {
                router.push(`/trips/${emptyTripId}`);
              }
            },
          }
        : null;

  return (
    <>
      <ScreenScaffold
        title="Следующее место"
        titleIcon="map-marker-right"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {loading ? (
          <Text>Загрузка…</Text>
        ) : nextPlace ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
          >
            <View style={styles.panel}>
              <Text variant="titleSmall" style={styles.firstLabel}>
                Поездка
              </Text>
              <Text variant="bodyLarge">{nextPlace.trip.title}</Text>

              <Text variant="titleSmall" style={styles.label}>
                В маршруте
              </Text>
              <Text variant="bodyLarge">Место {orderNumber}</Text>

              <Text variant="headlineSmall" style={styles.placeName}>
                {placeName}
              </Text>

              {description ? (
                <>
                  <Text variant="titleSmall" style={styles.label}>
                    Описание
                  </Text>
                  <Text variant="bodyLarge">{description}</Text>
                </>
              ) : null}

              {dd ? (
                <>
                  <Text variant="titleSmall" style={styles.label}>
                    Координаты (DD)
                  </Text>
                  <Text variant="bodyLarge">{dd}</Text>
                </>
              ) : null}

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  icon={tripIcon('map-marker')}
                  onPress={() => void handleOpenMap()}
                  textColor={UI.primary}
                  theme={tripButtonTheme}
                  style={tripOutlineButtonStyle}
                  contentStyle={tripButtonContentStyle}
                  labelStyle={tripOutlineIconLabelStyle}
                >
                  Открыть на карте
                </Button>
                <Button
                  mode="contained"
                  icon={tripIcon('navigation-variant')}
                  onPress={() => void handleOpenNavigator()}
                  buttonColor={UI.primary}
                  textColor={UI.onPrimary}
                  theme={tripButtonTheme}
                  style={tripFilledButtonStyle}
                  contentStyle={tripButtonContentStyle}
                  labelStyle={tripFilledIconLabelStyle}
                >
                  Открыть в навигаторе
                </Button>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.message}>
              {emptyMessage ?? error ?? 'Не удалось загрузить следующее место'}
            </Text>
            {emptyAction ? (
              <PrimaryButton onPress={emptyAction.onPress}>
                {emptyAction.label}
              </PrimaryButton>
            ) : null}
          </View>
        )}
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
    gap: 4,
  },
  firstLabel: {
    opacity: 0.7,
  },
  label: {
    marginTop: 14,
    opacity: 0.7,
  },
  placeName: {
    marginTop: 18,
    marginBottom: 4,
  },
  actions: {
    marginTop: 18,
    gap: UI.buttonGap,
  },
  message: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.75,
  },
});
