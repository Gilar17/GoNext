import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  HelperText,
  IconButton,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import type { PlacePhoto } from '@/src/types';
import { getCurrentDdPair, isValidDdPair } from '@/src/services';

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
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.panel}>
        <TextInput
          label="Название"
          value={values.name}
          onChangeText={(text) => update('name', text)}
          mode="outlined"
          style={styles.field}
        />

        <TextInput
          label="Описание"
          value={values.description}
          onChangeText={(text) => update('description', text)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.field}
        />

        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Посетить позже</Text>
          <Switch
            value={values.visitlater}
            onValueChange={(value) => update('visitlater', value)}
          />
        </View>

        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Понравилось</Text>
          <Switch
            value={values.liked}
            onValueChange={(value) => update('liked', value)}
          />
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
        />
        <HelperText type={ddInvalid ? 'error' : 'info'}>
          Вставьте пару из карт целиком: широта, долгота
        </HelperText>

        {isEdit ? (
          <Button
            mode="outlined"
            icon="crosshairs-gps"
            onPress={fillCurrentLocation}
            loading={locationLoading}
            style={styles.field}
          >
            Текущая геопозиция
          </Button>
        ) : null}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Фотографии
        </Text>

        {isEdit ? (
          <View style={styles.photoActions}>
            <Button mode="outlined" icon="image-plus" onPress={pickPhotos}>
              Добавить фото
            </Button>
            <Button mode="outlined" icon="camera" onPress={takePhoto}>
              Камера
            </Button>
          </View>
        ) : (
          <Button
            mode="outlined"
            icon="image-plus"
            onPress={pickPhotos}
            style={styles.field}
          >
            Добавить фото
          </Button>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photosRow}>
            {existingPhotos.map((photo) => (
              <View key={`existing-${photo.id}`} style={styles.photoWrap}>
                <Image source={{ uri: photo.filePath }} style={styles.photo} />
                {onDeleteExistingPhoto ? (
                  <IconButton
                    icon="close"
                    size={16}
                    iconColor="#fff"
                    style={styles.removePhoto}
                    onPress={() => onDeleteExistingPhoto(photo.id)}
                  />
                ) : null}
              </View>
            ))}
            {pendingPhotoUris.map((uri) => (
              <View key={`pending-${uri}`} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} />
                <IconButton
                  icon="close"
                  size={16}
                  iconColor="#fff"
                  style={styles.removePhoto}
                  onPress={() =>
                    setPendingPhotoUris((prev) =>
                      prev.filter((item) => item !== uri),
                    )
                  }
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.submit}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
  },
  field: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -10,
    right: -10,
    margin: 0,
    backgroundColor: '#333',
  },
  submit: {
    marginTop: 16,
  },
});
