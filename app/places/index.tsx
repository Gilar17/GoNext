import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Chip,
  FAB,
  List,
  Searchbar,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { listPlaces, searchPlacesByName } from '@/src/db';
import type { Place } from '@/src/types';

export default function PlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [filterVisitLater, setFilterVisitLater] = useState(false);
  const [filterLiked, setFilterLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const loadPlaces = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data = search.trim()
        ? await searchPlacesByName(search)
        : await listPlaces();
      setPlaces(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить места');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlaces(queryRef.current);
    }, [loadPlaces]),
  );

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (filterVisitLater && !place.visitlater) {
        return false;
      }
      if (filterLiked && !place.liked) {
        return false;
      }
      return true;
    });
  }, [places, filterVisitLater, filterLiked]);

  return (
    <View style={styles.root}>
      <ScreenScaffold title="Места" contentStyle={styles.content}>
        <View style={styles.panel}>
          <Searchbar
            placeholder="Поиск по названию"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void loadPlaces(query)}
            onIconPress={() => void loadPlaces(query)}
            style={styles.search}
          />

          <View style={styles.filters}>
            <Chip
              selected={filterVisitLater}
              onPress={() => setFilterVisitLater((value) => !value)}
              icon="clock-outline"
            >
              Посетить позже
            </Chip>
            <Chip
              selected={filterLiked}
              onPress={() => setFilterLiked((value) => !value)}
              icon="heart"
            >
              Понравилось
            </Chip>
          </View>

          {loading ? (
            <Text style={styles.message}>Загрузка…</Text>
          ) : filteredPlaces.length === 0 ? (
            <Text style={styles.message}>
              {places.length === 0
                ? 'Пока нет сохранённых мест'
                : 'Ничего не найдено по текущим фильтрам'}
            </Text>
          ) : (
            <FlatList
              data={filteredPlaces}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  description={
                    [
                      item.visitlater ? 'Посетить позже' : null,
                      item.liked ? 'Понравилось' : null,
                      item.dd,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Без координат'
                  }
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push(`/places/${item.id}`)}
                  style={styles.listItem}
                />
              )}
            />
          )}
        </View>
      </ScreenScaffold>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/places/new')}
        label="Добавить"
      />

      <Snackbar visible={error != null} onDismiss={() => setError(null)}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 88,
  },
  panel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
  },
  search: {
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 8,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  message: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.75,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
