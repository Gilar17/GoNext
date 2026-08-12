import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Button,
  HelperText,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { getCurrentDdPair, isValidDdPair } from '@/src/services';
import {
  primaryButtonContentStyle,
  primaryButtonStyle,
  UI,
} from '@/src/theme/ui';
import type { PlacePhoto } from '@/src/types';

export type PlaceFormValues = {
  name: string;
  description: string;
  visitlater: boolean;
  liked: boolean;
  dd: string;
};

export type PlaceFormMode = 'create' | 'edit';

type PlaceFormProps = {
  mode?: PlaceFormMode;
  initialValues?: Partial<PlaceFormValues>;
  existingPhotos?: PlacePhoto[];
  pendingPhotoUris?: string[];
  submitLabel: string;
  saving?: boolean;
  onSubmit: (values: PlaceFormValues, pendingPhotoUris: string[]) => Promise<void>;
  onDeleteExistingPhoto?: (photoId: number) => Promise<void>;
};

type PreviewPhoto = {
  uri: string;
  key: string;
};

const emptyValues: PlaceFormValues = {
  name: '',
  description: '',
  visitlater: false,
  liked: false,
  dd: '',
};

export function PlaceForm({
  mode = 'create',
  initialValues,
  existingPhotos = [],
  pendingPhotoUris: initialPending = [],
  submitLabel,
  saving = false,
  onSubmit,
  onDeleteExistingPhoto,
}: PlaceFormProps) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<PlaceFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [pendingPhotoUris, setPendingPhotoUris] = useState<string[]>(initialPending);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPhoto | null>(null);

  const ddInvalid = !isValidDdPair(values.dd);

  const update = <K extends keyof PlaceFormValues>(
    key: K,
    value: PlaceFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const pickPhotos = async () => {
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

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setPendingPhotoUris((prev) => [...prev, ...uris]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Нет доступа к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const fillCurrentLocation = async () => {
    setLocationLoading(true);
    setError(null);
    try {
      const dd = await getCurrentDdPair();
      update('dd', dd);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить координаты');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!values.name.trim()) {
      setError('Укажите название места');
      return;
    }
    if (ddInvalid) {
      setError('Координаты должны быть в формате: 55.744920, 37.604677');
      return;
    }

    setError(null);
    try {
      await onSubmit(values, pendingPhotoUris);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить место');
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.panel}>
          <TextInput
            label="Название"
            value={values.name}
            onChangeText={(text) => update('name', text)}
            mode="outlined"
            style={styles.field}
            dense
          />

          <TextInput
            label="Описание"
            value={values.description}
            onChangeText={(text) => update('description', text)}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.field}
            dense
          />

          <View style={styles.switchesRow}>
            <View style={styles.switchItem}>
              <Text
                style={styles.switchLabel}
                numberOfLines={2}
                textBreakStrategy="simple"
              >
                Посетить позже
              </Text>
              <Switch
                value={values.visitlater}
                onValueChange={(value) => update('visitlater', value)}
              />
            </View>
            <View style={styles.switchItem}>
              <Text
                style={styles.switchLabelSingle}
                numberOfLines={1}
                textBreakStrategy="simple"
              >
                Понравилось
              </Text>
              <Switch
                value={values.liked}
                onValueChange={(value) => update('liked', value)}
              />
            </View>
          </View>

          <TextInput
            label="Координаты (DD)"
            value={values.dd}
            onChangeText={(text) => update('dd', text)}
            mode="outlined"
            placeholder="55.744920, 37.604677"
            autoCapitalize="none"
            autoCorrect={false}
            error={ddInvalid}
            style={styles.field}
            dense
          />
          <HelperText type={ddInvalid ? 'error' : 'info'} style={styles.helper}>
            Вставьте пару из карт целиком: широта, долгота
          </HelperText>

          {isEdit ? (
            <Button
              mode="outlined"
              icon="crosshairs-gps"
              onPress={fillCurrentLocation}
              loading={locationLoading}
              textColor={UI.primary}
              style={[styles.field, styles.outlineButton]}
              contentStyle={primaryButtonContentStyle}
            >
              Текущая геопозиция
            </Button>
          ) : null}

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Фотографии
          </Text>

          {isEdit ? (
            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                icon="image-plus"
                onPress={pickPhotos}
                textColor={UI.primary}
                style={[styles.outlineButton, styles.photoActionButton]}
                contentStyle={primaryButtonContentStyle}
              >
                Добавить фото
              </Button>
              <Button
                mode="outlined"
                icon="camera"
                onPress={takePhoto}
                textColor={UI.primary}
                style={[styles.outlineButton, styles.photoActionButton]}
                contentStyle={primaryButtonContentStyle}
              >
                Камера
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              icon="image-plus"
              onPress={pickPhotos}
              textColor={UI.primary}
              style={[styles.field, styles.outlineButton]}
              contentStyle={primaryButtonContentStyle}
            >
              Добавить фото
            </Button>
          )}

          <View style={styles.photosGrid}>
            {existingPhotos.map((photo) => (
              <View key={`existing-${photo.id}`} style={styles.photoWrap}>
                <Pressable
                  onPress={() =>
                    setPreview({
                      uri: photo.filePath,
                      key: `existing-${photo.id}`,
                    })
                  }
                >
                  <Image source={{ uri: photo.filePath }} style={styles.photo} />
                </Pressable>
                {onDeleteExistingPhoto ? (
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => onDeleteExistingPhoto(photo.id)}
                    accessibilityLabel="Удалить фото"
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={14}
                      color={UI.onPrimary}
                    />
                  </Pressable>
                ) : null}
              </View>
            ))}
            {pendingPhotoUris.map((uri) => (
              <View key={`pending-${uri}`} style={styles.photoWrap}>
                <Pressable
                  onPress={() => setPreview({ uri, key: `pending-${uri}` })}
                >
                  <Image source={{ uri }} style={styles.photo} />
                </Pressable>
                <Pressable
                  style={styles.removePhoto}
                  onPress={() =>
                    setPendingPhotoUris((prev) =>
                      prev.filter((item) => item !== uri),
                    )
                  }
                  accessibilityLabel="Удалить фото"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={UI.onPrimary}
                  />
                </Pressable>
              </View>
            ))}
          </View>

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

      <Modal
        visible={preview != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(null)}>
          <Pressable style={styles.modalContent} onPress={() => undefined}>
            {preview ? (
              <Image
                source={{ uri: preview.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            <Pressable
              style={styles.modalClose}
              onPress={() => setPreview(null)}
              accessibilityLabel="Закрыть просмотр"
            >
              <MaterialCommunityIcons name="close" size={18} color={UI.onPrimary} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
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
  switchesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    marginTop: 2,
  },
  switchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 40,
    paddingVertical: 2,
  },
  switchLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 19,
    color: '#333',
  },
  /** Однострочная подпись: слово целиком, без переноса по буквам. */
  switchLabelSingle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 19,
    color: '#333',
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 8,
  },
  outlineButton: {
    ...primaryButtonStyle,
    borderColor: UI.primary,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  photoActionButton: {
    flexGrow: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
    minHeight: 8,
  },
  photoWrap: {
    position: 'relative',
    width: 104,
    height: 104,
  },
  photo: {
    width: 104,
    height: 104,
    borderRadius: UI.buttonBorderRadius,
    backgroundColor: '#EEE',
  },
  removePhoto: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: UI.buttonBorderRadius,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: UI.buttonBorderRadius,
  },
  modalClose: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: UI.buttonBorderRadius,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
