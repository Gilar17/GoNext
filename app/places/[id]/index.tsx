import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { PlacePhotoGallery } from '@/src/components/PlacePhotoGallery';
import { deletePlace, getPlaceById } from '@/src/db';
import { openPlaceOnMap } from '@/src/services';
import {
  primaryButtonContentStyle,
  primaryButtonStyle,
  UI,
} from '@/src/theme/ui';
import type { Place } from '@/src/types';

const MARK_VISIT_LATER = '#3B8F5C';
const MARK_LIKED = '#D96B9A';
const HEADER_DELETE = '#BDBDBD';
const HEADER_ACTION_SIZE = 40;

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const loadPlace = useCallback(async () => {
    if (!Number.isFinite(placeId)) {
      setError('Некорректный идентификатор места');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getPlaceById(placeId);
      setPlace(data);
      setError(data ? null : 'Место не найдено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить место');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlace();
    }, [loadPlace]),
  );

  const handleOpenMap = async () => {
    try {
      // Только сохранённые координаты place.dd — без геолокации устройства.
      await openPlaceOnMap(place?.dd ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Для этого места не указаны корректные координаты',
      );
    }
  };

  const handleDelete = async () => {
    setDeleteVisible(false);
    try {
      await deletePlace(placeId);
      router.replace('/places');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить место');
    }
  };

  const openEdit = () => {
    if (place) {
      router.push(`/places/${place.id}/edit`);
    }
  };

  const hasMarks = Boolean(place?.visitlater || place?.liked);
  /** Центр иконки карандаша = геометрический центр экрана. */
  const pencilLeft = windowWidth / 2 - HEADER_ACTION_SIZE / 2;

  return (
    <>
      <ScreenScaffold
        title="Место"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
        titleTrailing={
          place ? (
            <View style={[styles.headerActions, { left: pencilLeft }]}>
              <Pressable
                onPress={openEdit}
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
        ) : place ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
          >
            <View style={styles.panel}>
              <Text variant="headlineSmall" style={styles.placeName}>
                {place.name}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Описание
              </Text>
              <Text variant="bodyLarge">
                {place.description.trim() || 'Без описания'}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Фотографии
              </Text>
              <PlacePhotoGallery photos={place.photos} />

              <Text variant="titleSmall" style={styles.label}>
                Координаты (DD)
              </Text>
              <Text variant="bodyLarge">
                {place.dd ?? 'Не указаны'}
              </Text>

              <Button
                mode="outlined"
                icon="map-marker"
                onPress={handleOpenMap}
                textColor={UI.primary}
                style={styles.mapButton}
                contentStyle={primaryButtonContentStyle}
                labelStyle={styles.mapButtonLabel}
              >
                Открыть на карте
              </Button>

              <Text variant="titleSmall" style={styles.labelMuted}>
                Создано
              </Text>
              <Text variant="bodyMedium" style={styles.createdValue}>
                {new Date(place.createdAt).toLocaleString()}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Отметки
              </Text>
              {hasMarks ? (
                <View style={styles.marksRow}>
                  {place.visitlater ? (
                    <View style={styles.markItem}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={18}
                        color={MARK_VISIT_LATER}
                      />
                      <Text style={[styles.markText, { color: MARK_VISIT_LATER }]}>
                        Посетить позже
                      </Text>
                    </View>
                  ) : null}
                  {place.liked ? (
                    <View style={styles.markItem}>
                      <MaterialCommunityIcons
                        name="heart"
                        size={18}
                        color={MARK_LIKED}
                      />
                      <Text style={[styles.markText, { color: MARK_LIKED }]}>
                        Понравилось
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.noMarks}>
                  Нет отметок
                </Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <Text>Место не найдено</Text>
        )}
      </ScreenScaffold>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>Удалить место?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Вы действительно хотите удалить «{place?.name ?? ''}»?
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
  placeName: {
    marginBottom: 4,
  },
  label: {
    marginTop: 14,
    opacity: 0.7,
  },
  labelMuted: {
    marginTop: 14,
    opacity: 0.55,
  },
  createdValue: {
    opacity: 0.75,
  },
  mapButton: {
    ...primaryButtonStyle,
    marginTop: 10,
    marginBottom: 2,
    borderColor: UI.primary,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  mapButtonLabel: {
    fontSize: UI.buttonFontSize,
    marginVertical: 0,
    color: UI.primary,
  },
  marksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  markText: {
    fontSize: 14,
    lineHeight: 18,
  },
  noMarks: {
    opacity: 0.7,
  },
});
