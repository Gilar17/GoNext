import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type TextInput,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Searchbar, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { FilterToggleButton } from '@/src/components/FilterToggleButton';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { listPlaces } from '@/src/db';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { UI } from '@/src/theme/ui';
import { matchesPlaceName } from '@/src/utils/search';
import type { Place } from '@/src/types';

/** Те же цвета, что в карточке сохранённого места. */
const MARK_VISIT_LATER = '#3B8F5C';
const MARK_LIKED = '#D96B9A';

/** Верхний отступ контента — нижний визуальный отступ делаем таким же. */
const CONTENT_EDGE_GAP = 12;

export default function PlacesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { surfaces, primary } = useAppTheme();

  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [filterVisitLater, setFilterVisitLater] = useState(false);
  const [filterLiked, setFilterLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [areaHeight, setAreaHeight] = useState(0);
  const [topChromeHeight, setTopChromeHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(
    UI.buttonHeight + UI.buttonGap,
  );

  const searchRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Place>>(null);

  const hasActiveFilters = filterVisitLater || filterLiked;
  const contentBottomGap = insets.bottom + CONTENT_EDGE_GAP;

  /**
   * areaHeight — фактическая высота области контента под header
   * (уже без padding ScreenScaffold), измеряется onLayout.
   */
  const listMaxHeight = Math.max(
    96,
    areaHeight - topChromeHeight - footerHeight,
  );

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPlaces();
      setPlaces(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.loadPlacesFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const resetFilters = () => {
    setFilterVisitLater(false);
    setFilterLiked(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onAreaLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setAreaHeight((prev) => (prev === next ? prev : next));
  };

  const onTopChromeLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setTopChromeHeight((prev) => (prev === next ? prev : next));
  };

  const onFooterLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setFooterHeight((prev) => (prev === next ? prev : next));
  };

  return (
    <View style={styles.root}>
      <ScreenScaffold
        title={t('places.title')}
        titleIcon="map-marker"
        contentStyle={[
          styles.content,
          { paddingBottom: contentBottomGap },
        ]}
      >
        <View style={styles.area} onLayout={onAreaLayout}>
          <View
            style={[
              styles.panel,
              { backgroundColor: surfaces.card },
              areaHeight > 0 ? { maxHeight: areaHeight } : null,
            ]}
          >
            <View onLayout={onTopChromeLayout}>
              <Searchbar
                key={`places-search-${i18n.language}`}
                ref={searchRef}
                placeholder={t('places.searchPlaceholder')}
                value={query}
                onChangeText={handleQueryChange}
                clearIcon="close"
                clearAccessibilityLabel={t('places.clearSearch')}
                onClearIconPress={clearSearch}
                icon="magnify"
                iconColor={UI.onPrimary}
                placeholderTextColor="rgba(255,255,255,0.85)"
                style={[styles.search, { backgroundColor: primary }]}
                inputStyle={styles.searchInput}
              />

              <View style={styles.filters}>
                <FilterToggleButton
                  label={t('places.visitLater')}
                  icon="clock-outline"
                  active={filterVisitLater}
                  onPress={() => setFilterVisitLater((value) => !value)}
                />
                <FilterToggleButton
                  label={t('places.liked')}
                  icon="heart"
                  active={filterLiked}
                  onPress={() => setFilterLiked((value) => !value)}
                />
              </View>

              {hasActiveFilters ? (
                <Pressable
                  onPress={resetFilters}
                  style={[
                    styles.resetFilters,
                    { backgroundColor: surfaces.filterIdle },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('places.resetFilters')}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={primary}
                    style={styles.resetIcon}
                  />
                  <Text style={[styles.resetLabel, { color: primary }]}>
                    {t('places.resetFilters')}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {loading ? (
              <Text style={styles.message}>{t('common.loading')}</Text>
            ) : filteredPlaces.length === 0 ? (
              <Text style={styles.message}>
                {places.length === 0
                  ? t('places.empty')
                  : t('places.emptyFiltered')}
              </Text>
            ) : (
              <FlatList
                ref={listRef}
                data={filteredPlaces}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: listMaxHeight, flexGrow: 0 }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const hasMarks = item.visitlater || item.liked;
                  return (
                    <Pressable
                      onPress={() => router.push(`/places/${item.id}`)}
                      style={[
                        styles.listItem,
                        { backgroundColor: surfaces.cardItem },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.openItem', { name: item.name })}
                    >
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={24}
                        color={primary}
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
                            color={primary}
                          />
                        </View>
                        {hasMarks ? (
                          <View style={styles.marksRow}>
                            {item.visitlater ? (
                              <View style={styles.markItem}>
                                <MaterialCommunityIcons
                                  name="clock-outline"
                                  size={16}
                                  color={MARK_VISIT_LATER}
                                />
                                <Text
                                  style={[
                                    styles.markText,
                                    { color: MARK_VISIT_LATER },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {t('places.visitLater')}
                                </Text>
                              </View>
                            ) : null}
                            {item.liked ? (
                              <View style={styles.markItem}>
                                <MaterialCommunityIcons
                                  name="heart"
                                  size={16}
                                  color={MARK_LIKED}
                                />
                                <Text
                                  style={[
                                    styles.markText,
                                    { color: MARK_LIKED },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {t('places.liked')}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}

            <View onLayout={onFooterLayout}>
              <PrimaryButton
                icon="plus"
                onPress={() => router.push('/places/new')}
                style={styles.addButton}
              >
                {t('common.add')}
              </PrimaryButton>
            </View>
          </View>
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
    flex: 1,
    paddingTop: CONTENT_EDGE_GAP,
  },
  area: {
    flex: 1,
  },
  panel: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 12,
  },
  search: {
    height: UI.buttonHeight,
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
    marginBottom: UI.buttonGap,
    gap: 8,
    paddingHorizontal: 12,
  },
  resetIcon: {
    // Без абсолютного позиционирования.
  },
  resetLabel: {
    fontSize: UI.filterLabelFontSize,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 0,
    paddingBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    marginBottom: 8,
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
  marksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  markText: {
    fontSize: 12,
    lineHeight: 16,
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
