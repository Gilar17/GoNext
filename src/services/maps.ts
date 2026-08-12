import * as Linking from 'expo-linking';
import type { DecimalDegrees } from '@/src/types';
import { parseDdPair } from './coordinates';

const INVALID_DD_MESSAGE =
  'Для этого места не указаны корректные координаты';

/**
 * Открывает карту строго по сохранённой паре DD места.
 * Не использует геолокацию устройства.
 */
export async function openPlaceOnMap(dd: DecimalDegrees | null): Promise<void> {
  const parsed = parseDdPair(dd);
  if (!parsed) {
    throw new Error(INVALID_DD_MESSAGE);
  }

  const { latitude, longitude } = parsed;
  // Явно передаём сохранённые координаты места (не текущую геопозицию).
  const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
  const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;

  try {
    await Linking.openURL(geoUrl);
  } catch {
    await Linking.openURL(mapsUrl);
  }
}

/**
 * Открывает навигацию строго по сохранённой паре DD места.
 * Не использует геолокацию устройства.
 */
export async function openPlaceInNavigator(
  dd: DecimalDegrees | null,
): Promise<void> {
  const parsed = parseDdPair(dd);
  if (!parsed) {
    throw new Error(INVALID_DD_MESSAGE);
  }

  const { latitude, longitude } = parsed;
  const navigationUrl = `google.navigation:q=${latitude},${longitude}`;
  const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    await Linking.openURL(navigationUrl);
  } catch {
    await Linking.openURL(mapsDirUrl);
  }
}
