import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { TripForm, type TripFormValues } from '@/src/components/TripForm';
import { addPlaceToTrip, createTrip } from '@/src/db';
import { toStorageDate } from '@/src/utils/dates';

export default function NewTripScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (
    values: TripFormValues,
    selectedPlaceIds: number[],
  ) => {
    setSaving(true);
    try {
      const trip = await createTrip({
        title: values.title,
        description: values.description,
        startDate: toStorageDate(values.startDate),
        endDate: toStorageDate(values.endDate),
        current: values.current,
      });

      for (const placeId of selectedPlaceIds) {
        await addPlaceToTrip(trip.id, placeId);
      }

      router.replace(`/trips/${trip.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Новая поездка" contentStyle={styles.content}>
      <TripForm
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
