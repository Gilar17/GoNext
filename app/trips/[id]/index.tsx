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
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterToggleButton } from '@/src/components/FilterToggleButton';
import { PlacePhotoGallery } from '@/src/components/PlacePhotoGallery';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
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
  primaryButtonContentStyle,
  primaryButtonStyle,
  UI,
} from '@/src/theme/ui';
import {
  formatDateLabel,
  formatDateTimeLabel,
} from '@/src/utils/dates';
import type { Place, Trip, TripPlace } from '@/src/types';

const HEADER_DELETE = '#BDBDBD';
const HEADER_ACTION_SIZE = 40;

type RouteMode = 'all' | 'plan' | 'diary';

export default function TripDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [placesById, setPlacesById] = useState<Map<number, Place>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [addPlaceVisible, setAddPlaceVisible] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('all');
  const [notesDrafts, setNotesDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTrip = useCallback(async () => {
    if (!Number.isFinite(tripId)) {
      setError('Некорректный идентификатор поездки');
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
      if (data) {
        const drafts: Record<number, string> = {};
        for (const tripPlace of data.places) {
          drafts[tripPlace.id] = tripPlace.notes;
        }
        setNotesDrafts(drafts);
      }
      setError(data ? null : 'Поездка не найдена');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить поездку');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

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

  const handleDelete = async () => {
    setDeleteVisible(false);
    try {
      await deleteTrip(tripId);
      router.replace('/trips');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить поездку');
    }
  };

  const handleSetCurrent = async () => {
    try {
      const updated = await setCurrentTrip(tripId);
      if (updated) {
        setTrip(updated);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Не удалось сделать поездку текущей',
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
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    try {
      const places = await reorderTripPlaces(tripId, next);
      setTrip({ ...trip, places });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить порядок');
    }
  };

  const handleToggleVisited = async (tripPlace: TripPlace, visited: boolean) => {
    setBusyId(tripPlace.id);
    try {
      const updated = await markTripPlaceVisited(tripPlace.id, visited);
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
        e instanceof Error ? e.message : 'Не удалось обновить статус посещения',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNotes = async (tripPlaceId: number) => {
    const notes = notesDrafts[tripPlaceId] ?? '';
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить заметки');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemovePlace = async (tripPlaceId: number) => {
    try {
      await removePlaceFromTrip(tripPlaceId);
      await loadTrip();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Не удалось убрать место из поездки',
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
        e instanceof Error ? e.message : 'Не удалось добавить место в поездку',
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
          : 'Для этого места не указаны корректные координаты',
      );
    }
  };

  const pickPhotos = async (tripPlaceId: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Нет доступа к галерее');
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
      setError(e instanceof Error ? e.message : 'Не удалось добавить фото');
    }
  };

  const takePhoto = async (tripPlaceId: number) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Нет доступа к камере');
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
      setError(e instanceof Error ? e.message : 'Не удалось добавить фото');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await deleteTripPlacePhoto(photoId);
      await loadTrip();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить фото');
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
        title="Поездка"
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
                accessibilityLabel="Изменить"
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={22}
                  color={UI.primary}
                />
              </Pressable>
              <Pressable
                onPress={() => setDeleteVisible(true)}
                hitSlop={12}
                style={styles.headerAction}
                accessibilityLabel="Удалить"
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
          <Text>Загрузка…</Text>
        ) : trip ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.panel}>
              <Text variant="headlineSmall" style={styles.tripTitle}>
                {trip.title}
              </Text>

              {trip.current ? (
                <Text style={styles.currentBadge}>Текущая поездка</Text>
              ) : (
                <Button
                  mode="outlined"
                  icon="check-circle-outline"
                  onPress={handleSetCurrent}
                  textColor={UI.primary}
                  style={styles.outlineButton}
                  contentStyle={primaryButtonContentStyle}
                >
                  Сделать текущей
                </Button>
              )}

              <Text variant="titleSmall" style={styles.label}>
                Описание
              </Text>
              <Text variant="bodyLarge">
                {trip.description.trim() || 'Без описания'}
              </Text>

              <Text variant="titleSmall" style={styles.labelMuted}>
                Даты
              </Text>
              <Text variant="bodyMedium" style={styles.mutedValue}>
                {datesLabel ?? 'Не указаны'}
              </Text>

              <Text variant="titleSmall" style={styles.labelMuted}>
                Создано
              </Text>
              <Text variant="bodyMedium" style={styles.mutedValue}>
                {formatDateTimeLabel(trip.createdAt)}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Маршрут
              </Text>
              <View style={styles.filters}>
                <FilterToggleButton
                  label="Все"
                  icon="format-list-bulleted"
                  active={routeMode === 'all'}
                  onPress={() => setRouteMode('all')}
                />
                <FilterToggleButton
                  label="План"
                  icon="map-marker-path"
                  active={routeMode === 'plan'}
                  onPress={() => setRouteMode('plan')}
                />
                <FilterToggleButton
                  label="Дневник"
                  icon="book-open-variant"
                  active={routeMode === 'diary'}
                  onPress={() => setRouteMode('diary')}
                />
              </View>

              {filteredPlaces.length === 0 ? (
                <Text style={styles.message}>
                  {trip.places.length === 0
                    ? 'В маршруте пока нет мест'
                    : routeMode === 'plan'
                      ? 'Непосещённых мест нет — маршрут пройден'
                      : routeMode === 'diary'
                        ? 'Пока нет посещённых мест'
                        : 'Нет мест'}
                </Text>
              ) : (
                filteredPlaces.map((tripPlace, index) => {
                  const place = placesById.get(tripPlace.placeId);
                  const absoluteIndex = trip.places.findIndex(
                    (item) => item.id === tripPlace.id,
                  );
                  const showDiaryFields =
                    tripPlace.visited || routeMode === 'diary';

                  return (
                    <View key={tripPlace.id} style={styles.tripPlaceCard}>
                      <View style={styles.tripPlaceHeader}>
                        <Text style={styles.orderBadge}>
                          {absoluteIndex >= 0 ? absoluteIndex + 1 : index + 1}
                        </Text>
                        <View style={styles.tripPlaceTitleWrap}>
                          <Text variant="titleMedium" numberOfLines={2}>
                            {place?.name ?? `Место #${tripPlace.placeId}`}
                          </Text>
                          {place?.dd ? (
                            <Text
                              variant="bodySmall"
                              style={styles.meta}
                              numberOfLines={1}
                            >
                              {place.dd}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.reorderColumn}>
                          <Pressable
                            onPress={() => handleReorder(tripPlace.id, -1)}
                            hitSlop={8}
                            style={styles.reorderButton}
                            accessibilityLabel="Выше"
                          >
                            <MaterialCommunityIcons
                              name="chevron-up"
                              size={22}
                              color={UI.primary}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleReorder(tripPlace.id, 1)}
                            hitSlop={8}
                            style={styles.reorderButton}
                            accessibilityLabel="Ниже"
                          >
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={22}
                              color={UI.primary}
                            />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.visitedRow}>
                        <Text style={styles.switchLabel}>Посещено</Text>
                        <Switch
                          value={tripPlace.visited}
                          disabled={busyId === tripPlace.id}
                          onValueChange={(value) =>
                            void handleToggleVisited(tripPlace, value)
                          }
                        />
                      </View>

                      {tripPlace.visited && tripPlace.visitDate ? (
                        <Text variant="bodySmall" style={styles.meta}>
                          Дата визита: {formatDateTimeLabel(tripPlace.visitDate)}
                        </Text>
                      ) : null}

                      {place?.dd ? (
                        <Button
                          mode="outlined"
                          icon="map-marker"
                          onPress={() => void handleOpenMap(place)}
                          textColor={UI.primary}
                          style={styles.mapButton}
                          contentStyle={primaryButtonContentStyle}
                          labelStyle={styles.mapButtonLabel}
                        >
                          Открыть на карте
                        </Button>
                      ) : null}

                      {showDiaryFields ? (
                        <>
                          <Text variant="titleSmall" style={styles.cardLabel}>
                            Заметки
                          </Text>
                          <TextInput
                            value={notesDrafts[tripPlace.id] ?? ''}
                            onChangeText={(text) =>
                              setNotesDrafts((prev) => ({
                                ...prev,
                                [tripPlace.id]: text,
                              }))
                            }
                            mode="outlined"
                            multiline
                            numberOfLines={2}
                            dense
                            style={styles.notesInput}
                          />
                          <Button
                            mode="outlined"
                            onPress={() => void handleSaveNotes(tripPlace.id)}
                            loading={busyId === tripPlace.id}
                            textColor={UI.primary}
                            style={styles.outlineButton}
                            contentStyle={primaryButtonContentStyle}
                          >
                            Сохранить заметки
                          </Button>

                          <Text variant="titleSmall" style={styles.cardLabel}>
                            Фото посещения
                          </Text>
                          <View style={styles.photoActions}>
                            <Button
                              mode="outlined"
                              icon="image-plus"
                              onPress={() => void pickPhotos(tripPlace.id)}
                              textColor={UI.primary}
                              style={[
                                styles.outlineButton,
                                styles.photoActionButton,
                              ]}
                              contentStyle={primaryButtonContentStyle}
                            >
                              Галерея
                            </Button>
                            <Button
                              mode="outlined"
                              icon="camera"
                              onPress={() => void takePhoto(tripPlace.id)}
                              textColor={UI.primary}
                              style={[
                                styles.outlineButton,
                                styles.photoActionButton,
                              ]}
                              contentStyle={primaryButtonContentStyle}
                            >
                              Камера
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

                      <Pressable
                        onPress={() => void handleRemovePlace(tripPlace.id)}
                        style={styles.removeRow}
                        accessibilityLabel="Убрать из поездки"
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={18}
                          color={HEADER_DELETE}
                        />
                        <Text style={styles.removeText}>Убрать из поездки</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <PrimaryButton
                icon="plus"
                onPress={() => setAddPlaceVisible(true)}
                style={styles.addPlaceButton}
              >
                Добавить место
              </PrimaryButton>
            </View>
          </ScrollView>
        ) : (
          <Text>Поездка не найдена</Text>
        )}
      </ScreenScaffold>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>Удалить поездку?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Вы действительно хотите удалить «{trip?.title ?? ''}»?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={UI.primary}
              onPress={() => setDeleteVisible(false)}
            >
              Отмена
            </Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                void handleDelete();
              }}
            >
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={addPlaceVisible}
          onDismiss={() => setAddPlaceVisible(false)}
        >
          <Dialog.Title>Добавить место</Dialog.Title>
          <Dialog.ScrollArea style={styles.addPlaceScroll}>
            {availablePlacesToAdd.length === 0 ? (
              <Text style={styles.message}>
                Нет доступных мест. Создайте место в разделе «Места».
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
                    color={UI.primary}
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
              textColor={UI.primary}
              onPress={() => setAddPlaceVisible(false)}
            >
              Закрыть
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
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    color: UI.primary,
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
    backgroundColor: 'rgba(255,255,255,0.7)',
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
    color: UI.primary,
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
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  switchLabel: {
    fontSize: 14,
    lineHeight: 17,
    color: '#333',
  },
  meta: {
    color: UI.mutedText,
    marginTop: 2,
  },
  mapButton: {
    ...primaryButtonStyle,
    marginTop: 4,
    borderColor: UI.primary,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  mapButtonLabel: {
    fontSize: UI.buttonFontSize,
    marginVertical: 0,
    color: UI.primary,
  },
  cardLabel: {
    marginTop: 6,
    opacity: 0.7,
  },
  notesInput: {
    marginBottom: 4,
  },
  outlineButton: {
    ...primaryButtonStyle,
    borderColor: UI.primary,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  photoActionButton: {
    flexGrow: 1,
  },
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  removeText: {
    color: UI.mutedText,
    fontSize: 13,
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
