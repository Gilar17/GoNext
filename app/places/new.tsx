import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { PlaceForm, type PlaceFormValues } from '@/src/components/PlaceForm';
import { addPlacePhoto, createPlace } from '@/src/db';

export default function NewPlaceScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (
    values: PlaceFormValues,
    pendingPhotoUris: string[],
  ) => {
    setSaving(true);
    try {
      const place = await createPlace({
        name: values.name,
        description: values.description,
        visitlater: values.visitlater,
        liked: values.liked,
        dd: values.dd.trim() ? values.dd.trim() : null,
      });

      for (const uri of pendingPhotoUris) {
        await addPlacePhoto(place.id, uri);
      }

      router.replace(`/places/${place.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Новое место" contentStyle={styles.content}>
      <PlaceForm
        mode="create"
        submitLabel="Сохранить"
        saving={saving}
        onSubmit={handleSubmit}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
});
