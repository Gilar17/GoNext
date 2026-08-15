import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { TripForm, type TripFormValues } from '@/src/components/TripForm';
import { getTripById, updateTrip } from '@/src/db';
import { toStorageDate, toUiDate } from '@/src/utils/dates';
import type { Trip } from '@/src/types';

export default function EditTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    if (!Number.isFinite(tripId)) {
      setError(t('errors.invalidTripId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getTripById(tripId);
      setTrip(data);
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

  const handleSubmit = async (values: TripFormValues) => {
    setSaving(true);
    try {
      await updateTrip(tripId, {
        title: values.title,
        description: values.description,
        startDate: toStorageDate(values.startDate),
        endDate: toStorageDate(values.endDate),
        current: values.current,
      });
      router.replace(`/trips/${tripId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title={t('trips.editTitle')} contentStyle={styles.content}>
      {loading ? (
        <Text>{t('common.loading')}</Text>
      ) : trip ? (
        <TripForm
          mode="edit"
          key={trip.id}
          initialValues={{
            title: trip.title,
            description: trip.description,
            startDate: toUiDate(trip.startDate),
            endDate: toUiDate(trip.endDate),
            current: trip.current,
          }}
          submitLabel={t('common.saveChanges')}
          saving={saving}
          onSubmit={handleSubmit}
        />
      ) : (
        <Text>{error ?? t('errors.tripNotFound')}</Text>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
});
