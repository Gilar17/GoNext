import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type TextInput,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Searchbar, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { FilterToggleButton } from '@/src/components/FilterToggleButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { listPlaces } from '@/src/db';
import { UI } from '@/src/theme/ui';
import { matchesPlaceName } from '@/src/utils/search';
import type { Place } from '@/src/types';

function placeFlagsLabel(place: Place): string | null {
  const parts = [
    place.visitlater ? 'Посетить позже' : null,
    place.liked ? 'Понравилось' : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function PlacesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [filterVisitLater, setFilterVisitLater] = useState(false);
  const [filterLiked, setFilterLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Place>>(null);

  const listMaxHeight = Math.max(
    96,
    windowHeight - insets.top - insets.bottom - 340,
  );

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPlaces();
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
      void loadPlaces();
    }, [loadPlaces]),
  );

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (!matchesPlaceName(place.name, query)) {
        return false;
      }
      if (filterVisitLater && !place.visitlater) {
        return false;
      }
      if (filterLiked && !place.liked) {
        return false;
      }
      return true;
    });
  }, [places, query, filterVisitLater, filterLiked]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim() === '') {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  };

  const clearSearch = () => {
    setQuery('');
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  };

  const hasActiveFilters = filterVisitLater || filterLiked;

  const resetFilters = () => {
    setFilterVisitLater(false);
    setFilterLiked(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <View style={styles.root}>
      <ScreenScaffold
        title="Места"
        titleIcon="map-marker"
        contentStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={styles.panel}>
          <Searchbar
            ref={searchRef}
            placeholder="Поиск по названию"
            value={query}
            onChangeText={handleQueryChange}
            clearIcon="close"
            clearAccessibilityLabel="Очистить поиск"
            onClearIconPress={clearSearch}
            icon="magnify"
            iconColor={UI.onPrimary}
            placeholderTextColor="rgba(255,255,255,0.85)"
            style={styles.search}
            inputStyle={styles.searchInput}
          />

          <View style={styles.filters}>
            <FilterToggleButton
              label="Посетить позже"
              icon="clock-outline"
              active={filterVisitLater}
              onPress={() => setFilterVisitLater((value) => !value)}
            />
            <FilterToggleButton
              label="Понравилось"
              icon="heart"
              active={filterLiked}
              onPress={() => setFilterLiked((value) => !value)}
            />
          </View>

          {hasActiveFilters ? (
            <Pressable
              onPress={resetFilters}
              style={styles.resetFilters}
              accessibilityRole="button"
              accessibilityLabel="Сбросить фильтры"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={UI.primary}
                style={styles.resetIcon}
              />
              <Text style={styles.resetLabel}>Сбросить фильтры</Text>
            </Pressable>
          ) : null}

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
              ref={listRef}
              data={filteredPlaces}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const flags = placeFlagsLabel(item);
                return (
                  <Pressable
                    onPress={() => router.push(`/places/${item.id}`)}
                    style={styles.listItem}
                    accessibilityRole="button"
                    accessibilityLabel={`Открыть ${item.name}`}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={24}
                      color={UI.primary}
                      style={styles.placeIcon}
                    />
                    <View style={styles.listText}>
                      <View style={styles.titleRow}>
                        <Text
                          variant="titleMedium"
                          numberOfLines={1}
                          style={styles.placeName}
                        >
                          {item.name}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={UI.primary}
                        />
                      </View>
                      {item.dd ? (
                        <Text
                          variant="bodySmall"
                          numberOfLines={1}
                          style={styles.coords}
                        >
                          {item.dd}
                        </Text>
                      ) : null}
                      {flags ? (
                        <Text variant="bodySmall" style={styles.flags}>
                          {flags}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          <PrimaryButton
            icon="plus"
            onPress={() => router.push('/places/new')}
            style={styles.addButton}
          >
            Добавить
          </PrimaryButton>
        </View>
      </ScreenScaffold>

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
    paddingTop: 12,
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 12,
  },
  search: {
    height: UI.buttonHeight,
    backgroundColor: UI.primary,
    borderRadius: UI.buttonBorderRadius,
    elevation: 0,
    marginBottom: UI.buttonGap,
  },
  searchInput: {
    minHeight: 0,
    alignSelf: 'center',
    color: UI.onPrimary,
    fontSize: UI.buttonFontSize,
    paddingLeft: 0,
  },
  filters: {
    flexDirection: 'row',
    gap: UI.filterGap,
    marginBottom: UI.filterGap,
  },
  resetFilters: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: UI.buttonHeight,
    borderRadius: UI.buttonBorderRadius,
    backgroundColor: UI.filterIdle,
    marginBottom: UI.buttonGap,
    gap: 8,
    paddingHorizontal: 12,
  },
  resetIcon: {
    // Без абсолютного позиционирования.
  },
  resetLabel: {
    color: UI.primary,
    fontSize: UI.filterLabelFontSize,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  placeIcon: {
    marginTop: 2,
    marginRight: UI.iconTextGap,
  },
  listText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeName: {
    flex: 1,
    minWidth: 0,
  },
  coords: {
    color: UI.mutedText,
    marginTop: 2,
  },
  flags: {
    color: UI.mutedText,
    marginTop: 2,
  },
  message: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.75,
  },
  addButton: {
    marginTop: UI.buttonGap,
  },
});
