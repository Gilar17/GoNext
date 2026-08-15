import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import {
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterToggleButton } from '@/src/components/FilterToggleButton';
import { PlacePhotoGallery } from '@/src/components/PlacePhotoGallery';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { TripPlaceNotesSection } from '@/src/components/TripPlaceNotesSection';
import {
  addPlaceToTrip,
  addTripPlacePhoto,
  deleteTrip,
  deleteTripPlacePhoto,
  getTripById,
  listPlaces,
  markTripPlaceVisited,
  removePlaceFromTrip,
  reorderTripPlaces,
  setCurrentTrip,
  updateTripPlaceNotes,
} from '@/src/db';
import { openPlaceOnMap } from '@/src/services';
import {
  TRIP_BUTTON,
  tripButtonTheme,
  tripFilledButtonStyle,
  tripFilledIconLabelStyle,
  tripFilledLabelStyle,
  tripButtonContentStyle,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
  tripOutlineLabelStyle,
  useAccentStyles,
} from '@/src/theme/tripButtons';
import { UI } from '@/src/theme/ui';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import {
  formatDateLabel,
  formatDateTimeLabel,
} from '@/src/utils/dates';
import type { Place, Trip, TripPlace } from '@/src/types';

const HEADER_DELETE = '#BDBDBD';
const HEADER_ACTION_SIZE = 40;

type RouteMode = 'all' | 'plan' | 'diary';

