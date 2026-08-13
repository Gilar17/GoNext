import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { DecimalDegrees } from '@/src/types';
import { parseDdPair, type ParsedCoordinates } from './coordinates';

const INVALID_DD_MESSAGE =
  'Для этого места не указаны корректные координаты';
const MAP_UNAVAILABLE_MESSAGE = 'Не удалось открыть карту';
const NAVIGATOR_UNAVAILABLE_MESSAGE = 'Не удалось открыть навигатор';

function requirePlaceCoordinates(
  dd: DecimalDegrees | null,
): ParsedCoordinates {
  const parsed = parseDdPair(dd);
  if (!parsed) {
    throw new Error(INVALID_DD_MESSAGE);
  }
  return parsed;
}

function mapUrls(coords: ParsedCoordinates): {
  primary: string;
  fallback: string;
} {
  const { latitude, longitude } = coords;
  return {
    primary: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    fallback: `https://maps.google.com/maps?q=${latitude},${longitude}`,
  };
}

function navigatorUrls(coords: ParsedCoordinates): {
  primary: string;
  fallback: string;
} {
  const { latitude, longitude } = coords;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    return {
      primary: `maps://?daddr=${latitude},${longitude}&dirflg=d`,
      fallback,
    };
  }

  return {
    primary: `google.navigation:q=${latitude},${longitude}`,
    fallback,
  };
}

/**
 * Best effort: системное приложение, затем HTTPS.
 * Технические ошибки Linking наружу не пропускаются.
 */
async function openExternalUrl(
  primaryUrl: string,
  fallbackUrl: string,
  failMessage: string,
): Promise<void> {
  try {
    await Linking.openURL(primaryUrl);
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
    } catch {
      throw new Error(failMessage);
    }
  }
}

/**
 * Открывает карту строго по сохранённой паре DD места.
 * Не использует геолокацию устройства.
 */
export async function openPlaceOnMap(dd: DecimalDegrees | null): Promise<void> {
  const coords = requirePlaceCoordinates(dd);
  const urls = mapUrls(coords);
  await openExternalUrl(urls.primary, urls.fallback, MAP_UNAVAILABLE_MESSAGE);
}

/**
 * Открывает навигацию строго по сохранённой паре DD места.
 * Не использует геолокацию устройства и не задаёт фиктивную точку старта.
 */
export async function openPlaceInNavigator(
  dd: DecimalDegrees | null,
): Promise<void> {
  const coords = requirePlaceCoordinates(dd);
  const urls = navigatorUrls(coords);
  await openExternalUrl(
    urls.primary,
    urls.fallback,
    NAVIGATOR_UNAVAILABLE_MESSAGE,
  );
}
