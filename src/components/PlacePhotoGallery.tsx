import { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';
import { UI } from '@/src/theme/ui';
import type { PlacePhoto } from '@/src/types';

type PlacePhotoGalleryProps = {
  photos: PlacePhoto[];
};

export function PlacePhotoGallery({ photos }: PlacePhotoGalleryProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewSession, setPreviewSession] = useState(0);

  if (photos.length === 0) {
    return (
      <Text variant="bodyMedium" style={styles.empty}>
        Фотографий пока нет
      </Text>
    );
  }

  const previewVisible = previewIndex != null;
  const previewWidth = Math.min(windowWidth - 32, 480);
  const previewHeight = Math.min(windowHeight * 0.75, previewWidth);

  const openPreview = (index: number) => {
    setPreviewSession((value) => value + 1);
    setPreviewIndex(index);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / previewWidth);
    if (index >= 0 && index < photos.length) {
      setPreviewIndex(index);
    }
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              onPress={() => openPreview(index)}
              accessibilityLabel="Открыть фото"
            >
              <Image source={{ uri: photo.filePath }} style={styles.photo} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPreviewIndex(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => undefined}>
            {previewIndex != null ? (
              <FlatList
                key={previewSession}
                data={photos}
                keyExtractor={(item) => String(item.id)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: previewWidth }}
                getItemLayout={(_, index) => ({
                  length: previewWidth,
                  offset: previewWidth * index,
                  index,
                })}
                onMomentumScrollEnd={handleMomentumEnd}
                initialScrollIndex={previewIndex}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.previewSlide,
                      { width: previewWidth, height: previewHeight },
                    ]}
                  >
                    <Image
                      source={{ uri: item.filePath }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            ) : null}
            <Pressable
              style={styles.modalClose}
              onPress={() => setPreviewIndex(null)}
              accessibilityLabel="Закрыть просмотр"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={UI.onPrimary}
              />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 10,
  },
  empty: {
    opacity: 0.7,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSlide: {
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
