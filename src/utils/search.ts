/**
 * Нормализация текста для поиска (кириллица и латиница).
 * Названия в БД не изменяются.
 */
export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

/**
 * Разбивает запрос на непустые слова после нормализации.
 */
export function getSearchWords(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return [];
  }
  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * Место подходит, если название содержит все слова запроса (без учёта регистра).
 */
export function matchesPlaceName(name: string, query: string): boolean {
  const words = getSearchWords(query);
  if (words.length === 0) {
    return true;
  }
  const normalizedName = normalizeSearchText(name);
  return words.every((word) => normalizedName.includes(word));
}
