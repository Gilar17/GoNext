import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  useAccentStyles,
} from '@/src/theme/tripButtons';
import { UI } from '@/src/theme/ui';
import { isTripEnded } from '@/src/utils/dates';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { surfaces } = useAppTheme();
  const accent = useAccentStyles();

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
          : t('errors.loadNextFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

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
          : t('errors.invalidCoordinates'),
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
          : t('errors.invalidCoordinates'),
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
    (nextPlace ? t('common.placeFallback', { id: nextPlace.tripPlace.placeId }) : '');
  const description = nextPlace?.place?.description.trim() ?? '';
  const dd = nextPlace?.place?.dd ?? null;

  const emptyMessage =
    emptyKind === 'no-current'
      ? t('next.noCurrent')
      : emptyKind === 'ended'
        ? t('next.ended')
        : emptyKind === 'no-places'
          ? t('next.noPlaces')
          : emptyKind === 'all-visited'
            ? t('next.allVisited')
            : null;

  const emptyAction =
    emptyKind === 'no-current' || emptyKind === 'ended'
      ? {
          label: t('next.toTrips'),
          onPress: () => router.push('/trips'),
        }
      : emptyKind === 'no-places' || emptyKind === 'all-visited'
        ? {
            label: t('next.openTrip'),
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
        title={t('next.title')}
        titleIcon="map-marker-right"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {loading ? (
          <Text>{t('common.loading')}</Text>
        ) : nextPlace ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
          >
            <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
              <Text variant="titleSmall" style={styles.firstLabel}>
                {t('next.trip')}
              </Text>
              <Text variant="bodyLarge">{nextPlace.trip.title}</Text>

              <Text variant="titleSmall" style={styles.label}>
                {t('next.inRoute')}
              </Text>
              <Text variant="bodyLarge">{t('next.placeNumber', { n: orderNumber })}</Text>

              <Text variant="headlineSmall" style={styles.placeName}>
                {placeName}
              </Text>

              {description ? (
                <>
                  <Text variant="titleSmall" style={styles.label}>
                    {t('next.description')}
                  </Text>
                  <Text variant="bodyLarge">{description}</Text>
                </>
              ) : null}

              {dd ? (
                <>
                  <Text variant="titleSmall" style={styles.label}>
                    {t('next.coordinates')}
                  </Text>
                  <Text variant="bodyLarge">{dd}</Text>
                </>
              ) : null}

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  icon={tripIcon('map-marker')}
                  onPress={() => void handleOpenMap()}
                  textColor={accent.fg}
                  theme={tripButtonTheme}
                  style={[tripOutlineButtonStyle, accent.outline]}
                  contentStyle={tripButtonContentStyle}
                  labelStyle={[tripOutlineIconLabelStyle, accent.label]}
                >
                  {t('next.openOnMap')}
                </Button>
                <Button
                  mode="contained"
                  icon={tripIcon('navigation-variant')}
                  onPress={() => void handleOpenNavigator()}
                  buttonColor={accent.fill}
                  textColor={UI.onPrimary}
                  theme={tripButtonTheme}
                  style={[tripFilledButtonStyle, accent.filled]}
                  contentStyle={tripButtonContentStyle}
                  labelStyle={tripFilledIconLabelStyle}
                >
                  {t('next.openInNavigator')}
                </Button>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
            <Text style={styles.message}>
              {emptyMessage ?? error ?? t('errors.loadNextFailed')}
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