type RouteActionButtonProps = {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
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

function RouteActionButton({
  label,
  icon,
  filled = false,
  disabled = false,
  onPress,
}: RouteActionButtonProps) {
  const accent = useAccentStyles();
  const textColor = disabled
    ? UI.mutedText
    : filled
      ? UI.onPrimary
      : accent.primary;

  return (
    <Button
      mode={filled ? 'contained' : 'outlined'}
      icon={icon ? tripIcon(icon) : undefined}
      disabled={disabled}
      onPress={onPress}
      buttonColor={filled ? accent.primary : undefined}
      textColor={textColor}
      theme={tripButtonTheme}
      style={[
        styles.routeActionButton,
        filled ? tripFilledButtonStyle : tripOutlineButtonStyle,
        filled ? accent.filled : accent.outline,
        disabled ? styles.routeActionDisabled : null,
      ]}
      contentStyle={tripButtonContentStyle}
      labelStyle={[
        icon
          ? filled
            ? tripFilledIconLabelStyle
            : tripOutlineIconLabelStyle
          : filled
            ? tripFilledLabelStyle
            : tripOutlineLabelStyle,
        { color: textColor },
      ]}
    >
      {label}
    </Button>
  );
}

function hasSavedDiaryData(tripPlace: TripPlace): boolean {
  return (
    tripPlace.notes.trim().length > 0 || tripPlace.photos.length > 0
  );
}

/** Сравнивает только локальные календарные даты, без UTC и времени суток. */
function isTripEnded(endDate: string | null): boolean {
  if (!endDate) {
    return false;
  }

  const value = endDate.trim();
  const storageMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const uiMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);

  const year = storageMatch
    ? Number(storageMatch[1])
    : uiMatch
      ? Number(uiMatch[3])
      : NaN;
  const month = storageMatch
    ? Number(storageMatch[2])
    : uiMatch
      ? Number(uiMatch[2])
      : NaN;
  const day = storageMatch
    ? Number(storageMatch[3])
    : uiMatch
      ? Number(uiMatch[1])
      : NaN;

  const parsed = new Date(year, month - 1, day);
  if (
    !Number.isFinite(year) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  const endDateKey = year * 10_000 + month * 100 + day;
  const todayKey =
    today.getFullYear() * 10_000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return endDateKey < todayKey;
}

export default function TripDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { surfaces, primary } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const accent = useAccentStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [placesById, setPlacesById] = useState<Map<number, Place>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [addPlaceVisible, setAddPlaceVisible] = useState(false);
  const [removePlaceId, setRemovePlaceId] = useState<number | null>(null);
  const [cannotUnvisitVisible, setCannotUnvisitVisible] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTrip = useCallback(async () => {
    if (!Number.isFinite(tripId)) {
      setError(t('errors.invalidTripId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [data, allPlaces] = await Promise.all([
        getTripById(tripId),
        listPlaces(),
      ]);
      setTrip(data);
      setPlacesById(new Map(allPlaces.map((place) => [place.id, place])));
      setError(data ? null : t('errors.tripNotFound'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.loadTripFailed'));
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadTrip();
    }, [loadTrip]),
  );

  const filteredPlaces = useMemo(() => {
    if (!trip) {
      return [];
    }
    if (routeMode === 'plan') {
      return trip.places.filter((item) => !item.visited);
    }
    if (routeMode === 'diary') {
      return trip.places.filter((item) => item.visited);
    }
    return trip.places;
  }, [trip, routeMode]);

  const availablePlacesToAdd = useMemo(() => {
    if (!trip) {
      return [];
    }
    const used = new Set(trip.places.map((item) => item.placeId));
    return [...placesById.values()].filter((place) => !used.has(place.id));
  }, [trip, placesById]);

  const pencilLeft = windowWidth / 2 - HEADER_ACTION_SIZE / 2;
  const tripEnded = trip ? isTripEnded(trip.endDate) : false;

  const handleDelete = async () => {
    setDeleteVisible(false);
    try {
      await deleteTrip(tripId);
      router.replace('/trips');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.deleteTripFailed'));
    }
  };

  const handleSetCurrent = async () => {
    if (!trip || isTripEnded(trip.endDate)) {
      return;
    }

    try {
      const updated = await setCurrentTrip(tripId);
      if (updated) {
        setTrip(updated);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.setCurrentTripFailed'),
      );
    }
  };

  const handleReorder = async (tripPlaceId: number, direction: -1 | 1) => {
    if (!trip) {
      return;
    }
    const ids = trip.places.map((item) => item.id);
    const index = ids.indexOf(tripPlaceId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) {
      return;
    }
    const tripPlace = trip.places[index];
    if (tripPlace?.visited) {
      return;
    }

    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    try {
      const places = await reorderTripPlaces(tripId, next);
      setTrip({ ...trip, places });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.reorderFailed'));
    }
  };

  const handleToggleVisited = async (tripPlace: TripPlace) => {
    if (!tripPlace.visited) {
      setBusyId(tripPlace.id);
      try {
        const updated = await markTripPlaceVisited(tripPlace.id, true);
        if (updated && trip) {
          setTrip({
            ...trip,
            places: trip.places.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          });
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : t('errors.visitStatusFailed'),
        );
      } finally {
        setBusyId(null);
      }
      return;
    }

    if (hasSavedDiaryData(tripPlace)) {
      setCannotUnvisitVisible(true);
      return;
    }

    setBusyId(tripPlace.id);
    try {
      const updated = await markTripPlaceVisited(tripPlace.id, false);
      if (updated && trip) {
        setTrip({
          ...trip,
          places: trip.places.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        });
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('errors.visitStatusFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNotes = async (tripPlaceId: number, notes: string) => {
    setBusyId(tripPlaceId);
    try {
      const updated = await updateTripPlaceNotes(tripPlaceId, notes);
      if (updated && trip) {
        setTrip({
          ...trip,
          places: trip.places.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemovePlace = async () => {
    if (removePlaceId == null) {
      return;
    }
    const tripPlaceId = removePlaceId;
    setRemovePlaceId(null);
    try {
      await removePlaceFromTrip(tripPlaceId);
      await loadTrip();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.removePlaceFromTripFailed'),
      );
    }
  };

  const handleAddPlace = async (placeId: number) => {
    try {
      await addPlaceToTrip(tripId, placeId);
      setAddPlaceVisible(false);
      await loadTrip();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.addPlaceToTripFailed'),
      );
    }
  };

  const handleOpenMap = async (place: Place | undefined) => {
    try {
      await openPlaceOnMap(place?.dd ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('errors.invalidCoordinates'),
      );
    }
  };

  const pickPhotos = async (tripPlaceId: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('errors.galleryDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) {
      return;
    }
    try {
      for (const asset of result.assets) {
        await addTripPlacePhoto(tripPlaceId, asset.uri);
      }
      await loadTrip();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.addPhotoFailed'));
    }
  };

  const takePhoto = async (tripPlaceId: number) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t('errors.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      await addTripPlacePhoto(tripPlaceId, result.assets[0].uri);
      await loadTrip();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.addPhotoFailed'));
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await deleteTripPlacePhoto(photoId);
      await loadTrip();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.deletePhotoFailed'));
    }
  };

  const datesLabel =
    trip && (trip.startDate || trip.endDate)
      ? [
          trip.startDate ? formatDateLabel(trip.startDate) : null,
          trip.endDate ? formatDateLabel(trip.endDate) : null,
        ]
          .filter(Boolean)
          .join(' — ')
      : null;

  return (
    <>
      <ScreenScaffold
        title={t('trips.detailsTitle')}
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
        titleTrailing={
          trip ? (
            <View style={[styles.headerActions, { left: pencilLeft }]}>
              <Pressable
                onPress={() => router.push(`/trips/${trip.id}/edit`)}
                hitSlop={12}
                style={styles.headerAction}
                accessibilityLabel={t('common.edit')}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={22}
                  color={primary}
                />
              </Pressable>
              <Pressable
                onPress={() => setDeleteVisible(true)}
                hitSlop={12}
                style={styles.headerAction}
                accessibilityLabel={t('common.delete')}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={22}
                  color={HEADER_DELETE}
                />
              </Pressable>
            </View>
          ) : null
        }
      >
        {loading ? (
          <Text>{t('common.loading')}</Text>
        ) : trip ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
              <Text variant="headlineSmall" style={styles.tripTitle}>
                {trip.title}
              </Text>

              {trip.current ? (
                <Text style={[styles.currentBadge, { color: primary }]}>
                  {t('trips.currentTrip')}
                </Text>
              ) : tripEnded ? null : (
                <Button
                  mode="outlined"
                  icon={tripIcon('check-circle-outline')}
                  onPress={handleSetCurrent}
                  textColor={primary}
                  theme={tripButtonTheme}
                  style={[styles.outlineButton, accent.outline]}
                  contentStyle={tripButtonContentStyle}
                  labelStyle={[tripOutlineIconLabelStyle, accent.label]}
                >
                  {t('trips.makeCurrent')}
                </Button>
              )}

              <Text variant="titleSmall" style={styles.label}>
                {t('trips.description')}
              </Text>
              <Text variant="bodyLarge">
                {trip.description.trim() || t('common.noDescription')}
              </Text>

              <Text variant="titleSmall" style={styles.labelMuted}>
                {t('trips.dates')}
              </Text>
              <Text variant="bodyMedium" style={styles.mutedValue}>
                {datesLabel ?? t('common.notSpecified')}
              </Text>

              <Text variant="titleSmall" style={styles.labelMuted}>
                {t('trips.created')}
              </Text>
              <Text variant="bodyMedium" style={styles.mutedValue}>
                {formatDateTimeLabel(trip.createdAt)}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                {t('trips.route')}
              </Text>
              <View style={styles.filters}>
                <FilterToggleButton
                  label={t('trips.filterAll')}
                  icon="format-list-bulleted"
                  active={routeMode === 'all'}
                  onPress={() => setRouteMode('all')}
                />
                <FilterToggleButton
                  label={t('trips.filterPlan')}
                  icon="map-marker-path"
                  active={routeMode === 'plan'}
                  onPress={() => setRouteMode('plan')}
                />
                <FilterToggleButton
                  label={t('trips.filterDiary')}
                  icon="book-open-variant"
                  active={routeMode === 'diary'}
                  onPress={() => setRouteMode('diary')}
                />
              </View>

              {filteredPlaces.length === 0 ? (
                <Text style={styles.message}>
                  {trip.places.length === 0
                    ? t('trips.routeEmpty')
                    : routeMode === 'plan'
                      ? t('trips.routeAllVisited')
                      : routeMode === 'diary'
                        ? t('trips.routeNoVisited')
                        : t('trips.noPlaces')}
                </Text>
              ) : (
                filteredPlaces.map((tripPlace, index) => {
                  const place = placesById.get(tripPlace.placeId);
                  const absoluteIndex = trip.places.findIndex(
                    (item) => item.id === tripPlace.id,
                  );
                  const orderNumber =
                    absoluteIndex >= 0 ? absoluteIndex + 1 : index + 1;
                  const isFirst = absoluteIndex <= 0;
                  const isLast =
                    absoluteIndex < 0 ||
                    absoluteIndex >= trip.places.length - 1;
                  const moveLocked = tripPlace.visited;
                  const showDiaryFields = tripPlace.visited;

                  return (
                    <View
                      key={tripPlace.id}
                      style={[
                        styles.tripPlaceCard,
                        { backgroundColor: surfaces.cardItem },
                      ]}
                    >
                      <View style={styles.tripPlaceHeader}>
                        <Text style={[styles.orderBadge, { color: primary }]}>{orderNumber}</Text>
                        <View style={styles.tripPlaceTitleWrap}>
                          <Text variant="titleMedium" numberOfLines={2}>
                            {place?.name ?? t('common.placeFallback', { id: tripPlace.placeId })}
                          </Text>
                        </View>
                        <View style={styles.reorderColumn}>
                          <Pressable
                            onPress={() =>
                              void handleReorder(tripPlace.id, -1)
                            }
                            hitSlop={10}
                            disabled={moveLocked || isFirst}
                            style={styles.reorderButton}
                            accessibilityLabel={t('trips.moveUp')}
                          >
                            <MaterialCommunityIcons
                              name="chevron-up"
                              size={22}
                              color={
                                moveLocked || isFirst
                                  ? UI.mutedText
                                  : primary
                              }
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => void handleReorder(tripPlace.id, 1)}
                            hitSlop={10}
                            disabled={moveLocked || isLast}
                            style={styles.reorderButton}
                            accessibilityLabel={t('trips.moveDown')}
                          >
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={22}
                              color={
                                moveLocked || isLast
                                  ? UI.mutedText
                                  : primary
                              }
                            />
                          </Pressable>
                        </View>
                      </View>

                      {place?.dd ? (
                        <Button
                          mode="outlined"
                          icon={tripIcon('map-marker')}
                          onPress={() => void handleOpenMap(place)}
                          textColor={primary}
                          theme={tripButtonTheme}
                          style={[styles.mapButton, accent.outline]}
                          contentStyle={tripButtonContentStyle}
                          labelStyle={[tripOutlineIconLabelStyle, accent.label]}
                        >
                          {t('places.openOnMap')}
                        </Button>
                      ) : null}

                      <View style={styles.actionsRow}>
                        <RouteActionButton
                          label={t('trips.alreadyBeen')}
                          filled={tripPlace.visited}
                          disabled={busyId === tripPlace.id}
                          onPress={() => void handleToggleVisited(tripPlace)}
                        />
                        <RouteActionButton
                          label={t('common.delete')}
                          icon="delete"
                          onPress={() => setRemovePlaceId(tripPlace.id)}
                        />
                      </View>

                      {showDiaryFields ? (
                        <>
                          {tripPlace.visitDate ? (
                            <Text variant="bodySmall" style={styles.meta}>
                              {t('trips.visitDate', {
                                date: formatDateTimeLabel(tripPlace.visitDate),
                              })}
                            </Text>
                          ) : null}

                          <TripPlaceNotesSection
                            tripPlaceId={tripPlace.id}
                            notes={tripPlace.notes}
                            saving={busyId === tripPlace.id}
                            onSave={(nextNotes) =>
                              handleSaveNotes(tripPlace.id, nextNotes)
                            }
                          />

                          <Text variant="titleSmall" style={styles.cardLabel}>
                            {t('trips.visitPhotos')}
                          </Text>
                          <View style={styles.photoActions}>
                            <Button
                              mode="outlined"
                              icon={tripIcon('image-plus')}
                              onPress={() => void pickPhotos(tripPlace.id)}
                              textColor={primary}
                              theme={tripButtonTheme}
                              style={[
                                styles.outlineButton,
                                styles.photoActionButton,
                                accent.outline,
                              ]}
                              contentStyle={tripButtonContentStyle}
                              labelStyle={[tripOutlineIconLabelStyle, accent.label]}
                            >
                              {t('common.gallery')}
                            </Button>
                            <Button
                              mode="outlined"
                              icon={tripIcon('camera')}
                              onPress={() => void takePhoto(tripPlace.id)}
                              textColor={primary}
                              theme={tripButtonTheme}
                              style={[
                                styles.outlineButton,
                                styles.photoActionButton,
                                accent.outline,
                              ]}
                              contentStyle={tripButtonContentStyle}
                              labelStyle={[tripOutlineIconLabelStyle, accent.label]}
                            >
                              {t('common.camera')}
                            </Button>
                          </View>
                          <PlacePhotoGallery
                            photos={tripPlace.photos}
                            onDeletePhoto={(photoId) =>
                              void handleDeletePhoto(photoId)
                            }
                          />
                        </>
                      ) : null}
                    </View>
                  );
                })
              )}

              <PrimaryButton
                icon="plus"
                onPress={() => setAddPlaceVisible(true)}
                style={styles.addPlaceButton}
              >
                {t('trips.addPlace')}
              </PrimaryButton>
            </View>
          </ScrollView>
        ) : (
          <Text>{t('errors.tripNotFound')}</Text>
        )}
      </ScreenScaffold>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>{t('trips.deleteTripTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>
              {t('trips.deleteTripBody', { name: trip?.title ?? '' })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={primary}
              onPress={() => setDeleteVisible(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                void handleDelete();
              }}
            >
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={cannotUnvisitVisible}
          onDismiss={() => setCannotUnvisitVisible(false)}
        >
          <Dialog.Title>{t('trips.cannotUnvisitTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('trips.cannotUnvisitBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={primary}
              onPress={() => setCannotUnvisitVisible(false)}
            >
              {t('common.ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={removePlaceId != null}
          onDismiss={() => setRemovePlaceId(null)}
        >
          <Dialog.Title>{t('trips.removePlaceTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('trips.removePlaceBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={primary}
              onPress={() => setRemovePlaceId(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                void confirmRemovePlace();
              }}
            >
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={addPlaceVisible}
          onDismiss={() => setAddPlaceVisible(false)}
        >
          <Dialog.Title>{t('trips.addPlace')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.addPlaceScroll}>
            {availablePlacesToAdd.length === 0 ? (
              <Text style={styles.message}>
                {t('trips.noPlacesToAdd')}
              </Text>
            ) : (
              availablePlacesToAdd.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => void handleAddPlace(place.id)}
                  style={styles.addPlaceItem}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color={primary}
                  />
                  <View style={styles.addPlaceText}>
                    <Text variant="titleSmall" numberOfLines={2}>
                      {place.name}
                    </Text>
                    {place.dd ? (
                      <Text variant="bodySmall" style={styles.meta}>
                        {place.dd}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              textColor={primary}
              onPress={() => setAddPlaceVisible(false)}
            >
              {t('common.close')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  headerActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerAction: {
    width: HEADER_ACTION_SIZE,
    height: HEADER_ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTitle: {
    marginBottom: 4,
  },
  currentBadge: {
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    marginTop: 14,
    opacity: 0.7,
  },
  labelMuted: {
    marginTop: 14,
    opacity: 0.55,
  },
  mutedValue: {
    opacity: 0.75,
  },
  filters: {
    flexDirection: 'row',
    gap: UI.filterGap,
    marginTop: 8,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.75,
  },
  tripPlaceCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  tripPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  orderBadge: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  tripPlaceTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  reorderColumn: {
    alignItems: 'center',
  },
  reorderButton: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: TRIP_BUTTON.gap,
    marginTop: 2,
  },
  routeActionButton: {
    flex: 1,
    minWidth: 0,
  },
  routeActionDisabled: {
    borderColor: '#C8C8C8',
    opacity: 0.7,
  },
  meta: {
    color: UI.mutedText,
    marginTop: 2,
  },
  mapButton: {
    ...tripOutlineButtonStyle,
    marginTop: 2,
  },
  cardLabel: {
    marginTop: 6,
    opacity: 0.7,
  },
  outlineButton: {
    ...tripOutlineButtonStyle,
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TRIP_BUTTON.gap,
    marginBottom: 6,
  },
  photoActionButton: {
    flexGrow: 1,
  },
  addPlaceButton: {
    marginTop: 8,
  },
  addPlaceScroll: {
    maxHeight: 320,
    paddingHorizontal: 0,
  },
  addPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addPlaceText: {
    flex: 1,
    minWidth: 0,
  },
});
