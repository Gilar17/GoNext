import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { PlaceForm, type PlaceFormValues } from '@/src/components/PlaceForm';
import {
  addPlacePhoto,
  deletePlacePhoto,
  getPlaceById,
  updatePlace,
} from '@/src/db';
import type { Place } from '@/src/types';

export default function EditPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlace = useCallback(async () => {
    if (!Number.isFinite(placeId)) {
      setError(t('errors.invalidPlaceId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getPlaceById(placeId);
      setPlace(data);
      setError(data ? null : t('errors.placeNotFound'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.loadPlaceFailed'));
    } finally {
      setLoading(false);
    }
  }, [placeId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadPlace();
    }, [loadPlace]),
  );

  const handleSubmit = async (
    values: PlaceFormValues,
    pendingPhotoUris: string[],
  ) => {
    setSaving(true);
    try {
      await updatePlace(placeId, {
        name: values.name,
        description: values.description,
        visitlater: values.visitlater,
        liked: values.liked,
        dd: values.dd.trim() ? values.dd.trim() : null,
      });

      for (const uri of pendingPhotoUris) {
        await addPlacePhoto(placeId, uri);
      }

      router.replace(`/places/${placeId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    await deletePlacePhoto(photoId);
    await loadPlace();
  };

  return (
    <ScreenScaffold title={t('places.editTitle')} contentStyle={styles.content}>
      {loading ? (
        <Text>{t('common.loading')}</Text>
      ) : place ? (
        <PlaceForm
          mode="edit"
          key={place.id + place.photos.map((photo) => photo.id).join('-')}
          initialValues={{
            name: place.name,
            description: place.description,
            visitlater: place.visitlater,
            liked: place.liked,
            dd: place.dd ?? '',
          }}
          existingPhotos={place.photos}
          submitLabel={t('common.saveChanges')}
          saving={saving}
          onSubmit={handleSubmit}
          onDeleteExistingPhoto={handleDeletePhoto}
        />
      ) : (
        <Text>{error ?? t('errors.placeNotFound')}</Text>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
});
