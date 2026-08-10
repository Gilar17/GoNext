import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { PlacePhoto } from '@/src/types';

type PlacePhotoGalleryProps = {
  photos: PlacePhoto[];
};

export function PlacePhotoGallery({ photos }: PlacePhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <Text variant="bodyMedium" style={styles.empty}>
        Фотографий пока нет
      </Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {photos.map((photo) => (
          <Image
            key={photo.id}
            source={{ uri: photo.filePath }}
            style={styles.photo}
          />
        ))}
      </View>
    </ScrollView>
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
});
