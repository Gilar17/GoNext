import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  HelperText,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { listPlaces } from '@/src/db';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { UI } from '@/src/theme/ui';
import { useLocalizedUserText } from '@/src/utils/localizeUserText';
import type { Place } from '@/src/types';

export type TripFormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

export type TripFormMode = 'create' | 'edit';

type TripFormProps = {
  mode?: TripFormMode;
  initialValues?: Partial<TripFormValues>;
  /** Начальный порядок выбранных placeId (только create). */
  initialSelectedPlaceIds?: number[];
  submitLabel: string;
  saving?: boolean;
  onSubmit: (
    values: TripFormValues,
    selectedPlaceIds: number[],
  ) => Promise<void>;
};

const emptyValues: TripFormValues = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  current: false,
};

export function TripForm({
  mode = 'create',
  initialValues,
  initialSelectedPlaceIds = [],
  submitLabel,
  saving = false,
  onSubmit,
}: TripFormProps) {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedUserText();
  const isCreate = mode === 'create';
  const { surfaces, accent } = useAppTheme();
  const [values, setValues] = useState<TripFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>(
    initialSelectedPlaceIds,
  );
  const [placesLoading, setPlacesLoading] = useState(isCreate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCreate) {
      return;
    }
    let cancelled = false;
    (async () => {
      setPlacesLoading(true);
      try {
        const data = await listPlaces();
        if (!cancelled) {
          setPlaces(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : t('errors.loadPlacesFailed'),
          );
        }
      } finally {
        if (!cancelled) {
          setPlacesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCreate]);

  const selectedSet = useMemo(
    () => new Set(selectedPlaceIds),
    [selectedPlaceIds],
  );

  const update = <K extends keyof TripFormValues>(
    key: K,
    value: TripFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlace = (placeId: number) => {
    setSelectedPlaceIds((prev) => {
      if (prev.includes(placeId)) {
        return prev.filter((id) => id !== placeId);
      }
      return [...prev, placeId];
    });
  };

  const moveSelected = (placeId: number, direction: -1 | 1) => {
    setSelectedPlaceIds((prev) => {
      const index = prev.indexOf(placeId);
      if (index < 0) {
        return prev;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      setError(t('trips.titleRequired'));
      return;
    }
    setError(null);
    try {
      await onSubmit(values, selectedPlaceIds);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.saveTripFailed'));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
        <TextInput
          key={`trip-title-${i18n.language}`}
          label={t('trips.name')}
          value={values.title}
          onChangeText={(text) => update('title', text)}
          mode="outlined"
          style={styles.field}
          dense
        />

        <TextInput
          key={`trip-description-${i18n.language}`}
          label={t('trips.description')}
          value={values.description}
          onChangeText={(text) => update('description', text)}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.field}
          dense
        />

        <TextInput
          key={`trip-start-${i18n.language}`}
          label={t('trips.startDate')}
          value={values.startDate}
          onChangeText={(text) => update('startDate', text)}
          mode="outlined"
          placeholder={t('trips.startDatePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          style={styles.field}
          dense
        />

        <TextInput
          key={`trip-end-${i18n.language}`}
          label={t('trips.endDate')}
          value={values.endDate}
          onChangeText={(text) => update('endDate', text)}
          mode="outlined"
          placeholder={t('trips.endDatePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          style={styles.field}
          dense
        />
        <HelperText type="info" style={styles.helper}>
          {t('trips.datesOptional')}
        </HelperText>

        <View style={styles.switchRow}>
          <Text
            style={[styles.switchLabel, { color: surfaces.bodyText }]}
            numberOfLines={1}
            textBreakStrategy="simple"
          >
            {t('trips.currentTrip')}
          </Text>
          <Switch
            value={values.current}
            onValueChange={(value) => update('current', value)}
            color={accent}
          />
        </View>

        {isCreate ? (
          <>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('trips.routePlaces')}
            </Text>
            {placesLoading ? (
              <Text style={styles.message}>{t('trips.loadingPlaces')}</Text>
            ) : places.length === 0 ? (
              <Text style={styles.message}>
                {t('trips.addPlacesFirst')}
              </Text>
            ) : (
              <View style={styles.placesList}>
                {places.map((place) => {
                  const selected = selectedSet.has(place.id);
                  const orderIndex = selectedPlaceIds.indexOf(place.id);
                  return (
                    <View
                      key={place.id}
                      style={[
                        styles.placeRow,
                        {
                          backgroundColor: selected
                            ? surfaces.filterIdle
                            : surfaces.cardItem,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => togglePlace(place.id)}
                        style={styles.placeMain}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                      >
                        <MaterialCommunityIcons
                          name={
                            selected
                              ? 'checkbox-marked'
                              : 'checkbox-blank-outline'
                          }
                          size={22}
                          color={accent}
                        />
                        <View style={styles.placeText}>
                          <Text variant="titleSmall" numberOfLines={2}>
                            {loc(place.name)}
                          </Text>
                        </View>
                        {selected ? (
                          <Text style={[styles.orderBadge, { color: accent }]}>{orderIndex + 1}</Text>
                        ) : null}
                      </Pressable>
                      {selected ? (
                        <View style={styles.orderActions}>
                          <Pressable
                            onPress={() => moveSelected(place.id, -1)}
                            hitSlop={8}
                            style={styles.orderButton}
                            accessibilityLabel={t('trips.moveUpInRoute')}
                          >
                            <MaterialCommunityIcons
                              name="chevron-up"
                              size={22}
                              color={accent}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => moveSelected(place.id, 1)}
                            hitSlop={8}
                            style={styles.orderButton}
                            accessibilityLabel={t('trips.moveDownInRoute')}
                          >
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={22}
                              color={accent}
                            />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <PrimaryButton
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.submit}
        >
          {submitLabel}
        </PrimaryButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  panel: {
    borderRadius: 12,
    padding: 14,
  },
  field: {
    marginBottom: 6,
  },
  helper: {
    marginTop: -4,
    marginBottom: 4,
    paddingVertical: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 40,
    marginBottom: 8,
    marginTop: 4,
  },
  switchLabel: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 17,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.75,
  },
  placesList: {
    gap: 8,
    marginBottom: 8,
  },
  placeRow: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  placeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeText: {
    flex: 1,
    minWidth: 0,
  },
  orderBadge: {
    minWidth: 24,
    textAlign: 'center',
    color: UI.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  orderButton: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    marginTop: 12,
  },
});
