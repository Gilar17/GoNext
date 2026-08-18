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
import { useTranslation } from 'react-i18next';
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
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { getDateLocale } from '@/src/i18n';
import type { Place } from '@/src/types';

const MARK_VISIT_LATER = '#3B8F5C';
const MARK_LIKED = '#D96B9A';
const HEADER_DELETE = '#BDBDBD';
const HEADER_ACTION_SIZE = 40;

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { surfaces, accent } = useAppTheme();
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

  const handleOpenMap = async () => {
    try {
      // Только сохранённые координаты place.dd — без геолокации устройства.
      await openPlaceOnMap(place?.dd ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('errors.invalidCoordinates'),
      );
    }
  };

  const handleDelete = async () => {
    setDeleteVisible(false);
    try {
      await deletePlace(placeId);
      router.replace('/places');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.deletePlaceFailed'));
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
        title={t('places.detailsTitle')}
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
                accessibilityLabel={t('common.edit')}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={22}
                  color={accent}
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
        ) : place ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator
          >
            <View style={[styles.panel, { backgroundColor: surfaces.card }]}>
              <Text variant="headlineSmall" style={styles.placeName}>
                {place.name}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                {t('places.description')}
              </Text>
              <Text variant="bodyLarge">
                {place.description.trim() || t('common.noDescription')}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                {t('places.photos')}
              </Text>
              <PlacePhotoGallery photos={place.photos} />

              <Text variant="titleSmall" style={styles.label}>
                {t('places.coordinates')}
              </Text>
              <Text variant="bodyLarge">
                {place.dd ?? t('common.notSpecified')}
              </Text>

              <Button
                mode="outlined"
                icon="map-marker"
                onPress={handleOpenMap}
                textColor={accent}
                style={[styles.mapButton, { borderColor: accent }]}
                contentStyle={primaryButtonContentStyle}
                labelStyle={[styles.mapButtonLabel, { color: accent }]}
              >
                {t('places.openOnMap')}
              </Button>

              <Text variant="titleSmall" style={styles.labelMuted}>
                {t('places.created')}
              </Text>
              <Text variant="bodyMedium" style={styles.createdValue}>
                {new Date(place.createdAt).toLocaleString(getDateLocale(i18n.language))}
              </Text>

              <Text variant="titleSmall" style={styles.label}>
                {t('places.marks')}
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
                        {t('places.visitLater')}
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
                        {t('places.liked')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.noMarks}>
                  {t('places.noMarks')}
                </Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <Text>{t('errors.placeNotFound')}</Text>
        )}
      </ScreenScaffold>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>{t('places.deleteConfirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>
              {t('places.deleteConfirmBody', { name: place?.name ?? '' })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={accent}
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
