import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { PlacePhotoGallery } from '@/src/components/PlacePhotoGallery';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { deletePlace, getPlaceById } from '@/src/db';
import { openPlaceOnMap } from '@/src/services';
import type { Place } from '@/src/types';

export default function PlaceDetailsScreen() {
  const router = useRouter();
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

  return (
    <>
      <ScreenScaffold
        title={place?.name ?? 'Место'}
        contentStyle={styles.content}
        actions={
          place ? (
            <>
              <Appbar.Action
                icon="pencil"
                onPress={openEdit}
                accessibilityLabel="Изменить"
              />
              <Appbar.Action
                icon="delete"
                onPress={() => setDeleteVisible(true)}
                accessibilityLabel="Удалить"
              />
            </>
          ) : null
        }
      >
        {loading ? (
          <Text>Загрузка…</Text>
        ) : place ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.panel}>
              <Text variant="headlineSmall" numberOfLines={3}>
                {place.name}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Описание
              </Text>
              <Text variant="bodyLarge">
                {place.description.trim() || 'Без описания'}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Отметки
              </Text>
              <Text variant="bodyLarge">
                {[
                  place.visitlater ? 'Посетить позже' : null,
                  place.liked ? 'Понравилось' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Нет отметок'}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Координаты (DD)
              </Text>
              <Text variant="bodyLarge">{place.dd ?? 'Не указаны'}</Text>

              <Text variant="titleSmall" style={styles.label}>
                Создано
              </Text>
              <Text variant="bodyMedium">
                {new Date(place.createdAt).toLocaleString()}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                Фотографии
              </Text>
              <PlacePhotoGallery photos={place.photos} />

              <PrimaryButton
                icon="pencil"
                onPress={openEdit}
                style={styles.editButton}
              >
                Изменить
              </PrimaryButton>

              <PrimaryButton
                icon="map-marker"
                onPress={handleOpenMap}
                style={styles.mapButton}
              >
                Открыть на карте
              </PrimaryButton>
            </View>
          </ScrollView>
        ) : (
          <Text>Место не найдено</Text>
        )}
      </ScreenScaffold>

      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>Удалить место?</Dialog.Title>
          <Dialog.Content>
            <Text>Место и связанные фотографии будут удалены с устройства.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)}>Отмена</Button>
            <Button onPress={handleDelete}>Удалить</Button>
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
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  label: {
    marginTop: 14,
    opacity: 0.7,
  },
  editButton: {
    marginTop: 20,
  },
  mapButton: {
    marginTop: 12,
  },
});
