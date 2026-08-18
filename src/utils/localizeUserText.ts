import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { normalizeLanguage, type AppLanguage } from '@/src/i18n';

const CYRILLIC_RE = /[А-Яа-яЁё]/;

/**
 * Известные английские аналоги. Ключи — строчные русские слова/фразы.
 * Более длинные ключи применяются раньше коротких.
 */
const USER_TEXT_EN_DICTIONARY: Record<string, string> = {
  'санкт-петербург': 'Saint Petersburg',
  'нижний новгород': 'Nizhny Novgorod',
  'ростов-на-дону': 'Rostov-on-Don',
  'сергиев посад': 'Sergiev Posad',
  'путешествие по': 'Trip to',
  'путешествие в': 'Trip to',
  'поездка по': 'Trip to',
  'поездка в': 'Trip to',
  петербург: 'Saint Petersburg',
  питер: 'Saint Petersburg',
  москва: 'Moscow',
  анапа: 'Anapa',
  пушкино: 'Pushkino',
  сочи: 'Sochi',
  ялта: 'Yalta',
  севастополь: 'Sevastopol',
  казань: 'Kazan',
  суздаль: 'Suzdal',
  владимир: 'Vladimir',
  ярославль: 'Yaroslavl',
  кострома: 'Kostroma',
  ростов: 'Rostov',
  тула: 'Tula',
  рязань: 'Ryazan',
  калуга: 'Kaluga',
  смоленск: 'Smolensk',
  тверь: 'Tver',
  псков: 'Pskov',
  воронеж: 'Voronezh',
  краснодар: 'Krasnodar',
  екатеринбург: 'Ekaterinburg',
  новосибирск: 'Novosibirsk',
  калининград: 'Kaliningrad',
  мурманск: 'Murmansk',
  архангельск: 'Arkhangelsk',
  вологда: 'Vologda',
  пермь: 'Perm',
  уфа: 'Ufa',
  самара: 'Samara',
  волгоград: 'Volgograd',
  астрахань: 'Astrakhan',
  иркутск: 'Irkutsk',
  владивосток: 'Vladivostok',
  геленджик: 'Gelendzhik',
  новороссийск: 'Novorossiysk',
  коломенское: 'Kolomenskoye',
  измайлово: 'Izmailovo',
  коломна: 'Kolomna',
  дмитров: 'Dmitrov',
  звенигород: 'Zvenigorod',
  можайск: 'Mozhaysk',
  серпухов: 'Serpukhov',
  монастырь: 'Monastery',
  собор: 'Cathedral',
  церковь: 'Church',
  храм: 'Temple',
  кремль: 'Kremlin',
  лавра: 'Lavra',
  часовня: 'Chapel',
  музей: 'Museum',
  парк: 'Park',
  усадьба: 'Estate',
  крепость: 'Fortress',
  дворец: 'Palace',
  площадь: 'Square',
  улица: 'Street',
  набережная: 'Embankment',
  озеро: 'Lake',
  река: 'River',
  море: 'Sea',
  гора: 'Mountain',
  пляж: 'Beach',
  остров: 'Island',
  деревня: 'Village',
  село: 'Village',
  город: 'City',
  вокзал: 'Station',
  аэропорт: 'Airport',
  отель: 'Hotel',
  гостиница: 'Hotel',
  путешествие: 'Trip',
  поездка: 'Trip',
  экскурсия: 'Excursion',
  прогулка: 'Walk',
  тур: 'Tour',
  маршрут: 'Route',
};

const TRANSLIT_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const DICTIONARY_KEYS = Object.keys(USER_TEXT_EN_DICTIONARY).sort(
  (a, b) => b.length - a.length,
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCyrillic(value: string): boolean {
  return CYRILLIC_RE.test(value);
}

function capitalizeMapped(mapped: string): string {
  if (!mapped) {
    return '';
  }
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function applyReplacementCasing(original: string, english: string): string {
  if (!original) {
    return english;
  }
  if (original === original.toUpperCase()) {
    return english.toUpperCase();
  }
  return english;
}

function transliterateCyrillic(value: string): string {
  let result = '';
  for (const char of value) {
    const lower = char.toLowerCase();
    const mapped = TRANSLIT_MAP[lower];
    if (mapped === undefined) {
      result += char;
      continue;
    }
    if (char === lower) {
      result += mapped;
    } else {
      result += capitalizeMapped(mapped);
    }
  }
  return result;
}

const LETTER_CLASS = 'A-Za-zА-Яа-яЁё';

function applyKnownTranslations(value: string): string {
  let result = value;
  for (const key of DICTIONARY_KEYS) {
    const english = USER_TEXT_EN_DICTIONARY[key];
    const pattern = new RegExp(
      `(^|[^${LETTER_CLASS}])(${escapeRegex(key)})(?![${LETTER_CLASS}])`,
      'gi',
    );
    result = result.replace(
      pattern,
      (_full, prefix: string, matched: string) =>
        `${prefix}${applyReplacementCasing(matched, english)}`,
    );
  }
  return result;
}

/**
 * Отображает пользовательский текст из SQLite на выбранном языке.
 * Исходная строка в базе не изменяется.
 */
export function getLocalizedUserText(
  value: string | null | undefined,
  language: AppLanguage = normalizeLanguage(i18n.language),
): string {
  if (value == null) {
    return '';
  }
  if (value === '') {
    return '';
  }
  if (language !== 'en') {
    return value;
  }
  if (!hasCyrillic(value)) {
    return value;
  }

  const withDictionary = applyKnownTranslations(value);
  if (!hasCyrillic(withDictionary)) {
    return withDictionary;
  }
  return transliterateCyrillic(withDictionary);
}

export function useLocalizedUserText() {
  const { i18n: i18nInstance } = useTranslation();
  const language = normalizeLanguage(i18nInstance.language);

  return useCallback(
    (value: string | null | undefined) => getLocalizedUserText(value, language),
    [language],
  );
}
